package com.example.Backend.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.Backend.config.JwtTokenUtil;
import com.example.Backend.model.Holiday;
import com.example.Backend.model.User;
import com.example.Backend.service.HolidayService;
import com.example.Backend.service.UserService;

@RestController
@RequestMapping("/api/holidays")
public class HolidayController {

    private final HolidayService holidayService;
    private final UserService userService;
    private final JwtTokenUtil jwtTokenUtil;

    @Autowired
    public HolidayController(HolidayService holidayService, UserService userService, JwtTokenUtil jwtTokenUtil) {
        this.holidayService = holidayService;
        this.userService = userService;
        this.jwtTokenUtil = jwtTokenUtil;
    }

    @GetMapping
    public ResponseEntity<?> getAllHolidays() {
        try {
            List<Holiday> holidays = holidayService.getAllHolidays();
            return ResponseEntity.ok(holidays);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch holidays: " + e.getMessage()));
        }
    }

    @GetMapping("/range")
    public ResponseEntity<?> getHolidaysInRange(
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            List<Holiday> holidays = holidayService.getHolidaysInRange(startDate, endDate);
            return ResponseEntity.ok(holidays);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch holidays: " + e.getMessage()));
        }
    }

    @GetMapping("/upcoming")
    public ResponseEntity<?> getUpcomingHolidays() {
        try {
            List<Holiday> holidays = holidayService.getUpcomingHolidays();
            return ResponseEntity.ok(holidays);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch upcoming holidays: " + e.getMessage()));
        }
    }

    @PostMapping("/admin/create")
    public ResponseEntity<?> createHoliday(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Holiday holiday) {
        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix

            // Get user from token
            String userEmail = jwtTokenUtil.getUsernameFromToken(token);
            Optional<User> userOpt = userService.findByEmail(userEmail);
            
            if (userOpt.isEmpty() || !userOpt.get().getPosition().equalsIgnoreCase("Admin")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Access denied. Admin privileges required."));
            }

            Holiday createdHoliday = holidayService.createHoliday(holiday);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdHoliday);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create holiday: " + e.getMessage()));
        }
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<?> deleteHoliday(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id) {
        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix

            // Get user from token
            String userEmail = jwtTokenUtil.getUsernameFromToken(token);
            Optional<User> userOpt = userService.findByEmail(userEmail);
            
            if (userOpt.isEmpty() || !userOpt.get().getPosition().equalsIgnoreCase("Admin")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Access denied. Admin privileges required."));
            }

            holidayService.deleteHoliday(id);
            return ResponseEntity.ok(Map.of("message", "Holiday deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete holiday: " + e.getMessage()));
        }
    }
}