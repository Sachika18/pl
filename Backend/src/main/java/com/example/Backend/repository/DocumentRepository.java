package com.example.Backend.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.example.Backend.model.DocumentFile;

@Repository
public interface DocumentRepository extends MongoRepository<DocumentFile, String> {
    List<DocumentFile> findByUploadedById(String uploadedById);
    List<DocumentFile> findByForUserId(String forUserId);
    List<DocumentFile> findByForUser(String forUser);
    List<DocumentFile> findByForRequestId(String forRequestId);
}