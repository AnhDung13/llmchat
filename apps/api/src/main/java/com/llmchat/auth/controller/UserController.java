package com.llmchat.auth.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.llmchat.auth.model.User;
import com.llmchat.auth.service.UserService;
import com.llmchat.common.ApiResponse;

@RestController
@RequestMapping("/api/me")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping()
    public ApiResponse<User> getInfo(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        User user = userService.getUserById(userId);
        return ApiResponse.success(HttpStatus.OK, null, user);
    }

}
