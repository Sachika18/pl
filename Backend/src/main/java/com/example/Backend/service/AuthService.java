package com.example.Backend.service;

import com.example.Backend.model.User;

public interface AuthService {
    User register(User user);
    User authenticate(String email, String password);
}





