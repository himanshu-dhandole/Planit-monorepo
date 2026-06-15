package com.teamarc.planit.controller;

import com.teamarc.planit.dto.request.RazorpayVerificationRequestDTO;
import com.teamarc.planit.dto.response.PaymentResponseDTO;
import com.teamarc.planit.dto.response.RazorpayOrderResponseDTO;
import com.teamarc.planit.entity.Payment;
import com.teamarc.planit.mapper.BookingMapper;
import com.teamarc.planit.services.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final BookingMapper bookingMapper;

    @PostMapping("/{bookingId}/pay-wallet")
    public ResponseEntity<PaymentResponseDTO> payWithWallet(@PathVariable Long bookingId) {
        Payment payment = paymentService.payWithWallet(bookingId);
        return ResponseEntity.ok(bookingMapper.toPaymentResponse(payment));
    }

    @PostMapping("/{bookingId}/razorpay/order")
    public ResponseEntity<RazorpayOrderResponseDTO> createRazorpayOrder(@PathVariable Long bookingId) {
        return ResponseEntity.ok(paymentService.createRazorpayOrder(bookingId));
    }

    @PostMapping("/{bookingId}/razorpay/verify")
    public ResponseEntity<PaymentResponseDTO> verifyRazorpayPayment(
            @PathVariable Long bookingId,
            @RequestBody @Valid RazorpayVerificationRequestDTO verificationDTO) {
        Payment payment = paymentService.verifyRazorpayPayment(bookingId, verificationDTO);
        return ResponseEntity.ok(bookingMapper.toPaymentResponse(payment));
    }
}
