package com.example.Backend.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.Backend.model.DocumentFile;
import com.example.Backend.repository.DocumentRepository;

@Service
public class DocumentServiceImpl implements DocumentService {

    @Autowired
    private DocumentRepository documentRepository;

    @Override
    public List<DocumentFile> findAllDocuments() {
        return documentRepository.findAll();
    }

    @Override
    public List<DocumentFile> findDocumentsByUser(String userId) {
        return documentRepository.findByUploadedById(userId);
    }

    @Override
    public List<DocumentFile> findDocumentsForUser(String userId) {
        List<DocumentFile> documents = new ArrayList<>();
        documents.addAll(documentRepository.findByForUserId(userId));
        documents.addAll(documentRepository.findByForUser("All Employees"));
        return documents;
    }

    @Override
    public Optional<DocumentFile> findById(String id) {
        return documentRepository.findById(id);
    }

    @Override
    public DocumentFile saveDocument(DocumentFile document) {
        return documentRepository.save(document);
    }

    @Override
    public void deleteDocument(String id) {
        documentRepository.deleteById(id);
    }

    @Override
    public List<DocumentFile> findDocumentsByRequestId(String requestId) {
        return documentRepository.findByForRequestId(requestId);
    }
}