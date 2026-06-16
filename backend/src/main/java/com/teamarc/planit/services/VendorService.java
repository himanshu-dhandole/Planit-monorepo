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

    public VendorResponseDTO getVendorById(Long id) {
        return modelMapper.map(vendorRepository.findById(id).orElseThrow(() -> new RuntimeException("Vendor not found")), VendorResponseDTO.class);
    }

    public VendorResponseDTO getVendorByUserId(Long userId) {
        return modelMapper.map(vendorRepository.findByUser_Id(userId).orElseThrow(() -> new RuntimeException("Vendor not found by userId" + userId)), VendorResponseDTO.class);
    }

    public VendorResponseDTO updateVendorDetails(Long vendorId, VendorRequestDTO vendorRequestDTO) {
        Vendor vendor = vendorRepository.findById(vendorId).orElseThrow(() -> new RuntimeException("Vendor not found"));
        vendor.setBusinessName(vendorRequestDTO.getBusinessName());
        vendor.setDescription(vendorRequestDTO.getDescription());
        vendor.setCategory(VendorServiceCategory.valueOf(vendorRequestDTO.getCategory()));
        vendor.setLocation(vendorRequestDTO.getLocation());
        return modelMapper.map(vendorRepository.save(vendor), VendorResponseDTO.class);
    }

    public Page<VendorResponseDTO> getAllVendors(int page, int size) {
        return vendorRepository.findAll(PageRequest.of(page, size))
                .map(vendor -> modelMapper.map(vendor, VendorResponseDTO.class));
    }

    public Page<VendorResponseDTO> getVendorsByCategory(String category, int page, int size) {
        return vendorRepository.findAllByCategory(VendorServiceCategory.valueOf(category), PageRequest.of(page, size))
                .map(vendor -> modelMapper.map(vendor, VendorResponseDTO.class));
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
