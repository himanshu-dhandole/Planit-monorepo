package com.teamarc.planit.controller;

import com.teamarc.planit.dto.response.DisputeManagementResponseDTO;
import com.teamarc.planit.services.DisputeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final DisputeService disputeService;

    @GetMapping("/disputes")
    public ResponseEntity<List<DisputeManagementResponseDTO>> getMyDisputeNotifications() {
        return ResponseEntity.ok(disputeService.getMyDisputes());
    }
}
