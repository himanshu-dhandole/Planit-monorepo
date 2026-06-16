package com.teamarc.planit.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender javaMailSender;
    private final TemplateEngine templateEngine;

    /**
     * Send email with Thymeleaf template
     */
    public void sendTemplateEmail(String recipientEmail, String templateName, Map<String, Object> variables, String subject) {
        try {
            Context context = new Context();
            context.setVariables(variables);

            String emailContent = templateEngine.process(templateName, context);

            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setTo(recipientEmail);
            helper.setSubject(subject);
            helper.setText(emailContent, true);

            javaMailSender.send(mimeMessage);
            log.info("Email sent successfully to: {}", recipientEmail);

        } catch (MessagingException e) {
            log.error("Failed to send email to: {} with error: {}", recipientEmail, e.getMessage());
            throw new RuntimeException("Failed to send email", e);
        }
    }

    /**
     * Send OTP email
     */
    public void sendOTPEmail(String email, String userName, String otpCode, Integer validityMinutes, String otpType) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", userName);
        variables.put("otpCode", otpCode);
        variables.put("validityMinutes", validityMinutes);
        variables.put("otpType", otpType);
        variables.put("currentYear", java.time.Year.now().getValue());

        String subject = "PASSWORD_RESET".equals(otpType) ? "Reset Your Password - OTP" : "Email Verification - OTP";
        sendTemplateEmail(email, "otp-email", variables, subject);
    }

    /**
     * Send vendor approval email
     */
    public void sendVendorApprovalEmail(String email, String vendorName, String businessName) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("vendorName", vendorName);
        variables.put("businessName", businessName);
        variables.put("currentYear", java.time.Year.now().getValue());

        sendTemplateEmail(email, "vendor-approval-email", variables, "Vendor Approval Confirmation");
    }

    /**
     * Send welcome email
     */
    public void sendWelcomeEmail(String email, String userName) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", userName);
        variables.put("currentYear", java.time.Year.now().getValue());

        sendTemplateEmail(email, "welcome-email", variables, "Welcome to Planit!");
    }

    /**
     * Send password reset email
     */
    public void sendPasswordResetEmail(String email, String userName, String resetLink, Integer validityMinutes) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", userName);
        variables.put("resetLink", resetLink);
        variables.put("validityMinutes", validityMinutes);
        variables.put("currentYear", java.time.Year.now().getValue());

        sendTemplateEmail(email, "password-reset-email", variables, "Reset Your Password");
    }
}
