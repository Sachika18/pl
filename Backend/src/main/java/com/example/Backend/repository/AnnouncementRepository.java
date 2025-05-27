package com.example.Backend.repository;

import com.example.Backend.model.Announcement;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface AnnouncementRepository extends MongoRepository<Announcement, String> {
    
    // Find announcements that are not expired
    List<Announcement> findByExpiryDateGreaterThanEqual(LocalDateTime now);
    
    // Find announcements for a specific department or for all departments
    @Query("{ $and: [ { expiryDate: { $gte: ?0 } }, { $or: [ { targetDepartments: 'all' }, { targetDepartments: ?1 } ] } ] }")
    List<Announcement> findActiveAnnouncementsForDepartment(LocalDateTime now, String department);
    
    // Find announcements created by a specific admin
    List<Announcement> findByCreatedBy(String adminId);
}