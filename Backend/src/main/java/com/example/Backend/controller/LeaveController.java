package com.example.Backend.controller;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.Backend.config.JwtTokenUtil;
import com.example.Backend.model.Leave;
import com.example.Backend.model.User;
import com.example.Backend.service.LeaveService;
import com.example.Backend.service.UserService;
import com.example.Backend.util.NotificationGenerator;

@RestController
@RequestMapping("/api/leaves")
public class LeaveController {

    private final LeaveService leaveService;
    private final UserService userService;
    private final JwtTokenUtil jwtTokenUtil;
    private final NotificationGenerator notificationGenerator;

    @Autowired
    public LeaveController(LeaveService leaveService, UserService userService, JwtTokenUtil jwtTokenUtil, NotificationGenerator notificationGenerator) {
        this.leaveService = leaveService;
        this.userService = userService;
        this.jwtTokenUtil = jwtTokenUtil;
        this.notificationGenerator = notificationGenerator;
    }

    @PostMapping("/apply")
    public ResponseEntity<?> applyLeave(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam("fromDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam("toDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam("leaveType") String leaveType,
            @RequestParam("reason") String reason) {

        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix

            // Get user ID from token
            String userId = jwtTokenUtil.getUserIdFromToken(token);
            String userEmail = jwtTokenUtil.getUsernameFromToken(token);

            // Validate dates
            if (fromDate.isAfter(toDate)) {
                return ResponseEntity.badRequest().body(Map.of("error", "From date cannot be after to date"));
            }

            // Calculate number of days
            long days = ChronoUnit.DAYS.between(fromDate, toDate) + 1;
            
            // Check leave balance if not unpaid leave
            if (!leaveType.equals("Unpaid")) {
                boolean hasBalance = leaveService.checkLeaveBalanceAvailability(userId, leaveType, (int) days);
                if (!hasBalance) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "error", "Insufficient " + leaveType + " leave balance"
                    ));
                }
            }

            // Create leave object
            Leave leave = new Leave(userId, userEmail, fromDate, toDate, leaveType, reason);

            // Save leave application
            Leave savedLeave = leaveService.applyLeave(leave);

            return ResponseEntity.status(HttpStatus.CREATED).body(savedLeave);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to apply for leave: " + e.getMessage()));
        }
    }

    @PostMapping("/apply-json")
    public ResponseEntity<?> applyLeaveJson(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> leaveRequest) {

        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix

            // Get user ID and email from token
            String userId = jwtTokenUtil.getUserIdFromToken(token);
            String userEmail = jwtTokenUtil.getUsernameFromToken(token);

            // Parse dates
            LocalDate fromDate = LocalDate.parse(leaveRequest.get("from"));
            LocalDate toDate = LocalDate.parse(leaveRequest.get("to"));
            String leaveType = leaveRequest.get("type");

            // Validate dates
            if (fromDate.isAfter(toDate)) {
                return ResponseEntity.badRequest().body(Map.of("error", "From date cannot be after to date"));
            }
            
            // Calculate number of days
            long days = ChronoUnit.DAYS.between(fromDate, toDate) + 1;
            
            // Check leave balance if not unpaid leave
            if (!leaveType.equals("Unpaid")) {
                boolean hasBalance = leaveService.checkLeaveBalanceAvailability(userId, leaveType, (int) days);
                if (!hasBalance) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "error", "Insufficient " + leaveType + " leave balance"
                    ));
                }
            }

            // Create leave object
            Leave leave = new Leave(
                    userId,
                    userEmail,
                    fromDate,
                    toDate,
                    leaveType,
                    leaveRequest.get("reason")
            );

            // Save leave application
            Leave savedLeave = leaveService.applyLeave(leave);

            // Create success response
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedLeave.getId());
            response.put("status", savedLeave.getStatus());
            response.put("message", "Leave application submitted successfully");

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to apply for leave: " + e.getMessage()));
        }
    }
    
    @GetMapping("/history")
    public ResponseEntity<?> getLeaveHistory(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix

            // Get user ID from token
            String userId = jwtTokenUtil.getUserIdFromToken(token);

            // Get leave history
            List<Leave> leaveList = leaveService.getUserLeaves(userId);

            return ResponseEntity.ok(leaveList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch leave history: " + e.getMessage()));
        }
    }

    @GetMapping("/user")
    public ResponseEntity<?> getUserLeaves(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix

            // Get user ID from token
            String userId = jwtTokenUtil.getUserIdFromToken(token);

            // Get user leaves
            List<Leave> leaves = leaveService.getUserLeaves(userId);

            return ResponseEntity.ok(leaves);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch leaves: " + e.getMessage()));
        }
    }
    
    @GetMapping("/balance")
    public ResponseEntity<?> getUserLeaveBalance(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix

            // Get user ID from token
            String userId = jwtTokenUtil.getUserIdFromToken(token);

            // Get leave balance summary
            Map<String, Object> balanceSummary = leaveService.getLeaveBalanceSummary(userId);

            return ResponseEntity.ok(balanceSummary);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch leave balance: " + e.getMessage()));
        }
    }
    
    // Admin endpoints
    
    @GetMapping("/admin/pending")
    public ResponseEntity<?> getPendingLeaves(@RequestHeader("Authorization") String authHeader) {
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

            // Get all pending leaves
            List<Leave> pendingLeaves = leaveService.getAllPendingLeaves();

            return ResponseEntity.ok(pendingLeaves);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch pending leaves: " + e.getMessage()));
        }
    }
    
    @GetMapping("/admin/all-leaves")
    public ResponseEntity<?> getAllLeaves(@RequestHeader("Authorization") String authHeader) {
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

            // Get all leaves
            List<Leave> allLeaves = leaveService.getAllLeaves();

            return ResponseEntity.ok(allLeaves);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch all leaves: " + e.getMessage()));
        }
    }
    
    @PutMapping("/admin/approve/{id}")
    public ResponseEntity<?> approveLeave(
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

            // Get leave by ID
            Optional<Leave> leaveOpt = leaveService.getLeaveById(id);
            if (leaveOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Leave not found"));
            }
            
            Leave leave = leaveOpt.get();
            
            // Check if leave is already approved
            if (leave.getStatus().equals("APPROVED")) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Leave is already approved"));
            }
            
            // Check leave balance if not unpaid leave
            if (!leave.getLeaveType().equals("Unpaid")) {
                long days = ChronoUnit.DAYS.between(leave.getFromDate(), leave.getToDate()) + 1;
                boolean hasBalance = leaveService.checkLeaveBalanceAvailability(
                    leave.getUserId(), leave.getLeaveType(), (int) days);
                
                if (!hasBalance) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "error", "Cannot approve leave. User has insufficient " + leave.getLeaveType() + " leave balance"
                    ));
                }
            }

            // Approve leave
            Leave approvedLeave = leaveService.updateLeaveStatus(id, "APPROVED");
            
            // Generate notification for the user
            notificationGenerator.generateLeaveApprovalNotification(approvedLeave);

            return ResponseEntity.ok(Map.of(
                "message", "Leave approved successfully",
                "leave", approvedLeave
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to approve leave: " + e.getMessage()));
        }
    }
    
    @PutMapping("/admin/reject/{id}")
    public ResponseEntity<?> rejectLeave(
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

            // Get leave by ID
            Optional<Leave> leaveOpt = leaveService.getLeaveById(id);
            if (leaveOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Leave not found"));
            }

            // Reject leave
            Leave rejectedLeave = leaveService.updateLeaveStatus(id, "REJECTED");
            
            // Generate notification for the user
            notificationGenerator.generateLeaveRejectionNotification(rejectedLeave);

            return ResponseEntity.ok(Map.of(
                "message", "Leave rejected",
                "leave", rejectedLeave
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to reject leave: " + e.getMessage()));
        }
    }
    
    @GetMapping("/admin/user-balance/{userId}")
    public ResponseEntity<?> getUserLeaveBalanceByAdmin(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String userId) {
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

            // Get leave balance summary for the specified user
            Map<String, Object> balanceSummary = leaveService.getLeaveBalanceSummary(userId);

            return ResponseEntity.ok(balanceSummary);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch user leave balance: " + e.getMessage()));
        }
    }
}
