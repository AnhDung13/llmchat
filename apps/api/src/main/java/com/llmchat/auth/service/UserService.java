package com.llmchat.auth.service;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.llmchat.auth.model.User;
import com.llmchat.auth.repository.UserRepository;
import com.llmchat.common.MessageKey;
import com.llmchat.exception.AppException;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getUserById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.UNAUTHORIZED, MessageKey.UNAUTHORIZED));
    }

}
