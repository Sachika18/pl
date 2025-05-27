package com.example.Backend.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.Backend.model.Leave;

public interface LeaveRepository extends MongoRepository<Leave, String> {
    List<Leave> findByUserId(String userId);
    List<Leave> findByUserIdOrderByAppliedOnDesc(String userId);
    List<Leave> findByStatus(String status);
    List<Leave> findByStatusOrderByAppliedOnDesc(String status);
}