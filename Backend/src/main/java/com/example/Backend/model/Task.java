package com.example.Backend.model;

import java.time.LocalDate;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "tasks")
public class Task {
    
    @Id
    private String id;
    
    private String title;
    private String description;
    private String assignedTo; // User ID
    private LocalDate dueDate;
    private TaskStatus status;
    private LocalDate createdAt;
    private String createdBy; // Admin ID
    
    // Enum for task status
    public enum TaskStatus {
        TODO,
        PENDING,
        
        COMPLETED,
        IN_PROGRESS,
        ONGOING,  // Added to support frontend "ongoing" status
        CANCELLED,
        CANCELED, // Alternative spelling
        DONE
    }
    
    // Constructor for creating a new task
    public Task(String title, String description, String assignedTo, LocalDate dueDate, String createdBy) {
        this.title = title;
        this.description = description;
        this.assignedTo = assignedTo;
        this.dueDate = dueDate;
        this.status = TaskStatus.PENDING;
        this.createdAt = LocalDate.now();
        this.createdBy = createdBy;
    }
}