
package com.teamarc.planit.controller;

import com.teamarc.planit.dto.request.DisputeResolutionRequestDTO;
import com.teamarc.planit.dto.response.DisputeManagementResponseDTO;
import com.teamarc.planit.entity.DisputeManagement;
import com.teamarc.planit.entity.DisputeManagement.DisputeStatus;
import com.teamarc.planit.services.DisputeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/disputes")
@RequiredArgsConstructor
@Secured("ROLE_ADMIN")
public class AdminDisputeController {

    private final DisputeService disputeService;

    @GetMapping
    public ResponseEntity<Page<DisputeManagementResponseDTO>> getAllDisputes(
            @RequestParam(required = false) DisputeStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(disputeService.getAllDisputes(status, page, size));
    }

    @GetMapping("/{disputeId}")
    public ResponseEntity<DisputeManagementResponseDTO> getDisputeById(@PathVariable Long disputeId) {
        return ResponseEntity.ok(disputeService.getDisputeById(disputeId));
    }

    @PatchMapping("/{disputeId}/status")
    public ResponseEntity<DisputeManagementResponseDTO> updateDisputeStatus(
            @PathVariable Long disputeId,
            @RequestBody @Valid DisputeResolutionRequestDTO dto) {
        return ResponseEntity.ok(disputeService.updateDisputeStatus(disputeId, dto));
    }
}
