package com.example.Backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Backend.exception.ResourceNotFoundException;
import com.example.Backend.model.DocumentActivity;
import com.example.Backend.service.DocumentActivityService;

@RestController
@RequestMapping("/api/document-activities")
public class DocumentActivityController {

    @Autowired
    private DocumentActivityService documentActivityService;

    // Get all activities
    @GetMapping
    public ResponseEntity<List<DocumentActivity>> getAllActivities() {
        List<DocumentActivity> activities = documentActivityService.findAllActivities();
        return new ResponseEntity<>(activities, HttpStatus.OK);
    }
    
    // Get activities by user
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<DocumentActivity>> getActivitiesByUser(@PathVariable String userId) {
        List<DocumentActivity> activities = documentActivityService.findActivitiesByUser(userId);
        return new ResponseEntity<>(activities, HttpStatus.OK);
    }
    
    // Get activities by document
    @GetMapping("/document/{documentId}")
    public ResponseEntity<List<DocumentActivity>> getActivitiesByDocument(@PathVariable String documentId) {
        List<DocumentActivity> activities = documentActivityService.findActivitiesByDocument(documentId);
        return new ResponseEntity<>(activities, HttpStatus.OK);
    }
    
    // Get activities by type
    @GetMapping("/type/{type}")
    public ResponseEntity<List<DocumentActivity>> getActivitiesByType(@PathVariable String type) {
        List<DocumentActivity> activities = documentActivityService.findActivitiesByType(type);
        return new ResponseEntity<>(activities, HttpStatus.OK);
    }
    
    // Get activity by ID
    @GetMapping("/{id}")
    public ResponseEntity<DocumentActivity> getActivityById(@PathVariable String id) {
        DocumentActivity activity = documentActivityService.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Document activity not found with id: " + id));
        
        return new ResponseEntity<>(activity, HttpStatus.OK);
    }
    
    // Create activity
    @PostMapping
    public ResponseEntity<DocumentActivity> createActivity(@RequestBody DocumentActivity activity) {
        DocumentActivity savedActivity = documentActivityService.saveActivity(activity);
        return new ResponseEntity<>(savedActivity, HttpStatus.CREATED);
    }
}