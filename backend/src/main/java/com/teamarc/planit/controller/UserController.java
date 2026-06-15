package com.teamarc.planit.controller;

import com.teamarc.planit.dto.request.OnBoardNewVendorRequestDTO;
import com.teamarc.planit.dto.response.OnBoardNewVendorResponseDTO;
import com.teamarc.planit.services.OnBoardNewVendorRequestService;
import com.teamarc.planit.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping(path = "/api/user")
@RequiredArgsConstructor
public class UserController {

    private final OnBoardNewVendorRequestService onBoardNewVendorRequestService;

    @PostMapping(path = "/request/vendor")
    public ResponseEntity<OnBoardNewVendorResponseDTO> requestVendorOnBoard(@RequestBody OnBoardNewVendorRequestDTO onBoardNewVendorRequestDTO) {
        return ResponseEntity.ok(onBoardNewVendorRequestService.requestVendorOnBoard(onBoardNewVendorRequestDTO));
    }

    @PutMapping(path = "/update/request/vendor/verification/{requestId}")
    public ResponseEntity<String> updateVendorOnBoardRequestVerification(@PathVariable Long requestId, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(onBoardNewVendorRequestService.updateVendorVerification(requestId, file));
    }

}
