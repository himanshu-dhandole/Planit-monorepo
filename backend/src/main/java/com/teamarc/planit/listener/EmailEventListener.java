package com.teamarc.planit.listener;

import com.teamarc.planit.events.OTPEmailEvent;
import com.teamarc.planit.services.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailEventListener {

    private final EmailService emailService;

    @RabbitListener(queues = "otp.email.queue")
    public void handleOTPEmailEvent(OTPEmailEvent event) {
        try {
            log.info("Processing OTP email event for: {}", event.getEmail());
            emailService.sendOTPEmail(
                    event.getEmail(),
                    event.getUserName(),
                    event.getOtpCode(),
                    event.getExpiryMinutes()
            );
            log.info("OTP email sent successfully to: {}", event.getEmail());
        } catch (Exception e) {
            log.error("Failed to send OTP email to: {} with error: {}", event.getEmail(), e.getMessage(), e);
            // Implement retry logic if needed
        }
    }

    @RabbitListener(queues = "user.notification.queue")
    public void handleUserNotificationEvent(String message) {
        try {
            log.info("Processing user notification: {}", message);
            // Handle user notification logic
        } catch (Exception e) {
            log.error("Failed to process user notification: {}", e.getMessage());
        }
    }

    @RabbitListener(queues = "vendor.approval.queue")
    public void handleVendorApprovalEvent(String message) {
        try {
            log.info("Processing vendor approval notification: {}", message);
            // Handle vendor approval logic
        } catch (Exception e) {
            log.error("Failed to process vendor approval: {}", e.getMessage());
        }
    }
}
