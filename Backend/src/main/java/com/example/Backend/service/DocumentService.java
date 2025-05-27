package com.example.Backend.service;

import java.util.List;
import java.util.Optional;

import com.example.Backend.model.DocumentFile;

public interface DocumentService {
    List<DocumentFile> findAllDocuments();
    List<DocumentFile> findDocumentsByUser(String userId);
    List<DocumentFile> findDocumentsForUser(String userId);
    Optional<DocumentFile> findById(String id);
    DocumentFile saveDocument(DocumentFile document);
    void deleteDocument(String id);
    List<DocumentFile> findDocumentsByRequestId(String requestId);
}