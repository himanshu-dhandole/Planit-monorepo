package com.teamarc.planit.controller;

import com.teamarc.planit.dto.response.AuraTransactionResponseDTO;
import com.teamarc.planit.entity.AuraTransaction;
import com.teamarc.planit.mapper.BookingMapper;
import com.teamarc.planit.repository.AuraTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/aura")
@RequiredArgsConstructor
@Secured("ROLE_ADMIN")
public class AdminAuraController {

    private final AuraTransactionRepository auraTransactionRepository;
    private final BookingMapper bookingMapper;

    @GetMapping("/audit-trail")
    public ResponseEntity<List<AuraTransactionResponseDTO>> getAuditTrail() {
        List<AuraTransaction> transactions = auraTransactionRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        List<AuraTransactionResponseDTO> response = transactions.stream()
                .map(bookingMapper::toAuraTransactionResponse)
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AuraTransactionResponseDTO>> getUserAuditTrail(@PathVariable Long userId) {
        List<AuraTransaction> transactions = auraTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<AuraTransactionResponseDTO> response = transactions.stream()
                .map(bookingMapper::toAuraTransactionResponse)
                .toList();
        return ResponseEntity.ok(response);
    }
}
