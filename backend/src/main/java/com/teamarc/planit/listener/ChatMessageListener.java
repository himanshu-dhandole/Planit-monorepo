package com.teamarc.planit.listener;

import com.teamarc.planit.configs.RabbitMQConfig;
import com.teamarc.planit.dto.response.ChatMessageResponseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatMessageListener {

    private final SimpMessagingTemplate messagingTemplate;

    @RabbitListener(queues = RabbitMQConfig.CHAT_MESSAGE_QUEUE)
    public void consumeChatMessage(ChatMessageResponseDTO message) {
        log.info("Received chat message from RabbitMQ queue: {}", message);
        String destination = "/topic/messages/" + message.getConversationId();
        log.info("Broadcasting message over WebSocket to destination: {}", destination);
        messagingTemplate.convertAndSend(destination, message);
    }
}
