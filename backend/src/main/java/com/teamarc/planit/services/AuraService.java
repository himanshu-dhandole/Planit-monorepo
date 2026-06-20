package com.teamarc.planit.services;

import com.teamarc.planit.entity.Customer;
import com.teamarc.planit.entity.AuraTransaction;
import com.teamarc.planit.entity.User;
import com.teamarc.planit.entity.Vendor;
import com.teamarc.planit.entity.enums.Role;
import com.teamarc.planit.repository.CustomerRepository;
import com.teamarc.planit.repository.AuraTransactionRepository;
import com.teamarc.planit.repository.UserRepository;
import com.teamarc.planit.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuraService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final VendorRepository vendorRepository;
    private final AuraTransactionRepository auraTransactionRepository;

    public static final double MIN_AURA = 0.0;
    public static final double MAX_AURA = 1000.0;

    /**
     * Applies an aura change to a user.
     * Keeps user, customer, and vendor aura columns in sync.
     * Enforces policy outcomes (suspension/refund flags).
     * Logs the transaction in the database (silent, no notifications).
     */
    @Transactional
    public void applyAuraChange(Long userId, Role actionRole, Double amount, String ruleApplied, Long bookingId, Long complaintId, Long reviewId, String description) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        double previousAura = user.getAura() != null ? user.getAura() : 500.0;
        
        // Clamping between 0.0 and 1000.0
        double rawNewAura = previousAura + amount;
        double newAura = Math.max(MIN_AURA, Math.min(MAX_AURA, rawNewAura));

        // Format to 2 decimal places
        BigDecimal bd = BigDecimal.valueOf(newAura);
        bd = bd.setScale(2, RoundingMode.HALF_UP);
        newAura = bd.doubleValue();

        // 1. Update User Entity
        user.setAura(newAura);
        userRepository.save(user);

        // 2. Synchronize Customer Entity
        Customer customer = customerRepository.findByUserId(userId);
        if (customer != null) {
            customer.setAura(newAura);
            customerRepository.save(customer);
        }

        // 3. Synchronize Vendor Entity
        Optional<Vendor> vendorOpt = vendorRepository.findByUser_Id(userId);
        if (vendorOpt.isPresent()) {
            Vendor vendor = vendorOpt.get();
            vendor.setAura(newAura);

            // Enforcement: If aura drops below 100.0, suspend vendor profile
            if (newAura < 100.0) {
                vendor.setIsActive(false);
                log.warn("Vendor {} suspended due to low aura score ({})", vendor.getBusinessName(), newAura);
            }

            vendorRepository.save(vendor);
        }

        // 4. Log the audit transaction (silent)
        AuraTransaction transaction = AuraTransaction.builder()
                .userId(userId)
                .actionRole(actionRole)
                .amount(amount)
                .previousAura(previousAura)
                .newAura(newAura)
                .ruleApplied(ruleApplied)
                .bookingId(bookingId)
                .complaintId(complaintId)
                .reviewId(reviewId)
                .description(description)
                .build();

        auraTransactionRepository.save(transaction);

        log.info("Applied aura change to user ID {}: previous={}, new={}, rule={}", userId, previousAura, newAura, ruleApplied);
    }

    /**
     * Get the trust badge name based on aura score.
     */
    public String getTrustBadge(Double aura) {
        if (aura == null) return "LUMINOUS";
        if (aura >= 800.0) return "RADIANT";
        if (aura >= 500.0) return "LUMINOUS";
        return "FAINT";
    }

    /**
     * Check if customer needs stricter refund checks.
     */
    public boolean needsStricterRefundCheck(Double aura) {
        if (aura == null) return false;
        return aura < 300.0;
    }
}
