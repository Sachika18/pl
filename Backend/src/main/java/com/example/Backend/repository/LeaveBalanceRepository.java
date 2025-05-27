package com.example.Backend.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.Backend.model.LeaveBalance;

public interface LeaveBalanceRepository extends MongoRepository<LeaveBalance, String> {
    Optional<LeaveBalance> findByUserId(String userId);
}