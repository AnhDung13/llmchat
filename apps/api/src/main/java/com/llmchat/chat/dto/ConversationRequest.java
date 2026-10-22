package com.llmchat.chat.dto;

import com.llmchat.common.MessageKey;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ConversationRequest(
        @NotBlank(message = MessageKey.FIELD_REQUIRED) @Size(max = 200, message = MessageKey.TITLE_TOO_LONG) String title) {
}