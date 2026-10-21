CREATE TABLE refresh_tokens (
    id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64)  NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ  NOT NULL,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- PostgreSQL không tự tạo index cho khoá ngoại; cần khi thu hồi mọi token của một user
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
