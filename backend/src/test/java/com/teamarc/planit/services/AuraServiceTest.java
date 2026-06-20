package com.teamarc.planit.services;

import com.teamarc.planit.entity.Customer;
import com.teamarc.planit.entity.AuraTransaction;
import com.teamarc.planit.entity.User;
import com.teamarc.planit.entity.Vendor;
import com.teamarc.planit.entity.enums.Role;
import com.teamarc.planit.repository.CustomerRepository;
import com.teamarc.planit.repository.AuraTransactionRepository;
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
class AuraServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private VendorRepository vendorRepository;

    @Mock
    private AuraTransactionRepository auraTransactionRepository;

    @InjectMocks
    private AuraService auraService;

    private User user;
    private Customer customer;
    private Vendor vendor;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setName("John Doe");
        user.setAura(500.0);

        customer = new Customer();
        customer.setId(10L);
        customer.setUser(user);
        customer.setAura(500.0);

        vendor = new Vendor();
        vendor.setId(20L);
        vendor.setUser(user);
        vendor.setAura(500.0);
        vendor.setIsActive(true);
    }

    @Test
    void applyAuraChange_success_increase() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(customerRepository.findByUserId(1L)).thenReturn(customer);
        when(vendorRepository.findByUser_Id(1L)).thenReturn(Optional.of(vendor));

        auraService.applyAuraChange(1L, Role.VENDOR, 20.0, "BOOKING_COMPLETED", 100L, null, null, "Completed");

        assertEquals(520.0, user.getAura());
        assertEquals(520.0, customer.getAura());
        assertEquals(520.0, vendor.getAura());

        verify(userRepository, times(1)).save(user);
        verify(customerRepository, times(1)).save(customer);
        verify(vendorRepository, times(1)).save(vendor);
        verify(auraTransactionRepository, times(1)).save(any(AuraTransaction.class));
    }

    @Test
    void applyAuraChange_success_decrease() {
        user.setAura(400.0);
        customer.setAura(400.0);
        vendor.setAura(400.0);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(customerRepository.findByUserId(1L)).thenReturn(customer);
        when(vendorRepository.findByUser_Id(1L)).thenReturn(Optional.of(vendor));

        auraService.applyAuraChange(1L, Role.CUSTOMER, -50.0, "BOOKING_CANCELLED", 100L, null, null, "Cancelled");

        assertEquals(350.0, user.getAura());
        assertEquals(350.0, customer.getAura());
        assertEquals(350.0, vendor.getAura());
        assertTrue(vendor.getIsActive());

        verify(userRepository, times(1)).save(user);
        verify(customerRepository, times(1)).save(customer);
        verify(vendorRepository, times(1)).save(vendor);
    }

    @Test
    void applyAuraChange_minClampingAndSuspension() {
        user.setAura(150.0);
        customer.setAura(150.0);
        vendor.setAura(150.0);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(customerRepository.findByUserId(1L)).thenReturn(customer);
        when(vendorRepository.findByUser_Id(1L)).thenReturn(Optional.of(vendor));

        auraService.applyAuraChange(1L, Role.VENDOR, -100.0, "COMPLAINT_RESOLVED", 100L, 50L, null, "Critical dispute");

        assertEquals(50.0, user.getAura());
        assertEquals(50.0, customer.getAura());
        assertEquals(50.0, vendor.getAura());
        assertFalse(vendor.getIsActive()); // suspended!

        ArgumentCaptor<AuraTransaction> captor = ArgumentCaptor.forClass(AuraTransaction.class);
        verify(auraTransactionRepository, times(1)).save(captor.capture());
        
        AuraTransaction transaction = captor.getValue();
        assertEquals(1L, transaction.getUserId());
        assertEquals(-100.0, transaction.getAmount());
        assertEquals(150.0, transaction.getPreviousAura());
        assertEquals(50.0, transaction.getNewAura());
        assertEquals("COMPLAINT_RESOLVED", transaction.getRuleApplied());
        assertEquals(100L, transaction.getBookingId());
        assertEquals(50L, transaction.getComplaintId());
    }

    @Test
    void getTrustBadge_ranges() {
        assertEquals("RADIANT", auraService.getTrustBadge(850.0));
        assertEquals("RADIANT", auraService.getTrustBadge(800.0));
        assertEquals("LUMINOUS", auraService.getTrustBadge(799.0));
        assertEquals("LUMINOUS", auraService.getTrustBadge(500.0));
        assertEquals("FAINT", auraService.getTrustBadge(499.0));
        assertEquals("FAINT", auraService.getTrustBadge(100.0));
    }

    @Test
    void needsStricterRefundCheck_ranges() {
        assertTrue(auraService.needsStricterRefundCheck(299.0));
        assertTrue(auraService.needsStricterRefundCheck(100.0));
        assertFalse(auraService.needsStricterRefundCheck(300.0));
        assertFalse(auraService.needsStricterRefundCheck(500.0));
    }
}
