package com.llmchat.auth.dto;

import com.llmchat.common.MessageKey;

import jakarta.validation.constraints.NotBlank;

public record LogoutRequest(@NotBlank(message = MessageKey.FIELD_REQUIRED) String refreshToken) {

}
