package com.teamarc.planit.controller;

import com.teamarc.planit.dto.request.ServiceRequestDTO;
import com.teamarc.planit.dto.response.ServiceResponseDTO;
import com.teamarc.planit.services.ServicesService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class ServicesController {

    private final ServicesService servicesService;

    @PostMapping
    @Secured("ROLE_VENDOR")
    public ResponseEntity<ServiceResponseDTO> createService(@Valid @RequestBody ServiceRequestDTO serviceRequestDTO) {
        return new ResponseEntity<>(servicesService.createService(serviceRequestDTO), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Secured("ROLE_VENDOR")
    public ResponseEntity<ServiceResponseDTO> updateService(
            @PathVariable Long id, 
            @Valid @RequestBody ServiceRequestDTO serviceRequestDTO) {
        return ResponseEntity.ok(servicesService.updateService(id, serviceRequestDTO));
    }

    @PatchMapping("/{id}/status")
    @Secured("ROLE_VENDOR")
    public ResponseEntity<ServiceResponseDTO> toggleServiceStatus(
            @PathVariable Long id, 
            @RequestParam Boolean isAvailable) {
        return ResponseEntity.ok(servicesService.deleteService(id, isAvailable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceResponseDTO> getServiceById(@PathVariable Long id) {
        return ResponseEntity.ok(servicesService.getServiceById(id));
    }
}
