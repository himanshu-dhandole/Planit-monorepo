package com.teamarc.planit.services;


import com.teamarc.planit.dto.request.CustomerRequestDTO;
import com.teamarc.planit.dto.response.BookingResponseDTO;
import com.teamarc.planit.dto.response.CustomerResponseDTO;
import com.teamarc.planit.entity.Customer;
import com.teamarc.planit.entity.User;
import com.teamarc.planit.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class CustomerService {

    private final UserService userService;
    private final CustomerRepository customerRepository;
    private final ModelMapper modelMapper;
    private final BookingService bookingService;

    public CustomerResponseDTO createCustomerProfile(CustomerRequestDTO customerRequestDTO) {
        User user = userService.getUserById(customerRequestDTO.getUserId());
        Customer customer = Customer.builder()
                .user(user)
                .name(customerRequestDTO.getName())
                .bio(customerRequestDTO.getBio())
                .address(customerRequestDTO.getAddress())
                .build();

        return modelMapper.map(customerRepository.save(customer), CustomerResponseDTO.class);
    }

    public CustomerResponseDTO getCustomerById(Long id) {
        return modelMapper.map(customerRepository.findById(id).orElseThrow(() -> new RuntimeException("Customer not found with id: " + id)), CustomerResponseDTO.class);
    }

    public Customer getCustomerEntityById(Long id) {
        return customerRepository.findById(id).orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));
    }

    public CustomerResponseDTO getCustomerByUserId(Long userId) {
        Customer customer = customerRepository.findByUserId(userId);
        if (customer == null) {
            throw new RuntimeException("Customer profile not found for user ID: " + userId);
        }
        return modelMapper.map(customer, CustomerResponseDTO.class);
    }

    public CustomerResponseDTO updateCustomerProfile(Long id, CustomerRequestDTO customerRequestDTO) {
        Customer existingCustomer = customerRepository.findById(id).orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));
        existingCustomer.setName(customerRequestDTO.getName());
        existingCustomer.setBio(customerRequestDTO.getBio());
        existingCustomer.setAddress(customerRequestDTO.getAddress());

        return modelMapper.map(customerRepository.save(existingCustomer), CustomerResponseDTO.class);
    }

    public Page<BookingResponseDTO> getAllBookingByCustomerId(Long customerId, int page, int size) {
        Customer customer = customerRepository.findById(customerId).orElseThrow(() -> new RuntimeException("Customer not found with id: " + customerId));
        return bookingService.getAllCustomerBookings(customer.getId(), page, size);
    }
}
