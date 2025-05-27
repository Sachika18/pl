package com.example.Backend.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.Backend.model.Attendance;
import com.example.Backend.model.User;
import com.example.Backend.repository.AttendanceRepository;
import com.example.Backend.repository.UserRepository;

@RestController
@RequestMapping("/api/admin/attendance")
public class AdminAttendanceController {

    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;

    @Autowired
    public AdminAttendanceController(AttendanceRepository attendanceRepository, UserRepository userRepository) {
        this.attendanceRepository = attendanceRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getAttendanceByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        try {
            // Convert dates to LocalDateTime (start of first day to end of last day)
            LocalDateTime startDateTime = startDate.atStartOfDay();
            LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);
            
            // Get all users
            List<User> users = userRepository.findAll();
            
            // Get all attendance records for the date range
            List<Attendance> allAttendances = attendanceRepository.findAll().stream()
                .filter(a -> {
                    LocalDateTime recordDate = a.getDate();
                    return recordDate != null && 
                           !recordDate.isBefore(startDateTime) && 
                           !recordDate.isAfter(endDateTime);
                })
                .collect(Collectors.toList());
            
            // Process attendance records for each user
            List<Map<String, Object>> processedRecords = new ArrayList<>();
            
            for (User user : users) {
                // Get attendance records for this user
                List<Attendance> userAttendances = allAttendances.stream()
                    .filter(a -> user.getId().equals(a.getUserId()))
                    .collect(Collectors.toList());
                
                // For each day in the range, check if user has attendance
                LocalDate currentDate = startDate;
                while (!currentDate.isAfter(endDate)) {
                    final LocalDate dateToCheck = currentDate;
                    
                    // Find attendance for this date
                    Attendance dayAttendance = userAttendances.stream()
                        .filter(a -> {
                            if (a.getDate() == null) return false;
                            LocalDate attendanceDate = a.getDate().toLocalDate();
                            return attendanceDate.equals(dateToCheck);
                        })
                        .findFirst()
                        .orElse(null);
                    
                    // Create record for this user and date
                    Map<String, Object> record = new HashMap<>();
                    record.put("userId", user.getId());
                    record.put("employeeId", user.getEmployeeId());
                    record.put("employeeName", user.getFirstName() + " " + user.getLastName());
                    record.put("department", user.getDepartment());
                    record.put("position", user.getPosition());
                    record.put("date", currentDate.toString());
                    
                    if (dayAttendance != null) {
                        record.put("status", dayAttendance.getStatus());
                        record.put("checkInTime", dayAttendance.getCheckInTime());
                        record.put("checkOutTime", dayAttendance.getCheckOutTime());
                        record.put("totalHours", dayAttendance.getTotalHours());
                        record.put("id", dayAttendance.getId());
                    } else {
                        record.put("status", "ABSENT");
                        record.put("checkInTime", null);
                        record.put("checkOutTime", null);
                        record.put("totalHours", 0.0);
                    }
                    
                    processedRecords.add(record);
                    currentDate = currentDate.plusDays(1);
                }
            }
            
            return ResponseEntity.ok(processedRecords);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch attendance data: " + e.getMessage()));
        }
    }
    
    @GetMapping("/department-stats")
    public ResponseEntity<?> getDepartmentStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        try {
            // Convert dates to LocalDateTime
            LocalDateTime startDateTime = startDate.atStartOfDay();
            LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);
            
            // Get all users grouped by department
            List<User> allUsers = userRepository.findAll();
            Map<String, List<User>> usersByDepartment = allUsers.stream()
                .collect(Collectors.groupingBy(
                    user -> user.getDepartment() != null ? user.getDepartment() : "Unassigned"
                ));
            
            // Get all attendance records for the date range
            List<Attendance> allAttendances = attendanceRepository.findAll().stream()
                .filter(a -> {
                    LocalDateTime recordDate = a.getDate();
                    return recordDate != null && 
                           !recordDate.isBefore(startDateTime) && 
                           !recordDate.isAfter(endDateTime);
                })
                .collect(Collectors.toList());
            
            // Calculate stats for each department
            List<Map<String, Object>> departmentStats = new ArrayList<>();
            
            for (Map.Entry<String, List<User>> entry : usersByDepartment.entrySet()) {
                String department = entry.getKey();
                List<User> departmentUsers = entry.getValue();
                
                int totalEmployees = departmentUsers.size();
                int totalDays = (int) startDate.datesUntil(endDate.plusDays(1)).count();
                int totalPossibleAttendances = totalEmployees * totalDays;
                
                // Count present days for this department
                int presentCount = 0;
                
                for (User user : departmentUsers) {
                    // Get attendance records for this user
                    List<Attendance> userAttendances = allAttendances.stream()
                        .filter(a -> user.getId().equals(a.getUserId()) && 
                               ("COMPLETED".equals(a.getStatus()) || "PRESENT".equals(a.getStatus())))
                        .collect(Collectors.toList());
                    
                    presentCount += userAttendances.size();
                }
                
                // Calculate stats
                double attendanceRate = totalPossibleAttendances > 0 
                    ? (double) presentCount / totalPossibleAttendances * 100 
                    : 0;
                
                Map<String, Object> stats = new HashMap<>();
                stats.put("department", department);
                stats.put("totalEmployees", totalEmployees);
                stats.put("presentCount", presentCount);
                stats.put("absentCount", totalPossibleAttendances - presentCount);
                stats.put("attendanceRate", Math.round(attendanceRate * 100) / 100.0); // Round to 2 decimal places
                
                departmentStats.add(stats);
            }
            
            return ResponseEntity.ok(departmentStats);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch department stats: " + e.getMessage()));
        }
    }
    
    @GetMapping("/employee/{userId}")
    public ResponseEntity<?> getEmployeeAttendanceCalendar(
            @PathVariable String userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        try {
            // Convert dates to LocalDateTime
            LocalDateTime startDateTime = startDate.atStartOfDay();
            LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);
            
            // Get user
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Get attendance records for this user in the date range
            List<Attendance> userAttendances = attendanceRepository.findAll().stream()
                .filter(a -> {
                    LocalDateTime recordDate = a.getDate();
                    return userId.equals(a.getUserId()) &&
                           recordDate != null && 
                           !recordDate.isBefore(startDateTime) && 
                           !recordDate.isAfter(endDateTime);
                })
                .collect(Collectors.toList());
            
            // Create calendar data
            Map<String, Object> calendarData = new HashMap<>();
            calendarData.put("userId", userId);
            calendarData.put("employeeName", user.getFirstName() + " " + user.getLastName());
            calendarData.put("department", user.getDepartment());
            
            // Process each day in the range
            List<Map<String, Object>> daysData = new ArrayList<>();
            LocalDate currentDate = startDate;
            
            while (!currentDate.isAfter(endDate)) {
                final LocalDate dateToCheck = currentDate;
                
                // Find attendance for this date
                Attendance dayAttendance = userAttendances.stream()
                    .filter(a -> {
                        if (a.getDate() == null) return false;
                        LocalDate attendanceDate = a.getDate().toLocalDate();
                        return attendanceDate.equals(dateToCheck);
                    })
                    .findFirst()
                    .orElse(null);
                
                Map<String, Object> dayData = new HashMap<>();
                dayData.put("date", currentDate.toString());
                
                if (dayAttendance != null) {
                    dayData.put("status", dayAttendance.getStatus());
                    dayData.put("checkInTime", dayAttendance.getCheckInTime());
                    dayData.put("checkOutTime", dayAttendance.getCheckOutTime());
                    dayData.put("totalHours", dayAttendance.getTotalHours());
                } else {
                    dayData.put("status", "ABSENT");
                    dayData.put("checkInTime", null);
                    dayData.put("checkOutTime", null);
                    dayData.put("totalHours", 0.0);
                }
                
                daysData.add(dayData);
                currentDate = currentDate.plusDays(1);
            }
            
            calendarData.put("days", daysData);
            
            // Calculate summary
            long presentDays = daysData.stream()
                .filter(day -> "COMPLETED".equals(day.get("status")) || "PRESENT".equals(day.get("status")))
                .count();
            
            long absentDays = daysData.size() - presentDays;
            
            calendarData.put("summary", Map.of(
                "totalDays", daysData.size(),
                "presentDays", presentDays,
                "absentDays", absentDays,
                "attendanceRate", daysData.size() > 0 ? (double) presentDays / daysData.size() * 100 : 0
            ));
            
            return ResponseEntity.ok(calendarData);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch employee calendar: " + e.getMessage()));
        }
    }
}