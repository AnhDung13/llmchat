package com.llmchat.chat.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.llmchat.chat.model.Message;

@Repository
public class MessageRepositoriy {
    private final JdbcClient jdbcClientl;

    public MessageRepositoriy(JdbcClient jdbcClient) {
        this.jdbcClientl = jdbcClient;
    }

    public List<Message> getMessages(UUID convoId) {
        String sql = "SELECT id, role, content, created_at FROM messages WHERE conversation_id = :convoId";
        return jdbcClientl.sql(sql).param("convoId", convoId).query(MessageRepositoriy::mapRow).list();
    }

    private static Message mapRow(ResultSet rs, int rowNum) throws SQLException {
        return new Message(rs.getObject("id", UUID.class), rs.getString("role"), rs.getString("content"),
                rs.getTimestamp("created_at").toInstant());
    }
}
