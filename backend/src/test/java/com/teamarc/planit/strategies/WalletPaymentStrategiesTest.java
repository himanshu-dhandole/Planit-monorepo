package com.teamarc.planit.strategies;

import com.teamarc.planit.entity.*;
import com.teamarc.planit.entity.enums.PaymentStatus;
import com.teamarc.planit.exceptions.ResourceNotFoundException;
import com.teamarc.planit.repository.PaymentRepository;
import com.teamarc.planit.repository.WalletRepository;
import com.teamarc.planit.repository.WalletTransactionRepository;
import com.teamarc.planit.services.WalletService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WalletPaymentStrategiesTest {

    @Mock
    private WalletRepository walletRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private WalletService walletService;

    @Mock
    private WalletTransactionRepository walletTransactionRepository;

    @InjectMocks
    private WalletPaymentStrategies walletPaymentStrategies;

    private User customerUser;
    private User vendorUser;
    private Customer customer;
    private Vendor vendor;
    private Services service;
    private Booking booking;
    private Payment payment;
    private Wallet customerWallet;
    private Wallet vendorWallet;

    @BeforeEach
    void setUp() {
        customerUser = new User();
        customerUser.setId(1L);
        customerUser.setName("Customer User");
        customerUser.setEmail("customer@example.com");

        vendorUser = new User();
        vendorUser.setId(2L);
        vendorUser.setName("Vendor User");
        vendorUser.setEmail("vendor@example.com");

        customer = new Customer();
        customer.setId(10L);
        customer.setUser(customerUser);

        vendor = new Vendor();
        vendor.setId(20L);
        vendor.setUser(vendorUser);

        service = new Services();
        service.setId(30L);
        service.setVendor(vendor);

        booking = new Booking();
        booking.setId(40L);
        booking.setCustomer(customer);
        booking.setServices(service);
        booking.setBookingAmount(BigDecimal.valueOf(100.0));

        payment = new Payment();
        payment.setId(50L);
        payment.setBooking(booking);
        payment.setAmount(BigDecimal.valueOf(100.0));
        payment.setStatus(PaymentStatus.PENDING);

        customerWallet = new Wallet();
        customerWallet.setId(100L);
        customerWallet.setUser(customerUser);
        customerWallet.setBalance(150.0);

        vendorWallet = new Wallet();
        vendorWallet.setId(200L);
        vendorWallet.setUser(vendorUser);
        vendorWallet.setBalance(50.0);
    }

    @Test
    void processPayment_success() {
        when(walletRepository.findByUser_Id(customerUser.getId())).thenReturn(Optional.of(customerWallet));
        when(walletTransactionRepository.findByTransactionId(anyString())).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        walletPaymentStrategies.processPayment(payment);

        assertEquals(PaymentStatus.PAID, payment.getStatus());
        verify(walletService, times(1)).deductMoney(
                eq(customerUser), argThat(a -> a.compareTo(new BigDecimal("100.0")) == 0), anyString(), eq(booking)
        );
        // Business share: 100 * (1 - 0.05) = 95.0
        verify(walletService, times(1)).addMoney(
                eq(vendorUser), argThat(a -> a.compareTo(new BigDecimal("95.0")) == 0), anyString(), eq(booking)
        );
        verify(paymentRepository, times(1)).save(payment);
    }

    @Test
    void processPayment_insufficientBalance() {
        customerWallet.setBalance(30.0); // Less than payment amount 100.0
        when(walletRepository.findByUser_Id(customerUser.getId())).thenReturn(Optional.of(customerWallet));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> 
                walletPaymentStrategies.processPayment(payment)
        );

        assertTrue(exception.getMessage().contains("Insufficient balance in wallet"));
        assertEquals(PaymentStatus.FAILED, payment.getStatus());
        verify(paymentRepository, times(1)).save(payment);
        verifyNoInteractions(walletService);
    }

    @Test
    void processPayment_alreadyPaid() {
        payment.setStatus(PaymentStatus.PAID);
        when(walletRepository.findByUser_Id(customerUser.getId())).thenReturn(Optional.of(customerWallet));

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> 
                walletPaymentStrategies.processPayment(payment)
        );

        assertEquals("Payment is already processed", exception.getMessage());
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void processPayment_alreadyCancelled() {
        payment.setStatus(PaymentStatus.CANCELLED);
        when(walletRepository.findByUser_Id(customerUser.getId())).thenReturn(Optional.of(customerWallet));

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> 
                walletPaymentStrategies.processPayment(payment)
        );

        assertEquals("Payment is already cancelled", exception.getMessage());
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void refundPayment_success() {
        payment.setStatus(PaymentStatus.PAID);
        when(walletRepository.findByUser_Id(vendorUser.getId())).thenReturn(Optional.of(vendorWallet));
        when(walletTransactionRepository.findByTransactionId(anyString())).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        vendorWallet.setBalance(150.0); // Ensure vendor has enough balance

        walletPaymentStrategies.refundPayment(payment);

        assertEquals(PaymentStatus.REFUNDED, payment.getStatus());
        verify(walletService, times(1)).deductMoney(
                eq(vendorUser), argThat(a -> a.compareTo(new BigDecimal("100.0")) == 0), anyString(), eq(booking)
        );
        verify(walletService, times(1)).addMoney(
                eq(customerUser), argThat(a -> a.compareTo(new BigDecimal("100.0")) == 0), anyString(), eq(booking)
        );
        verify(paymentRepository, times(1)).save(payment);
    }

    @Test
    void refundPayment_insufficientVendorBalance() {
        payment.setStatus(PaymentStatus.PAID);
        when(walletRepository.findByUser_Id(vendorUser.getId())).thenReturn(Optional.of(vendorWallet));
        vendorWallet.setBalance(30.0); // Less than refund amount 100.0

        RuntimeException exception = assertThrows(RuntimeException.class, () -> 
                walletPaymentStrategies.refundPayment(payment)
        );

        assertTrue(exception.getMessage().contains("Insufficient balance in Vendor wallet"));
        verify(paymentRepository, never()).save(any(Payment.class));
        verifyNoInteractions(walletService);
    }

    @Test
    void refundBookedServicePayment_success() {
        payment.setStatus(PaymentStatus.PAID);
        when(walletRepository.findByUser_Id(vendorUser.getId())).thenReturn(Optional.of(vendorWallet));
        when(walletTransactionRepository.findByTransactionId(anyString())).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        vendorWallet.setBalance(150.0);

        walletPaymentStrategies.refundBookedServicePayment(payment);

        assertEquals(PaymentStatus.REFUNDED, payment.getStatus());
        // refund amount = 100.0 * (1 - 0.05 * 2) = 100.0 * 0.90 = 90.0
        verify(walletService, times(1)).deductMoney(
                eq(vendorUser), argThat(a -> a.compareTo(new BigDecimal("90.0")) == 0), anyString(), eq(booking)
        );
        // customer gets full 100.0 refund
        verify(walletService, times(1)).addMoney(
                eq(customerUser), argThat(a -> a.compareTo(new BigDecimal("100.0")) == 0), anyString(), eq(booking)
        );
        verify(paymentRepository, times(1)).save(payment);
    }

    @Test
    void refundBookedServicePayment_insufficientVendorBalance() {
        payment.setStatus(PaymentStatus.PAID);
        when(walletRepository.findByUser_Id(vendorUser.getId())).thenReturn(Optional.of(vendorWallet));
        vendorWallet.setBalance(30.0);

        RuntimeException exception = assertThrows(RuntimeException.class, () -> 
                walletPaymentStrategies.refundBookedServicePayment(payment)
        );

        assertTrue(exception.getMessage().contains("Insufficient balance in Vendor wallet"));
        verify(paymentRepository, never()).save(any(Payment.class));
        verifyNoInteractions(walletService);
    }
}
