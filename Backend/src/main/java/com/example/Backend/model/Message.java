package com.example.Backend.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "messages")
public class Message {
    @Id
    private String id;
    
    private String from;      // User ID of sender
    private String to;        // User ID of recipient
    private String content;   // Message content
    private LocalDateTime timestamp;
    private boolean read;     // Whether the message has been read
    
    // Constructor for creating a new message
    public Message(String from, String to, String content) {
        this.from = from;
        this.to = to;
        this.content = content;
        this.timestamp = LocalDateTime.now();
        this.read = false;
    }
}