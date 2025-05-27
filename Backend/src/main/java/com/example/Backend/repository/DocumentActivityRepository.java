package com.example.Backend.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.example.Backend.model.DocumentActivity;

@Repository
public interface DocumentActivityRepository extends MongoRepository<DocumentActivity, String> {
    List<DocumentActivity> findByUserId(String userId);
    List<DocumentActivity> findByDocumentId(String documentId);
    List<DocumentActivity> findByType(String type);
    List<DocumentActivity> findAllByOrderByTimestampDesc();
}