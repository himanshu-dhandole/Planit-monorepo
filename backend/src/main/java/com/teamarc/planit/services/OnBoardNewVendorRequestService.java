package com.teamarc.planit.services;

import com.teamarc.planit.dto.request.OnBoardNewVendorRequestDTO;
import com.teamarc.planit.entity.OnBoardNewVendorRequest;
import com.teamarc.planit.exceptions.ResourceNotFoundException;
import com.teamarc.planit.repository.OnBoardNewVendorRequestRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OnBoardNewVendorRequestService {

    private final ModelMapper modelMapper;
    private final OnBoardNewVendorRequestRepository onBoardNewVendorRequestRepository;

    public OnBoardNewVendorRequestDTO getRequestByRequestId(Long requestId) {
        return modelMapper.map(onBoardNewVendorRequestRepository.findById(requestId).orElseThrow(() -> new ResourceNotFoundException("Unable to find request with id " + requestId)), OnBoardNewVendorRequestDTO.class);
    }

    public void deleteRequestById(Long requestId) {
        onBoardNewVendorRequestRepository.deleteById(requestId);
    }

    public OnBoardNewVendorRequest getByUserId(long userId) {
        return onBoardNewVendorRequestRepository.findByUserId(userId);
    }


    public OnBoardNewVendorRequestDTO saveRequest(OnBoardNewVendorRequest onBoardNewVendorRequest) {
        return modelMapper.map(onBoardNewVendorRequestRepository.save(onBoardNewVendorRequest), OnBoardNewVendorRequestDTO.class);
    }
}
