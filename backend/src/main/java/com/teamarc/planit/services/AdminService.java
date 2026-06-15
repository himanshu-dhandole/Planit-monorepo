package com.teamarc.planit.services;

import com.teamarc.planit.dto.request.OnBoardNewVendorRequestDTO;
import com.teamarc.planit.entity.OnBoardNewVendorRequest;
import com.teamarc.planit.entity.User;
import com.teamarc.planit.entity.Vendor;
import com.teamarc.planit.entity.enums.Role;
import com.teamarc.planit.entity.enums.VendorServiceCategory;
import com.teamarc.planit.repository.OnBoardNewVendorRequestRepository;
import com.teamarc.planit.repository.UserRepository;
import com.teamarc.planit.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final OnBoardNewVendorRequestRepository onBoardNewVendorRequestRepository;
    private final UserService userService;
    private final VendorRepository vendorRepository;
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;
    private final OnBoardNewVendorRequestService onBoardNewVendorRequestService;
    private final EmailService emailService;

    public List<OnBoardNewVendorRequestDTO> getAllVendorOnBoardRequests() {
        List<OnBoardNewVendorRequest> requests = onBoardNewVendorRequestRepository.findAll();
        return requests.stream()
                        .map(request -> modelMapper.map(request, OnBoardNewVendorRequestDTO.class))
                        .toList();
    }


    public void approveOnBoardNewVendorRequest(Long requestId) {
        OnBoardNewVendorRequestDTO onBoardNewVendorRequestDTO = onBoardNewVendorRequestService.getRequestByRequestId(requestId);
        User user = userService.getUserById(onBoardNewVendorRequestDTO.getUserId());

        Vendor vendor = Vendor.builder()
                            .user(user)
                            .businessName(onBoardNewVendorRequestDTO.getBusinessName())
                            .description(onBoardNewVendorRequestDTO.getDescription())
                            .category(VendorServiceCategory.valueOf(onBoardNewVendorRequestDTO.getCategory()))
                            .verification(onBoardNewVendorRequestDTO.getVerification())
                            .location(onBoardNewVendorRequestDTO.getLocation())
                            .isVerified(Boolean.TRUE)
                            .build();

        vendorRepository.save(vendor);

        user.getRole().add(Role.VENDOR);
        userRepository.save(user);

        // Send approval email
        emailService.sendVendorApprovalEmail(
            user.getEmail(),
            user.getName(),
            onBoardNewVendorRequestDTO.getBusinessName()
        );

        onBoardNewVendorRequestService.deleteRequestById(requestId);
    }

    public void rejectOnBoardNewVendorRequest(Long requestId) {
        onBoardNewVendorRequestService.deleteRequestById(requestId);
    }

}
