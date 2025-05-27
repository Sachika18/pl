package com.example.Backend.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.example.Backend.model.DocumentRequest;

@Repository
public interface DocumentRequestRepository extends MongoRepository<DocumentRequest, String> {
    List<DocumentRequest> findByUserId(String userId);
    List<DocumentRequest> findByForUserId(String forUserId);
    List<DocumentRequest> findByStatus(String status);
}