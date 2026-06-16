package com.teamarc.planit.services;

import com.teamarc.planit.dto.request.VendorRequestDTO;
import com.teamarc.planit.dto.response.BookingResponseDTO;
import com.teamarc.planit.dto.response.ServiceResponseDTO;
import com.teamarc.planit.dto.response.VendorResponseDTO;
import com.teamarc.planit.entity.Vendor;
import com.teamarc.planit.entity.enums.VendorServiceCategory;
import com.teamarc.planit.exceptions.ResourceNotFoundException;
import com.teamarc.planit.repository.VendorRepository;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class VendorService {

    private final ModelMapper modelMapper;
    private final VendorRepository vendorRepository;
    private final ServicesService servicesService;
    private final BookingService bookingService;

    private VendorResponseDTO mapToDTO(Vendor vendor) {
        VendorResponseDTO dto = modelMapper.map(vendor, VendorResponseDTO.class);
        if (vendor.getCustomer() != null) {
            dto.setOwnerName(vendor.getCustomer().getFirstName() + " " + vendor.getCustomer().getLastName());
            dto.setAadharUrl(vendor.getCustomer().getAadharUrl());
            dto.setCustomerId(vendor.getCustomer().getId());
        }
        return dto;
    }

    public VendorResponseDTO getVendorById(Long id) {
        return mapToDTO(vendorRepository.findById(id).orElseThrow(() -> new RuntimeException("Vendor not found")));
    }

    public VendorResponseDTO getVendorByCustomerId(Long customerId) {
        return mapToDTO(vendorRepository.findByCustomer_Id(customerId).orElseThrow(() -> new RuntimeException("Vendor not found by customerId " + customerId)));
    }

    public VendorResponseDTO updateVendorDetails(Long vendorId, VendorRequestDTO vendorRequestDTO) {
        Vendor vendor = vendorRepository.findById(vendorId).orElseThrow(() -> new RuntimeException("Vendor not found"));
        vendor.setBusinessName(vendorRequestDTO.getBusinessName());
        vendor.setDescription(vendorRequestDTO.getDescription());
        vendor.setCategory(VendorServiceCategory.valueOf(vendorRequestDTO.getCategory()));
        vendor.setPhoneNumber(vendorRequestDTO.getPhoneNumber());
        vendor.setUpiAddress(vendorRequestDTO.getUpiAddress());
        vendor.setAddressLine1(vendorRequestDTO.getAddressLine1());
        vendor.setAddressLine2(vendorRequestDTO.getAddressLine2());
        vendor.setPincode(vendorRequestDTO.getPincode());
        vendor.setState(vendorRequestDTO.getState());
        if(vendorRequestDTO.getProfileImageUrl() != null) vendor.setProfileImageUrl(vendorRequestDTO.getProfileImageUrl());
        vendor.setPan(vendorRequestDTO.getPan());
        vendor.setGstNumber(vendorRequestDTO.getGstNumber());
        return mapToDTO(vendorRepository.save(vendor));
    }

    public Page<VendorResponseDTO> getAllVendors(int page, int size) {
        return vendorRepository.findAll(PageRequest.of(page, size))
                .map(this::mapToDTO);
    }

    public Page<VendorResponseDTO> getVendorsByCategory(String category, int page, int size) {
        return vendorRepository.findAllByCategory(VendorServiceCategory.valueOf(category), PageRequest.of(page, size))
                .map(this::mapToDTO);
    }

    //TODO Delete Vendor Account


    public Page<ServiceResponseDTO> getAllVendorServices(Long id, int page, int size) {
        return servicesService.getAllServicesByVendorId(id, page, size);
    }


    public Page<BookingResponseDTO> getAllVendorBookings(Long id, int page, int size) {
        return bookingService.getAllVendorBookings(id, page, size);
    }

    public Vendor getVendorEntityById(Long vendorId) {
        return vendorRepository.findById(vendorId).orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + vendorId));
    }
}
