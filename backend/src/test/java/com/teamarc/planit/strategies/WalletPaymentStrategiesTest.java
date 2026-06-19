package com.teamarc.planit.strategies;

import com.teamarc.planit.entity.*;
import com.teamarc.planit.entity.enums.PaymentStatus;
import com.teamarc.planit.exceptions.InsufficientFundsException;
import com.teamarc.planit.exceptions.ResourceNotFoundException;
import com.teamarc.planit.repository.EscrowRepository;
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
    private EscrowRepository escrowRepository;

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
    private Escrow escrow;

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
        payment.setAmount(BigDecimal.valueOf(102.0)); // booking + customer platform fee
        payment.setStatus(PaymentStatus.PENDING);

        customerWallet = new Wallet();
        customerWallet.setId(100L);
        customerWallet.setUser(customerUser);
        customerWallet.setBalance(150.0);

        vendorWallet = new Wallet();
        vendorWallet.setId(200L);
        vendorWallet.setUser(vendorUser);
        vendorWallet.setBalance(50.0);

        escrow = new Escrow();
        escrow.setId(300L);
        escrow.setBooking(booking);
        escrow.setHeldAmount(BigDecimal.valueOf(100.0));
        escrow.setStatus(Escrow.EscrowStatus.HELD);
    }

    @Test
    void releaseEscrowToVendor_success() {
        when(walletRepository.findByUser_Id(vendorUser.getId())).thenReturn(Optional.of(vendorWallet));
        when(paymentRepository.findByBooking(booking)).thenReturn(Optional.of(payment));
        when(walletTransactionRepository.findByTransactionId(anyString())).thenReturn(Optional.empty());

        vendorWallet.setBalance(10.0); // Vendor has enough for 2% fee (2.0)

        walletPaymentStrategies.releaseEscrowToVendor(escrow);

        assertEquals(Escrow.EscrowStatus.RELEASED_TO_VENDOR, escrow.getStatus());
        assertNotNull(escrow.getReleasedAt());
        assertEquals(PaymentStatus.PAID, payment.getStatus());

        // Deduct 2.0 vendor fee
        verify(walletService, times(1)).deductMoney(
                eq(vendorUser), eq(BigDecimal.valueOf(2.0).setScale(2)), anyString(), eq(booking)
        );
        // Credit 100.0 - 2.0 = 98.0
        verify(walletService, times(1)).addMoney(
                eq(vendorUser), eq(BigDecimal.valueOf(98.0).setScale(2)), anyString(), eq(booking)
        );
        verify(escrowRepository, times(1)).save(escrow);
        verify(paymentRepository, times(1)).save(payment);
    }

    @Test
    void releaseEscrowToVendor_insufficientFunds() {
        when(walletRepository.findByUser_Id(vendorUser.getId())).thenReturn(Optional.of(vendorWallet));
        vendorWallet.setBalance(1.0); // Less than 2% fee (2.0)

        assertThrows(InsufficientFundsException.class, () ->
                walletPaymentStrategies.releaseEscrowToVendor(escrow)
        );

        verify(escrowRepository, never()).save(any(Escrow.class));
        verify(paymentRepository, never()).save(any(Payment.class));
        verifyNoInteractions(walletService);
    }

    @Test
    void refundEscrowToCustomer_success() {
        when(paymentRepository.findByBooking(booking)).thenReturn(Optional.of(payment));
        when(walletTransactionRepository.findByTransactionId(anyString())).thenReturn(Optional.empty());

        walletPaymentStrategies.refundEscrowToCustomer(escrow);

        assertEquals(Escrow.EscrowStatus.REFUNDED_TO_CUSTOMER, escrow.getStatus());
        assertEquals(PaymentStatus.REFUNDED, payment.getStatus());

        // Refund full held amount (100.0)
        verify(walletService, times(1)).addMoney(
                eq(customerUser), eq(BigDecimal.valueOf(100.0)), anyString(), eq(booking)
        );
        verify(escrowRepository, times(1)).save(escrow);
        verify(paymentRepository, times(1)).save(payment);
    }

    @Test
    void cancelWithFeeByCustomer_success() {
        when(paymentRepository.findByBooking(booking)).thenReturn(Optional.of(payment));
        when(walletTransactionRepository.findByTransactionId(anyString())).thenReturn(Optional.empty());

        walletPaymentStrategies.cancelWithFeeByCustomer(escrow);

        assertEquals(Escrow.EscrowStatus.PARTIALLY_REFUNDED, escrow.getStatus());
        assertEquals(PaymentStatus.REFUNDED, payment.getStatus());

        // Refund 100.0 - 2.0 = 98.0
        verify(walletService, times(1)).addMoney(
                eq(customerUser), eq(BigDecimal.valueOf(98.0).setScale(2)), anyString(), eq(booking)
        );
        verify(escrowRepository, times(1)).save(escrow);
        verify(paymentRepository, times(1)).save(payment);
    }

    @Test
    void cancelWithFeeByVendor_success() {
        when(walletRepository.findByUser_Id(vendorUser.getId())).thenReturn(Optional.of(vendorWallet));
        when(paymentRepository.findByBooking(booking)).thenReturn(Optional.of(payment));
        when(walletTransactionRepository.findByTransactionId(anyString())).thenReturn(Optional.empty());

        vendorWallet.setBalance(10.0);

        walletPaymentStrategies.cancelWithFeeByVendor(escrow);

        assertEquals(Escrow.EscrowStatus.REFUNDED_TO_CUSTOMER, escrow.getStatus());
        assertEquals(PaymentStatus.REFUNDED, payment.getStatus());

        // Credit full 100.0 to customer
        verify(walletService, times(1)).addMoney(
                eq(customerUser), eq(BigDecimal.valueOf(100.0)), anyString(), eq(booking)
        );
        // Deduct 2% penalty (2.0) from vendor
        verify(walletService, times(1)).deductMoney(
                eq(vendorUser), eq(BigDecimal.valueOf(2.0).setScale(2)), anyString(), eq(booking)
        );
        verify(escrowRepository, times(1)).save(escrow);
        verify(paymentRepository, times(1)).save(payment);
    }

    @Test
    void cancelWithFeeByVendor_insufficientFunds() {
        when(walletRepository.findByUser_Id(vendorUser.getId())).thenReturn(Optional.of(vendorWallet));
        vendorWallet.setBalance(1.0); // Less than penalty (2.0)

        assertThrows(InsufficientFundsException.class, () ->
                walletPaymentStrategies.cancelWithFeeByVendor(escrow)
        );

        verify(escrowRepository, never()).save(any(Escrow.class));
        verify(paymentRepository, never()).save(any(Payment.class));
        verifyNoInteractions(walletService);
    }
}
