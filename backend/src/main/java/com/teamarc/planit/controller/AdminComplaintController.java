package com.teamarc.planit.controller;

import com.teamarc.planit.dto.response.ComplaintResponseDTO;
import com.teamarc.planit.entity.enums.ComplaintBlame;
import com.teamarc.planit.services.ComplaintService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/complaints")
@RequiredArgsConstructor
@Secured("ROLE_ADMIN")
public class AdminComplaintController {

    private final ComplaintService complaintService;

    @GetMapping
    public ResponseEntity<List<ComplaintResponseDTO>> getAllComplaints() {
        return ResponseEntity.ok(complaintService.getAllComplaints());
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<ComplaintResponseDTO> resolveComplaint(
            @PathVariable Long id,
            @RequestParam ComplaintBlame blame) {
        return ResponseEntity.ok(complaintService.resolveComplaint(id, blame));
    }

    @PostMapping("/{id}/dismiss")
    public ResponseEntity<ComplaintResponseDTO> dismissComplaint(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean malicious) {
        return ResponseEntity.ok(complaintService.dismissComplaint(id, malicious));
    }
}
