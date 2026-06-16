package com.teamarc.planit.services;

import com.razorpay.RazorpayClient;
import com.teamarc.planit.dto.request.RazorpayVerificationRequestDTO;
import com.teamarc.planit.dto.response.RazorpayOrderResponseDTO;
import com.teamarc.planit.entity.Booking;
import com.teamarc.planit.entity.Payment;
import com.teamarc.planit.entity.User;
import com.teamarc.planit.entity.enums.BookingStatus;
import com.teamarc.planit.entity.enums.PaymentStatus;
import com.teamarc.planit.exceptions.ResourceNotFoundException;
import com.teamarc.planit.repository.BookingRepository;
import com.teamarc.planit.repository.PaymentRepository;
import com.teamarc.planit.strategies.WalletPaymentStrategies;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final BookingRepository bookingRepository;
    private final WalletService walletService;
    private final PaymentRepository paymentRepository;
    private final RazorpayClient razorpayClient;
    private final WalletPaymentStrategies walletPaymentStrategies;

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    @Transactional
    public Payment payWithWallet(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (booking.getStatus() == BookingStatus.CONFIRMED) {
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
        payment.setStatus(PaymentStatus.PAID);
        payment.setTxnId("PAY_WL_" + bookingId + "_" + System.currentTimeMillis());

        Payment savedPayment = paymentRepository.save(payment);

        // Confirm the booking
        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        return savedPayment;
    }

    public void createPayment(Long bookingId, String txnId, PaymentStatus status) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setAmount(booking.getBookingAmount());
        payment.setStatus(status);
        payment.setTxnId(txnId);

        paymentRepository.save(payment);
    }

    public void processPayment(Booking booking) {
        Payment payment = paymentRepository.findByBooking(booking)
                .orElseThrow(() -> new ResourceNotFoundException("Payment record not found for booking ID: " + booking.getId()));
        walletPaymentStrategies.processPayment(payment);
    }

    public void cancelPayment(Booking booking) {
        Payment payment = paymentRepository.findByBooking(booking).orElseThrow(() -> new ResourceNotFoundException("Payment record not found for booking ID: " + booking.getId()));

        payment.setStatus(PaymentStatus.CANCELLED);
        paymentRepository.save(payment);
    }

    public void refundPayment(Booking booking) {
        Payment payment = paymentRepository.findByBooking(booking).orElseThrow(() -> new ResourceNotFoundException("Payment record not found for booking ID: " + booking.getId()));
        walletPaymentStrategies.refundPayment(payment);
    }

    public void refundBookedServicePayment(Booking booking) {
        Payment payment = paymentRepository.findByBooking(booking).orElseThrow(() -> new ResourceNotFoundException("Payment record not found for booking ID: " + booking.getId()));
        walletPaymentStrategies.refundBookedServicePayment(payment);
    }

    @Transactional
    public RazorpayOrderResponseDTO createRazorpayOrder(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (booking.getStatus() == BookingStatus.CONFIRMED) {
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
            payment.setStatus(PaymentStatus.PENDING);
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
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

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

            payment.setStatus(PaymentStatus.PAID);
            payment.setTxnId(verificationDTO.getRazorpayPaymentId()); // update order ID with final payment ID
            Payment savedPayment = paymentRepository.save(payment);

            // Confirm booking
            booking.setStatus(BookingStatus.CONFIRMED);
            bookingRepository.save(booking);

            return savedPayment;

        } catch (com.razorpay.RazorpayException e) {
            throw new RuntimeException("Error verifying Razorpay payment: " + e.getMessage(), e);
        }
    }


}
