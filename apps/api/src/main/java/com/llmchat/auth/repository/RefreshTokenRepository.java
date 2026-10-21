package com.llmchat.auth.repository;

import java.sql.Timestamp;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class RefreshTokenRepository {
    private final JdbcClient jdbcClient;

    public RefreshTokenRepository(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    public Optional<UUID> consumeRefreshToken(String tokenHash) {
        String sql = """
                UPDATE refresh_tokens
                SET revoked_at = clock_timestamp()
                WHERE token_hash = :tokenHash
                  AND revoked_at IS NULL
                  AND expires_at > clock_timestamp()
                RETURNING user_id
                """;
        return jdbcClient.sql(sql).param("tokenHash", tokenHash).query(UUID.class).optional();
    }

    public void insertRefreshToken(UUID userId, String tokenHash, Timestamp expiresAt) {
        String sql = """
                INSERT INTO refresh_tokens (token_hash, user_id, expires_at)
                VALUES (:tokenHash, :userId, :expiresAt)
                """;
        jdbcClient.sql(sql)
                .param("tokenHash", tokenHash)
                .param("userId", userId)
                .param("expiresAt", expiresAt)
                .update();
    }
}
