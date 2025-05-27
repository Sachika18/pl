package com.example.Backend.controller;

import com.example.Backend.config.JwtTokenUtil;
import com.example.Backend.model.Announcement;
import com.example.Backend.model.User;
import com.example.Backend.service.AnnouncementService;
import com.example.Backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class AnnouncementController {

    private final AnnouncementService announcementService;
    private final UserService userService;
    private final JwtTokenUtil jwtTokenUtil;

    @Autowired
    public AnnouncementController(AnnouncementService announcementService, UserService userService, JwtTokenUtil jwtTokenUtil) {
        this.announcementService = announcementService;
        this.userService = userService;
        this.jwtTokenUtil = jwtTokenUtil;
    }

    // Create a new announcement
    @PostMapping("/announcements")
    public ResponseEntity<?> createAnnouncement(@RequestBody Map<String, Object> payload, @RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            
            // Get user ID from token
            String userId = jwtTokenUtil.getUserIdFromToken(token);
            
            // Find user by ID
            User user = userService.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
            // Check if user is an admin based on position
            String position = user.getPosition();
            if (position == null || !position.toLowerCase().contains("admin")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only administrators can create announcements"));
            }
            
            // Create new announcement
            Announcement announcement = new Announcement();
            announcement.setTitle((String) payload.get("title"));
            announcement.setContent((String) payload.get("content"));
            announcement.setPriority((String) payload.get("priority"));
            
            // Handle target departments
            @SuppressWarnings("unchecked")
            List<String> targetDepartments = (List<String>) payload.get("targetDepartments");
            announcement.setTargetDepartments(targetDepartments);
            
            // Handle dates
            DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;
            
            // Set created at to now
            announcement.setCreatedAt(LocalDateTime.now());
            
            // Parse expiry date if provided
            String expiryDateStr = (String) payload.get("expiryDate");
            if (expiryDateStr != null && !expiryDateStr.isEmpty()) {
                // If it's just a date (no time), append time
                if (expiryDateStr.length() <= 10) {
                    expiryDateStr += "T23:59:59";
                }
                announcement.setExpiryDate(LocalDateTime.parse(expiryDateStr, formatter));
            } else {
                // Default to 7 days from now
                announcement.setExpiryDate(LocalDateTime.now().plusDays(7));
            }
            
            // Set created by
            announcement.setCreatedBy(userId);
            
            // Save announcement
            Announcement savedAnnouncement = announcementService.createAnnouncement(announcement);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(savedAnnouncement);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    // Get all announcements (admin only)
    @GetMapping("/announcements")
    public ResponseEntity<?> getAllAnnouncements(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            
            // Get user ID from token
            String userId = jwtTokenUtil.getUserIdFromToken(token);
            
            // Find user by ID
            User user = userService.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
            // Check if user is an admin based on position
            String position = user.getPosition();
            if (position == null || !position.toLowerCase().contains("admin")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only administrators can view all announcements"));
            }
            
            List<Announcement> announcements = announcementService.getAllAnnouncements();
            return ResponseEntity.ok(announcements);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    // Get active announcements for a user
    @GetMapping("/announcements/active")
    public ResponseEntity<?> getActiveAnnouncements(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            
            // Get user ID from token
            String userId = jwtTokenUtil.getUserIdFromToken(token);
            
            // Find user by ID
            User user = userService.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
            // Get announcements for the user's department or for all departments
            List<Announcement> announcements = announcementService.getActiveAnnouncementsForDepartment(user.getDepartment());
            return ResponseEntity.ok(announcements);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    // Get announcement by ID
    @GetMapping("/announcements/{id}")
    public ResponseEntity<?> getAnnouncementById(@PathVariable String id, @RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            
            // Get user ID from token
            String userId = jwtTokenUtil.getUserIdFromToken(token);
            
            // Find user by ID
            userService.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
            Optional<Announcement> announcement = announcementService.getAnnouncementById(id);
            
            if (announcement.isPresent()) {
                return ResponseEntity.ok(announcement.get());
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Announcement not found"));
            }
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    // Update an announcement (admin only)
    @PutMapping("/announcements/{id}")
    public ResponseEntity<?> updateAnnouncement(@PathVariable String id, @RequestBody Announcement announcementDetails, @RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            
            // Get user ID from token
            String userId = jwtTokenUtil.getUserIdFromToken(token);
            
            // Find user by ID
            User user = userService.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
            // Check if user is an admin based on position
            String position = user.getPosition();
            if (position == null || !position.toLowerCase().contains("admin")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only administrators can update announcements"));
            }
            
            Optional<Announcement> existingAnnouncement = announcementService.getAnnouncementById(id);
            
            if (existingAnnouncement.isPresent()) {
                // Check if the admin is the creator of the announcement
                if (!existingAnnouncement.get().getCreatedBy().equals(userId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You can only update announcements you created"));
                }
                
                Announcement updatedAnnouncement = announcementService.updateAnnouncement(id, announcementDetails);
                return ResponseEntity.ok(updatedAnnouncement);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Announcement not found"));
            }
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    // Delete an announcement (admin only)
    @DeleteMapping("/announcements/{id}")
    public ResponseEntity<?> deleteAnnouncement(@PathVariable String id, @RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            
            // Get user ID from token
            String userId = jwtTokenUtil.getUserIdFromToken(token);
            
            // Find user by ID
            User user = userService.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
            // Check if user is an admin based on position
            String position = user.getPosition();
            if (position == null || !position.toLowerCase().contains("admin")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only administrators can delete announcements"));
            }
            
            Optional<Announcement> existingAnnouncement = announcementService.getAnnouncementById(id);
            
            if (existingAnnouncement.isPresent()) {
                // Check if the admin is the creator of the announcement
                if (!existingAnnouncement.get().getCreatedBy().equals(userId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You can only delete announcements you created"));
                }
                
                announcementService.deleteAnnouncement(id);
                return ResponseEntity.ok(Map.of("message", "Announcement deleted successfully"));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Announcement not found"));
            }
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }
}