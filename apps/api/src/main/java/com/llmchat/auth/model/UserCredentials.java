package com.llmchat.auth.model;

public record UserCredentials(User user, String passwordHash) {
}
