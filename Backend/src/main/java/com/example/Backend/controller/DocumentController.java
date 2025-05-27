package com.example.Backend.controller;

import com.example.Backend.model.DocumentFile;
import com.example.Backend.model.DocumentActivity;
import com.example.Backend.model.DocumentRequest;
import com.example.Backend.model.User;
import com.example.Backend.service.DocumentActivityService;
import com.example.Backend.service.DocumentRequestService;
import com.example.Backend.service.DocumentService;
import com.example.Backend.service.FileStorageService;
import com.example.Backend.service.UserService;
import com.example.Backend.exception.ResourceNotFoundException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    @Autowired
    private DocumentService documentService;
    
    @Autowired
    private DocumentRequestService documentRequestService;
    
    @Autowired
    private DocumentActivityService documentActivityService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private FileStorageService fileStorageService;

    // Get all documents (admin)
    @GetMapping
    public ResponseEntity<List<DocumentFile>> getAllDocuments() {
        List<DocumentFile> documents = documentService.findAllDocuments();
        return new ResponseEntity<>(documents, HttpStatus.OK);
    }
    
    // Get user documents
    @GetMapping("/user")
    public ResponseEntity<List<DocumentFile>> getUserDocuments(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        
        List<DocumentFile> documents = documentService.findDocumentsForUser(user.getId());
        return new ResponseEntity<>(documents, HttpStatus.OK);
    }
    
    // Get document by ID
    @GetMapping("/{id}")
    public ResponseEntity<DocumentFile> getDocumentById(@PathVariable String id) {
        DocumentFile document = documentService.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + id));
        
        return new ResponseEntity<>(document, HttpStatus.OK);
    }
    
    // Upload document
    @PostMapping
    public ResponseEntity<DocumentFile> uploadDocument(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam("name") String name,
            @RequestParam("type") String type,
            @RequestParam("size") String size,
            @RequestParam(value = "forUser", required = false, defaultValue = "All Employees") String forUser,
            @RequestParam(value = "forUserId", required = false) String forUserId,
            @RequestParam(value = "forRequestId", required = false) String forRequestId,
            Authentication authentication) {
        
        String email = authentication.getName();
        User user = userService.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        
        // Create document object
        DocumentFile document = new DocumentFile();
        document.setName(name);
        document.setType(type);
        document.setSize(size);
        document.setUploadedDate(LocalDate.now());
        document.setUploadedBy(user.getFirstName() + " " + user.getLastName());
        document.setUploadedById(user.getId());
        document.setForUser(forUser);
        document.setForUserId(forUserId);
        document.setForRequestId(forRequestId);
        
        // Handle file upload to storage service
        if (file != null && !file.isEmpty()) {
            try {
                // Use the FileStorageService to store the file
                String fileName = file.getOriginalFilename();
                String storedFileName = fileStorageService.storeFile(file);
                document.setFileUrl("/api/files/" + storedFileName);
            } catch (Exception e) {
                // If file upload fails, set a placeholder URL
                document.setFileUrl("/files/" + name);
            }
        } else {
            // If no file is provided, set a placeholder URL
            document.setFileUrl("/files/" + name);
        }
        
        // Save document
        DocumentFile savedDocument = documentService.saveDocument(document);
        
        // If this is for a request, update the request status
        if (forRequestId != null && !forRequestId.isEmpty()) {
            Optional<DocumentRequest> requestOpt = documentRequestService.findById(forRequestId);
            if (requestOpt.isPresent()) {
                DocumentRequest request = requestOpt.get();
                request.setStatus("Completed");
                request.setCompletedDate(LocalDate.now());
                request.setDocumentId(savedDocument.getId());
                documentRequestService.saveRequest(request);
            }
        }
        
        // Create activity
        DocumentActivity activity = new DocumentActivity();
        activity.setType("upload");
        activity.setUser(user.getFirstName() + " " + user.getLastName());
        activity.setUserId(user.getId());
        activity.setDocument(savedDocument.getName());
        activity.setDocumentId(savedDocument.getId());
        documentActivityService.saveActivity(activity);
        
        return new ResponseEntity<>(savedDocument, HttpStatus.CREATED);
    }
    
    // Delete document
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable String id, Authentication authentication) {
        DocumentFile document = documentService.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + id));
        
        String email = authentication.getName();
        User user = userService.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        
        // Delete document
        documentService.deleteDocument(id);
        
        // Create activity
        DocumentActivity activity = new DocumentActivity();
        activity.setType("delete");
        activity.setUser(user.getFirstName() + " " + user.getLastName());
        activity.setUserId(user.getId());
        activity.setDocument(document.getName());
        activity.setDocumentId(id);
        documentActivityService.saveActivity(activity);
        
        // If this document was for a request, update the request status
        if (document.getForRequestId() != null && !document.getForRequestId().isEmpty()) {
            Optional<DocumentRequest> requestOpt = documentRequestService.findById(document.getForRequestId());
            if (requestOpt.isPresent()) {
                DocumentRequest request = requestOpt.get();
                request.setStatus("Pending");
                request.setCompletedDate(null);
                request.setDocumentId(null);
                documentRequestService.saveRequest(request);
            }
        }
        
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}