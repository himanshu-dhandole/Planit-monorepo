package com.teamarc.planit.services;

import com.teamarc.planit.dto.request.BookingRequestDTO;
import com.teamarc.planit.dto.response.BookingResponseDTO;
import com.teamarc.planit.entity.Booking;
import com.teamarc.planit.entity.Customer;
import com.teamarc.planit.entity.Event;
import com.teamarc.planit.entity.Services;
import com.teamarc.planit.exceptions.ResourceNotFoundException;
import com.teamarc.planit.repository.BookingRepository;
import com.teamarc.planit.repository.CustomerRepository;
import com.teamarc.planit.repository.EventRepository;
import com.teamarc.planit.repository.ServicesRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;
    private final ServicesRepository servicesRepository;
    private final CustomerRepository customerRepository;
    private final ModelMapper modelMapper;

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
        booking.setStatus(Booking.BookingStatus.PENDING);
        booking.setBookingAmount(dto.getBookingAmount());
        booking.setStartDt(dto.getStartDt());
        booking.setEndDt(dto.getEndDt());

        // TODO Notify Vendor

        Booking savedBooking = bookingRepository.save(booking);
        return modelMapper.map(savedBooking, BookingResponseDTO.class);
    }

    // Accept Booking Request By Vendor




    // Reject Booking Request By Vendor


    // Cancel Booking From Cus Before Accepting


    // Cancel Booking From Customer After Accepting


    // Cancel Booking From Vendor After Accepting


    // Cancel all Booking Request By Vendor







    @Transactional
    public BookingResponseDTO updateBookingStatus(Long id, Booking.BookingStatus status) {
        Booking booking = getBookingEntityById(id);
        booking.setStatus(status);
        Booking saved = bookingRepository.save(booking);
        return modelMapper.map(saved, BookingResponseDTO.class);
    }

    public Page<BookingResponseDTO> getAllCustomerBookings(Long id, int page, int size) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
        return bookingRepository.findAllByCustomer_Id(customer.getId(), PageRequest.of(page, size))
                .map(booking -> modelMapper.map(booking, BookingResponseDTO.class));
    }
}