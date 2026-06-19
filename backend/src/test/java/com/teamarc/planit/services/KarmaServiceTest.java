package com.teamarc.planit.services;

import com.teamarc.planit.entity.Customer;
import com.teamarc.planit.entity.KarmaTransaction;
import com.teamarc.planit.entity.User;
import com.teamarc.planit.entity.Vendor;
import com.teamarc.planit.entity.enums.Role;
import com.teamarc.planit.repository.CustomerRepository;
import com.teamarc.planit.repository.KarmaTransactionRepository;
import com.teamarc.planit.repository.UserRepository;
import com.teamarc.planit.repository.VendorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KarmaServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private VendorRepository vendorRepository;

    @Mock
    private KarmaTransactionRepository karmaTransactionRepository;

    @InjectMocks
    private KarmaService karmaService;

    private User user;
    private Customer customer;
    private Vendor vendor;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setName("John Doe");
        user.setKarma(5.00);

        customer = new Customer();
        customer.setId(10L);
        customer.setUser(user);
        customer.setKarma(5.00);

        vendor = new Vendor();
        vendor.setId(20L);
        vendor.setUser(user);
        vendor.setKarma(5.00);
        vendor.setIsActive(true);
    }

    @Test
    void applyKarmaChange_success_increase() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(customerRepository.findByUserId(1L)).thenReturn(customer);
        when(vendorRepository.findByUser_Id(1L)).thenReturn(Optional.of(vendor));

        karmaService.applyKarmaChange(1L, Role.VENDOR, 0.10, "BOOKING_COMPLETED", 100L, null, null, "Completed");

        assertEquals(5.00, user.getKarma()); // clamped to 5.0
        assertEquals(5.00, customer.getKarma());
        assertEquals(5.00, vendor.getKarma());

        verify(userRepository, times(1)).save(user);
        verify(customerRepository, times(1)).save(customer);
        verify(vendorRepository, times(1)).save(vendor);
        verify(karmaTransactionRepository, times(1)).save(any(KarmaTransaction.class));
    }

    @Test
    void applyKarmaChange_success_decrease() {
        user.setKarma(4.00);
        customer.setKarma(4.00);
        vendor.setKarma(4.00);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(customerRepository.findByUserId(1L)).thenReturn(customer);
        when(vendorRepository.findByUser_Id(1L)).thenReturn(Optional.of(vendor));

        karmaService.applyKarmaChange(1L, Role.CUSTOMER, -0.50, "BOOKING_CANCELLED", 100L, null, null, "Cancelled");

        assertEquals(3.50, user.getKarma());
        assertEquals(3.50, customer.getKarma());
        assertEquals(3.50, vendor.getKarma());
        assertTrue(vendor.getIsActive());

        verify(userRepository, times(1)).save(user);
        verify(customerRepository, times(1)).save(customer);
        verify(vendorRepository, times(1)).save(vendor);
    }

    @Test
    void applyKarmaChange_minClampingAndSuspension() {
        user.setKarma(2.50);
        customer.setKarma(2.50);
        vendor.setKarma(2.50);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(customerRepository.findByUserId(1L)).thenReturn(customer);
        when(vendorRepository.findByUser_Id(1L)).thenReturn(Optional.of(vendor));

        // Deduct 2.0 -> raw becomes 0.5 -> clamped to 1.0
        karmaService.applyKarmaChange(1L, Role.VENDOR, -2.00, "COMPLAINT_RESOLVED", 100L, 50L, null, "Critical dispute");

        assertEquals(1.00, user.getKarma());
        assertEquals(1.00, customer.getKarma());
        assertEquals(1.00, vendor.getKarma());
        assertFalse(vendor.getIsActive()); // suspended!

        ArgumentCaptor<KarmaTransaction> captor = ArgumentCaptor.forClass(KarmaTransaction.class);
        verify(karmaTransactionRepository, times(1)).save(captor.capture());
        
        KarmaTransaction transaction = captor.getValue();
        assertEquals(1L, transaction.getUserId());
        assertEquals(-2.00, transaction.getAmount());
        assertEquals(2.50, transaction.getPreviousKarma());
        assertEquals(1.00, transaction.getNewKarma());
        assertEquals("COMPLAINT_RESOLVED", transaction.getRuleApplied());
        assertEquals(100L, transaction.getBookingId());
        assertEquals(50L, transaction.getComplaintId());
    }

    @Test
    void getTrustBadge_ranges() {
        assertEquals("GOLD", karmaService.getTrustBadge(4.80));
        assertEquals("GOLD", karmaService.getTrustBadge(4.50));
        assertEquals("SILVER", karmaService.getTrustBadge(4.49));
        assertEquals("SILVER", karmaService.getTrustBadge(4.00));
        assertEquals("STANDARD", karmaService.getTrustBadge(3.99));
        assertEquals("STANDARD", karmaService.getTrustBadge(1.00));
    }

    @Test
    void needsStricterRefundCheck_ranges() {
        assertTrue(karmaService.needsStricterRefundCheck(2.99));
        assertTrue(karmaService.needsStricterRefundCheck(1.00));
        assertFalse(karmaService.needsStricterRefundCheck(3.00));
        assertFalse(karmaService.needsStricterRefundCheck(5.00));
    }
}
