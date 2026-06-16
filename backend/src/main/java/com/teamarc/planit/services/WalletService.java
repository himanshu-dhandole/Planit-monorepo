package com.teamarc.planit.services;

import com.razorpay.RazorpayClient;
import com.teamarc.planit.dto.request.WalletDepositVerificationDTO;
import com.teamarc.planit.dto.response.RazorpayOrderResponseDTO;
import com.teamarc.planit.entity.Booking;
import com.teamarc.planit.entity.User;
import com.teamarc.planit.entity.Wallet;
import com.teamarc.planit.entity.WalletTransaction;
import com.teamarc.planit.entity.enums.TransactionMethod;
import com.teamarc.planit.entity.enums.TransactionType;
import com.teamarc.planit.exceptions.ResourceNotFoundException;
import com.teamarc.planit.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class WalletService{

    private final WalletRepository walletRepository;
    private final ModelMapper modelMapper;
    private final WalletTransactionService walletTransactionService;
    private final RazorpayClient razorpayClient;

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    @Transactional
    public Wallet addMoneyToWallet(User user, Double amount, String transactionId, Booking booking , TransactionMethod transactionMethod) {
        Wallet wallet = findByUser(user);
        wallet.setBalance(wallet.getBalance()+amount);
        WalletTransaction walletTransaction = WalletTransaction.builder()
                .transactionId(transactionId)
                .booking(booking)
                .wallet(wallet)
                .transactionType(TransactionType.CREDIT)
                .amount(amount)
                .transactionMethod(transactionMethod)
                .build();

        walletTransactionService.createNewWalletTransaction(walletTransaction);
        return walletRepository.save(wallet);
    }

    public void addMoney(User user, BigDecimal amount, String transactionId, Booking booking) {
        Wallet wallet = findByUser(user);
        wallet.setBalance(wallet.getBalance() + amount.doubleValue());
        WalletTransaction walletTxn = WalletTransaction.builder()
                .transactionId(transactionId)
                .transactionType(TransactionType.CREDIT)
                .transactionMethod(TransactionMethod.BANKING)
                .amount(amount.doubleValue())
                .booking(booking)
                .wallet(wallet)
                .build();
        walletTransactionService.createNewWalletTransaction(walletTxn);

        wallet.getTransactions().add(walletTxn);
        walletRepository.save(wallet);

        // TODO_MAIL_VENDOR

    }

    public Wallet deductMoney(User user, BigDecimal amount, String transactionId, Booking booking) {
        Wallet wallet = findByUser(user);

        if(BigDecimal.valueOf(wallet.getBalance()).compareTo(amount) < 0) {
            throw new IllegalArgumentException("Insufficient wallet balance");
        }

        wallet.setBalance(wallet.getBalance() - amount.doubleValue());
        WalletTransaction walletTxn = WalletTransaction.builder()
                .transactionId(transactionId)
                .transactionType(TransactionType.DEBIT)
                .transactionMethod(TransactionMethod.BANKING)
                .amount(amount.doubleValue())
                .booking(booking)
                .wallet(wallet)
                .build();
        walletTransactionService.createNewWalletTransaction(walletTxn);

        wallet.getTransactions().add(walletTxn);
        return walletRepository.save(wallet);
    }

    @Transactional
    public Wallet deductMoneyFromWallet(User user, Double amount, String transactionId, Booking booking , TransactionMethod transactionMethod) {
        Wallet wallet = findByUser(user);
        if (wallet.getBalance() < amount) {
            throw new IllegalArgumentException("Insufficient wallet balance");
        }
        wallet.setBalance(wallet.getBalance()-amount);
        WalletTransaction walletTransaction = WalletTransaction.builder()
                .transactionId(transactionId)
                .booking(booking)
                .wallet(wallet)
                .transactionType(TransactionType.DEBIT)
                .amount(amount)
                .transactionMethod(transactionMethod)
                .build();

        walletTransactionService.createNewWalletTransaction(walletTransaction);
        return walletRepository.save(wallet);

    }

    public void withdrawAllMyMoneyFromWallet() {

    }

    @Transactional
    public RazorpayOrderResponseDTO createDepositOrder(User user, Double amount) {
        long amountInPaise = Math.round(amount * 100);
        try {
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "wallet_deposit_" + user.getId() + "_" + System.currentTimeMillis());

            com.razorpay.Order razorpayOrder = razorpayClient.orders.create(orderRequest);
            String orderId = razorpayOrder.get("id");

            return RazorpayOrderResponseDTO.builder()
                    .id(orderId)
                    .amount(amountInPaise)
                    .currency("INR")
                    .keyId(keyId)
                    .bookingId(null)
                    .build();
        } catch (com.razorpay.RazorpayException e) {
            throw new RuntimeException("Error creating Razorpay order for wallet deposit: " + e.getMessage(), e);
        }
    }

    @Transactional
    public Wallet verifyAndDepositWallet(User user, WalletDepositVerificationDTO verificationDTO) {
        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", verificationDTO.getRazorpayOrderId());
            options.put("razorpay_payment_id", verificationDTO.getRazorpayPaymentId());
            options.put("razorpay_signature", verificationDTO.getRazorpaySignature());

            boolean isValid = com.razorpay.Utils.verifyPaymentSignature(options, keySecret);
            if (!isValid) {
                throw new IllegalArgumentException("Razorpay signature verification failed for wallet deposit");
            }

            return addMoneyToWallet(
                    user,
                    verificationDTO.getAmount().doubleValue(),
                    verificationDTO.getRazorpayPaymentId(),
                    null,
                    TransactionMethod.BANKING
            );
        } catch (com.razorpay.RazorpayException e) {
            throw new RuntimeException("Error verifying Razorpay wallet deposit: " + e.getMessage(), e);
        }
    }

    @Transactional
    public Wallet withdrawMoneyFromWallet(User user, Double amount) {
        String transactionId = "WWD_" + System.currentTimeMillis();
        return deductMoneyFromWallet(user, amount, transactionId, null, TransactionMethod.REFUND);
    }

    public Wallet findWalletById(Long walletId) {
        return walletRepository.findById(walletId)
                .orElseThrow(()-> new ResourceNotFoundException("Wallet not found with id: "+walletId));
    }

    public Wallet createNewWallet(User user) {
        Wallet wallet=new Wallet();
        wallet.setUser(user);
        return walletRepository.save(wallet);
    }

    public Wallet findByUser(User user) {
        return walletRepository.findByUser(user)
                .orElseThrow(()-> new ResourceNotFoundException("Wallet not found with id: "+user.getId()));
    }
}
