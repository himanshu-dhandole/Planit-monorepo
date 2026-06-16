package com.teamarc.planit.services;

import com.teamarc.planit.dto.response.BookingResponseDTO;
import com.teamarc.planit.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ModelMapper modelMapper;



    public Page<BookingResponseDTO> getAllVendorBookings(Long vendorId, int page, int size) {
        return bookingRepository.findAllByService_Vendor_Id(vendorId, PageRequest.of(page, size))
                .map(booking -> modelMapper.map(booking, BookingResponseDTO.class));
    }

    public Page<BookingResponseDTO> getAllCustomerBookings(Long customerId, int page, int size) {
        return bookingRepository.findAllByCustomer_Id(customerId, PageRequest.of(page, size))
                .map(booking -> modelMapper.map(booking, BookingResponseDTO.class));
    }
}
