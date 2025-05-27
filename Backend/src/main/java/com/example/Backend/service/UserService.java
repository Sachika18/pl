package com.example.Backend.service;

import com.example.Backend.model.User;

import java.util.List;
import java.util.Optional;

public interface UserService {
    Optional<User> findById(String id);
    Optional<User> findByEmail(String email);
    List<User> findAllUsers();
    User updateUserProfile(String userId, User updatedUser);
}