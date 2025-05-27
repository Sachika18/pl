package com.example.Backend.service;

import com.example.Backend.model.User;
import com.example.Backend.repository.UserRepository;
import com.example.Backend.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Autowired
    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public Optional<User> findById(String id) {
        return userRepository.findById(id);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    @Override
    public List<User> findAllUsers() {
        return userRepository.findAll();
    }
    
    @Override
    public User updateUserProfile(String userId, User updatedUser) {
        return userRepository.findById(userId)
            .map(existingUser -> {
                System.out.println("Updating user profile for ID: " + userId);
                
                // Update basic info if provided
                if (updatedUser.getFirstName() != null) {
                    existingUser.setFirstName(updatedUser.getFirstName());
                }
                if (updatedUser.getLastName() != null) {
                    existingUser.setLastName(updatedUser.getLastName());
                }
                if (updatedUser.getPosition() != null) {
                    existingUser.setPosition(updatedUser.getPosition());
                }
                
                // Update profile picture
                if (updatedUser.getAvatar() != null) {
                    existingUser.setAvatar(updatedUser.getAvatar());
                }
                
                // Update additional profile fields if provided
                if (updatedUser.getPhoneNumber() != null) {
                    existingUser.setPhoneNumber(updatedUser.getPhoneNumber());
                }
                if (updatedUser.getAddress() != null) {
                    existingUser.setAddress(updatedUser.getAddress());
                }
                if (updatedUser.getCity() != null) {
                    existingUser.setCity(updatedUser.getCity());
                }
                if (updatedUser.getState() != null) {
                    existingUser.setState(updatedUser.getState());
                }
                if (updatedUser.getZipCode() != null) {
                    existingUser.setZipCode(updatedUser.getZipCode());
                }
                if (updatedUser.getCountry() != null) {
                    existingUser.setCountry(updatedUser.getCountry());
                }
                if (updatedUser.getBio() != null) {
                    existingUser.setBio(updatedUser.getBio());
                }
                if (updatedUser.getSkills() != null) {
                    existingUser.setSkills(updatedUser.getSkills());
                }
                if (updatedUser.getDepartment() != null) {
                    existingUser.setDepartment(updatedUser.getDepartment());
                }
                if (updatedUser.getDateOfBirth() != null) {
                    existingUser.setDateOfBirth(updatedUser.getDateOfBirth());
                }
                if (updatedUser.getJoinDate() != null) {
                    existingUser.setJoinDate(updatedUser.getJoinDate());
                }
                if (updatedUser.getEmergencyContact() != null) {
                    existingUser.setEmergencyContact(updatedUser.getEmergencyContact());
                }
                
                // Don't update email, password, or employeeId here to maintain integrity
                // If the user doesn't have an employeeId, generate one
                if (existingUser.getEmployeeId() == null || existingUser.getEmployeeId().isEmpty()) {
                    // Generate a simple employee ID based on the user's database ID
                    String idStr = existingUser.getId();
                    int idNum = Math.abs(idStr.hashCode() % 1000);
                    existingUser.setEmployeeId(String.format("1A%03d", idNum));
                    System.out.println("Generated employee ID: " + existingUser.getEmployeeId());
                }
                
                System.out.println("Saving updated user profile");
                return userRepository.save(existingUser);
            })
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }
}
