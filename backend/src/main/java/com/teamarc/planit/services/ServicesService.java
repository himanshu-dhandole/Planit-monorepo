package com.teamarc.planit.services;

import com.teamarc.planit.dto.response.ServiceResponseDTO;
import com.teamarc.planit.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ServicesService {


    private final ServiceRepository serviceRepository;
    private final ModelMapper modelMapper;

    public Page<ServiceResponseDTO> getAllServicesByVendorId(Long vendorId, int page, int size) {
        return serviceRepository.findAllByVendor_Id(vendorId, PageRequest.of(page, size))
                .map(service -> modelMapper.map(service, ServiceResponseDTO.class));

    }
}
