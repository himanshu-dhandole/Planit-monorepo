package com.teamarc.planit.controller;

import com.teamarc.planit.dto.request.OnBoardNewVendorRequestDTO;
import com.teamarc.planit.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping(path = "/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping(path = "/request/vendor")
    public ResponseEntity<OnBoardNewVendorRequestDTO> requestVendorOnBoard(@RequestBody OnBoardNewVendorRequestDTO onBoardNewVendorRequestDTO) {
        return ResponseEntity.ok(userService.requestVendorOnBoard(onBoardNewVendorRequestDTO));
    }

    @PutMapping(path = "/update/request/vendor/verification/{requestId}")
    public ResponseEntity<String> updateVendorOnBoardRequestVerification(@PathVariable Long requestId, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(userService.updateVendorVerification(requestId, file));
    }


}
