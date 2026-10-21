package com.llmchat.exception;

import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.llmchat.common.ApiResponse;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Void>> handleAppException(AppException ex) {
        return build(ex.getStatus(), ex.getMessage());
    }

    // @Valid thất bại
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return build(HttpStatus.BAD_REQUEST, message);
    }

    // Body không phải JSON hợp lệ, hoặc thiếu body
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotReadable(HttpMessageNotReadableException ex) {
        return build(HttpStatus.BAD_REQUEST, "Dữ liệu gửi lên không đúng định dạng JSON");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception ex) {
        // Lỗi Spring tự ném ra đã mang sẵn HTTP status (404 sai đường dẫn, 405 sai
        // method, ResponseStatusException...)
        if (ex instanceof ErrorResponse errorResponse) {
            HttpStatusCode status = errorResponse.getStatusCode();

            return build(status, errorResponse.getBody().getDetail());
        }

        // Lỗi không lường trước: ghi log đầy đủ, nhưng không lộ chi tiết cho client
        log.error("Unhandled exception", ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi hệ thống, vui lòng thử lại sau");
    }

    private ResponseEntity<ApiResponse<Void>> build(HttpStatusCode status, String message) {
        return ResponseEntity.status(status).body(ApiResponse.error(status, message));
    }
}
