package com.teamarc.planit.services;

import com.teamarc.planit.dto.request.BookingRequestDTO;
import com.teamarc.planit.dto.response.BookingResponseDTO;
import com.teamarc.planit.entity.*;
import com.teamarc.planit.entity.enums.BookingStatus;
import com.teamarc.planit.entity.enums.PaymentMethod;
import com.teamarc.planit.entity.enums.Role;
import com.teamarc.planit.exceptions.ResourceNotFoundException;
import com.teamarc.planit.repository.*;
import com.teamarc.planit.strategies.WalletPaymentStrategies;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;
    private final ServicesRepository servicesRepository;
    private final CustomerRepository customerRepository;
    private final ModelMapper modelMapper;
    private final WalletRepository walletRepository;
    private final PaymentService paymentService;
    private final PaymentRepository paymentRepository;
    private final KarmaService karmaService;
    private final EscrowRepository escrowRepository;
    private final WalletPaymentStrategies walletPaymentStrategies;

    public Page<BookingResponseDTO> getAllVendorBookings(Long id, int page, int size) {
        return bookingRepository.findAllByServices_Vendor_Id(id, PageRequest.of(page, size))
                .map(booking -> modelMapper.map(booking, BookingResponseDTO.class));
    }

    public Booking getBookingEntityById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
    }

    public BookingResponseDTO getBookingById(Long id) {
        return modelMapper.map(getBookingEntityById(id), BookingResponseDTO.class);
    }

    // Create Booking Request from Cus -> Vend
    @Transactional
    public Object createBookingRequest(BookingRequestDTO dto) {
        Event event = eventRepository.findById(dto.getEventId())
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + dto.getEventId()));
        Services services = servicesRepository.findById(dto.getServiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with id: " + dto.getServiceId()));
        Customer customer = customerRepository.findById(dto.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + dto.getCustomerId()));

        Booking booking = new Booking();
        booking.setEvent(event);
        booking.setServices(services);
        booking.setCustomer(customer);
        booking.setStatus(BookingStatus.PENDING);
        booking.setBookingAmount(dto.getBookingAmount());
        booking.setStartDt(dto.getStartDt());
        booking.setEndDt(dto.getEndDt());

        Booking savedBooking = bookingRepository.save(booking);

        // Initiate payment which handles wallet deduction & escrow creation or Razorpay order creation
        Object response = paymentService.initiateBookingPayment(savedBooking.getId(), dto.getPaymentMethod());

        // TODO Notify Vendor

        return response;
    }

    // Accept Booking Request By Vendor
    @Transactional
    public BookingResponseDTO acceptBookingRequest(Long id) {
        Booking booking = getBookingEntityById(id);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Only pending bookings can be accepted");
        }

        Escrow escrow = escrowRepository.findByBooking_Id(id)
                .orElseThrow(() -> new ResourceNotFoundException("Escrow not found for booking: " + id));

        // Release escrow money to vendor wallet (deducting vendor platform fee)
        walletPaymentStrategies.releaseEscrowToVendor(escrow);

        booking.setStatus(BookingStatus.CONFIRMED);
        Booking saved = bookingRepository.save(booking);

        // TODO Notify Customer

        return modelMapper.map(saved, BookingResponseDTO.class);
    }

    // Reject Booking Request By Vendor
    @Transactional
    public BookingResponseDTO rejectBookingRequest(Long id) {
        Booking booking = getBookingEntityById(id);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Only pending bookings can be rejected");
        }

        Escrow escrow = escrowRepository.findByBooking_Id(id)
                .orElseThrow(() -> new ResourceNotFoundException("Escrow not found for booking: " + id));

        // Full refund to customer wallet
        walletPaymentStrategies.refundEscrowToCustomer(escrow);

        booking.setStatus(BookingStatus.REJECTED);
        Booking saved = bookingRepository.save(booking);

        // TODO Notify Customer

        return modelMapper.map(saved, BookingResponseDTO.class);
    }

    // Cancel Booking From Cus Before Accepting
    @Transactional
    public BookingResponseDTO cancelBookingRequestBeforeAccepting(Long id) {
        Booking booking = getBookingEntityById(id);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Only pending bookings can be cancelled");
        }

        Escrow escrow = escrowRepository.findByBooking_Id(id)
                .orElseThrow(() -> new ResourceNotFoundException("Escrow not found for booking: " + id));

        // Full refund to customer wallet
        walletPaymentStrategies.refundEscrowToCustomer(escrow);

        booking.setStatus(BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);

        // TODO Notify Vendor

        return modelMapper.map(saved, BookingResponseDTO.class);
    }

    // Cancel Booking From Customer After Accepting
    @Transactional
    public BookingResponseDTO cancelBookingRequestAfterAccepting(Long id) {
        Booking booking = getBookingEntityById(id);
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new IllegalStateException("Only confirmed bookings can be cancelled");
        }

        Escrow escrow = escrowRepository.findByBooking_Id(id)
                .orElseThrow(() -> new ResourceNotFoundException("Escrow not found for booking: " + id));

        // Customer cancels with 2% cancellation fee penalty
        walletPaymentStrategies.cancelWithFeeByCustomer(escrow);

        booking.setStatus(BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);

        // Apply time-dependent customer karma penalty
        LocalDateTime now = LocalDateTime.now();
        java.time.Duration duration = java.time.Duration.between(now, booking.getStartDt());
        double penalty = -0.10;
        String urgency = "STANDARD";
        if (duration.isNegative() || duration.toHours() <= 24) {
            penalty = -1.00;
            urgency = "CRITICAL";
        } else if (duration.toDays() <= 7) {
            penalty = -0.50;
            urgency = "URGENT";
        }

        karmaService.applyKarmaChange(
                booking.getCustomer().getUser().getId(),
                Role.CUSTOMER,
                penalty,
                "BOOKING_CANCELLED_BY_CUSTOMER_" + urgency,
                booking.getId(),
                null,
                null,
                "Booking cancelled by customer. Urgency: " + urgency + ". Time remaining: " + duration.toHours() + " hours."
        );

        // TODO Notify Vendor

        return modelMapper.map(saved, BookingResponseDTO.class);
    }

    // Cancel Booking From Vendor After Accepting
    @Transactional
    public BookingResponseDTO cancelBookingRequestByVendor(Long id) {
        Booking booking = getBookingEntityById(id);
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new IllegalStateException("Only confirmed bookings can be cancelled by vendor");
        }

        Escrow escrow = escrowRepository.findByBooking_Id(id)
                .orElseThrow(() -> new ResourceNotFoundException("Escrow not found for booking: " + id));

        // Vendor cancels, customer gets full refund, vendor gets penalized 2% cancellation fee
        walletPaymentStrategies.cancelWithFeeByVendor(escrow);

        booking.setStatus(BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);

        // Apply time-dependent vendor karma penalty
        LocalDateTime now = LocalDateTime.now();
        java.time.Duration duration = java.time.Duration.between(now, booking.getStartDt());
        double penalty = -0.10;
        String urgency = "STANDARD";
        if (duration.isNegative() || duration.toHours() <= 24) {
            penalty = -1.00;
            urgency = "CRITICAL";
        } else if (duration.toDays() <= 7) {
            penalty = -0.50;
            urgency = "URGENT";
        }

        karmaService.applyKarmaChange(
                booking.getServices().getVendor().getUser().getId(),
                Role.VENDOR,
                penalty,
                "BOOKING_CANCELLED_BY_VENDOR_" + urgency,
                booking.getId(),
                null,
                null,
                "Booking cancelled by vendor. Urgency: " + urgency + ". Time remaining: " + duration.toHours() + " hours."
        );

        // TODO Notify Customer

        return modelMapper.map(saved, BookingResponseDTO.class);
    }

    @Transactional
    public BookingResponseDTO updateBookingStatus(Long id, BookingStatus status) {
        Booking booking = getBookingEntityById(id);
        BookingStatus oldStatus = booking.getStatus();
        booking.setStatus(status);
        Booking saved = bookingRepository.save(booking);

        if (status == BookingStatus.COMPLETED && oldStatus != BookingStatus.COMPLETED) {
            // Reward Vendor
            karmaService.applyKarmaChange(
                    booking.getServices().getVendor().getUser().getId(),
                    Role.VENDOR,
                    0.10,
                    "BOOKING_COMPLETED",
                    booking.getId(),
                    null,
                    null,
                    "Booking completed successfully."
            );
            // Reward Customer
            karmaService.applyKarmaChange(
                    booking.getCustomer().getUser().getId(),
                    Role.CUSTOMER,
                    0.05,
                    "BOOKING_COMPLETED",
                    booking.getId(),
                    null,
                    null,
                    "Booking completed successfully."
            );
        }

        return modelMapper.map(saved, BookingResponseDTO.class);
    }

    @Transactional
    public List<BookingResponseDTO> createBatchBookings(List<BookingRequestDTO> dtos) {
        if (dtos == null || dtos.isEmpty()) {
            throw new IllegalArgumentException("Booking requests list cannot be empty");
        }

        Long customerId = dtos.get(0).getCustomerId();
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));

        List<BookingResponseDTO> responses = new ArrayList<>();
        for (BookingRequestDTO dto : dtos) {
            if (!dto.getCustomerId().equals(customerId)) {
                throw new IllegalArgumentException("All bookings in a batch must belong to the same customer");
            }

            Event event = eventRepository.findById(dto.getEventId())
                    .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + dto.getEventId()));
            Services services = servicesRepository.findById(dto.getServiceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Service not found with id: " + dto.getServiceId()));

            Booking booking = new Booking();
            booking.setEvent(event);
            booking.setServices(services);
            booking.setCustomer(customer);
            booking.setStatus(BookingStatus.PENDING);
            booking.setBookingAmount(dto.getBookingAmount());
            booking.setStartDt(dto.getStartDt());
            booking.setEndDt(dto.getEndDt());

            Booking savedBooking = bookingRepository.save(booking);

            // Initiate payment for each booking in the batch
            paymentService.initiateBookingPayment(savedBooking.getId(), dto.getPaymentMethod());

            responses.add(modelMapper.map(savedBooking, BookingResponseDTO.class));
        }

        // Update event status to CONFIRMED
        Long eventId = dtos.get(0).getEventId();
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));
        event.setStatus(com.teamarc.planit.entity.enums.EventStatus.CONFIRMED);
        eventRepository.save(event);

        return responses;
    }

    public Page<BookingResponseDTO> getAllCustomerBookings(Long id, int page, int size) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
        return bookingRepository.findAllByCustomer_Id(customer.getId(), PageRequest.of(page, size))
                .map(booking -> modelMapper.map(booking, BookingResponseDTO.class));
    }
}