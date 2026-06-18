package com.teamarc.planit.controller;

import com.teamarc.planit.dto.response.VendorResponseDTO;
import com.teamarc.planit.services.VendorService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(path = "/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final VendorService vendorService;

    @GetMapping(path = "/vendor")
    public ResponseEntity<Page<VendorResponseDTO>> getAllVendors(@RequestParam int page, @RequestParam int size) {
        return ResponseEntity.ok(vendorService.getAllVendors(page, size));
    }

    @GetMapping(path = "vendor/{vendorid}")
    public ResponseEntity<VendorResponseDTO> getVendorById(@PathVariable("vendorid") Long vendorid) {
        return ResponseEntity.ok(vendorService.getVendorById(vendorid));
    }

    @GetMapping(path = "vendor/customer/{customerId}")
    public ResponseEntity<VendorResponseDTO> getVendorByCustomerId(@PathVariable("customerId") Long customerId) {
        return ResponseEntity.ok(vendorService.getVendorByCustomerId(customerId));
    }

    @GetMapping("vendor/category")
    public ResponseEntity<Page<VendorResponseDTO>> getVendorsByCategory(@RequestParam String category, @RequestParam int page, @RequestParam int size) {
        return ResponseEntity.ok(vendorService.getVendorsByCategory(category, page, size));
    }

    @GetMapping(path = "/vendor/near")
    public ResponseEntity<Page<VendorResponseDTO>> getVendorsNear(
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam(defaultValue = "10000") double distance,
            @RequestParam int page,
            @RequestParam int size) {
        return ResponseEntity.ok(vendorService.getVendorsNear(lat, lon, distance, page, size));
    }

}
