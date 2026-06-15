package com.teamarc.planit.services;

import com.teamarc.planit.entity.WalletTransaction;
import com.teamarc.planit.repository.WalletTransactionsRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class WalletTransactionService {

    private final ModelMapper modelMapper;
    private final WalletTransactionsRepository walletTransactionsRepository;

    public void createNewWalletTransaction(WalletTransaction walletTransaction) {
        walletTransactionsRepository.save(walletTransaction);
    }
}
