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
@Document(collection = "document_requests")
public class DocumentRequest {
    @Id
    private String id;
    
    private String userId;
    private String userName;
    private String userEmail;
    private String documentName;
    private String description;
    private LocalDate requestDate;
    private LocalDate deadline;
    private String status; // Pending, Completed, Rejected
    private LocalDate completedDate;
    private String documentId; // Reference to the uploaded document (if completed)
    
    // For user-to-user requests
    private String forUserId;
    private String forUserName;
    private String forUserEmail;
    
    // Request type: admin-to-user, user-to-admin, user-to-user
    private String requestType;
    
    // Explicitly add getters and setters to avoid Lombok issues
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getDocumentName() {
        return documentName;
    }

    public void setDocumentName(String documentName) {
        this.documentName = documentName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDate getRequestDate() {
        return requestDate;
    }

    public void setRequestDate(LocalDate requestDate) {
        this.requestDate = requestDate;
    }

    public LocalDate getDeadline() {
        return deadline;
    }

    public void setDeadline(LocalDate deadline) {
        this.deadline = deadline;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getCompletedDate() {
        return completedDate;
    }

    public void setCompletedDate(LocalDate completedDate) {
        this.completedDate = completedDate;
    }

    public String getDocumentId() {
        return documentId;
    }

    public void setDocumentId(String documentId) {
        this.documentId = documentId;
    }

    public String getForUserId() {
        return forUserId;
    }

    public void setForUserId(String forUserId) {
        this.forUserId = forUserId;
    }

    public String getForUserName() {
        return forUserName;
    }

    public void setForUserName(String forUserName) {
        this.forUserName = forUserName;
    }

    public String getForUserEmail() {
        return forUserEmail;
    }

    public void setForUserEmail(String forUserEmail) {
        this.forUserEmail = forUserEmail;
    }

    public String getRequestType() {
        return requestType;
    }

    public void setRequestType(String requestType) {
        this.requestType = requestType;
    }
}