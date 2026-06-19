package com.teamarc.planit.services;

import com.teamarc.planit.dto.request.TestimonialRequestDTO;
import com.teamarc.planit.dto.response.TestimonialResponseDTO;
import com.teamarc.planit.entity.*;
import com.teamarc.planit.entity.enums.Role;
import com.teamarc.planit.exceptions.ResourceNotFoundException;
import com.teamarc.planit.exceptions.RuntimeConflictException;
import com.teamarc.planit.mapper.BookingMapper;
import com.teamarc.planit.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TestimonialService {

    private final TestimonialRepository testimonialRepository;
    private final VendorRepository vendorRepository;
    private final CustomerRepository customerRepository;
    private final BookingRepository bookingRepository;
    private final ServicesRepository servicesRepository;
    private final BookingMapper bookingMapper;

    @Transactional
    public TestimonialResponseDTO createTestimonial(TestimonialRequestDTO dto) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        Customer customer = customerRepository.findByUserId(currentUser.getId());
        if (customer == null) {
            throw new AccessDeniedException("Only registered customers can submit testimonials.");
        }

        Vendor vendor = vendorRepository.findById(dto.getVendorId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with ID: " + dto.getVendorId()));

        Services service = null;
        if (dto.getServiceId() != null) {
            service = servicesRepository.findById(dto.getServiceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Service not found with ID: " + dto.getServiceId()));
            if (!service.getVendor().getId().equals(vendor.getId())) {
                throw new RuntimeConflictException("The specified service does not belong to this vendor.");
            }
        }

        // Validate customer has completed at least one booking with this vendor
        boolean hasCompletedBooking = bookingRepository.hasCompletedBooking(customer.getId(), vendor.getId());
        if (!hasCompletedBooking) {
            throw new RuntimeConflictException("You must have at least one completed booking with this vendor to write a testimonial.");
        }

        Testimonial testimonial = bookingMapper.toEntity(dto);
        testimonial.setCustomer(customer);
        testimonial.setVendor(vendor);
        testimonial.setServices(service);
        testimonial.setIsFeatured(false);

        Testimonial saved = testimonialRepository.save(testimonial);
        log.info("Customer ID {} left testimonial for Vendor ID {}", customer.getId(), vendor.getId());

        return bookingMapper.toTestimonialResponse(saved);
    }

    @Transactional
    public TestimonialResponseDTO toggleFeatureTestimonial(Long testimonialId) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        Testimonial testimonial = testimonialRepository.findById(testimonialId)
                .orElseThrow(() -> new ResourceNotFoundException("Testimonial not found with ID: " + testimonialId));

        // Only the recipient vendor user can toggle featured status
        if (testimonial.getVendor().getUser().getId() != currentUser.getId()) {
            throw new AccessDeniedException("Only the recipient vendor can feature this testimonial.");
        }

        testimonial.setIsFeatured(!testimonial.getIsFeatured());
        Testimonial saved = testimonialRepository.save(testimonial);
        log.info("Vendor ID {} toggled isFeatured on testimonial ID {} to {}", 
                testimonial.getVendor().getId(), testimonialId, testimonial.getIsFeatured());

        return bookingMapper.toTestimonialResponse(saved);
    }

    @Transactional
    public void deleteTestimonial(Long testimonialId) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        Testimonial testimonial = testimonialRepository.findById(testimonialId)
                .orElseThrow(() -> new ResourceNotFoundException("Testimonial not found with ID: " + testimonialId));

        boolean isCustomerAuthor = testimonial.getCustomer().getUser().getId() == currentUser.getId();
        boolean isVendorOwner = testimonial.getVendor().getUser().getId() == currentUser.getId();
        boolean isAdmin = currentUser.getRole().contains(Role.ADMIN);

        if (!isCustomerAuthor && !isVendorOwner && !isAdmin) {
            throw new AccessDeniedException("You do not have permission to delete this testimonial.");
        }

        testimonialRepository.delete(testimonial);
        log.info("Deleted testimonial ID {}", testimonialId);
    }

    public List<TestimonialResponseDTO> getTestimonialsByVendor(Long vendorId, boolean onlyFeatured) {
        if (!vendorRepository.existsById(vendorId)) {
            throw new ResourceNotFoundException("Vendor not found with ID: " + vendorId);
        }

        List<Testimonial> testimonials;
        if (onlyFeatured) {
            testimonials = testimonialRepository.findByVendor_IdAndIsFeaturedTrueOrderByCreatedAtDesc(vendorId);
        } else {
            testimonials = testimonialRepository.findByVendor_IdOrderByCreatedAtDesc(vendorId);
        }

        return testimonials.stream()
                .map(bookingMapper::toTestimonialResponse)
                .toList();
    }
}
