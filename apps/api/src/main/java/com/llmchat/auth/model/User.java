package com.llmchat.auth.model;

import java.time.Instant;
import java.util.UUID;

public record User(UUID id, String email, String passwordHash, String displayName, Instant createdAt) {
}
