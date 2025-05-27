package com.example.Backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")

public class User {
    @Id
    private String id;

    private String firstName;
    private String lastName;

    @Indexed(unique = true)
    private String email;

    private String password;
    private String position;
    private String avatar;
    private String employeeId; // Unique employee ID (e.g., 1A001, 1A002, etc.)
    
    // Additional profile fields
    private String phoneNumber;
    private String address;
    private String city;
    private String state;
    private String zipCode;
    private String country;
    private String bio;
    private String skills;
    private String department;
    private String dateOfBirth;
    private String joinDate;
    private String emergencyContact;

    // Constructor for registration
    public User(String firstName, String lastName, String email, String password, String position) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        this.position = position;
    }
}