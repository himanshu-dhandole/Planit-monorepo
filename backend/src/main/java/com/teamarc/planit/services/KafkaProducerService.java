package com.teamarc.planit.services;

import com.teamarc.planit.configs.KafkaConfig;
import com.teamarc.planit.dto.response.ChatMessageResponseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaProducerService {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void sendMessage(ChatMessageResponseDTO message) {
        log.info("Publishing message to Kafka topic {}: {}", KafkaConfig.CHAT_TOPIC, message);
        kafkaTemplate.send(KafkaConfig.CHAT_TOPIC, String.valueOf(message.getConversationId()), message);
    }
}
