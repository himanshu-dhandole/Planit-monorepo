package com.teamarc.planit.controller;

import com.teamarc.planit.dto.request.OnBoardNewVendorRequestDTO;
import com.teamarc.planit.services.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin")
@Secured("ROLE_ADMIN")
public class AdminController {

    private final AdminService adminService;

    @GetMapping(path = "/requests/vendor")
    public ResponseEntity<List<OnBoardNewVendorRequestDTO>> getAllVendorRequests() {
        return ResponseEntity.ok(adminService.getAllVendorOnBoardRequests());
    }

    @PostMapping(path = "/requests/vendor/approve/{requestId}")
    public ResponseEntity<Void> approveVendorRequest(@PathVariable Long requestId) {
        adminService.approveOnBoardNewVendorRequest(requestId);
        return ResponseEntity.ok().build();
    }

    @PostMapping(path = "/requests/vendor/reject/{requestId}")
    public ResponseEntity<Void> rejectVendorRequest(@PathVariable Long requestId) {
        adminService.rejectOnBoardNewVendorRequest(requestId);
        return ResponseEntity.ok().build();
    }
}
