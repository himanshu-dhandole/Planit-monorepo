package com.teamarc.planit.controller;

import com.teamarc.planit.dto.request.CustomerRequestDTO;
import com.teamarc.planit.dto.response.CustomerResponseDTO;
import com.teamarc.planit.services.CustomerService;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping(path = "/api/customer")
@Secured("ROLE_CUSTOMER")
public class CustomerController {

    private final CustomerService customerService;

    @PostMapping(path = "/create")
    public ResponseEntity<CustomerResponseDTO> createCustomer(@RequestBody CustomerRequestDTO  customerRequestDTO) {
        return ResponseEntity.ok(customerService.createCustomerProfile(customerRequestDTO));
    }

    @GetMapping(path = "/{id}")
    public ResponseEntity<CustomerResponseDTO> getCustomerById(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.getCustomerById(id));
    }

    @GetMapping(path = "/user/{userId}")
    public ResponseEntity<CustomerResponseDTO> getCustomerByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(customerService.getCustomerByUserId(userId));
    }

    @PutMapping(path = "/update/{id}")
    public ResponseEntity<CustomerResponseDTO> updateCustomerProfile(@PathVariable Long id, @RequestBody CustomerRequestDTO customerRequestDTO) {
        return ResponseEntity.ok(customerService.updateCustomerProfile(id, customerRequestDTO));
    }

    @GetMapping(path = "/{customerId}/bookings")
    public ResponseEntity<?> getAllBookingsByCustomerId(@PathVariable Long customerId, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(customerService.getAllBookingByCustomerId(customerId, page, size));
    }


}
