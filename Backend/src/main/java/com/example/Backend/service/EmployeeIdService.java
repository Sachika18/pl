package com.example.Backend.service;

import com.example.Backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class EmployeeIdService {

    private final UserRepository userRepository;

    @Autowired
    public EmployeeIdService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Generates a unique employee ID in the format 1A001, 1A002, etc.
     * @return A unique employee ID
     */
    public String generateEmployeeId() {
        // Count the number of users and add 1 to get the next ID
        long userCount = userRepository.count() + 1;
        
        // Format as 1A001, 1A002, etc.
        return String.format("1A%03d", userCount);
    }
}