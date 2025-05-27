package com.example.Backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.Backend.model.User;
import com.example.Backend.repository.UserRepository;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmployeeIdService employeeIdService;

    @Autowired
    public AuthServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder, EmployeeIdService employeeIdService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.employeeIdService = employeeIdService;
    }

    @Override
    public User register(User user) {
        // Check if user with this email already exists
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email is already registered. Please use a different email address.");
        }

        // Validate that firstName and lastName are provided
        if (user.getFirstName() == null || user.getFirstName().trim().isEmpty()) {
            throw new IllegalArgumentException("First name is required");
        }
        
        if (user.getLastName() == null || user.getLastName().trim().isEmpty()) {
            throw new IllegalArgumentException("Last name is required");
        }
        
        // Validate password (as a backup to frontend validation)
        if (user.getPassword() == null || user.getPassword().trim().length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long");
        }

        // Encode password before saving
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        
        // Generate and set a unique employee ID
        user.setEmployeeId(employeeIdService.generateEmployeeId());

        // Log the user being registered
        System.out.println("Registering user: " + user.getFirstName() + " " + user.getLastName() + 
                           " (" + user.getEmail() + ") as " + user.getPosition());

        // Save user to database
        return userRepository.save(user);
    }

    @Override
    public User authenticate(String email, String password) {
        // Find user by email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        // Check if password matches
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        return user;
    }
}