package com.example.Backend.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.example.Backend.model.User;
import com.example.Backend.repository.UserRepository;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@Order(2) // Run after AdminUserInitializer
public class EmployeeIdUpdater implements CommandLineRunner {

    private final UserRepository userRepository;

    @Autowired
    public EmployeeIdUpdater(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        System.out.println("EmployeeIdUpdater is running...");
        
        // Get all users
        List<User> users = userRepository.findAll();
        
        // Counter for employee IDs
        AtomicInteger counter = new AtomicInteger(1);
        
        // Update users without employee IDs
        for (User user : users) {
            if (user.getEmployeeId() == null || user.getEmployeeId().isEmpty()) {
                // Format as 1A001, 1A002, etc.
                String employeeId = String.format("1A%03d", counter.getAndIncrement());
                
                System.out.println("Updating user " + user.getEmail() + " with employee ID: " + employeeId);
                
                user.setEmployeeId(employeeId);
                userRepository.save(user);
            }
        }
        
        System.out.println("Employee ID update complete.");
    }
}