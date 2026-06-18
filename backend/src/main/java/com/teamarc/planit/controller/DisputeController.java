package com.teamarc.planit.controller;

import com.teamarc.planit.dto.request.DisputeManagementRequestDTO;
import com.teamarc.planit.dto.response.DisputeManagementResponseDTO;
import com.teamarc.planit.services.DisputeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/disputes")
@RequiredArgsConstructor
public class DisputeController {

    private final DisputeService disputeService;

    @PostMapping
    @Secured({"ROLE_CUSTOMER", "ROLE_VENDOR"})
    public ResponseEntity<DisputeManagementResponseDTO> raiseDispute(@RequestBody @Valid DisputeManagementRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(disputeService.raiseDispute(dto));
    }

    @GetMapping("/my")
    public ResponseEntity<List<DisputeManagementResponseDTO>> getMyDisputes() {
        return ResponseEntity.ok(disputeService.getMyDisputes());
    }

    @GetMapping("/{disputeId}")
    public ResponseEntity<DisputeManagementResponseDTO> getDisputeById(@PathVariable Long disputeId) {
        return ResponseEntity.ok(disputeService.getDisputeById(disputeId));
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<DisputeManagementResponseDTO> getDisputeByBookingId(@PathVariable Long bookingId) {
        return ResponseEntity.ok(disputeService.getDisputeByBookingId(bookingId));
    }
}
