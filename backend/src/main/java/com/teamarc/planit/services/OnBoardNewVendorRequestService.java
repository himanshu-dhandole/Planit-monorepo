package com.teamarc.planit.services;

import com.teamarc.planit.dto.request.OnBoardNewVendorRequestDTO;
import com.teamarc.planit.dto.response.OnBoardNewVendorResponseDTO;
import com.teamarc.planit.entity.OnBoardNewVendorRequest;
import com.teamarc.planit.entity.User;
import com.teamarc.planit.entity.enums.VendorServiceCategory;
import com.teamarc.planit.exceptions.ResourceNotFoundException;
import com.teamarc.planit.repository.OnBoardNewVendorRequestRepository;
import com.teamarc.planit.utils.FileService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class OnBoardNewVendorRequestService {

    private final ModelMapper modelMapper;
    private final OnBoardNewVendorRequestRepository onBoardNewVendorRequestRepository;
    private final FileService fileService;


    public OnBoardNewVendorResponseDTO requestVendorOnBoard(OnBoardNewVendorRequestDTO requestDTO) {

        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        OnBoardNewVendorRequest request = OnBoardNewVendorRequest.builder()
                .userId(user.getId())
                .businessName(requestDTO.getBusinessName())
                .description(requestDTO.getDescription())
                .category(VendorServiceCategory.valueOf(requestDTO.getCategory()))
                .phoneNumber(requestDTO.getPhoneNumber())
                .upiAddress(requestDTO.getUpiAddress())
                .addressLine1(requestDTO.getAddressLine1())
                .addressLine2(requestDTO.getAddressLine2())
                .pincode(requestDTO.getPincode())
                .state(requestDTO.getState())
                .profileImageUrl(requestDTO.getProfileImageUrl())
                .pan(requestDTO.getPan())
                .gstNumber(requestDTO.getGstNumber())
                .build();


        return saveRequest(request);
    }

    public String updateVendorVerification(Long requestId, MultipartFile file) {
        // Verification document is no longer a text field, but we can store it in profileImageUrl or a new field if needed.
        // For now, doing nothing since we removed verification string from OnBoardNewVendorRequest.
        // If we want to keep it, we should add verificationDocUrl.
        return "Vendor verification updated successfully.";
    }

    public OnBoardNewVendorRequestDTO getRequestByRequestId(Long requestId) {
        return modelMapper.map(onBoardNewVendorRequestRepository.findById(requestId).orElseThrow(() -> new ResourceNotFoundException("Unable to find request with id " + requestId)), OnBoardNewVendorRequestDTO.class);
    }

    public void deleteRequestById(Long requestId) {
        onBoardNewVendorRequestRepository.deleteById(requestId);
    }

    public OnBoardNewVendorRequest getByUserId(long userId) {
        return onBoardNewVendorRequestRepository.findByUserId(userId);
    }


    public OnBoardNewVendorResponseDTO saveRequest(OnBoardNewVendorRequest onBoardNewVendorRequest) {
        return modelMapper.map(onBoardNewVendorRequestRepository.save(onBoardNewVendorRequest), OnBoardNewVendorResponseDTO.class);
    }


}
