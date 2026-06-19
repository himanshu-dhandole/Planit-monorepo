package com.teamarc.planit.controller;

import com.teamarc.planit.dto.response.KarmaTransactionResponseDTO;
import com.teamarc.planit.entity.KarmaTransaction;
import com.teamarc.planit.mapper.BookingMapper;
import com.teamarc.planit.repository.KarmaTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/karma")
@RequiredArgsConstructor
@Secured("ROLE_ADMIN")
public class AdminKarmaController {

    private final KarmaTransactionRepository karmaTransactionRepository;
    private final BookingMapper bookingMapper;

    @GetMapping("/audit-trail")
    public ResponseEntity<List<KarmaTransactionResponseDTO>> getAuditTrail() {
        List<KarmaTransaction> transactions = karmaTransactionRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        List<KarmaTransactionResponseDTO> response = transactions.stream()
                .map(bookingMapper::toKarmaTransactionResponse)
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<KarmaTransactionResponseDTO>> getUserAuditTrail(@PathVariable Long userId) {
        List<KarmaTransaction> transactions = karmaTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<KarmaTransactionResponseDTO> response = transactions.stream()
                .map(bookingMapper::toKarmaTransactionResponse)
                .toList();
        return ResponseEntity.ok(response);
    }
}
