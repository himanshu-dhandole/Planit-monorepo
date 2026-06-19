package com.teamarc.planit.controller;

import com.teamarc.planit.dto.request.ComplaintRequestDTO;
import com.teamarc.planit.dto.response.ComplaintResponseDTO;
import com.teamarc.planit.services.ComplaintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService complaintService;

    @PostMapping
    public ResponseEntity<ComplaintResponseDTO> raiseComplaint(@RequestBody @Valid ComplaintRequestDTO dto) {
        return ResponseEntity.ok(complaintService.raiseComplaint(dto));
    }

    @GetMapping("/my")
    public ResponseEntity<List<ComplaintResponseDTO>> getMyComplaints() {
        return ResponseEntity.ok(complaintService.getMyComplaints());
    }
}
