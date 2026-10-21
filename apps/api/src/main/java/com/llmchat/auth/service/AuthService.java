package com.llmchat.auth.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.llmchat.auth.dto.LoginRequest;
import com.llmchat.auth.dto.LoginResponse;
import com.llmchat.auth.dto.RegisterRequest;
import com.llmchat.auth.dto.RefreshRequest;
import com.llmchat.auth.dto.TokenResponse;
import com.llmchat.auth.model.User;
import com.llmchat.auth.model.UserCredentials;
import com.llmchat.auth.repository.UserRepository;
import com.llmchat.exception.AppException;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public AuthService(PasswordEncoder passwordEncoder, UserRepository userRepository, TokenService tokenService) {
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
        this.tokenService = tokenService;
    }

    public void register(RegisterRequest req) {
        if (userRepository.existEmail(req.email())) {
            throw new AppException(HttpStatus.CONFLICT, "Email đã được đăng ký");
        }
        userRepository.insertUser(req.email(), passwordEncoder.encode(req.password()), req.displayName());
    }

    @Transactional
    public TokenResponse refresh(RefreshRequest req) {
        User user = userRepository.findById(tokenService.consumeRefreshToken(req.refreshToken()));
        String accessToken = tokenService.createAccessToken(user);
        String refreshToken = tokenService.createRefreshToken(user.id());
        return new TokenResponse(accessToken, "Bearer", tokenService.getAccessTtlSeconds(), refreshToken);
    }

    public LoginResponse login(LoginRequest req) {
        String errorMessage = "Email hoặc mật khẩu không đúng";

        UserCredentials userCredentials = userRepository.findCredentialsByEmail(req.email())
                .orElseThrow(() -> new AppException(HttpStatus.UNAUTHORIZED, errorMessage));

        if (!passwordEncoder.matches(req.password(), userCredentials.passwordHash())) {
            throw new AppException(HttpStatus.UNAUTHORIZED, errorMessage);
        }

        String accessToken = tokenService.createAccessToken(userCredentials.user());
        String refreshToken = tokenService.createRefreshToken(userCredentials.user().id());

        return new LoginResponse(accessToken, "Bearer", tokenService.getAccessTtlSeconds(), refreshToken,
                userCredentials.user());
    }
}
