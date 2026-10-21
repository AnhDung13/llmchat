package com.llmchat.auth.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.llmchat.auth.dto.RegisterRequest;
import com.llmchat.auth.model.User;
import com.llmchat.auth.repository.UserRepository;
import com.llmchat.exception.AppException;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(PasswordEncoder passwordEncoder, UserRepository userRepository) {
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
    }

    public User registerUser(RegisterRequest req) {
        if (userRepository.existEmail(req.email())) {
            throw new AppException(HttpStatus.CONFLICT, "Email đã được đăng ký");
        }

        return userRepository.insertUser(req.email(), passwordEncoder.encode(req.password()), req.displayName());
    }

}
