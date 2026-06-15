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

    public Page<BookingResponseDTO> getAllVendorBookings(Long id, int page, int size) {
        return bookingRepository.findAllByService_Vendor_Id(id, PageRequest.of(page, size))
                .map(booking -> modelMapper.map(booking, BookingResponseDTO.class));
    }

}
