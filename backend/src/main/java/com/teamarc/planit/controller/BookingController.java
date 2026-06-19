package com.teamarc.planit.controller;

import com.teamarc.planit.dto.request.BookingRequestDTO;
import com.teamarc.planit.dto.request.RazorpayVerificationRequestDTO;
import com.teamarc.planit.dto.response.BookingResponseDTO;
import com.teamarc.planit.dto.response.PaymentResponseDTO;
import com.teamarc.planit.services.BookingService;
import com.teamarc.planit.services.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(path = "/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final PaymentService paymentService;

    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody @jakarta.validation.Valid BookingRequestDTO bookingRequestDTO) {
        return ResponseEntity.ok(bookingService.createBookingRequest(bookingRequestDTO));
    }

    @PostMapping("/batch")
    public ResponseEntity<java.util.List<BookingResponseDTO>> createBatchBookings(@RequestBody @jakarta.validation.Valid java.util.List<BookingRequestDTO> bookingRequests) {
        return ResponseEntity.ok(bookingService.createBatchBookings(bookingRequests));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponseDTO> getBookingById(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<BookingResponseDTO> acceptBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.acceptBookingRequest(id));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<BookingResponseDTO> rejectBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.rejectBookingRequest(id));
    }

    @PostMapping("/{id}/cancel/before")
    public ResponseEntity<BookingResponseDTO> cancelBeforeAccepting(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.cancelBookingRequestBeforeAccepting(id));
    }

    @PostMapping("/{id}/cancel/after")
    public ResponseEntity<BookingResponseDTO> cancelAfterAccepting(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.cancelBookingRequestAfterAccepting(id));
    }

    @PostMapping("/{id}/cancel/vendor")
    public ResponseEntity<BookingResponseDTO> cancelByVendor(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.cancelBookingRequestByVendor(id));
    }

    @PostMapping("/{id}/pay/razorpay/verify")
    public ResponseEntity<PaymentResponseDTO> verifyRazorpayBookingPayment(
            @PathVariable Long id,
            @RequestBody @Valid RazorpayVerificationRequestDTO dto) {
        return ResponseEntity.ok(paymentService.verifyRazorpayBookingPayment(id, dto));
    }
}

