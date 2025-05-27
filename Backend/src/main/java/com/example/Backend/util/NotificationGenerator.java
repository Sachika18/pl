package com.example.Backend.util;

import java.util.Arrays;
import java.util.Collections;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.example.Backend.model.Leave;
import com.example.Backend.model.Notification;
import com.example.Backend.model.Task;
import com.example.Backend.service.NotificationService;

@Component
public class NotificationGenerator {

    @Autowired
    private NotificationService notificationService;

    // Generate notification for leave approval
    public void generateLeaveApprovalNotification(Leave leave) {
        String title = "Leave Request Approved";
        String description = String.format("Your leave request from %s to %s has been approved.", 
                leave.getFromDate().toString(), leave.getToDate().toString());
        
        Notification notification = new Notification(
            leave.getUserId(),
            title,
            description,
            "leave",
            "medium",
            Collections.singletonList("View Details")
        );
        
        notificationService.createNotification(notification);
    }
    
    // Generate notification for leave rejection
    public void generateLeaveRejectionNotification(Leave leave) {
        String title = "Leave Request Rejected";
        String description = String.format("Your leave request from %s to %s has been rejected.", 
                leave.getFromDate().toString(), leave.getToDate().toString());
        
        Notification notification = new Notification(
            leave.getUserId(),
            title,
            description,
            "leave",
            "high",
            Collections.singletonList("View Details")
        );
        
        notificationService.createNotification(notification);
    }
    
    // Generate notification for new task assignment
    public void generateTaskAssignmentNotification(Task task) {
        String title = "New Task Assignment";
        String description = String.format("You have been assigned a new task: \"%s\".", task.getTitle());
        
        Notification notification = new Notification(
            task.getAssignedTo(),
            title,
            description,
            "message",
            "medium",
            Arrays.asList("View Task", "Mark Complete")
        );
        
        notificationService.createNotification(notification);
    }
    
    // Generate notification for task completion
    public void generateTaskCompletionNotification(Task task, String assignerId) {
        String title = "Task Completed";
        String description = String.format("The task \"%s\" has been marked as completed.", task.getTitle());
        
        Notification notification = new Notification(
            assignerId,
            title,
            description,
            "message",
            "medium",
            Collections.singletonList("View Task")
        );
        
        notificationService.createNotification(notification);
    }
    
    // Generate system notification for all users
    public void generateSystemNotification(String title, String description, String userId) {
        Notification notification = new Notification(
            userId,
            title,
            description,
            "system",
            "medium",
            Collections.singletonList("Acknowledge")
        );
        
        notificationService.createNotification(notification);
    }
}