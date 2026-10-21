package com.llmchat.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(@NotBlank @Email String email,
                @NotBlank @Size(min = 8, message = "Password must be at least 8 characters long") String password,
                @NotBlank @Size(max = 50, message = "Display name must be at most 50 characters long") String displayName) {
}
