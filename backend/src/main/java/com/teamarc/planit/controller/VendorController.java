package com.teamarc.planit.controller;

import com.teamarc.planit.dto.request.VendorRequestDTO;
import com.teamarc.planit.dto.response.BookingResponseDTO;
import com.teamarc.planit.dto.response.ServiceResponseDTO;
import com.teamarc.planit.dto.response.VendorResponseDTO;
import com.teamarc.planit.services.VendorService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(path = "/api/vendor")
@RequiredArgsConstructor
@Secured("ROLE_VENDOR")
public class VendorController {

    private final VendorService vendorService;

    @PutMapping("/update/profile/{id}")
    public ResponseEntity<VendorResponseDTO> updateVendorDetails(@PathVariable Long id, @RequestBody VendorRequestDTO vendorRequestDTO) {
        return ResponseEntity.ok(vendorService.updateVendorDetails(id, vendorRequestDTO));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<VendorResponseDTO> getVendorByCustomerId(@PathVariable Long customerId) {
        return ResponseEntity.ok(vendorService.getVendorByCustomerId(customerId));
    }

    @GetMapping("/bookings/{vendorId}")
    public ResponseEntity<Page<BookingResponseDTO>> getAllVendorBookings(
            @PathVariable Long vendorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        return ResponseEntity.ok(vendorService.getAllVendorBookings(vendorId, page, size));
    }

    @GetMapping("/services/{vendorId}")
    public ResponseEntity<Page<ServiceResponseDTO>> getAllVendorServices(
            @PathVariable Long vendorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        return ResponseEntity.ok(vendorService.getAllVendorServices(vendorId, page, size));
    }


}
