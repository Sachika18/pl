package com.example.Backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "leaves")
public class Leave {
    @Id
    private String id;

    private String userId;
    private String userEmail;
    private LocalDate fromDate;
    private LocalDate toDate;
    private String leaveType;
    private String reason;
    private String status; // "PENDING", "APPROVED", "REJECTED"
    private LocalDate appliedOn;

    // Constructor for leave application
    public Leave(String userId, String userEmail, LocalDate fromDate, LocalDate toDate,
                 String leaveType, String reason) {
        this.userId = userId;
        this.userEmail = userEmail;
        this.fromDate = fromDate;
        this.toDate = toDate;
        this.leaveType = leaveType;
        this.reason = reason;
        this.status = "PENDING";
        this.appliedOn = LocalDate.now();
    }
}
