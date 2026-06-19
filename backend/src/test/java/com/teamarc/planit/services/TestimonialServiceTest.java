package com.teamarc.planit.services;

import com.teamarc.planit.dto.request.TestimonialRequestDTO;
import com.teamarc.planit.dto.response.TestimonialResponseDTO;
import com.teamarc.planit.entity.*;
import com.teamarc.planit.entity.enums.Role;
import com.teamarc.planit.exceptions.ResourceNotFoundException;
import com.teamarc.planit.exceptions.RuntimeConflictException;
import com.teamarc.planit.mapper.BookingMapper;
import com.teamarc.planit.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TestimonialServiceTest {

    @Mock
    private TestimonialRepository testimonialRepository;

    @Mock
    private VendorRepository vendorRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ServicesRepository servicesRepository;

    @Mock
    private BookingMapper bookingMapper;

    @InjectMocks
    private TestimonialService testimonialService;

    private User currentUser;
    private Customer customer;
    private Vendor vendor;
    private TestimonialRequestDTO dto;
    private Testimonial testimonial;

    @BeforeEach
    void setUp() {
        currentUser = new User();
        currentUser.setId(1L);
        currentUser.setName("Test User");
        currentUser.setRole(Set.of(Role.CUSTOMER));

        customer = new Customer();
        customer.setId(10L);
        customer.setUser(currentUser);

        User vendorUser = new User();
        vendorUser.setId(2L);
        vendorUser.setName("Vendor User");
        vendorUser.setRole(Set.of(Role.VENDOR));

        vendor = new Vendor();
        vendor.setId(20L);
        vendor.setUser(vendorUser);

        dto = new TestimonialRequestDTO();
        dto.setVendorId(20L);
        dto.setTestimonialText("Excellent services!");

        testimonial = new Testimonial();
        testimonial.setId(100L);
        testimonial.setCustomer(customer);
        testimonial.setVendor(vendor);
        testimonial.setTestimonialText("Excellent services!");
        testimonial.setIsFeatured(false);

        // Mock Security Context (Lenient to allow other tests to override without exceptions)
        Authentication authentication = mock(Authentication.class);
        org.mockito.Mockito.lenient().when(authentication.getPrincipal()).thenReturn(currentUser);
        SecurityContext securityContext = mock(SecurityContext.class);
        org.mockito.Mockito.lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void createTestimonial_success() {
        when(customerRepository.findByUserId(1L)).thenReturn(customer);
        when(vendorRepository.findById(20L)).thenReturn(Optional.of(vendor));
        when(bookingRepository.hasCompletedBooking(10L, 20L)).thenReturn(true);
        when(bookingMapper.toEntity(dto)).thenReturn(testimonial);
        when(testimonialRepository.save(any(Testimonial.class))).thenReturn(testimonial);
        when(bookingMapper.toTestimonialResponse(any(Testimonial.class))).thenReturn(new TestimonialResponseDTO());

        TestimonialResponseDTO response = testimonialService.createTestimonial(dto);

        assertNotNull(response);
        verify(testimonialRepository, times(1)).save(any(Testimonial.class));
    }

    @Test
    void createTestimonial_notCustomer() {
        when(customerRepository.findByUserId(1L)).thenReturn(null);

        assertThrows(AccessDeniedException.class, () -> testimonialService.createTestimonial(dto));
        verify(testimonialRepository, never()).save(any(Testimonial.class));
    }

    @Test
    void createTestimonial_noCompletedBooking() {
        when(customerRepository.findByUserId(1L)).thenReturn(customer);
        when(vendorRepository.findById(20L)).thenReturn(Optional.of(vendor));
        when(bookingRepository.hasCompletedBooking(10L, 20L)).thenReturn(false);

        assertThrows(RuntimeConflictException.class, () -> testimonialService.createTestimonial(dto));
        verify(testimonialRepository, never()).save(any(Testimonial.class));
    }

    @Test
    void toggleFeatureTestimonial_success() {
        // Change current user to Vendor User
        currentUser.setId(2L); // matches vendor user ID
        when(testimonialRepository.findById(100L)).thenReturn(Optional.of(testimonial));
        when(testimonialRepository.save(any(Testimonial.class))).thenAnswer(i -> i.getArgument(0));
        when(bookingMapper.toTestimonialResponse(any(Testimonial.class))).thenAnswer(i -> {
            Testimonial t = i.getArgument(0);
            TestimonialResponseDTO r = new TestimonialResponseDTO();
            r.setIsFeatured(t.getIsFeatured());
            return r;
        });

        TestimonialResponseDTO response = testimonialService.toggleFeatureTestimonial(100L);

        assertNotNull(response);
        assertTrue(response.getIsFeatured());
        verify(testimonialRepository, times(1)).save(testimonial);
    }

    @Test
    void toggleFeatureTestimonial_accessDenied() {
        // Current user is customer (ID 1), but vendor user is ID 2
        when(testimonialRepository.findById(100L)).thenReturn(Optional.of(testimonial));

        assertThrows(AccessDeniedException.class, () -> testimonialService.toggleFeatureTestimonial(100L));
        verify(testimonialRepository, never()).save(any(Testimonial.class));
    }

    @Test
    void deleteTestimonial_authorSuccess() {
        when(testimonialRepository.findById(100L)).thenReturn(Optional.of(testimonial));

        testimonialService.deleteTestimonial(100L);

        verify(testimonialRepository, times(1)).delete(testimonial);
    }

    @Test
    void deleteTestimonial_vendorSuccess() {
        User vendorUser = testimonial.getVendor().getUser();
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(vendorUser);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(testimonialRepository.findById(100L)).thenReturn(Optional.of(testimonial));

        testimonialService.deleteTestimonial(100L);

        verify(testimonialRepository, times(1)).delete(testimonial);
    }

    @Test
    void deleteTestimonial_adminSuccess() {
        User adminUser = new User();
        adminUser.setId(3L);
        adminUser.setRole(Set.of(Role.ADMIN));

        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(adminUser);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(testimonialRepository.findById(100L)).thenReturn(Optional.of(testimonial));

        testimonialService.deleteTestimonial(100L);

        verify(testimonialRepository, times(1)).delete(testimonial);
    }

    @Test
    void deleteTestimonial_accessDenied() {
        User anotherUser = new User();
        anotherUser.setId(3L);
        anotherUser.setRole(Collections.emptySet());

        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(anotherUser);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(testimonialRepository.findById(100L)).thenReturn(Optional.of(testimonial));

        assertThrows(AccessDeniedException.class, () -> testimonialService.deleteTestimonial(100L));
        verify(testimonialRepository, never()).delete(any(Testimonial.class));
    }
}
