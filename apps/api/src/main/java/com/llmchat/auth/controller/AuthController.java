package com.llmchat.auth.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.llmchat.auth.dto.LoginRequest;
import com.llmchat.auth.dto.LoginResponse;
import com.llmchat.auth.dto.RefreshRequest;
import com.llmchat.auth.dto.RegisterRequest;
import com.llmchat.auth.dto.TokenResponse;
import com.llmchat.auth.service.AuthService;
import com.llmchat.common.ApiResponse;
import com.llmchat.common.MessageKey;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        LoginResponse loginResponse = authService.login(loginRequest);
        return ApiResponse.success(HttpStatus.OK, MessageKey.LOGIN_SUCCESS, loginResponse);
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest registerRequest) {
        authService.register(registerRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(HttpStatus.CREATED, MessageKey.REGISTER_SUCCESS, null));
    }

    @PostMapping("/refresh")
    public ApiResponse<TokenResponse> refresh(@Valid @RequestBody RefreshRequest refreshRequest) {
        return ApiResponse.success(HttpStatus.OK, null, authService.refresh(refreshRequest));
    }

    @PostMapping("/logout")
    public void logout(@RequestBody String entity) {
        // TODO: process POST request

        return;
    }

}
