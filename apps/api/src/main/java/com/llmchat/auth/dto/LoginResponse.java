package com.llmchat.auth.dto;

import com.llmchat.auth.model.User;

public record LoginResponse(String accessToken, String tokenType, long expiresIn, String refreshToken, User user) {
}
