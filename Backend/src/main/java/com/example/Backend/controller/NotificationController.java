package com.example.Backend.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Backend.config.JwtTokenUtil;
import com.example.Backend.model.Notification;
import com.example.Backend.model.User;
import com.example.Backend.service.NotificationService;
import com.example.Backend.service.UserService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    @GetMapping
    public ResponseEntity<?> getUserNotifications(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix

            // Get user from token
            String userEmail = jwtTokenUtil.getUsernameFromToken(token);
            Optional<User> userOpt = userService.findByEmail(userEmail);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "User not found"));
            }

            List<Notification> notifications = notificationService.getUserNotifications(userOpt.get().getId());
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch notifications: " + e.getMessage()));
        }
    }

    @GetMapping("/unread")
    public ResponseEntity<?> getUnreadNotifications(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix

            // Get user from token
            String userEmail = jwtTokenUtil.getUsernameFromToken(token);
            Optional<User> userOpt = userService.findByEmail(userEmail);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "User not found"));
            }

            List<Notification> notifications = notificationService.getUserUnreadNotifications(userOpt.get().getId());
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch unread notifications: " + e.getMessage()));
        }
    }

    @GetMapping("/pinned")
    public ResponseEntity<?> getPinnedNotifications(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix

            // Get user from token
            String userEmail = jwtTokenUtil.getUsernameFromToken(token);
            Optional<User> userOpt = userService.findByEmail(userEmail);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "User not found"));
            }

            List<Notification> notifications = notificationService.getUserPinnedNotifications(userOpt.get().getId());
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch pinned notifications: " + e.getMessage()));
        }
    }

    @GetMapping("/count")
    public ResponseEntity<?> getUnreadCount(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix

            // Get user from token
            String userEmail = jwtTokenUtil.getUsernameFromToken(token);
            Optional<User> userOpt = userService.findByEmail(userEmail);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "User not found"));
            }

            long count = notificationService.getUnreadCount(userOpt.get().getId());
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch unread count: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id) {
        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix

            // Get user from token
            String userEmail = jwtTokenUtil.getUsernameFromToken(token);
            Optional<User> userOpt = userService.findByEmail(userEmail);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "User not found"));
            }

            Notification notification = notificationService.markAsRead(id);
            return ResponseEntity.ok(notification);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to mark notification as read: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/pin")
    public ResponseEntity<?> togglePin(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id) {
        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix

            // Get user from token
            String userEmail = jwtTokenUtil.getUsernameFromToken(token);
            Optional<User> userOpt = userService.findByEmail(userEmail);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "User not found"));
            }

            Notification notification = notificationService.togglePin(id);
            return ResponseEntity.ok(notification);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to toggle pin status: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id) {
        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix

            // Get user from token
            String userEmail = jwtTokenUtil.getUsernameFromToken(token);
            Optional<User> userOpt = userService.findByEmail(userEmail);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "User not found"));
            }

            notificationService.deleteNotification(id);
            return ResponseEntity.ok(Map.of("message", "Notification deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete notification: " + e.getMessage()));
        }
    }

    // Admin endpoint to create a notification for a user
    @PostMapping("/admin/create")
    public ResponseEntity<?> createNotification(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Notification notification) {
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

            Notification createdNotification = notificationService.createNotification(notification);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdNotification);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create notification: " + e.getMessage()));
        }
    }
}