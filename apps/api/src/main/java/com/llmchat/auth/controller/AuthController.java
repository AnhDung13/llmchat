package com.llmchat.auth.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.llmchat.auth.dto.LoginRequest;
import com.llmchat.auth.dto.RefreshRequest;
import com.llmchat.auth.dto.RegisterRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/login")
    public void login(@RequestBody LoginRequest loginRequest) {

        return;
    }

    @PostMapping("/register")
    public void register(@Valid @RequestBody RegisterRequest registerRequest) {
        // TODO: process POST request

        return;
    }

    @PostMapping("/refresh")
    public String postMethodName(@RequestBody RefreshRequest refreshRequest) {
        // TODO: process POST request

        return "";
    }

    @PostMapping("/logout")
    public void logout(@RequestBody String entity) {
        // TODO: process POST request

        return;
    }

}
