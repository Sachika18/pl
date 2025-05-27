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
@Document(collection = "holidays")
public class Holiday {
    @Id
    private String id;
    
    private String name;
    private LocalDate date;
    private String type; // NATIONAL, FESTIVAL, GOVERNMENT, COMPANY
    private String description;
    private String color; // For UI display
}