package com.teamarc.planit.controller;

import com.teamarc.planit.dto.WalletDto;
import com.teamarc.planit.entity.User;
import com.teamarc.planit.entity.Wallet;
import com.teamarc.planit.services.WalletService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
