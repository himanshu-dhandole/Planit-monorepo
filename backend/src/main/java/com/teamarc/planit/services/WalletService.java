package com.teamarc.planit.services;

import com.teamarc.planit.entity.Booking;
import com.teamarc.planit.entity.User;
import com.teamarc.planit.entity.Wallet;
import com.teamarc.planit.entity.WalletTransaction;
import com.teamarc.planit.entity.enums.TransactionMethod;
import com.teamarc.planit.entity.enums.TransactionType;
import com.teamarc.planit.exceptions.ResourceNotFoundException;
import com.teamarc.planit.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WalletService{

    private final WalletRepository walletRepository;
    private final ModelMapper modelMapper;
    private final WalletTransactionService walletTransactionService;

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
