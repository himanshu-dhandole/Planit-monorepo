package com.teamarc.planit.services;

import com.teamarc.planit.dto.request.BookingRequestDTO;
import com.teamarc.planit.dto.response.BookingResponseDTO;
import com.teamarc.planit.entity.*;
import com.teamarc.planit.entity.enums.BookingStatus;
import com.teamarc.planit.entity.enums.PaymentStatus;
import com.teamarc.planit.exceptions.ResourceNotFoundException;
import com.teamarc.planit.repository.*;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;
    private final ServicesRepository servicesRepository;
    private final CustomerRepository customerRepository;
    private final ModelMapper modelMapper;
    private final WalletService walletService;
    private final WalletRepository walletRepository;
    private final PaymentService paymentService;
    private final PaymentRepository paymentRepository;

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
    public BookingResponseDTO createBookingRequest(BookingRequestDTO dto) {
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

        Wallet wallet = walletRepository.findByUser_Id(customer.getUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for customer with id: " + customer.getId()));

        if(BigDecimal.valueOf(wallet.getBalance()).compareTo(dto.getBookingAmount()) < 0) {
            throw new RuntimeException("Insufficient balance in wallet for customer with id: " + customer.getId());
        }

        // Creating Payment
        paymentService.createPayment(booking.getId(), "PAY_" + booking.getId() + "_" + System.currentTimeMillis(), PaymentStatus.PENDING);


        // TODO Notify Vendor

        return modelMapper.map(savedBooking, BookingResponseDTO.class);
    }

    // Accept Booking Request By Vendor

    public BookingResponseDTO acceptBookingRequest(Long id) {
        Booking booking = getBookingEntityById(id);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Only pending bookings can be accepted");
        }
        booking.setStatus(BookingStatus.CONFIRMED);
        Booking saved = bookingRepository.save(booking);

        // Processing payment from customer wallet to vendor
        paymentService.processPayment(booking);

        // TODO Notify Customer

        return modelMapper.map(saved, BookingResponseDTO.class);
    }


    // Reject Booking Request By Vendor

    public BookingResponseDTO rejectBookingRequest(Long id) {
        Booking booking = getBookingEntityById(id);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Only pending bookings can be rejected");
        }
        booking.setStatus(BookingStatus.REJECTED);
        Booking saved = bookingRepository.save(booking);

        paymentService.cancelPayment(booking);

        // TODO Notify Customer

        return modelMapper.map(saved, BookingResponseDTO.class);
    }

    // Cancel Booking From Cus Before Accepting

    public BookingResponseDTO cancelBookingRequestBeforeAccepting(Long id) {
        Booking booking = getBookingEntityById(id);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Only pending bookings can be cancelled");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);

        paymentService.cancelPayment(booking);

        // TODO Notify Vendor

        return modelMapper.map(saved, BookingResponseDTO.class);
    }



    // Cancel Booking From Customer After Accepting

    public BookingResponseDTO cancelBookingRequestAfterAccepting(Long id) {
        Booking booking = getBookingEntityById(id);
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new IllegalStateException("Only confirmed bookings can be cancelled");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);

        paymentService.refundPayment(booking);

        // TODO Notify Vendor

        return modelMapper.map(saved, BookingResponseDTO.class);
    }



    // Cancel Booking From Vendor After Accepting

    public BookingResponseDTO cancelBookingRequestByVendor(Long id) {
        Booking booking = getBookingEntityById(id);
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new IllegalStateException("Only confirmed bookings can be cancelled by vendor");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);

        paymentService.refundBookedServicePayment(booking);

        // TODO Notify Customer

        return modelMapper.map(saved, BookingResponseDTO.class);
    }


    // Cancel all Booking Request By Vendor







    @Transactional
    public BookingResponseDTO updateBookingStatus(Long id, BookingStatus status) {
        Booking booking = getBookingEntityById(id);
        booking.setStatus(status);
        Booking saved = bookingRepository.save(booking);
        return modelMapper.map(saved, BookingResponseDTO.class);
    }

    @Transactional
    public java.util.List<BookingResponseDTO> createBatchBookings(java.util.List<BookingRequestDTO> dtos) {
        if (dtos == null || dtos.isEmpty()) {
            throw new IllegalArgumentException("Booking requests list cannot be empty");
        }

        Long customerId = dtos.get(0).getCustomerId();
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));

        Wallet wallet = walletRepository.findByUser_Id(customer.getUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for customer with id: " + customerId));

        BigDecimal totalAmount = dtos.stream()
                .map(BookingRequestDTO::getBookingAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (BigDecimal.valueOf(wallet.getBalance()).compareTo(totalAmount) < 0) {
            throw new RuntimeException("Insufficient balance in wallet for total booking amount. Required: " + totalAmount + ", Available: " + wallet.getBalance());
        }

        java.util.List<BookingResponseDTO> responses = new java.util.ArrayList<>();
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

            paymentService.createPayment(savedBooking.getId(), "PAY_" + savedBooking.getId() + "_" + System.currentTimeMillis(), PaymentStatus.PENDING);

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