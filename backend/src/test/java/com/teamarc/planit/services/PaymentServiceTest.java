package com.teamarc.planit.services;

import com.razorpay.Order;
import com.razorpay.OrderClient;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.teamarc.planit.dto.request.RazorpayVerificationRequestDTO;
import com.teamarc.planit.dto.response.RazorpayOrderResponseDTO;
import com.teamarc.planit.entity.*;
import com.teamarc.planit.entity.enums.BookingStatus;
import com.teamarc.planit.entity.enums.PaymentStatus;
import com.teamarc.planit.exceptions.ResourceNotFoundException;
import com.teamarc.planit.repository.BookingRepository;
import com.teamarc.planit.repository.PaymentRepository;
import com.teamarc.planit.strategies.WalletPaymentStrategies;
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
    private RazorpayClient razorpayClient;

    @Mock
    private OrderClient orderClient;

    @Mock
    private WalletPaymentStrategies walletPaymentStrategies;

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
        payment.setAmount(BigDecimal.valueOf(150.0));
        payment.setStatus(PaymentStatus.PENDING);
        payment.setTxnId("rzp_order_123");
    }

    @Test
    void payWithWallet_success() {
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Payment result = paymentService.payWithWallet(100L);

        assertNotNull(result);
        assertEquals(PaymentStatus.PAID, result.getStatus());
        assertEquals(BigDecimal.valueOf(150.0), result.getAmount());
        assertTrue(result.getTxnId().startsWith("PAY_WL_"));
        assertEquals(BookingStatus.CONFIRMED, booking.getStatus());

        verify(walletService, times(1)).deductMoneyFromWallet(
                eq(user), eq(150.0), anyString(), eq(booking), eq(com.teamarc.planit.entity.enums.TransactionMethod.BOOKING)
        );
        verify(paymentRepository, times(1)).save(any(Payment.class));
        verify(bookingRepository, times(1)).save(booking);
    }

    @Test
    void payWithWallet_alreadyConfirmed() {
        booking.setStatus(BookingStatus.CONFIRMED);
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));

        assertThrows(IllegalStateException.class, () -> paymentService.payWithWallet(100L));
        verifyNoInteractions(walletService);
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void createRazorpayOrder_success() throws RazorpayException {
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        
        Order razorpayOrder = mock(Order.class);
        when(razorpayOrder.get("id")).thenReturn("rzp_order_123");
        when(orderClient.create(any(JSONObject.class))).thenReturn(razorpayOrder);

        RazorpayOrderResponseDTO response = paymentService.createRazorpayOrder(100L);

        assertNotNull(response);
        assertEquals("rzp_order_123", response.getId());
        assertEquals(15000L, response.getAmount()); // 150 * 100 paise
        assertEquals("INR", response.getCurrency());
        assertEquals("mock_key_id", response.getKeyId());
        assertEquals(100L, response.getBookingId());

        verify(paymentRepository, times(1)).save(argThat(p -> 
            p.getBooking() == booking &&
            p.getAmount().equals(BigDecimal.valueOf(150.0)) &&
            p.getStatus() == PaymentStatus.PENDING &&
            p.getTxnId().equals("rzp_order_123")
        ));
    }

    @Test
    void createRazorpayOrder_alreadyConfirmed() {
        booking.setStatus(BookingStatus.CONFIRMED);
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));

        assertThrows(IllegalStateException.class, () -> paymentService.createRazorpayOrder(100L));
        verifyNoInteractions(orderClient);
    }

    @Test
    void verifyRazorpayPayment_success() throws RazorpayException {
        RazorpayVerificationRequestDTO verificationDTO = new RazorpayVerificationRequestDTO();
        verificationDTO.setRazorpayOrderId("rzp_order_123");
        verificationDTO.setRazorpayPaymentId("rzp_pay_456");
        verificationDTO.setRazorpaySignature("rzp_sig_789");

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(paymentRepository.findByTxnId("rzp_order_123")).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        try (MockedStatic<com.razorpay.Utils> utilities = mockStatic(com.razorpay.Utils.class)) {
            utilities.when(() -> com.razorpay.Utils.verifyPaymentSignature(any(JSONObject.class), anyString()))
                     .thenReturn(true);

            Payment result = paymentService.verifyRazorpayPayment(100L, verificationDTO);

            assertNotNull(result);
            assertEquals(PaymentStatus.PAID, result.getStatus());
            assertEquals("rzp_pay_456", result.getTxnId());
            assertEquals(BookingStatus.CONFIRMED, booking.getStatus());

            verify(paymentRepository, times(1)).save(payment);
            verify(bookingRepository, times(1)).save(booking);
        }
    }

    @Test
    void verifyRazorpayPayment_invalidSignature() {
        RazorpayVerificationRequestDTO verificationDTO = new RazorpayVerificationRequestDTO();
        verificationDTO.setRazorpayOrderId("rzp_order_123");
        verificationDTO.setRazorpayPaymentId("rzp_pay_456");
        verificationDTO.setRazorpaySignature("rzp_sig_invalid");

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));

        try (MockedStatic<com.razorpay.Utils> utilities = mockStatic(com.razorpay.Utils.class)) {
            utilities.when(() -> com.razorpay.Utils.verifyPaymentSignature(any(JSONObject.class), anyString()))
                     .thenReturn(false);

            assertThrows(IllegalArgumentException.class, () -> 
                    paymentService.verifyRazorpayPayment(100L, verificationDTO)
            );

            verify(paymentRepository, never()).save(any(Payment.class));
            verify(bookingRepository, never()).save(any(Booking.class));
        }
    }

    @Test
    void processPayment_delegatesToStrategy() {
        when(paymentRepository.findByBooking(booking)).thenReturn(Optional.of(payment));
        paymentService.processPayment(booking);
        verify(walletPaymentStrategies, times(1)).processPayment(payment);
    }

    @Test
    void refundPayment_delegatesToStrategy() {
        when(paymentRepository.findByBooking(booking)).thenReturn(Optional.of(payment));
        paymentService.refundPayment(booking);
        verify(walletPaymentStrategies, times(1)).refundPayment(payment);
    }

    @Test
    void refundBookedServicePayment_delegatesToStrategy() {
        when(paymentRepository.findByBooking(booking)).thenReturn(Optional.of(payment));
        paymentService.refundBookedServicePayment(booking);
        verify(walletPaymentStrategies, times(1)).refundBookedServicePayment(payment);
    }
}
