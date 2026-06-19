package com.teamarc.planit.services;

import com.razorpay.RazorpayClient;
import com.teamarc.planit.configs.PlatformFeeConfig;
import com.teamarc.planit.dto.request.RazorpayVerificationRequestDTO;
import com.teamarc.planit.dto.response.PaymentResponseDTO;
import com.teamarc.planit.dto.response.RazorpayOrderResponseDTO;
import com.teamarc.planit.entity.Booking;
import com.teamarc.planit.entity.Escrow;
import com.teamarc.planit.entity.Payment;
import com.teamarc.planit.entity.User;
import com.teamarc.planit.entity.enums.BookingStatus;
import com.teamarc.planit.entity.enums.PaymentMethod;
import com.teamarc.planit.entity.enums.PaymentStatus;
import com.teamarc.planit.exceptions.ResourceNotFoundException;
import com.teamarc.planit.mapper.BookingMapper;
import com.teamarc.planit.repository.BookingRepository;
import com.teamarc.planit.repository.EscrowRepository;
import com.teamarc.planit.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final BookingRepository bookingRepository;
    private final WalletService walletService;
    private final PaymentRepository paymentRepository;
    private final EscrowRepository escrowRepository;
    private final BookingMapper bookingMapper;
    private final RazorpayClient razorpayClient;

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    @Transactional
    public Object initiateBookingPayment(Long bookingId, PaymentMethod method) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            throw new IllegalStateException("Booking is already confirmed");
        }

        BigDecimal bookingAmount = booking.getBookingAmount();
        BigDecimal platformFee = bookingAmount.multiply(PlatformFeeConfig.PLATFORM_FEE_RATE)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = bookingAmount.add(platformFee);

        if (method == PaymentMethod.WALLET) {
            User user = booking.getCustomer().getUser();
            
            // 1. Deduct bookingAmount + platformFee (2% of bookingAmount) from customer wallet
            walletService.deductMoney(
                    user,
                    totalAmount,
                    "WTX_" + bookingId + "_" + System.currentTimeMillis(),
                    booking
            );

            // 2. Create Escrow record with heldAmount = bookingAmount
            Escrow escrow = Escrow.builder()
                    .booking(booking)
                    .heldAmount(bookingAmount)
                    .status(Escrow.EscrowStatus.HELD)
                    .build();
            escrowRepository.save(escrow);

            // 3. Set Payment.status = PAID, Booking.status remains PENDING (waiting for vendor accept)
            Payment payment = paymentRepository.findByBooking(booking).orElse(new Payment());
            payment.setBooking(booking);
            payment.setAmount(totalAmount);
            payment.setStatus(PaymentStatus.PAID);
            payment.setTxnId("PAY_WL_" + bookingId + "_" + System.currentTimeMillis());
            Payment savedPayment = paymentRepository.save(payment);

            // 4. Return PaymentResponseDTO
            return bookingMapper.toPaymentResponse(savedPayment);

        } else if (method == PaymentMethod.RAZORPAY) {
            // 1. Create Razorpay order for bookingAmount * 1.02
            long amountInPaise = totalAmount.multiply(BigDecimal.valueOf(100)).longValue();
            try {
                JSONObject orderRequest = new JSONObject();
                orderRequest.put("amount", amountInPaise);
                orderRequest.put("currency", "INR");
                orderRequest.put("receipt", "rcpt_" + bookingId + "_" + System.currentTimeMillis());

                com.razorpay.Order razorpayOrder = razorpayClient.orders.create(orderRequest);
                String orderId = razorpayOrder.get("id");

                // 2. Save Payment with status = PENDING, txnId = razorpayOrderId
                Payment payment = paymentRepository.findByBooking(booking).orElse(new Payment());
                payment.setBooking(booking);
                payment.setAmount(totalAmount);
                payment.setStatus(PaymentStatus.PENDING);
                payment.setTxnId(orderId);
                paymentRepository.save(payment);

                // 3. Return RazorpayOrderResponseDTO
                return RazorpayOrderResponseDTO.builder()
                        .id(orderId)
                        .amount(amountInPaise)
                        .currency("INR")
                        .keyId(keyId.trim())
                        .bookingId(bookingId)
                        .build();

            } catch (com.razorpay.RazorpayException e) {
                throw new RuntimeException("Error creating Razorpay order: " + e.getMessage(), e);
            }
        } else {
            throw new IllegalArgumentException("Unsupported payment method: " + method);
        }
    }

    @Transactional
    public PaymentResponseDTO verifyRazorpayBookingPayment(Long bookingId, RazorpayVerificationRequestDTO verificationDTO) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", verificationDTO.getRazorpayOrderId());
            options.put("razorpay_payment_id", verificationDTO.getRazorpayPaymentId());
            options.put("razorpay_signature", verificationDTO.getRazorpaySignature());

            boolean isValid = com.razorpay.Utils.verifyPaymentSignature(options, keySecret.trim());
            if (!isValid) {
                throw new IllegalArgumentException("Razorpay payment signature verification failed");
            }

            Payment payment = paymentRepository.findByTxnId(verificationDTO.getRazorpayOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Payment record not found for Razorpay Order ID: " + verificationDTO.getRazorpayOrderId()));

            // 1. Update Payment.status = PAID
            payment.setStatus(PaymentStatus.PAID);
            payment.setTxnId(verificationDTO.getRazorpayPaymentId());
            Payment savedPayment = paymentRepository.save(payment);

            // 2. Create Escrow with heldAmount = bookingAmount
            Escrow escrow = Escrow.builder()
                    .booking(booking)
                    .heldAmount(booking.getBookingAmount())
                    .status(Escrow.EscrowStatus.HELD)
                    .build();
            escrowRepository.save(escrow);

            // 3. Booking remains PENDING (waiting for vendor accept)

            return bookingMapper.toPaymentResponse(savedPayment);

        } catch (com.razorpay.RazorpayException e) {
            throw new RuntimeException("Error verifying Razorpay payment: " + e.getMessage(), e);
        }
    }
}
