package com.example.Backend.model;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;
    
    private String userId;
    private String title;
    private String description;
    private LocalDateTime createdAt;
    private String type; // message, event, leave, document, system
    private String priority; // high, medium, low
    private boolean isRead;
    private boolean isPinned;
    private List<String> actions;
    
    // Constructor for creating a new notification
    public Notification(String userId, String title, String description, String type, 
                        String priority, List<String> actions) {
        this.userId = userId;
        this.title = title;
        this.description = description;
        this.createdAt = LocalDateTime.now();
        this.type = type;
        this.priority = priority;
        this.isRead = false;
        this.isPinned = false;
        this.actions = actions;
    }
}