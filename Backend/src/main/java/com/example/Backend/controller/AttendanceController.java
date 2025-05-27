package com.example.Backend.controller;

import com.example.Backend.config.JwtTokenUtil;
import com.example.Backend.model.Attendance;
import com.example.Backend.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final JwtTokenUtil jwtTokenUtil;

    @Autowired
    public AttendanceController(AttendanceService attendanceService, JwtTokenUtil jwtTokenUtil) {
        this.attendanceService = attendanceService;
        this.jwtTokenUtil = jwtTokenUtil;
    }

    // Updated URL to match frontend request
    @PostMapping("/checkin")
    public ResponseEntity<?> checkIn(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix

            // Get user ID from token
            String userId = jwtTokenUtil.getUserIdFromToken(token);

            // Check if user already checked in today
            Optional<Attendance> existingAttendance = attendanceService.getTodayAttendance(userId);
            if (existingAttendance.isPresent() && "CHECKED_IN".equals(existingAttendance.get().getStatus())) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "You have already checked in today",
                        "attendance", existingAttendance.get()
                ));
            }

            // Create new attendance record with check-in time
            Attendance attendance = attendanceService.checkIn(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Check-in successful");
            response.put("attendance", attendance);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to check in: " + e.getMessage()));
        }
    }

    // Updated URL to match frontend request
    @PostMapping("/checkout")
    public ResponseEntity<?> checkOut(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix

            // Get user ID from token
            String userId = jwtTokenUtil.getUserIdFromToken(token);

            // Check if user has checked in today
            Optional<Attendance> existingAttendance = attendanceService.getTodayAttendance(userId);
            if (existingAttendance.isEmpty() || !"CHECKED_IN".equals(existingAttendance.get().getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("error", "You need to check in first"));
            }

            // Update attendance record with check-out time
            Attendance attendance = attendanceService.checkOut(existingAttendance.get().getId());

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Check-out successful");
            response.put("attendance", attendance);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to check out: " + e.getMessage()));
        }
    }

    @GetMapping("/today")
    public ResponseEntity<?> getTodayAttendance(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix

            // Get user ID from token
            String userId = jwtTokenUtil.getUserIdFromToken(token);
            
            System.out.println("Getting attendance for user ID: " + userId);

            // Get today's attendance record
            Optional<Attendance> attendance = attendanceService.getTodayAttendance(userId);

            if (attendance.isPresent()) {
                System.out.println("Found attendance record: " + attendance.get().getId());
                return ResponseEntity.ok(attendance.get());
            } else {
                System.out.println("No attendance record found for today");
                return ResponseEntity.ok(Map.of("message", "No attendance record found for today"));
            }
        } catch (Exception e) {
            System.err.println("Error in getTodayAttendance controller: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(Map.of("message", "No attendance record found for today"));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getAttendanceHistory(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix

            // Get user ID from token
            String userId = jwtTokenUtil.getUserIdFromToken(token);

            // Get attendance history
            List<Attendance> attendanceList;
            if (fromDate != null && toDate != null) {
                attendanceList = attendanceService.getAttendanceByDateRange(userId, fromDate, toDate);
            } else {
                // Default to last 30 days if no dates provided
                LocalDate defaultFrom = LocalDate.now().minusDays(30);
                attendanceList = attendanceService.getAttendanceByDateRange(userId, defaultFrom, LocalDate.now());
            }

            return ResponseEntity.ok(attendanceList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch attendance history: " + e.getMessage()));
        }
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getAttendanceSummary(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix

            // Get user ID from token
            String userId = jwtTokenUtil.getUserIdFromToken(token);

            // Get the current month's statistics
            LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
            LocalDate today = LocalDate.now();

            List<Attendance> monthAttendance = attendanceService.getAttendanceByDateRange(userId, startOfMonth, today);

            // Calculate statistics
            int totalDays = monthAttendance.size();
            long presentDays = monthAttendance.stream()
                    .filter(a -> "COMPLETED".equals(a.getStatus()))
                    .count();

            double totalHours = monthAttendance.stream()
                    .filter(a -> a.getTotalHours() != null)
                    .mapToDouble(Attendance::getTotalHours)
                    .sum();

            Map<String, Object> summary = new HashMap<>();
            summary.put("totalDays", totalDays);
            summary.put("presentDays", presentDays);
            summary.put("totalHours", totalHours);
            summary.put("averageHoursPerDay", totalDays > 0 ? totalHours / presentDays : 0);

            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to generate attendance summary: " + e.getMessage()));
        }
    }
}