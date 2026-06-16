package com.teamarc.planit.services;

import com.teamarc.planit.dto.request.CustomerRequestDTO;
import com.teamarc.planit.dto.response.BookingResponseDTO;
import com.teamarc.planit.dto.response.CustomerResponseDTO;
import com.teamarc.planit.entity.Customer;
import com.teamarc.planit.entity.User;
import com.teamarc.planit.entity.enums.Role;
import com.teamarc.planit.entity.enums.VerificationStatus;
import com.teamarc.planit.repository.CustomerRepository;
import com.teamarc.planit.utils.FileService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final UserService userService;
    private final CustomerRepository customerRepository;
    private final ModelMapper modelMapper;
    private final BookingService bookingService;
    private final FileService fileService;

    @Override
    @Transactional
    public CustomerResponseDTO createCustomerProfile(CustomerRequestDTO customerRequestDTO, MultipartFile profilePic, MultipartFile aadhar) {
        User user = userService.getUserById(customerRequestDTO.getUserId());
        
        Customer customer = Customer.builder()
                .user(user)
                .firstName(customerRequestDTO.getFirstName())
                .middleName(customerRequestDTO.getMiddleName())
                .lastName(customerRequestDTO.getLastName())
                .phoneNumber(customerRequestDTO.getPhoneNumber())
                .bio(customerRequestDTO.getBio())
                .addressLine1(customerRequestDTO.getAddressLine1())
                .addressLine2(customerRequestDTO.getAddressLine2())
                .state(customerRequestDTO.getState())
                .pincode(customerRequestDTO.getPincode())
                .verificationStatus(VerificationStatus.PENDING)
                .build();
                
        if (profilePic != null && !profilePic.isEmpty()) {
            customer.setProfilePictureUrl(fileService.uploadFile(profilePic));
        }
        if (aadhar != null && !aadhar.isEmpty()) {
            customer.setAadharUrl(fileService.uploadFile(aadhar));
        }

        user.getRole().add(Role.CUSTOMER);
        userService.saveUser(user);

        return modelMapper.map(customerRepository.save(customer), CustomerResponseDTO.class);
    }

    @Override
    public CustomerResponseDTO getCustomerById(Long id) {
        return modelMapper.map(customerRepository.findById(id).orElseThrow(() -> new RuntimeException("Customer not found with id: " + id)), CustomerResponseDTO.class);
    }

    @Override
    public CustomerResponseDTO getCustomerByUserId(Long userId) {
        Customer customer = customerRepository.findByUserId(userId);
        if (customer == null) {
            throw new RuntimeException("Customer profile not found for user ID: " + userId);
        }
        return modelMapper.map(customer, CustomerResponseDTO.class);
    }

    @Override
    @Transactional
    public CustomerResponseDTO updateCustomerProfile(Long id, CustomerRequestDTO customerRequestDTO, MultipartFile profilePic, MultipartFile aadhar) {
        Customer existingCustomer = customerRepository.findById(id).orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));
        
        existingCustomer.setFirstName(customerRequestDTO.getFirstName());
        existingCustomer.setMiddleName(customerRequestDTO.getMiddleName());
        existingCustomer.setLastName(customerRequestDTO.getLastName());
        existingCustomer.setPhoneNumber(customerRequestDTO.getPhoneNumber());
        existingCustomer.setBio(customerRequestDTO.getBio());
        existingCustomer.setAddressLine1(customerRequestDTO.getAddressLine1());
        existingCustomer.setAddressLine2(customerRequestDTO.getAddressLine2());
        existingCustomer.setState(customerRequestDTO.getState());
        existingCustomer.setPincode(customerRequestDTO.getPincode());

        if (profilePic != null && !profilePic.isEmpty()) {
            existingCustomer.setProfilePictureUrl(fileService.uploadFile(profilePic));
        }
        if (aadhar != null && !aadhar.isEmpty()) {
            existingCustomer.setAadharUrl(fileService.uploadFile(aadhar));
            existingCustomer.setVerificationStatus(VerificationStatus.PENDING); // Reset verification status when Aadhar is updated
        }

        User user = existingCustomer.getUser();
        if (user != null) {
            user.getRole().add(Role.CUSTOMER);
            userService.saveUser(user);
        }

        return modelMapper.map(customerRepository.save(existingCustomer), CustomerResponseDTO.class);
    }

    @Override
    public Page<BookingResponseDTO> getAllBookingByCustomerId(Long customerId, int page, int size) {
        Customer customer = customerRepository.findById(customerId).orElseThrow(() -> new RuntimeException("Customer not found with id: " + customerId));
        return bookingService.getAllCustomerBookings(customer.getId(), page, size);
    }
}
