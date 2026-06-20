package com.teamarc.planit.services;

import com.teamarc.planit.dto.request.OnBoardNewVendorRequestDTO;
import com.teamarc.planit.entity.OnBoardNewVendorRequest;
import com.teamarc.planit.entity.User;
import com.teamarc.planit.entity.Vendor;
import com.teamarc.planit.entity.enums.Role;
import com.teamarc.planit.entity.enums.VendorServiceCategory;
import com.teamarc.planit.entity.enums.VerificationStatus;
import com.teamarc.planit.repository.OnBoardNewVendorRequestRepository;
import com.teamarc.planit.repository.UserRepository;
import com.teamarc.planit.repository.VendorRepository;
import com.teamarc.planit.repository.ServicesRepository;
import com.teamarc.planit.dto.response.ServiceResponseDTO;
import com.teamarc.planit.repository.CustomerRepository;
import com.teamarc.planit.entity.Customer;
import com.teamarc.planit.exceptions.ResourceNotFoundException;
import com.teamarc.planit.utils.GeometryUtil;
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
    private final CustomerRepository customerRepository;
    private final ModelMapper modelMapper;
    private final ServicesRepository servicesRepository;
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
        Customer customer = customerRepository.findByUserId(onBoardNewVendorRequestDTO.getUserId());
        if (customer == null) {
            throw new ResourceNotFoundException("Customer not found. User must be a registered customer to become a vendor.");
        }

        Vendor vendor = Vendor.builder()
                            .user(user)
                            .businessName(onBoardNewVendorRequestDTO.getBusinessName())
                            .description(onBoardNewVendorRequestDTO.getDescription())
                            .category(VendorServiceCategory.valueOf(onBoardNewVendorRequestDTO.getCategory()))
                            .phoneNumber(onBoardNewVendorRequestDTO.getPhoneNumber())
                            .upiAddress(onBoardNewVendorRequestDTO.getUpiAddress())
                            .addressLine1(onBoardNewVendorRequestDTO.getAddressLine1())
                            .addressLine2(onBoardNewVendorRequestDTO.getAddressLine2())
                            .pincode(onBoardNewVendorRequestDTO.getPincode())
                            .state(onBoardNewVendorRequestDTO.getState())
                            .profileImageUrl(onBoardNewVendorRequestDTO.getProfileImageUrl())
                            .pan(onBoardNewVendorRequestDTO.getPan())
                            .gstNumber(onBoardNewVendorRequestDTO.getGstNumber())
                            .verificationStatus(VerificationStatus.VERIFIED)
                            .isActive(true)
                            .aura(user.getAura())
                            .coordinates(onBoardNewVendorRequestDTO.getCoordinates() != null ? GeometryUtil.creatPoint(onBoardNewVendorRequestDTO.getCoordinates()) : null)
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

    public List<com.teamarc.planit.dto.response.CustomerResponseDTO> getAllCustomerVerificationRequests() {
        return customerRepository.findByVerificationStatus(VerificationStatus.PENDING)
                .stream()
                .map(customer -> modelMapper.map(customer, com.teamarc.planit.dto.response.CustomerResponseDTO.class))
                .toList();
    }

    public void approveCustomerVerification(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));
        customer.setVerificationStatus(VerificationStatus.VERIFIED);
        customerRepository.save(customer);
    }

    public void rejectCustomerVerification(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));
        customer.setVerificationStatus(VerificationStatus.NOT_VERIFIED);
        customerRepository.save(customer);
    }

    // Services Verification methods
    public List<ServiceResponseDTO> getAllPendingServices() {
        return servicesRepository.findAllByVerificationStatus(VerificationStatus.PENDING)
                .stream()
                .map(service -> modelMapper.map(service, ServiceResponseDTO.class))
                .toList();
    }

    public void approveService(Long serviceId) {
        com.teamarc.planit.entity.Services service = servicesRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with id: " + serviceId));
        service.setVerificationStatus(VerificationStatus.VERIFIED);
        servicesRepository.save(service);
    }

    public void rejectService(Long serviceId) {
        com.teamarc.planit.entity.Services service = servicesRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with id: " + serviceId));
        service.setVerificationStatus(VerificationStatus.NOT_VERIFIED);
        servicesRepository.save(service);
    }

}
