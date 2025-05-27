package com.example.Backend.service;

import com.example.Backend.model.Announcement;
import com.example.Backend.repository.AnnouncementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;

    @Autowired
    public AnnouncementService(AnnouncementRepository announcementRepository) {
        this.announcementRepository = announcementRepository;
    }

    // Create a new announcement
    public Announcement createAnnouncement(Announcement announcement) {
        return announcementRepository.save(announcement);
    }

    // Get all announcements
    public List<Announcement> getAllAnnouncements() {
        return announcementRepository.findAll();
    }

    // Get announcement by ID
    public Optional<Announcement> getAnnouncementById(String id) {
        return announcementRepository.findById(id);
    }

    // Get active announcements (not expired)
    public List<Announcement> getActiveAnnouncements() {
        return announcementRepository.findByExpiryDateGreaterThanEqual(LocalDateTime.now());
    }

    // Get active announcements for a specific department
    public List<Announcement> getActiveAnnouncementsForDepartment(String department) {
        return announcementRepository.findActiveAnnouncementsForDepartment(LocalDateTime.now(), department);
    }

    // Get announcements created by a specific admin
    public List<Announcement> getAnnouncementsByAdmin(String adminId) {
        return announcementRepository.findByCreatedBy(adminId);
    }

    // Update an announcement
    public Announcement updateAnnouncement(String id, Announcement announcementDetails) {
        Optional<Announcement> announcement = announcementRepository.findById(id);
        
        if (announcement.isPresent()) {
            Announcement existingAnnouncement = announcement.get();
            
            existingAnnouncement.setTitle(announcementDetails.getTitle());
            existingAnnouncement.setContent(announcementDetails.getContent());
            existingAnnouncement.setPriority(announcementDetails.getPriority());
            existingAnnouncement.setTargetDepartments(announcementDetails.getTargetDepartments());
            existingAnnouncement.setExpiryDate(announcementDetails.getExpiryDate());
            
            return announcementRepository.save(existingAnnouncement);
        }
        
        return null;
    }

    // Delete an announcement
    public void deleteAnnouncement(String id) {
        announcementRepository.deleteById(id);
    }
}