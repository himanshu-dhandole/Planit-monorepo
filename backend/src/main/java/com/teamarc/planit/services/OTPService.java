package com.teamarc.planit.services;

import com.teamarc.planit.dto.request.OTPVerificationDTO;
import com.teamarc.planit.dto.response.OTPResponseDTO;
import com.teamarc.planit.entity.OTP;
import com.teamarc.planit.entity.User;
import com.teamarc.planit.events.OTPEmailEvent;
import com.teamarc.planit.exceptions.ResourceNotFoundException;
import com.teamarc.planit.exceptions.RuntimeConflictException;
import com.teamarc.planit.repository.OTPRepository;
import com.teamarc.planit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OTPService {

    private final OTPRepository otpRepository;
    private final UserRepository userRepository;
    private final RabbitTemplate rabbitTemplate;
    private final PasswordEncoder passwordEncoder;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Value("${otp.validity.minutes:5}")
    private Integer otpValidityMinutes;

    @Value("${otp.length:6}")
    private Integer otpLength;

    /**
     * Generate and send OTP for email verification
     * Hashes OTP before storing in database
     * Sends plain text OTP to user's email
     */
    @Transactional
    public OTPResponseDTO generateAndSendOTP(String email, OTP.OTPType otpType) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));



        // Generate plain text OTP using SecureRandom
        String generatedOTP = generateOTP();
        
        // Hash the OTP before storing in database
        String hashedOTP = passwordEncoder.encode(generatedOTP);
        
        LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(otpValidityMinutes);

        OTP otp = OTP.builder()
                .user(user)
                .hashedCode(hashedOTP)  // Store only hashed OTP
                .email(email)
                .type(otpType)
                .expiryTime(expiryTime)
                .isUsed(false)
                .build();

        OTP savedOTP = otpRepository.save(otp);

        // Publish event to send plain text OTP via email
        OTPEmailEvent event = OTPEmailEvent.builder()
                .otpId(savedOTP.getId())
                .email(email)
                .userName(user.getName())
                .otpCode(generatedOTP)  // Send plain text only
                .otpType(otpType.toString())
                .expiryMinutes(otpValidityMinutes)
                .build();

        rabbitTemplate.convertAndSend("email.exchange", "email.otp", event);
        log.info("OTP generated and event published for email: {}", email);

        return new OTPResponseDTO(
                savedOTP.getId(),
                email,
                otpValidityMinutes,
                "OTP sent successfully to your email"
        );
    }

    /**
     * Verify OTP for email verification
     * Compares plain text input against stored hash
     */
    @Transactional
    public void verifyOTP(OTPVerificationDTO verificationDTO) {
        // Get valid OTP records for the email
        List<OTP> otpList = otpRepository.findValidOTPByEmailAndType(
                verificationDTO.getEmail(),
                OTP.OTPType.EMAIL_VERIFICATION,
                LocalDateTime.now()
        );

        if (otpList.isEmpty()) {
            log.warn("No valid OTP found for email: {}", verificationDTO.getEmail());
            throw new RuntimeConflictException("Invalid or expired OTP");
        }

        // Get the latest OTP
        OTP otp = otpList.get(0);

        // Check if already used
        if (otp.getIsUsed()) {
            log.warn("OTP already used for email: {}", verificationDTO.getEmail());
            throw new RuntimeConflictException("OTP has already been used");
        }

        // Compare plain text OTP with stored hash using PasswordEncoder
        boolean isValidOTP = passwordEncoder.matches(verificationDTO.getOtpCode().trim(), otp.getHashedCode());
        
        if (!isValidOTP) {
            log.warn("Invalid OTP attempt for email: {}", verificationDTO.getEmail());
            throw new RuntimeConflictException("Invalid OTP");
        }

        // Mark OTP as used
        otp.setIsUsed(true);
        otpRepository.save(otp);

        log.info("OTP verified successfully for email: {}", verificationDTO.getEmail());
    }

    /**
     * Verify OTP for password reset
     */
    @Transactional
    public void verifyPasswordResetOTP(OTPVerificationDTO verificationDTO) {
        List<OTP> otpList = otpRepository.findValidOTPByEmailAndType(
                verificationDTO.getEmail(),
                OTP.OTPType.PASSWORD_RESET,
                LocalDateTime.now()
        );

        if (otpList.isEmpty()) {
            log.warn("No valid password reset OTP found for email: {}", verificationDTO.getEmail());
            throw new RuntimeConflictException("Invalid or expired OTP");
        }

        OTP otp = otpList.get(0);

        if (otp.getIsUsed()) {
            log.warn("Password reset OTP already used for email: {}", verificationDTO.getEmail());
            throw new RuntimeConflictException("OTP has already been used");
        }

        // Compare using PasswordEncoder
        boolean isValidOTP = passwordEncoder.matches(verificationDTO.getOtpCode().trim(), otp.getHashedCode());
        
        if (!isValidOTP) {
            log.warn("Invalid OTP attempt for password reset: {}", verificationDTO.getEmail());
            throw new RuntimeConflictException("Invalid OTP");
        }

        otp.setIsUsed(true);
        otpRepository.save(otp);

        log.info("Password reset OTP verified for email: {}", verificationDTO.getEmail());
    }

    /**
     * Generate cryptographically secure random OTP using SecureRandom
     */
    private String generateOTP() {
        StringBuilder otp = new StringBuilder();
        for (int i = 0; i < otpLength; i++) {
            otp.append(SECURE_RANDOM.nextInt(10));
        }
        return otp.toString();
    }

    /**
     * Delete expired OTPs (should run via scheduled task)
     */
    @Transactional
    public void deleteExpiredOTPs() {
        otpRepository.deleteByExpiryTimeBefore(LocalDateTime.now());
        log.info("Expired OTPs deleted");
    }

    /**
     * Resend OTP - delete old OTP and generate new one
     */
    @Transactional
    public OTPResponseDTO resendOTP(String email, OTP.OTPType otpType) {
        // Delete old OTPs for this email and type
        List<OTP> oldOTPs = otpRepository.findLatestValidOTPForEmail(email, otpType);
        oldOTPs.forEach(otp -> otpRepository.delete(otp));

        // Generate new OTP
        return generateAndSendOTP(email, otpType);
    }
}
