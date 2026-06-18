package com.teamarc.planit.services;

import com.teamarc.planit.dto.request.ServiceRequestDTO;
import com.teamarc.planit.dto.response.ServiceResponseDTO;
import com.teamarc.planit.entity.Services;
import com.teamarc.planit.entity.Vendor;
import com.teamarc.planit.entity.enums.VendorServiceCategory;
import com.teamarc.planit.exceptions.ResourceNotFoundException;
import com.teamarc.planit.repository.ServicesRepository;
import com.teamarc.planit.repository.VendorRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ServicesService {


    private final ServicesRepository servicesRepository;
    private final ModelMapper modelMapper;
    private final VendorRepository vendorRepository;

    @Transactional
    public ServiceResponseDTO createService(ServiceRequestDTO serviceRequestDTO) {

        Vendor vendor = vendorRepository.findById(serviceRequestDTO.getVendorId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + serviceRequestDTO.getVendorId()));

        Services service = Services.builder()
                .vendor(vendor)
                .name(serviceRequestDTO.getName())
                .description(serviceRequestDTO.getDescription())
                .price(serviceRequestDTO.getPrice())
                .location(serviceRequestDTO.getLocation())
                .category(VendorServiceCategory.valueOf(serviceRequestDTO.getCategory()))
                .rating(0.0)
                .availableLocations(serviceRequestDTO.getAvailableLocations() != null ? 
                    serviceRequestDTO.getAvailableLocations().stream().map(loc -> new com.teamarc.planit.entity.ServiceLocation(loc.getCity(), loc.getState())).toList() : null)
                .photos(serviceRequestDTO.getPhotos())
                .build();

        return modelMapper.map(servicesRepository.save(service), ServiceResponseDTO.class);
    }

    public ServiceResponseDTO getServiceById(Long serviceId) {
        return modelMapper.map(servicesRepository.findById(serviceId).orElseThrow(() -> new ResourceNotFoundException("Service not found with id: " + serviceId)), ServiceResponseDTO.class);
    }

    public ServiceResponseDTO updateService(Long serviceId, ServiceRequestDTO serviceRequestDTO) {
        Services existingService = servicesRepository.findById(serviceId).orElseThrow(() -> new ResourceNotFoundException("Service not found with id: " + serviceId));
        existingService.setName(serviceRequestDTO.getName());
        existingService.setDescription(serviceRequestDTO.getDescription());
        existingService.setPrice(serviceRequestDTO.getPrice());
        existingService.setLocation(serviceRequestDTO.getLocation());
        existingService.setCategory(VendorServiceCategory.valueOf(serviceRequestDTO.getCategory()));
        if (serviceRequestDTO.getAvailableLocations() != null) {
            existingService.setAvailableLocations(serviceRequestDTO.getAvailableLocations().stream()
                .map(loc -> new com.teamarc.planit.entity.ServiceLocation(loc.getCity(), loc.getState())).toList());
        }
        if (serviceRequestDTO.getPhotos() != null) {
            existingService.setPhotos(serviceRequestDTO.getPhotos());
        }


        return modelMapper.map(servicesRepository.save(existingService), ServiceResponseDTO.class);
    }


    public Page<ServiceResponseDTO> getAllServicesByVendorId(Long vendorId, int page, int size) {
        return servicesRepository.findAllByVendor_Id(vendorId, PageRequest.of(page, size))
                .map(service -> modelMapper.map(service, ServiceResponseDTO.class));

    }

    public Page<ServiceResponseDTO> getAllServicesByCategory(String category, int page, int size) {
        return servicesRepository.findAllByCategoryAndIsAvailable(VendorServiceCategory.valueOf(category), Boolean.TRUE, PageRequest.of(page, size))
                .map(service -> modelMapper.map(service, ServiceResponseDTO.class));
    }


    public ServiceResponseDTO deleteService(Long serviceId, Boolean isAvailable) {
        Services existingService = servicesRepository.findById(serviceId).orElseThrow(() -> new ResourceNotFoundException("Service not found with id: " + serviceId));
        existingService.setIsAvailable(isAvailable);
        return modelMapper.map(servicesRepository.save(existingService), ServiceResponseDTO.class);
    }

    public Page<ServiceResponseDTO> getAllServicesByLocation(String category, int page, int size) {
        return servicesRepository.findAllByLocationAndIsAvailable(VendorServiceCategory.valueOf(category), Boolean.TRUE, PageRequest.of(page, size))
                .map(service -> modelMapper.map(service, ServiceResponseDTO.class));
    }

    public Page<ServiceResponseDTO> searchServicesByCityAndState(String city, String state, int page, int size) {
        return servicesRepository.findByAvailableLocationCityAndState(city, state, PageRequest.of(page, size))
                .map(service -> modelMapper.map(service, ServiceResponseDTO.class));
    }



    public Page<ServiceResponseDTO> getAllServices(int page, int size) {
        return servicesRepository.findAllByIsAvailable(Boolean.TRUE, PageRequest.of(page, size))
                .map(service -> modelMapper.map(service, ServiceResponseDTO.class));
    }

    // TODO_DELETE_SERVICE
}
