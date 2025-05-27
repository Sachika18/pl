package com.example.Backend.controller;

import com.example.Backend.model.User;
import com.example.Backend.service.UserService;
import com.example.Backend.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
public class UserController {

    @Autowired
    private UserService userService;

    // Get all users
    @GetMapping("/api/users")
    public ResponseEntity<List<User>> getAllUsers() {
        System.out.println("UserController: getAllUsers() called");
        List<User> users = userService.findAllUsers();
        System.out.println("UserController: Found " + users.size() + " users");
        
        // Remove sensitive information like passwords before sending to client
        List<User> sanitizedUsers = users.stream()
            .map(user -> {
                User sanitizedUser = new User();
                sanitizedUser.setId(user.getId());
                sanitizedUser.setFirstName(user.getFirstName());
                sanitizedUser.setLastName(user.getLastName());
                sanitizedUser.setEmail(user.getEmail());
                sanitizedUser.setPosition(user.getPosition());
                sanitizedUser.setAvatar(user.getAvatar());
                sanitizedUser.setDepartment(user.getDepartment());
                sanitizedUser.setEmployeeId(user.getEmployeeId());
                return sanitizedUser;
            })
            .collect(Collectors.toList());
        
        return new ResponseEntity<>(sanitizedUsers, HttpStatus.OK);
    }
    
    // Get user by ID
    @GetMapping("/api/users/{id}")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        User user = userService.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        
        // Remove sensitive information
        user.setPassword(null);
        
        return new ResponseEntity<>(user, HttpStatus.OK);
    }
    
    // Get current user
    @GetMapping("/api/users/me")
    public ResponseEntity<User> getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        
        // Remove sensitive information
        user.setPassword(null);
        
        return new ResponseEntity<>(user, HttpStatus.OK);
    }
    
    // Get current user profile - matches frontend endpoint
    @GetMapping("/api/user/profile")
    public ResponseEntity<User> getCurrentUserProfile(Authentication authentication) {
        try {
            System.out.println("Fetching profile for authenticated user");
            String email = authentication.getName();
            System.out.println("User email: " + email);
            
            User user = userService.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
            
            System.out.println("User found: " + user.getFirstName() + " " + user.getLastName());
            System.out.println("Employee ID: " + user.getEmployeeId());
            
            // Remove sensitive information
            user.setPassword(null);
            
            return new ResponseEntity<>(user, HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("Error fetching user profile: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    // Update user profile - matches frontend endpoint
    @PutMapping("/api/user/profile")
    public ResponseEntity<?> updateCurrentUserProfile(@RequestBody User updatedUser, Authentication authentication) {
        try {
            System.out.println("Updating profile for authenticated user");
            String email = authentication.getName();
            System.out.println("User email: " + email);
            
            User currentUser = userService.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
            
            System.out.println("User found with ID: " + currentUser.getId());
            System.out.println("Updating fields: firstName=" + updatedUser.getFirstName() + 
                               ", lastName=" + updatedUser.getLastName() +
                               ", position=" + updatedUser.getPosition());
            
            // Set the ID from the authenticated user
            String userId = currentUser.getId();
            
            User updated = userService.updateUserProfile(userId, updatedUser);
            updated.setPassword(null); // Remove password before sending response
            
            System.out.println("Profile updated successfully");
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            System.err.println("Error updating user profile: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to update profile: " + e.getMessage()));
        }
    }
    
    // Update user profile - original endpoint
    @PutMapping("/api/users/{id}/profile")
    public ResponseEntity<?> updateUserProfile(@PathVariable String id, @RequestBody User updatedUser, Authentication authentication) {
        // Security check - only allow users to update their own profile or admin users
        String email = authentication.getName();
        User currentUser = userService.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        
        if (!currentUser.getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You can only update your own profile"));
        }
        
        try {
            User updated = userService.updateUserProfile(id, updatedUser);
            updated.setPassword(null); // Remove password before sending response
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to update profile: " + e.getMessage()));
        }
    }
    
    // Update profile picture - original endpoint
    @PostMapping("/api/users/{id}/avatar")
    public ResponseEntity<?> updateProfilePicture(
            @PathVariable String id,
            @RequestParam("avatar") String base64Image,
            Authentication authentication) {
        
        // Security check - only allow users to update their own profile picture
        String email = authentication.getName();
        User currentUser = userService.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        
        if (!currentUser.getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You can only update your own profile"));
        }
        
        try {
            User user = userService.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
            
            user.setAvatar(base64Image);
            User updated = userService.updateUserProfile(id, user);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Profile picture updated successfully");
            response.put("avatar", updated.getAvatar());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to update profile picture: " + e.getMessage()));
        }
    }
    
    // Update profile picture - matches frontend endpoint
    @PostMapping("/api/user/profile/avatar")
    public ResponseEntity<?> updateCurrentUserProfilePicture(
            @RequestParam("avatar") String base64Image,
            Authentication authentication) {
        
        String email = authentication.getName();
        User currentUser = userService.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        
        try {
            System.out.println("Received avatar update request for user: " + email);
            
            String userId = currentUser.getId();
            User user = userService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
            
            // Store the base64 image string
            user.setAvatar(base64Image);
            User updated = userService.updateUserProfile(userId, user);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Profile picture updated successfully");
            response.put("avatar", updated.getAvatar());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error updating profile picture: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to update profile picture: " + e.getMessage()));
        }
    }
}