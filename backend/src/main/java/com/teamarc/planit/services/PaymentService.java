package com.teamarc.planit.services;

import com.razorpay.RazorpayClient;
import com.teamarc.planit.dto.request.RazorpayVerificationRequestDTO;
import com.teamarc.planit.dto.response.RazorpayOrderResponseDTO;
import com.teamarc.planit.entity.Booking;
import com.teamarc.planit.entity.Payment;
import com.teamarc.planit.entity.User;
import com.teamarc.planit.exceptions.ResourceNotFoundException;
import com.teamarc.planit.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final BookingService bookingService;
    private final WalletService walletService;
    private final PaymentRepository paymentRepository;
    private final RazorpayClient razorpayClient;

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    @Transactional
    public Payment payWithWallet(Long bookingId) {
        Booking booking = bookingService.getBookingEntityById(bookingId);

        if (booking.getStatus() == Booking.BookingStatus.CONFIRMED) {
            throw new IllegalStateException("Booking is already confirmed");
        }

        User user = booking.getCustomer().getUser();

        // Deduct money from user's wallet
        walletService.deductMoneyFromWallet(
                user,
                booking.getBookingAmount().doubleValue(),
                "WTX_" + bookingId + "_" + System.currentTimeMillis(),
                booking,
                com.teamarc.planit.entity.enums.TransactionMethod.BOOKING
        );

        // Save payment record
        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setAmount(booking.getBookingAmount());
        payment.setStatus(Payment.PaymentStatus.PAID);
        payment.setTxnId("PAY_WL_" + bookingId + "_" + System.currentTimeMillis());

        Payment savedPayment = paymentRepository.save(payment);

        // Confirm the booking
        bookingService.updateBookingStatus(bookingId, Booking.BookingStatus.CONFIRMED);

        return savedPayment;
    }

    @Transactional
    public RazorpayOrderResponseDTO createRazorpayOrder(Long bookingId) {
        Booking booking = bookingService.getBookingEntityById(bookingId);

        if (booking.getStatus() == Booking.BookingStatus.CONFIRMED) {
            throw new IllegalStateException("Booking is already confirmed");
        }

        long amountInPaise = booking.getBookingAmount().multiply(new BigDecimal(100)).longValue();

        try {
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "rcpt_" + bookingId + "_" + System.currentTimeMillis());

            com.razorpay.Order razorpayOrder = razorpayClient.orders.create(orderRequest);
            String orderId = razorpayOrder.get("id");

            // Save pending payment record using Razorpay Order ID as temporary txn_id
            Payment payment = new Payment();
            payment.setBooking(booking);
            payment.setAmount(booking.getBookingAmount());
            payment.setStatus(Payment.PaymentStatus.PENDING);
            payment.setTxnId(orderId);
            paymentRepository.save(payment);

            return RazorpayOrderResponseDTO.builder()
                    .id(orderId)
                    .amount(amountInPaise)
                    .currency("INR")
                    .keyId(keyId)
                    .bookingId(bookingId)
                    .build();

        } catch (com.razorpay.RazorpayException e) {
            throw new RuntimeException("Error creating Razorpay order: " + e.getMessage(), e);
        }
    }

    @Transactional
    public Payment verifyRazorpayPayment(Long bookingId, RazorpayVerificationRequestDTO verificationDTO) {
        Booking booking = bookingService.getBookingEntityById(bookingId);

        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", verificationDTO.getRazorpayOrderId());
            options.put("razorpay_payment_id", verificationDTO.getRazorpayPaymentId());
            options.put("razorpay_signature", verificationDTO.getRazorpaySignature());

            boolean isValid = com.razorpay.Utils.verifyPaymentSignature(options, keySecret);
            if (!isValid) {
                throw new IllegalArgumentException("Razorpay payment signature verification failed");
            }

            Payment payment = paymentRepository.findByTxnId(verificationDTO.getRazorpayOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Payment record not found for Razorpay Order ID: " + verificationDTO.getRazorpayOrderId()));

            payment.setStatus(Payment.PaymentStatus.PAID);
            payment.setTxnId(verificationDTO.getRazorpayPaymentId()); // update order ID with final payment ID
            Payment savedPayment = paymentRepository.save(payment);

            // Confirm booking
            bookingService.updateBookingStatus(bookingId, Booking.BookingStatus.CONFIRMED);

            return savedPayment;

        } catch (com.razorpay.RazorpayException e) {
            throw new RuntimeException("Error verifying Razorpay payment: " + e.getMessage(), e);
        }
    }
}
