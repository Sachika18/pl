package com.example.Backend.service;

import com.example.Backend.model.Leave;
import com.example.Backend.model.LeaveBalance;
import com.example.Backend.repository.LeaveBalanceRepository;
import com.example.Backend.repository.LeaveRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class LeaveServiceImpl implements LeaveService {

    private final LeaveRepository leaveRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;

    @Autowired
    public LeaveServiceImpl(LeaveRepository leaveRepository, LeaveBalanceRepository leaveBalanceRepository) {
        this.leaveRepository = leaveRepository;
        this.leaveBalanceRepository = leaveBalanceRepository;
    }

    @Override
    public Leave applyLeave(Leave leave) {
        // Calculate number of days
        long days = ChronoUnit.DAYS.between(leave.getFromDate(), leave.getToDate()) + 1;
        
        // Check if user has enough leave balance
        if (!leave.getLeaveType().equals("Unpaid")) {
            boolean hasBalance = checkLeaveBalanceAvailability(leave.getUserId(), leave.getLeaveType(), (int) days);
            if (!hasBalance) {
                throw new IllegalStateException("Insufficient leave balance for " + leave.getLeaveType() + " leave");
            }
        }
        
        return leaveRepository.save(leave);
    }

    @Override
    public List<Leave> getUserLeaves(String userId) {
        return leaveRepository.findByUserIdOrderByAppliedOnDesc(userId);
    }

    @Override
    public Optional<Leave> getLeaveById(String id) {
        return leaveRepository.findById(id);
    }

    @Override
    public Leave updateLeaveStatus(String id, String status) {
        Optional<Leave> leaveOpt = leaveRepository.findById(id);
        if (leaveOpt.isPresent()) {
            Leave leave = leaveOpt.get();
            String oldStatus = leave.getStatus();
            leave.setStatus(status);
            Leave updatedLeave = leaveRepository.save(leave);
            
            // If leave is approved, update the leave balance
            if (status.equals("APPROVED") && !oldStatus.equals("APPROVED") && !leave.getLeaveType().equals("Unpaid")) {
                long days = ChronoUnit.DAYS.between(leave.getFromDate(), leave.getToDate()) + 1;
                updateLeaveBalanceUsage(leave.getUserId(), leave.getLeaveType(), (int) days);
            }
            
            return updatedLeave;
        }
        throw new IllegalArgumentException("Leave not found with id: " + id);
    }
    
    @Override
    public LeaveBalance getUserLeaveBalance(String userId) {
        Optional<LeaveBalance> leaveBalanceOpt = leaveBalanceRepository.findByUserId(userId);
        return leaveBalanceOpt.orElseGet(() -> initializeUserLeaveBalance(userId));
    }
    
    @Override
    public LeaveBalance initializeUserLeaveBalance(String userId) {
        LeaveBalance leaveBalance = new LeaveBalance(userId);
        return leaveBalanceRepository.save(leaveBalance);
    }
    
    @Override
    public boolean checkLeaveBalanceAvailability(String userId, String leaveType, int days) {
        LeaveBalance leaveBalance = getUserLeaveBalance(userId);
        return leaveBalance.hasEnoughBalance(leaveType, days);
    }
    
    @Override
    public LeaveBalance updateLeaveBalanceUsage(String userId, String leaveType, int days) {
        LeaveBalance leaveBalance = getUserLeaveBalance(userId);
        leaveBalance.useLeave(leaveType, days);
        return leaveBalanceRepository.save(leaveBalance);
    }
    
    @Override
    public List<Leave> getAllPendingLeaves() {
        return leaveRepository.findByStatus("PENDING");
    }
    
    @Override
    public List<Leave> getAllLeaves() {
        return leaveRepository.findAll();
    }
    
    @Override
    public Map<String, Object> getLeaveBalanceSummary(String userId) {
        LeaveBalance balance = getUserLeaveBalance(userId);
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("sickLeave", Map.of(
            "total", balance.getSickLeaveBalance(),
            "used", balance.getSickLeaveUsed(),
            "remaining", balance.getRemainingBalance("Sick")
        ));
        
        summary.put("casualLeave", Map.of(
            "total", balance.getCasualLeaveBalance(),
            "used", balance.getCasualLeaveUsed(),
            "remaining", balance.getRemainingBalance("Casual")
        ));
        
        summary.put("earnedLeave", Map.of(
            "total", balance.getEarnedLeaveBalance(),
            "used", balance.getEarnedLeaveUsed(),
            "remaining", balance.getRemainingBalance("Earned")
        ));
        
        return summary;
    }
}
