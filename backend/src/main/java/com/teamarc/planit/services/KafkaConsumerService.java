package com.teamarc.planit.services;

import com.teamarc.planit.configs.KafkaConfig;
import com.teamarc.planit.dto.response.ChatMessageResponseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaConsumerService {

    private final SimpMessagingTemplate messagingTemplate;

    @KafkaListener(topics = KafkaConfig.CHAT_TOPIC, groupId = "planit-chat-group")
    public void consumeMessage(ChatMessageResponseDTO message) {
        log.info("Received message from Kafka topic {}: {}", KafkaConfig.CHAT_TOPIC, message);
        String destination = "/topic/messages/" + message.getConversationId();
        log.info("Broadcasting message over WebSocket to destination: {}", destination);
        messagingTemplate.convertAndSend(destination, message);
    }
}
