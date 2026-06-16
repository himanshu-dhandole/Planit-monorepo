package com.teamarc.planit.controller;

import com.teamarc.planit.dto.request.BookingRequestDTO;
import com.teamarc.planit.dto.response.BookingResponseDTO;
import com.teamarc.planit.services.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(path = "/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

//    @PostMapping
//    public ResponseEntity<BookingResponseDTO> createBooking(@RequestBody @Valid BookingRequestDTO bookingRequestDTO) {
//        return ResponseEntity.ok(bookingService.createBookingRequest(bookingRequestDTO));
//    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponseDTO> getBookingById(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }
}
