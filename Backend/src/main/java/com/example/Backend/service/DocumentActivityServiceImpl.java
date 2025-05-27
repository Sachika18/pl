package com.example.Backend.service;

import com.example.Backend.model.DocumentActivity;
import com.example.Backend.repository.DocumentActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class DocumentActivityServiceImpl implements DocumentActivityService {

    @Autowired
    private DocumentActivityRepository documentActivityRepository;

    @Override
    public List<DocumentActivity> findAllActivities() {
        return documentActivityRepository.findAllByOrderByTimestampDesc();
    }

    @Override
    public List<DocumentActivity> findActivitiesByUser(String userId) {
        return documentActivityRepository.findByUserId(userId);
    }

    @Override
    public List<DocumentActivity> findActivitiesByDocument(String documentId) {
        return documentActivityRepository.findByDocumentId(documentId);
    }

    @Override
    public List<DocumentActivity> findActivitiesByType(String type) {
        return documentActivityRepository.findByType(type);
    }

    @Override
    public Optional<DocumentActivity> findById(String id) {
        return documentActivityRepository.findById(id);
    }

    @Override
    public DocumentActivity saveActivity(DocumentActivity activity) {
        if (activity.getTimestamp() == null) {
            activity.setTimestamp(LocalDateTime.now());
        }
        return documentActivityRepository.save(activity);
    }
}