package com.teamarc.planit.controller;

import com.teamarc.planit.dto.request.CustomerRequestDTO;
import com.teamarc.planit.dto.response.BookingResponseDTO;
import com.teamarc.planit.dto.response.CustomerResponseDTO;
import com.teamarc.planit.services.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/customer")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<CustomerResponseDTO> createCustomerProfile(
            @RequestPart("customer") @Valid CustomerRequestDTO customerRequestDTO,
            @RequestPart(value = "profilePic", required = false) MultipartFile profilePic,
            @RequestPart(value = "aadhar", required = false) MultipartFile aadhar) {
        
        CustomerResponseDTO response = customerService.createCustomerProfile(customerRequestDTO, profilePic, aadhar);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<CustomerResponseDTO> updateCustomerProfile(
            @PathVariable Long id,
            @RequestPart("customer") @Valid CustomerRequestDTO customerRequestDTO,
            @RequestPart(value = "profilePic", required = false) MultipartFile profilePic,
            @RequestPart(value = "aadhar", required = false) MultipartFile aadhar) {
            
        CustomerResponseDTO response = customerService.updateCustomerProfile(id, customerRequestDTO, profilePic, aadhar);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerResponseDTO> getCustomerById(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.getCustomerById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<CustomerResponseDTO> getCustomerByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(customerService.getCustomerByUserId(userId));
    }

    @GetMapping("/bookings/{customerId}")
    public ResponseEntity<Page<BookingResponseDTO>> getAllBookingByCustomerId(
            @PathVariable Long customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        return ResponseEntity.ok(customerService.getAllBookingByCustomerId(customerId, page, size));
    }
}

