package com.teamarc.planit.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class OTPScheduler {

    private final OTPService otpService;

    /**
     * Run every hour to clean up expired OTPs
     */
    @Scheduled(fixedRate = 3600000)
    public void scheduleExpiredOTPCleanup() {
        log.info("Running scheduled task to delete expired OTPs...");
        otpService.deleteExpiredOTPs();
    }
}
