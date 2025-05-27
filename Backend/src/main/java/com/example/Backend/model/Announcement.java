package com.example.Backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "announcements")
public class Announcement {
    @Id
    private String id;
    private String title;
    private String content;
    private String priority;
    private List<String> targetDepartments;
    private LocalDateTime createdAt;
    private LocalDateTime expiryDate;
    private String createdBy; // User ID of the admin who created the announcement

    // Constructors
    public Announcement() {
    }

    public Announcement(String title, String content, String priority, List<String> targetDepartments, 
                        LocalDateTime createdAt, LocalDateTime expiryDate, String createdBy) {
        this.title = title;
        this.content = content;
        this.priority = priority;
        this.targetDepartments = targetDepartments;
        this.createdAt = createdAt;
        this.expiryDate = expiryDate;
        this.createdBy = createdBy;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public List<String> getTargetDepartments() {
        return targetDepartments;
    }

    public void setTargetDepartments(List<String> targetDepartments) {
        this.targetDepartments = targetDepartments;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDateTime expiryDate) {
        this.expiryDate = expiryDate;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    @Override
    public String toString() {
        return "Announcement{" +
                "id='" + id + '\'' +
                ", title='" + title + '\'' +
                ", content='" + content + '\'' +
                ", priority='" + priority + '\'' +
                ", targetDepartments=" + targetDepartments +
                ", createdAt=" + createdAt +
                ", expiryDate=" + expiryDate +
                ", createdBy='" + createdBy + '\'' +
                '}';
    }
}