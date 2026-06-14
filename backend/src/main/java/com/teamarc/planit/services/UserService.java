package com.teamarc.planit.services;



import com.teamarc.planit.dto.request.OnBoardNewVendorRequestDTO;
import com.teamarc.planit.entity.OnBoardNewVendorRequest;
import com.teamarc.planit.entity.User;
import com.teamarc.planit.entity.enums.Role;
import com.teamarc.planit.entity.enums.VendorServiceCategory;
import com.teamarc.planit.exceptions.ResourceNotFoundException;
import com.teamarc.planit.repository.OnBoardNewVendorRequestRepository;
import com.teamarc.planit.repository.UserRepository;
import com.teamarc.planit.utils.FileService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {
    private final UserRepository userRepository;
    private final OnBoardNewVendorRequestRepository onBoardNewVendorRequestRepository;
    private final OnBoardNewVendorRequestService onBoardNewVendorRequestService;
    private final FileService fileService;


    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByEmail(username).orElse(null);
    }

    public User getUserById(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    public User loadUserByRole(Role role) {
        return userRepository.findByRole(role);
    }


    public OnBoardNewVendorRequestDTO requestVendorOnBoard(OnBoardNewVendorRequestDTO requestDTO) {

        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        OnBoardNewVendorRequest request = OnBoardNewVendorRequest.builder()
                .userId(user.getId())
                .businessName(requestDTO.getBusinessName())
                .description(requestDTO.getDescription())
                .category(VendorServiceCategory.valueOf(requestDTO.getCategory()))
                .location(requestDTO.getLocation())
                .verification(null)
                .build();


        return onBoardNewVendorRequestService.saveRequest(request);
    }

    public String updateVendorVerification(Long requestId, MultipartFile file) {
        OnBoardNewVendorRequest request = onBoardNewVendorRequestRepository.findById(requestId).orElseThrow(() -> new ResourceNotFoundException("Unable to find request for id " + requestId));
        request.setVerification(fileService.uploadFile(file));
        onBoardNewVendorRequestService.saveRequest(request);
        return "Vendor verification updated successfully.";
    }
}
