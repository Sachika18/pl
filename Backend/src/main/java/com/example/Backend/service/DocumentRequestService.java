package com.example.Backend.service;

import java.util.List;
import java.util.Optional;

import com.example.Backend.model.DocumentRequest;

public interface DocumentRequestService {
    List<DocumentRequest> findAllRequests();
    List<DocumentRequest> findRequestsByUser(String userId);
    List<DocumentRequest> findRequestsForUser(String userId);
    List<DocumentRequest> findRequestsByStatus(String status);
    Optional<DocumentRequest> findById(String id);
    DocumentRequest saveRequest(DocumentRequest request);
    void deleteRequest(String id);
    DocumentRequest updateRequestStatus(String id, String status);
}