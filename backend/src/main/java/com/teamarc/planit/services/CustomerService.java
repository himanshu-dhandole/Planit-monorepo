package com.teamarc.planit.services;

import com.teamarc.planit.dto.request.CustomerRequestDTO;
import com.teamarc.planit.dto.response.BookingResponseDTO;
import com.teamarc.planit.dto.response.CustomerResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

public interface CustomerService {
    CustomerResponseDTO createCustomerProfile(CustomerRequestDTO customerRequestDTO, MultipartFile profilePic, MultipartFile aadhar);
    CustomerResponseDTO getCustomerById(Long id);
    CustomerResponseDTO getCustomerByUserId(Long userId);
    CustomerResponseDTO updateCustomerProfile(Long id, CustomerRequestDTO customerRequestDTO, MultipartFile profilePic, MultipartFile aadhar);
    Page<BookingResponseDTO> getAllBookingByCustomerId(Long customerId, int page, int size);
}
