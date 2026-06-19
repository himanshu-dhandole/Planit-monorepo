package com.teamarc.planit.strategies;

import com.teamarc.planit.configs.PlatformFeeConfig;
import com.teamarc.planit.entity.Customer;
import com.teamarc.planit.entity.Escrow;
import com.teamarc.planit.entity.Payment;
import com.teamarc.planit.entity.Vendor;
import com.teamarc.planit.entity.Wallet;
import com.teamarc.planit.entity.enums.PaymentStatus;
import com.teamarc.planit.exceptions.InsufficientFundsException;
import com.teamarc.planit.exceptions.ResourceNotFoundException;
import com.teamarc.planit.repository.EscrowRepository;
import com.teamarc.planit.repository.PaymentRepository;
import com.teamarc.planit.repository.WalletRepository;
import com.teamarc.planit.repository.WalletTransactionRepository;
import com.teamarc.planit.services.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WalletPaymentStrategies {

    private final WalletRepository walletRepository;
    private final PaymentRepository paymentRepository;
    private final EscrowRepository escrowRepository;
    private final WalletService walletService;
    private final WalletTransactionRepository walletTransactionRepository;

    @Transactional
    public void releaseEscrowToVendor(Escrow escrow) {
        Vendor vendor = escrow.getBooking().getServices().getVendor();

        // 1. Calculate vendorFee = escrow.heldAmount * 0.02
        BigDecimal heldAmount = escrow.getHeldAmount();
        BigDecimal vendorFee = heldAmount.multiply(PlatformFeeConfig.PLATFORM_FEE_RATE)
                .setScale(2, RoundingMode.HALF_UP);

        // 2. Deduct vendorFee from vendor wallet. If vendor wallet has insufficient funds, throw InsufficientFundsException.
        Wallet vendorWallet = walletRepository.findByUser_Id(vendor.getUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor wallet not found"));

        if (BigDecimal.valueOf(vendorWallet.getBalance()).compareTo(vendorFee) < 0) {
            throw new InsufficientFundsException("Insufficient funds in vendor wallet for platform fee");
        }

        walletService.deductMoney(vendor.getUser(), vendorFee, generateWithdrawTransactionId(), escrow.getBooking());

        // 3. Credit escrow.heldAmount - vendorFee to vendor wallet
        BigDecimal vendorCredit = heldAmount.subtract(vendorFee);
        walletService.addMoney(vendor.getUser(), vendorCredit, generateCreditTransactionId(), escrow.getBooking());

        // 4. Set Escrow.status = RELEASED_TO_VENDOR, Escrow.releasedAt = now()
        escrow.setStatus(Escrow.EscrowStatus.RELEASED_TO_VENDOR);
        escrow.setReleasedAt(LocalDateTime.now());
        escrowRepository.save(escrow);

        // 5. Set Payment.status = PAID (if not already)
        Payment payment = paymentRepository.findByBooking(escrow.getBooking())
                .orElseThrow(() -> new ResourceNotFoundException("Payment record not found for booking ID: " + escrow.getBooking().getId()));
        if (payment.getStatus() != PaymentStatus.PAID) {
            payment.setStatus(PaymentStatus.PAID);
            paymentRepository.save(payment);
        }
    }

    @Transactional
    public void refundEscrowToCustomer(Escrow escrow) {
        Customer customer = escrow.getBooking().getCustomer();

        // 1. Credit escrow.heldAmount back to customer wallet (customer platform fee is non-refundable)
        walletService.addMoney(customer.getUser(), escrow.getHeldAmount(), generateCreditTransactionId(), escrow.getBooking());

        // 2. Set Escrow.status = REFUNDED_TO_CUSTOMER
        escrow.setStatus(Escrow.EscrowStatus.REFUNDED_TO_CUSTOMER);
        escrowRepository.save(escrow);

        // 3. Set Payment.status = REFUNDED
        Payment payment = paymentRepository.findByBooking(escrow.getBooking())
                .orElseThrow(() -> new ResourceNotFoundException("Payment record not found for booking ID: " + escrow.getBooking().getId()));
        payment.setStatus(PaymentStatus.REFUNDED);
        paymentRepository.save(payment);
    }

    @Transactional
    public void cancelWithFeeByCustomer(Escrow escrow) {
        Customer customer = escrow.getBooking().getCustomer();

        // 1. Calculate cancellationFee = escrow.heldAmount * 0.02
        BigDecimal heldAmount = escrow.getHeldAmount();
        BigDecimal cancellationFee = heldAmount.multiply(PlatformFeeConfig.CANCELLATION_FEE_RATE)
                .setScale(2, RoundingMode.HALF_UP);

        // 2. Refund escrow.heldAmount - cancellationFee to customer wallet
        BigDecimal refundAmount = heldAmount.subtract(cancellationFee);
        walletService.addMoney(customer.getUser(), refundAmount, generateCreditTransactionId(), escrow.getBooking());

        // 3. Keep cancellationFee as platform revenue (do not credit to vendor)

        // 4. Set Escrow.status = PARTIALLY_REFUNDED
        escrow.setStatus(Escrow.EscrowStatus.PARTIALLY_REFUNDED);
        escrowRepository.save(escrow);

        // 5. Set Payment.status = REFUNDED
        Payment payment = paymentRepository.findByBooking(escrow.getBooking())
                .orElseThrow(() -> new ResourceNotFoundException("Payment record not found for booking ID: " + escrow.getBooking().getId()));
        payment.setStatus(PaymentStatus.REFUNDED);
        paymentRepository.save(payment);
    }

    @Transactional
    public void cancelWithFeeByVendor(Escrow escrow) {
        Customer customer = escrow.getBooking().getCustomer();
        Vendor vendor = escrow.getBooking().getServices().getVendor();

        // 1. Calculate cancellationFee = escrow.heldAmount * 0.02
        BigDecimal heldAmount = escrow.getHeldAmount();
        BigDecimal cancellationFee = heldAmount.multiply(PlatformFeeConfig.CANCELLATION_FEE_RATE)
                .setScale(2, RoundingMode.HALF_UP);

        // Check vendor wallet balance first to fail fast
        Wallet vendorWallet = walletRepository.findByUser_Id(vendor.getUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor wallet not found"));

        if (BigDecimal.valueOf(vendorWallet.getBalance()).compareTo(cancellationFee) < 0) {
            throw new InsufficientFundsException("Insufficient funds in vendor wallet for cancellation fee penalty");
        }

        // 2. Credit full escrow.heldAmount to customer wallet (full refund, no deduction)
        walletService.addMoney(customer.getUser(), heldAmount, generateCreditTransactionId(), escrow.getBooking());

        // 3. Deduct cancellationFee from vendor wallet as penalty
        walletService.deductMoney(vendor.getUser(), cancellationFee, generateWithdrawTransactionId(), escrow.getBooking());

        // 4. Set Escrow.status = REFUNDED_TO_CUSTOMER
        escrow.setStatus(Escrow.EscrowStatus.REFUNDED_TO_CUSTOMER);
        escrowRepository.save(escrow);

        // 5. Set Payment.status = REFUNDED
        Payment payment = paymentRepository.findByBooking(escrow.getBooking())
                .orElseThrow(() -> new ResourceNotFoundException("Payment record not found for booking ID: " + escrow.getBooking().getId()));
        payment.setStatus(PaymentStatus.REFUNDED);
        paymentRepository.save(payment);
    }

    private String generateWithdrawTransactionId() {
        String id = "WTX" + UUID.randomUUID().toString().replace("-", "");
        if (walletTransactionRepository.findByTransactionId(id).isPresent()) {
            return generateWithdrawTransactionId(); // Ensure unique transaction ID
        } else {
            return id;
        }
    }

    private String generateCreditTransactionId() {
        String id = "CTX" + UUID.randomUUID().toString().replace("-", "");
        if (walletTransactionRepository.findByTransactionId(id).isPresent()) {
            return generateCreditTransactionId(); // Ensure unique transaction ID
        } else {
            return id;
        }
    }
}
