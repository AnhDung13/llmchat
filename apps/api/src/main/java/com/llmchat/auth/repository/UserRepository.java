package com.llmchat.auth.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.llmchat.auth.model.User;

@Repository
public class UserRepository {
    private final JdbcClient jdbcClient;

    public UserRepository(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    public Boolean existEmail(String email) {
        String sql = "SELECT EXISTS(SELECT 1 FROM users WHERE email = :email)";
        return jdbcClient.sql(sql).param("email", email).query(Boolean.class).single();
    }

    public User insertUser(String email, String passwordHash, String displayName) {
        String sql = """
                INSERT INTO users (email, password_hash, display_name)
                VALUES (:email, :passwordHash, :displayName)
                RETURNING id, email, password_hash, display_name, created_at
                """;
        return jdbcClient.sql(sql)
                .param("email", email)
                .param("passwordHash", passwordHash)
                .param("displayName", displayName)
                .query(UserRepository::mapRow)
                .single();
    }

    private static User mapRow(ResultSet rs, int rowNum) throws SQLException {
        return new User(
                rs.getObject("id", UUID.class),
                rs.getString("email"),
                rs.getString("password_hash"),
                rs.getString("display_name"),
                rs.getTimestamp("created_at").toInstant());
    }

}
