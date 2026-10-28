package com.llmchat.chat.dto;

import com.llmchat.common.MessageKey;

import jakarta.validation.constraints.NotBlank;

public record MessageRequest(@NotBlank(message = MessageKey.FIELD_REQUIRED) String role,
        @NotBlank(message = MessageKey.FIELD_REQUIRED) String content) {

}
