package com.teamarc.planit.services;

import com.teamarc.planit.dto.request.ReviewRequestDTO;
import com.teamarc.planit.dto.response.ReviewResponseDTO;
import com.teamarc.planit.entity.Booking;
import com.teamarc.planit.entity.Review;
import com.teamarc.planit.entity.Services;
import com.teamarc.planit.entity.User;
import com.teamarc.planit.entity.enums.BookingStatus;
import com.teamarc.planit.entity.enums.Role;
import com.teamarc.planit.exceptions.ResourceNotFoundException;
import com.teamarc.planit.exceptions.RuntimeConflictException;
import com.teamarc.planit.repository.BookingRepository;
import com.teamarc.planit.repository.ReviewRepository;
import com.teamarc.planit.repository.ServicesRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final ServicesRepository servicesRepository;
    private final KarmaService karmaService;
    private final ModelMapper modelMapper;

    @Transactional
    public ReviewResponseDTO createReview(ReviewRequestDTO dto) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        Booking booking = bookingRepository.findById(dto.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + dto.getBookingId()));

        // 1. Verify booking is completed
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new RuntimeConflictException("Reviews can only be submitted for completed bookings.");
        }

        // 2. Verify current user is the customer who placed the booking
        if (booking.getCustomer().getUser().getId() != currentUser.getId()) {
            throw new AccessDeniedException("You are not authorized to review this booking.");
        }

        // 3. Verify no review already exists
        if (reviewRepository.existsByBooking_Id(dto.getBookingId())) {
            throw new RuntimeConflictException("A review already exists for this booking.");
        }

        // 4. Save review
        Review review = new Review();
        review.setBooking(booking);
        review.setServices(booking.getServices());
        review.setRating(dto.getRating());
        review.setReviewText(dto.getReviewText());
        review.setCreatedAt(LocalDateTime.now());
        review.setUpdatedAt(LocalDateTime.now());

        Review savedReview = reviewRepository.save(review);

        // 5. Update service's average rating
        Services service = booking.getServices();
        recalculateServiceRating(service);

        // 6. Apply Review-to-Karma modifier to the vendor
        Double karmaChange = getKarmaChangeForRating(dto.getRating());
        if (karmaChange != 0.0) {
            User vendorUser = service.getVendor().getUser();
            String description = "Review rating of " + dto.getRating() + " stars left by Customer user ID: " + currentUser.getId();
            karmaService.applyKarmaChange(
                    vendorUser.getId(),
                    Role.VENDOR,
                    karmaChange,
                    "REVIEW_RECEIVED_" + dto.getRating() + "_STAR",
                    booking.getId(),
                    null,
                    savedReview.getId(),
                    description
            );
        }

        return modelMapper.map(savedReview, ReviewResponseDTO.class);
    }

    public List<ReviewResponseDTO> getReviewsByServiceId(Long serviceId) {
        if (!servicesRepository.existsById(serviceId)) {
            throw new ResourceNotFoundException("Service not found with ID: " + serviceId);
        }
        return reviewRepository.findByServices_Id(serviceId).stream()
                .map(review -> modelMapper.map(review, ReviewResponseDTO.class))
                .toList();
    }

    private void recalculateServiceRating(Services service) {
        List<Review> reviews = reviewRepository.findByServices_Id(service.getId());
        if (reviews.isEmpty()) {
            service.setRating(0.0);
        } else {
            double totalStars = reviews.stream().mapToDouble(Review::getRating).sum();
            double avgRating = totalStars / reviews.size();
            // Rounded to 2 decimal places
            service.setRating(Math.round(avgRating * 100.0) / 100.0);
        }
        servicesRepository.save(service);
    }

    private Double getKarmaChangeForRating(Integer rating) {
        switch (rating) {
            case 5: return 0.10;
            case 4: return 0.05;
            case 3: return 0.0;
            case 2: return -0.20;
            case 1: return -0.50;
            default: return 0.0;
        }
    }
}
