package com.llmchat.chat.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.llmchat.chat.dto.ConversationRequest;
import com.llmchat.chat.model.Conversation;
import com.llmchat.chat.model.Message;
import com.llmchat.chat.service.ConversationService;
import com.llmchat.chat.service.MessageService;
import com.llmchat.common.ApiResponse;
import com.llmchat.common.JwtUtils;
import com.llmchat.common.Paging;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/conversations")
public class ConversationController {
    private final ConversationService conversationService;
    private final MessageService messageService;

    public ConversationController(ConversationService conversationService, MessageService messageService) {
        this.conversationService = conversationService;
        this.messageService = messageService;

    }

    @GetMapping
    public ApiResponse<List<Conversation>> getListConversation(@AuthenticationPrincipal Jwt jwt,
            @Valid Paging payload) {
        UUID userId = JwtUtils.subjectToUUID(jwt);
        return ApiResponse.success(HttpStatus.OK, null, conversationService.getConversations(userId, payload));
    }

    @GetMapping("/{id}")
    public ApiResponse<Conversation> getConversation(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        UUID userId = JwtUtils.subjectToUUID(jwt);
        return ApiResponse.success(HttpStatus.OK, null, conversationService.getConversation(userId, id));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Conversation>> createConversation(@AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ConversationRequest payload) {
        UUID userId = JwtUtils.subjectToUUID(jwt);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(HttpStatus.CREATED, null,
                conversationService.createConversation(userId, payload.title())));
    }

    @PutMapping("/{id}")
    public ApiResponse<Conversation> updateConversation(@AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody ConversationRequest payload) {
        UUID userId = JwtUtils.subjectToUUID(jwt);
        return ApiResponse.success(HttpStatus.OK, null,
                conversationService.updateConversation(userId, id, payload.title()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConversation(@AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id) {
        UUID userId = JwtUtils.subjectToUUID(jwt);
        conversationService.deleteConversation(userId, id);
        return ResponseEntity.noContent().build();
    }

    // messages
    @GetMapping("/{id}/messages")
    public ApiResponse<List<Message>> getMessages(@AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id) {
        UUID userId = JwtUtils.subjectToUUID(jwt);
        return ApiResponse.success(HttpStatus.OK, null, messageService.getMessages(userId, id));
    }

}
