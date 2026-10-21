package com.llmchat.auth.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.llmchat.auth.dto.LoginRequest;
import com.llmchat.auth.dto.LoginResponse;
import com.llmchat.auth.dto.RefreshRequest;
import com.llmchat.auth.dto.RegisterRequest;
import com.llmchat.auth.dto.TokenResponse;
import com.llmchat.auth.model.User;
import com.llmchat.auth.model.UserCredentials;
import com.llmchat.auth.repository.UserRepository;
import com.llmchat.common.MessageKey;
import com.llmchat.exception.AppException;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public AuthService(UserRepository userRepository, UserService userService, PasswordEncoder passwordEncoder,
            TokenService tokenService) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    public void register(RegisterRequest req) {
        if (userRepository.existEmail(req.email())) {
            throw new AppException(HttpStatus.CONFLICT, MessageKey.EMAIL_ALREADY_EXISTS);
        }
        userRepository.insertUser(req.email(), passwordEncoder.encode(req.password()), req.displayName());
    }

    @Transactional
    public TokenResponse refresh(RefreshRequest req) {
        User user = userService.getUserById(tokenService.consumeRefreshToken(req.refreshToken()));
        String accessToken = tokenService.createAccessToken(user);
        String refreshToken = tokenService.createRefreshToken(user.id());
        return new TokenResponse(accessToken, "Bearer", tokenService.getAccessTtlSeconds(), refreshToken);
    }

    public LoginResponse login(LoginRequest req) {
        UserCredentials userCredentials = userRepository.findCredentialsByEmail(req.email())
                .orElseThrow(() -> new AppException(HttpStatus.UNAUTHORIZED, MessageKey.INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(req.password(), userCredentials.passwordHash())) {
            throw new AppException(HttpStatus.UNAUTHORIZED, MessageKey.INVALID_CREDENTIALS);
        }

        String accessToken = tokenService.createAccessToken(userCredentials.user());
        String refreshToken = tokenService.createRefreshToken(userCredentials.user().id());

        return new LoginResponse(accessToken, "Bearer", tokenService.getAccessTtlSeconds(), refreshToken,
                userCredentials.user());
    }
}
