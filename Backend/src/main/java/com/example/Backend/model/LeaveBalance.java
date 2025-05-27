package com.example.Backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "leave_balances")
public class LeaveBalance {
    @Id
    private String id;
    
    private String userId;
    private int sickLeaveBalance;
    private int casualLeaveBalance;
    private int earnedLeaveBalance;
    private int sickLeaveUsed;
    private int casualLeaveUsed;
    private int earnedLeaveUsed;
    
    // Constructor for creating a new leave balance
    public LeaveBalance(String userId) {
        this.userId = userId;
        this.sickLeaveBalance = 10;
        this.casualLeaveBalance = 10;
        this.earnedLeaveBalance = 10;
        this.sickLeaveUsed = 0;
        this.casualLeaveUsed = 0;
        this.earnedLeaveUsed = 0;
    }
    
    // Method to check if user has enough balance for a specific leave type
    public boolean hasEnoughBalance(String leaveType, int days) {
        switch (leaveType) {
            case "Sick":
                return sickLeaveBalance - sickLeaveUsed >= days;
            case "Casual":
                return casualLeaveBalance - casualLeaveUsed >= days;
            case "Earned":
                return earnedLeaveBalance - earnedLeaveUsed >= days;
            default:
                return true; // For unpaid leave or other types
        }
    }
    
    // Method to update used leave count
    public void useLeave(String leaveType, int days) {
        switch (leaveType) {
            case "Sick":
                this.sickLeaveUsed += days;
                break;
            case "Casual":
                this.casualLeaveUsed += days;
                break;
            case "Earned":
                this.earnedLeaveUsed += days;
                break;
            default:
                // No action for unpaid leave
                break;
        }
    }
    
    // Method to get remaining balance for a specific leave type
    public int getRemainingBalance(String leaveType) {
        switch (leaveType) {
            case "Sick":
                return sickLeaveBalance - sickLeaveUsed;
            case "Casual":
                return casualLeaveBalance - casualLeaveUsed;
            case "Earned":
                return earnedLeaveBalance - earnedLeaveUsed;
            default:
                return 0;
        }
    }
}