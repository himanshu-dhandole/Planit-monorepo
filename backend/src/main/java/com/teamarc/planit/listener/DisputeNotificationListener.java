package com.teamarc.planit.listener;

import com.teamarc.planit.configs.RabbitMQConfig;
import com.teamarc.planit.events.DisputeNotificationEvent;
import com.teamarc.planit.services.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DisputeNotificationListener {

    private final EmailService emailService;

    @RabbitListener(queues = RabbitMQConfig.DISPUTE_NOTIFICATION_QUEUE)
    public void handleDisputeNotification(DisputeNotificationEvent event) {
        log.info("Received dispute notification email event for recipient: {}", event.getRecipientEmail());
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("recipientName", event.getRecipientName());
        variables.put("eventType", event.getEventType());
        variables.put("reason", event.getReason());
        variables.put("resolutionNote", event.getResolutionNote());
        variables.put("newStatus", event.getNewStatus());
        variables.put("bookingId", event.getBookingId());
        variables.put("currentYear", java.time.Year.now().getValue());

        String subject = "Dispute Update - Booking #" + event.getBookingId();
        if ("RAISED_CONFIRMATION".equals(event.getEventType())) {
            subject = "Confirmation: Your Dispute for Booking #" + event.getBookingId() + " has been Submitted";
        } else if ("RAISED".equals(event.getEventType())) {
            subject = "Alert: A Dispute has been Raised for Booking #" + event.getBookingId();
        }

        emailService.sendTemplateEmail(
                event.getRecipientEmail(),
                "dispute-notification-email",
                variables,
                subject
        );
    }
}
