package com.teamarc.planit.services;

import com.razorpay.Order;
import com.razorpay.OrderClient;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.teamarc.planit.dto.request.RazorpayVerificationRequestDTO;
import com.teamarc.planit.dto.response.PaymentResponseDTO;
import com.teamarc.planit.dto.response.RazorpayOrderResponseDTO;
import com.teamarc.planit.entity.*;
import com.teamarc.planit.entity.enums.BookingStatus;
import com.teamarc.planit.entity.enums.PaymentMethod;
import com.teamarc.planit.entity.enums.PaymentStatus;
import com.teamarc.planit.mapper.BookingMapper;
import com.teamarc.planit.repository.BookingRepository;
import com.teamarc.planit.repository.EscrowRepository;
import com.teamarc.planit.repository.PaymentRepository;
import org.json.JSONObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private WalletService walletService;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private EscrowRepository escrowRepository;

    @Mock
    private BookingMapper bookingMapper;

    @Mock
    private RazorpayClient razorpayClient;

    @Mock
    private OrderClient orderClient;

    @InjectMocks
    private PaymentService paymentService;

    private User user;
    private Customer customer;
    private Booking booking;
    private Payment payment;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(paymentService, "keyId", "mock_key_id");
        ReflectionTestUtils.setField(paymentService, "keySecret", "mock_key_secret");
        ReflectionTestUtils.setField(razorpayClient, "orders", orderClient);

        user = new User();
        user.setId(1L);
        user.setName("Test User");
        user.setEmail("test@example.com");

        customer = new Customer();
        customer.setId(10L);
        customer.setUser(user);

        booking = new Booking();
        booking.setId(100L);
        booking.setCustomer(customer);
        booking.setBookingAmount(BigDecimal.valueOf(150.0));
        booking.setStatus(BookingStatus.PENDING);

        payment = new Payment();
        payment.setId(200L);
        payment.setBooking(booking);
        payment.setAmount(BigDecimal.valueOf(153.0)); // 150 * 1.02
        payment.setStatus(PaymentStatus.PENDING);
        payment.setTxnId("rzp_order_123");
    }

    @Test
    void initiateBookingPayment_wallet_success() {
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(paymentRepository.findByBooking(booking)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(escrowRepository.save(any(Escrow.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentResponseDTO expectedResponse = new PaymentResponseDTO();
        expectedResponse.setId(200L);
        expectedResponse.setBookingId(100L);
        expectedResponse.setAmount(BigDecimal.valueOf(153.0));
        expectedResponse.setStatus(PaymentStatus.PAID);
        when(bookingMapper.toPaymentResponse(any(Payment.class))).thenReturn(expectedResponse);

        Object response = paymentService.initiateBookingPayment(100L, PaymentMethod.WALLET);

        assertTrue(response instanceof PaymentResponseDTO);
        PaymentResponseDTO result = (PaymentResponseDTO) response;
        assertEquals(PaymentStatus.PAID, result.getStatus());
        assertEquals(BigDecimal.valueOf(153.0), result.getAmount());

        verify(walletService, times(1)).deductMoney(
                eq(user), eq(BigDecimal.valueOf(153.00).setScale(2)), anyString(), eq(booking)
        );
        verify(escrowRepository, times(1)).save(argThat(escrow ->
                escrow.getBooking() == booking &&
                escrow.getHeldAmount().compareTo(BigDecimal.valueOf(150.0)) == 0 &&
                escrow.getStatus() == Escrow.EscrowStatus.HELD
        ));
        verify(paymentRepository, times(1)).save(any(Payment.class));
    }

    @Test
    void initiateBookingPayment_razorpay_success() throws RazorpayException {
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(paymentRepository.findByBooking(booking)).thenReturn(Optional.empty());

        Order razorpayOrder = mock(Order.class);
        when(razorpayOrder.get("id")).thenReturn("rzp_order_123");
        when(orderClient.create(any(JSONObject.class))).thenReturn(razorpayOrder);

        Object response = paymentService.initiateBookingPayment(100L, PaymentMethod.RAZORPAY);

        assertTrue(response instanceof RazorpayOrderResponseDTO);
        RazorpayOrderResponseDTO result = (RazorpayOrderResponseDTO) response;
        assertEquals("rzp_order_123", result.getId());
        assertEquals(15300L, result.getAmount()); // 153 * 100 paise
        assertEquals("INR", result.getCurrency());

        verify(paymentRepository, times(1)).save(argThat(p ->
                p.getBooking() == booking &&
                p.getAmount().compareTo(BigDecimal.valueOf(153.0)) == 0 &&
                p.getStatus() == PaymentStatus.PENDING &&
                p.getTxnId().equals("rzp_order_123")
        ));
    }

    @Test
    void verifyRazorpayBookingPayment_success() throws RazorpayException {
        RazorpayVerificationRequestDTO verificationDTO = new RazorpayVerificationRequestDTO();
        verificationDTO.setRazorpayOrderId("rzp_order_123");
        verificationDTO.setRazorpayPaymentId("rzp_pay_456");
        verificationDTO.setRazorpaySignature("rzp_sig_789");

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(paymentRepository.findByTxnId("rzp_order_123")).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentResponseDTO expectedResponse = new PaymentResponseDTO();
        expectedResponse.setId(200L);
        expectedResponse.setBookingId(100L);
        expectedResponse.setAmount(BigDecimal.valueOf(153.0));
        expectedResponse.setStatus(PaymentStatus.PAID);
        expectedResponse.setTxnId("rzp_pay_456");
        when(bookingMapper.toPaymentResponse(any(Payment.class))).thenReturn(expectedResponse);

        try (MockedStatic<com.razorpay.Utils> utilities = mockStatic(com.razorpay.Utils.class)) {
            utilities.when(() -> com.razorpay.Utils.verifyPaymentSignature(any(JSONObject.class), anyString()))
                     .thenReturn(true);

            PaymentResponseDTO result = paymentService.verifyRazorpayBookingPayment(100L, verificationDTO);

            assertNotNull(result);
            assertEquals(PaymentStatus.PAID, result.getStatus());
            assertEquals("rzp_pay_456", result.getTxnId());

            verify(paymentRepository, times(1)).save(payment);
            verify(escrowRepository, times(1)).save(argThat(escrow ->
                    escrow.getBooking() == booking &&
                    escrow.getHeldAmount().compareTo(BigDecimal.valueOf(150.0)) == 0 &&
                    escrow.getStatus() == Escrow.EscrowStatus.HELD
            ));
        }
    }

    @Test
    void verifyRazorpayBookingPayment_invalidSignature() {
        RazorpayVerificationRequestDTO verificationDTO = new RazorpayVerificationRequestDTO();
        verificationDTO.setRazorpayOrderId("rzp_order_123");
        verificationDTO.setRazorpayPaymentId("rzp_pay_456");
        verificationDTO.setRazorpaySignature("rzp_sig_invalid");

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));

        try (MockedStatic<com.razorpay.Utils> utilities = mockStatic(com.razorpay.Utils.class)) {
            utilities.when(() -> com.razorpay.Utils.verifyPaymentSignature(any(JSONObject.class), anyString()))
                     .thenReturn(false);

            assertThrows(IllegalArgumentException.class, () ->
                    paymentService.verifyRazorpayBookingPayment(100L, verificationDTO)
            );

            verify(paymentRepository, never()).save(any(Payment.class));
            verify(escrowRepository, never()).save(any(Escrow.class));
        }
    }
}
