package com.example.Backend.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "attendances")
public class Attendance {

    @Id
    private String id;

    private String userId;
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;
    private Double totalHours;
    private String status; // CHECKED_IN, COMPLETED, etc.
    
    @Indexed
    private LocalDateTime date;

    // Constructor for check-in
    public Attendance(String userId, LocalDateTime checkInTime) {
        this.userId = userId;
        this.checkInTime = checkInTime;
        this.date = checkInTime;
        this.status = "CHECKED_IN";
    }

    // Method to set checkout time and calculate hours
    public void setCheckOutTime(LocalDateTime checkOutTime) {
        this.checkOutTime = checkOutTime;

        // Calculate total hours when checking out
        if (this.checkInTime != null && checkOutTime != null) {
            long seconds = java.time.Duration.between(this.checkInTime, checkOutTime).getSeconds();
            this.totalHours = seconds / 3600.0; // Convert seconds to hours
            this.status = "COMPLETED";
        }
    }
}