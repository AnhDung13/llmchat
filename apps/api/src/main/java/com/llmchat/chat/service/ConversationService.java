package com.llmchat.chat.service;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.llmchat.chat.model.Conversation;
import com.llmchat.chat.repository.ConversationRepository;
import com.llmchat.common.MessageKey;
import com.llmchat.common.Paging;
import com.llmchat.exception.AppException;

@Service
public class ConversationService {
    private final ConversationRepository conversationRepository;

    public ConversationService(ConversationRepository conversationRepository) {
        this.conversationRepository = conversationRepository;

    }

    public List<Conversation> getConversations(UUID userId, Paging payload) {
        return conversationRepository.getConversations(userId, payload);
    }

    public Conversation getConversation(UUID convoId, UUID userId) {
        return conversationRepository.findById(convoId, userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, MessageKey.CONVERSATION_NOT_FOUND));
    }

    public Conversation createConversation(UUID userId, String title) {
        return conversationRepository.insertConversation(userId, title);
    }
}
