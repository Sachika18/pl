package com.example.Backend.service;

import java.util.List;
import java.util.Optional;

import com.example.Backend.model.DocumentActivity;

public interface DocumentActivityService {
    List<DocumentActivity> findAllActivities();
    List<DocumentActivity> findActivitiesByUser(String userId);
    List<DocumentActivity> findActivitiesByDocument(String documentId);
    List<DocumentActivity> findActivitiesByType(String type);
    Optional<DocumentActivity> findById(String id);
    DocumentActivity saveActivity(DocumentActivity activity);
}