package com.example.Backend.controller;

import com.example.Backend.model.DocumentActivity;
import com.example.Backend.model.DocumentRequest;
import com.example.Backend.model.User;
import com.example.Backend.service.DocumentActivityService;
import com.example.Backend.service.DocumentRequestService;
import com.example.Backend.service.UserService;
import com.example.Backend.exception.ResourceNotFoundException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/document-requests")
public class DocumentRequestController {

    @Autowired
    private DocumentRequestService documentRequestService;
    
    @Autowired
    private DocumentActivityService documentActivityService;
    
    @Autowired
    private UserService userService;

    // Get all document requests (admin)
    @GetMapping
    public ResponseEntity<List<DocumentRequest>> getAllRequests() {
        List<DocumentRequest> requests = documentRequestService.findAllRequests();
        return new ResponseEntity<>(requests, HttpStatus.OK);
    }
    
    // Get user document requests (requests made by the user)
    @GetMapping("/user")
    public ResponseEntity<List<DocumentRequest>> getUserRequests(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        
        List<DocumentRequest> requests = documentRequestService.findRequestsByUser(user.getId());
        return new ResponseEntity<>(requests, HttpStatus.OK);
    }
    
    // Get requests for user (requests made for the user)
    @GetMapping("/for-user")
    public ResponseEntity<List<DocumentRequest>> getRequestsForUser(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        
        List<DocumentRequest> requests = documentRequestService.findRequestsForUser(user.getId());
        return new ResponseEntity<>(requests, HttpStatus.OK);
    }
    
    // Get request by ID
    @GetMapping("/{id}")
    public ResponseEntity<DocumentRequest> getRequestById(@PathVariable String id) {
        DocumentRequest request = documentRequestService.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Document request not found with id: " + id));
        
        return new ResponseEntity<>(request, HttpStatus.OK);
    }
    
    // Create document request
    @PostMapping
    public ResponseEntity<DocumentRequest> createRequest(@RequestBody DocumentRequest requestData, Authentication authentication) {
        String email = authentication.getName();
        User user = userService.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        
        // Set user information
        requestData.setUserId(user.getId());
        requestData.setUserName(user.getFirstName() + " " + user.getLastName());
        requestData.setUserEmail(user.getEmail());
        requestData.setRequestDate(LocalDate.now());
        requestData.setStatus("Pending");
        
        // If forUserId is provided, get user information
        if (requestData.getForUserId() != null && !requestData.getForUserId().isEmpty()) {
            User forUser = userService.findById(requestData.getForUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + requestData.getForUserId()));
            
            requestData.setForUserName(forUser.getFirstName() + " " + forUser.getLastName());
            requestData.setForUserEmail(forUser.getEmail());
            
            // Set request type
            requestData.setRequestType("user-to-user");
        } else {
            // If no forUserId, this is a user-to-admin request
            requestData.setRequestType("user-to-admin");
        }
        
        // Save request
        DocumentRequest savedRequest = documentRequestService.saveRequest(requestData);
        
        // Create activity
        DocumentActivity activity = new DocumentActivity();
        activity.setType("request");
        activity.setUser(user.getFirstName() + " " + user.getLastName());
        activity.setUserId(user.getId());
        activity.setDocument(savedRequest.getDocumentName());
        documentActivityService.saveActivity(activity);
        
        return new ResponseEntity<>(savedRequest, HttpStatus.CREATED);
    }
    
    // Update request status
    @PatchMapping("/{id}/status")
    public ResponseEntity<DocumentRequest> updateRequestStatus(
            @PathVariable String id, 
            @RequestBody Map<String, String> statusUpdate,
            Authentication authentication) {
        
        String status = statusUpdate.get("status");
        if (status == null) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        
        DocumentRequest request = documentRequestService.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Document request not found with id: " + id));
        
        String email = authentication.getName();
        User user = userService.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        
        // Update request status
        request.setStatus(status);
        if (status.equals("Completed")) {
            request.setCompletedDate(LocalDate.now());
        }
        
        DocumentRequest updatedRequest = documentRequestService.saveRequest(request);
        
        // Create activity if status is completed or rejected
        if (status.equals("Completed") || status.equals("Rejected")) {
            DocumentActivity activity = new DocumentActivity();
            activity.setType(status.toLowerCase());
            activity.setUser(user.getFirstName() + " " + user.getLastName());
            activity.setUserId(user.getId());
            activity.setDocument(request.getDocumentName() + " for " + request.getUserName());
            documentActivityService.saveActivity(activity);
        }
        
        return new ResponseEntity<>(updatedRequest, HttpStatus.OK);
    }
    
    // Delete request
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRequest(@PathVariable String id) {
        documentRequestService.deleteRequest(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}