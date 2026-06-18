package com.teamarc.planit.listener;

import com.teamarc.planit.configs.RabbitMQConfig;
import com.teamarc.planit.dto.response.NotificationPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class DisputeWebSocketListener {

    private final SimpMessagingTemplate messagingTemplate;

    @RabbitListener(queues = RabbitMQConfig.DISPUTE_WS_QUEUE)
    public void handleDisputeWebSocketNotification(NotificationPayload payload) {
        log.info("Broadcasting dispute WS notification to user: {}", payload.getRecipientUserId());
        String destination = "/topic/notifications/" + payload.getRecipientUserId();
        messagingTemplate.convertAndSend(destination, payload);
    }

    // Frontend subscription pattern:
    // stompClient.subscribe('/topic/notifications/' + currentUserId, (message) => {
    //     const notification = JSON.parse(message.body);
    //     // notification.type, notification.title, notification.message
    //     // Show as toast/badge in UI
    // });
}
