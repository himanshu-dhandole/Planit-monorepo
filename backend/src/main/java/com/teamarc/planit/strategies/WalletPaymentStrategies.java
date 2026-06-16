package com.teamarc.planit.strategies;

import com.teamarc.planit.entity.Customer;
import com.teamarc.planit.entity.Payment;
import com.teamarc.planit.entity.Vendor;
import com.teamarc.planit.entity.Wallet;
import com.teamarc.planit.entity.enums.PaymentStatus;
import com.teamarc.planit.exceptions.ResourceNotFoundException;
import com.teamarc.planit.repository.PaymentRepository;
import com.teamarc.planit.repository.WalletRepository;
import com.teamarc.planit.repository.WalletTransactionRepository;
import com.teamarc.planit.services.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;


@Service
@RequiredArgsConstructor
public class WalletPaymentStrategies {


    private final BigDecimal PLATFORM_FEES = BigDecimal.valueOf(0.05); // 5% Platform Charges
    private final WalletRepository walletRepository;
    private final PaymentRepository paymentRepository;
    private final WalletService walletService;
    private final WalletTransactionRepository walletTransactionRepository;

    @Transactional
    public void processPayment(Payment payment) {

        Vendor vendor = payment.getBooking().getServices().getVendor();
        Customer customer = payment.getBooking().getCustomer();

        Wallet customerWallet = walletRepository.findByUser_Id(customer.getUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer wallet not found"));


        if(BigDecimal.valueOf(customerWallet.getBalance()).compareTo(payment.getAmount()) < 0) {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            throw new RuntimeException("Insufficient balance in wallet: payment failed");
        }

        if(payment.getStatus() == PaymentStatus.PAID) {
            throw new IllegalStateException("Payment is already processed");
        }

        if(payment.getStatus() == PaymentStatus.CANCELLED) {
            throw new IllegalStateException("Payment is already cancelled");
        }

        walletService.deductMoney(customer.getUser(), payment.getAmount(), generateWithdrawTransactionId(), payment.getBooking());

        BigDecimal businessShare = payment.getAmount().multiply(BigDecimal.ONE.subtract(PLATFORM_FEES));

        walletService.addMoney(vendor.getUser(), businessShare, generateCreditTransactionId(), payment.getBooking());
        payment.setStatus(PaymentStatus.PAID);
        paymentRepository.save(payment);


    }

    @Transactional
    public void refundPayment(Payment payment) {
        Vendor vendor = payment.getBooking().getServices().getVendor();
        Customer customer = payment.getBooking().getCustomer();

        Wallet vendorWallet = walletRepository.findByUser_Id(vendor.getUser().getId()).orElseThrow(() -> new ResourceNotFoundException("Business wallet not found"));

        if(BigDecimal.valueOf(vendorWallet.getBalance()).compareTo(payment.getAmount()) < 0) {
            throw new RuntimeException("Insufficient balance in Vendor wallet: refund failed.");
        }

        walletService.deductMoney(vendor.getUser(), payment.getAmount(), generateWithdrawTransactionId(), payment.getBooking());
        walletService.addMoney(customer.getUser(), payment.getAmount(), generateCreditTransactionId(), payment.getBooking());
        payment.setStatus(PaymentStatus.REFUNDED);
        paymentRepository.save(payment);

    }

    @Transactional
    public void refundBookedServicePayment(Payment payment) {
        Vendor vendor = payment.getBooking().getServices().getVendor();
        Customer customer = payment.getBooking().getCustomer();

        Wallet vendorWallet = walletRepository.findByUser_Id(vendor.getUser().getId()).orElseThrow(() -> new ResourceNotFoundException("Business wallet not found"));

        BigDecimal refundAmount = payment.getAmount().multiply(BigDecimal.ONE.subtract(PLATFORM_FEES.multiply(BigDecimal.TWO)));

        if(BigDecimal.valueOf(vendorWallet.getBalance()).compareTo(payment.getAmount()) < 0) {
            throw new RuntimeException("Insufficient balance in Vendor wallet: refund failed.");
        }

        walletService.deductMoney(vendor.getUser(), refundAmount, generateWithdrawTransactionId(), payment.getBooking());
        walletService.addMoney(customer.getUser(), payment.getAmount(), generateCreditTransactionId(), payment.getBooking());
        payment.setStatus(PaymentStatus.REFUNDED);
        paymentRepository.save(payment);

    }

    private String generateWithdrawTransactionId() {
        String id  = "WTX"+ UUID.randomUUID().toString().replace("-", "");
        if(walletTransactionRepository.findByTransactionId(id).isPresent()) {
            return generateWithdrawTransactionId(); // Ensure unique transaction ID
        } else {
            return id;
        }
    }

    private String generateCreditTransactionId() {
        String id  = "CTX"+ UUID.randomUUID().toString().replace("-", "");
        if(walletTransactionRepository.findByTransactionId(id).isPresent()) {
            return generateCreditTransactionId(); // Ensure unique transaction ID
        } else {
            return id;
        }
    }

}
