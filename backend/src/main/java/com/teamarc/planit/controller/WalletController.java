package com.teamarc.planit.controller;

import com.teamarc.planit.dto.WalletDto;
import com.teamarc.planit.dto.request.WalletDepositRequestDTO;
import com.teamarc.planit.dto.request.WalletDepositVerificationDTO;
import com.teamarc.planit.dto.request.WalletWithdrawRequestDTO;
import com.teamarc.planit.dto.response.RazorpayOrderResponseDTO;
import com.teamarc.planit.entity.User;
import com.teamarc.planit.entity.Wallet;
import com.teamarc.planit.services.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(path = "/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;
    private final ModelMapper modelMapper;

    @GetMapping
    public ResponseEntity<WalletDto> getMyWallet() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Wallet wallet = walletService.findByUser(user);
        return ResponseEntity.ok(modelMapper.map(wallet, WalletDto.class));
    }

    @PostMapping("/deposit/order")
    public ResponseEntity<RazorpayOrderResponseDTO> createDepositOrder(@RequestBody @Valid WalletDepositRequestDTO requestDTO) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(walletService.createDepositOrder(user, requestDTO.getAmount().doubleValue()));
    }

    @PostMapping("/deposit/verify")
    public ResponseEntity<WalletDto> verifyAndDeposit(@RequestBody @Valid WalletDepositVerificationDTO verificationDTO) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Wallet wallet = walletService.verifyAndDepositWallet(user, verificationDTO);
        return ResponseEntity.ok(modelMapper.map(wallet, WalletDto.class));
    }

    @PostMapping("/withdraw")
    public ResponseEntity<WalletDto> withdraw(@RequestBody @Valid WalletWithdrawRequestDTO requestDTO) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Wallet wallet = walletService.withdrawMoneyFromWallet(user, requestDTO.getAmount().doubleValue());
        return ResponseEntity.ok(modelMapper.map(wallet, WalletDto.class));
    }
}
