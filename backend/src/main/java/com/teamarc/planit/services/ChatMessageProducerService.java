package com.teamarc.planit.services;

import com.teamarc.planit.configs.RabbitMQConfig;
import com.teamarc.planit.dto.response.ChatMessageResponseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatMessageProducerService {

    private final RabbitTemplate rabbitTemplate;

    public void sendMessage(ChatMessageResponseDTO message) {
        log.info("Publishing chat message to RabbitMQ exchange: {}, routingKey: {}, message: {}", 
                RabbitMQConfig.CHAT_EXCHANGE, RabbitMQConfig.CHAT_MESSAGE_ROUTING_KEY, message);
        rabbitTemplate.convertAndSend(RabbitMQConfig.CHAT_EXCHANGE, RabbitMQConfig.CHAT_MESSAGE_ROUTING_KEY, message);
    }
}
