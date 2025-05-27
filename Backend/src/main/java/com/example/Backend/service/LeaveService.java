package com.example.Backend.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.example.Backend.model.Leave;
import com.example.Backend.model.LeaveBalance;

public interface LeaveService {
    Leave applyLeave(Leave leave);
    List<Leave> getUserLeaves(String userId);
    Optional<Leave> getLeaveById(String id);
    Leave updateLeaveStatus(String id, String status);
    
    // New methods for leave balance
    LeaveBalance getUserLeaveBalance(String userId);
    LeaveBalance initializeUserLeaveBalance(String userId);
    boolean checkLeaveBalanceAvailability(String userId, String leaveType, int days);
    LeaveBalance updateLeaveBalanceUsage(String userId, String leaveType, int days);
    List<Leave> getAllPendingLeaves();
    List<Leave> getAllLeaves();
    Map<String, Object> getLeaveBalanceSummary(String userId);
}
