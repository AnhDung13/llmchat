package com.llmchat.chat.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.task.TaskExecutor;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.connection.stream.StreamReadOptions;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.llmchat.chat.dto.LLMRequestDTO;
import com.llmchat.chat.dto.MessageRequest;
import com.llmchat.chat.repository.ConversationRepository;
import com.llmchat.chat.repository.MessageRepositoriy;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
public class StreamingService {
    private final RestClient llmRestClient;
    private final MessageRepositoriy messageRepositoriy;
    private final ConversationRepository conversationRepository;
    private final ObjectMapper objectMapper;
    private final StringRedisTemplate redis;
    private final TaskExecutor executor;

    @Value("${app.llm.model}")
    private String model;

    public StreamingService(MessageRepositoriy messageRepositoriy, ConversationRepository conversationRepository,
            RestClient llmRestClient, ObjectMapper objectMapper, StringRedisTemplate redis,
            TaskExecutor executor) {
        this.messageRepositoriy = messageRepositoriy;
        this.conversationRepository = conversationRepository;
        this.llmRestClient = llmRestClient;
        this.objectMapper = objectMapper;
        this.redis = redis;
        this.executor = executor;

    }

    public SseEmitter stream(UUID userId, UUID convoId, MessageRequest req) {
        String key = "llm:stream" + UUID.randomUUID();

        SseEmitter emitter = new SseEmitter(0L);
        AtomicBoolean stopped = new AtomicBoolean(false);
        emitter.onCompletion(() -> stopped.set(true));
        emitter.onTimeout(() -> stopped.set(true));
        emitter.onError(e -> stopped.set(true));

        executor.execute(() -> openStream(key, req));
        executor.execute(() -> readStream(key, emitter, stopped));

        return emitter;
    }

    private void readStream(String key, SseEmitter emitter, AtomicBoolean stopped) {
        String lastId = "0";
        try {
            while (!stopped.get()) {
                List<MapRecord<String, Object, Object>> records = redis.opsForStream()
                        .read(StreamReadOptions.empty().block(Duration.ofSeconds(2)),
                                StreamOffset.create(key, ReadOffset.from(lastId)));

                if (records == null || records.isEmpty()) {
                    continue;
                }

                for (MapRecord<String, Object, Object> record : records) {
                    lastId = record.getId().getValue();
                    Map<Object, Object> fields = record.getValue();
                    String type = String.valueOf(fields.get("type"));

                    if (type.equals("done")) {
                        emitter.send(SseEmitter.event().name("done").data(Map.of("text", fields.get("text"))));
                        emitter.complete();
                        return;
                    }
                    emitter.send(SseEmitter.event().name("delta").data(Map.of("text", fields.get("text"))));
                }
            }
        } catch (IOException e) {
            emitter.completeWithError(e);
        }
    }

    private void openStream(String key, MessageRequest req) {
        LLMRequestDTO llmReq = new LLMRequestDTO(model, true, List.of(req));
        llmRestClient.post().uri("/chat/completions").body(llmReq).exchange((request, response) -> {
            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(response.getBody(), StandardCharsets.UTF_8));
            String line;
            StringBuilder fullText = new StringBuilder();

            try {
                while ((line = reader.readLine()) != null) {
                    if (!line.startsWith("data: ")) {
                        continue;
                    }
                    String rawdata = line.substring(6);
                    if (rawdata.equals("[DONE]")) {
                        redis.opsForStream().add(key, Map.of("type", "done", "text", fullText.toString()));
                        break;
                    }
                    JsonNode data = objectMapper.readTree(rawdata);
                    JsonNode reasoning = data.path("choices").path(0).path("delta").path("reasoning");
                    JsonNode text = data.path("choices").path(0).path("delta").path("content");

                    if (!(reasoning.isMissingNode() || reasoning.isNull())) {
                        redis.opsForStream().add(key,
                                Map.of("type", "reasoning", "text", reasoning.asString()));
                    }
                    if (!(text.isMissingNode() || text.isNull())) {
                        redis.opsForStream().add(key, Map.of("type", "delta", "text", text.asString()));
                        fullText.append(text.asString());
                    }

                }
            } finally {
                redis.expire(key, Duration.ofMinutes(5));
            }
            return null;
        });

    }

}
