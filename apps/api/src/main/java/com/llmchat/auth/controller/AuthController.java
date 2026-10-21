package com.llmchat.auth.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.llmchat.auth.dto.LoginRequest;
import com.llmchat.auth.dto.RefreshRequest;
import com.llmchat.auth.dto.RegisterRequest;
import com.llmchat.auth.model.User;
import com.llmchat.auth.service.AuthService;
import com.llmchat.common.ApiResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public void login(@Valid @RequestBody LoginRequest loginRequest) {

        return;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<User>> register(@Valid @RequestBody RegisterRequest registerRequest) {
        User user = authService.registerUser(registerRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(HttpStatus.CREATED, user));
    }

    @PostMapping("/refresh")
    public String refresh(@Valid @RequestBody RefreshRequest refreshRequest) {
        // TODO: process POST request

        return "";
    }

    @PostMapping("/logout")
    public void logout(@RequestBody String entity) {
        // TODO: process POST request

        return;
    }

}
