package com.example.Backend.service;

import com.example.Backend.model.DocumentRequest;
import com.example.Backend.repository.DocumentRequestRepository;
import com.example.Backend.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class DocumentRequestServiceImpl implements DocumentRequestService {

    @Autowired
    private DocumentRequestRepository documentRequestRepository;

    @Override
    public List<DocumentRequest> findAllRequests() {
        return documentRequestRepository.findAll();
    }

    @Override
    public List<DocumentRequest> findRequestsByUser(String userId) {
        return documentRequestRepository.findByUserId(userId);
    }

    @Override
    public List<DocumentRequest> findRequestsForUser(String userId) {
        return documentRequestRepository.findByForUserId(userId);
    }

    @Override
    public List<DocumentRequest> findRequestsByStatus(String status) {
        return documentRequestRepository.findByStatus(status);
    }

    @Override
    public Optional<DocumentRequest> findById(String id) {
        return documentRequestRepository.findById(id);
    }

    @Override
    public DocumentRequest saveRequest(DocumentRequest request) {
        if (request.getRequestDate() == null) {
            request.setRequestDate(LocalDate.now());
        }
        if (request.getStatus() == null) {
            request.setStatus("Pending");
        }
        return documentRequestRepository.save(request);
    }

    @Override
    public void deleteRequest(String id) {
        documentRequestRepository.deleteById(id);
    }

    @Override
    public DocumentRequest updateRequestStatus(String id, String status) {
        DocumentRequest request = documentRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document request not found with id: " + id));
        
        request.setStatus(status);
        
        if (status.equals("Completed")) {
            request.setCompletedDate(LocalDate.now());
        }
        
        return documentRequestRepository.save(request);
    }
}