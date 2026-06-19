package com.teamarc.planit.services;

import com.teamarc.planit.entity.Customer;
import com.teamarc.planit.entity.KarmaTransaction;
import com.teamarc.planit.entity.User;
import com.teamarc.planit.entity.Vendor;
import com.teamarc.planit.entity.enums.Role;
import com.teamarc.planit.repository.CustomerRepository;
import com.teamarc.planit.repository.KarmaTransactionRepository;
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
public class KarmaService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final VendorRepository vendorRepository;
    private final KarmaTransactionRepository karmaTransactionRepository;

    public static final double MIN_KARMA = 1.0;
    public static final double MAX_KARMA = 5.0;

    /**
     * Applies a karma change to a user.
     * Keeps user, customer, and vendor karma columns in sync.
     * Enforces policy outcomes (suspension/refund flags).
     * Logs the transaction in the database (silent, no notifications).
     */
    @Transactional
    public void applyKarmaChange(Long userId, Role actionRole, Double amount, String ruleApplied, Long bookingId, Long complaintId, Long reviewId, String description) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        double previousKarma = user.getKarma() != null ? user.getKarma() : 5.0;
        
        // Clamping between 1.0 and 5.0
        double rawNewKarma = previousKarma + amount;
        double newKarma = Math.max(MIN_KARMA, Math.min(MAX_KARMA, rawNewKarma));

        // Format to 2 decimal places
        BigDecimal bd = BigDecimal.valueOf(newKarma);
        bd = bd.setScale(2, RoundingMode.HALF_UP);
        newKarma = bd.doubleValue();

        // 1. Update User Entity
        user.setKarma(newKarma);
        userRepository.save(user);

        // 2. Synchronize Customer Entity
        Customer customer = customerRepository.findByUserId(userId);
        if (customer != null) {
            customer.setKarma(newKarma);
            customerRepository.save(customer);
        }

        // 3. Synchronize Vendor Entity
        Optional<Vendor> vendorOpt = vendorRepository.findByUser_Id(userId);
        if (vendorOpt.isPresent()) {
            Vendor vendor = vendorOpt.get();
            vendor.setKarma(newKarma);

            // Enforcement: If karma drops below 2.0, suspend vendor profile
            if (newKarma < 2.0) {
                vendor.setIsActive(false);
                log.warn("Vendor {} suspended due to low karma score ({})", vendor.getBusinessName(), newKarma);
            }

            vendorRepository.save(vendor);
        }

        // 4. Log the audit transaction (silent)
        KarmaTransaction transaction = KarmaTransaction.builder()
                .userId(userId)
                .actionRole(actionRole)
                .amount(amount)
                .previousKarma(previousKarma)
                .newKarma(newKarma)
                .ruleApplied(ruleApplied)
                .bookingId(bookingId)
                .complaintId(complaintId)
                .reviewId(reviewId)
                .description(description)
                .build();

        karmaTransactionRepository.save(transaction);

        log.info("Applied karma change to user ID {}: previous={}, new={}, rule={}", userId, previousKarma, newKarma, ruleApplied);
    }

    /**
     * Get the trust badge name based on karma score.
     */
    public String getTrustBadge(Double karma) {
        if (karma == null) return "STANDARD";
        if (karma >= 4.5) return "GOLD";
        if (karma >= 4.0) return "SILVER";
        return "STANDARD";
    }

    /**
     * Check if customer needs stricter refund checks.
     */
    public boolean needsStricterRefundCheck(Double karma) {
        if (karma == null) return false;
        return karma < 3.0;
    }
}
