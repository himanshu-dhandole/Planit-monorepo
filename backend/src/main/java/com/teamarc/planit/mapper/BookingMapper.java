package com.teamarc.planit.mapper;

import com.teamarc.planit.dto.request.*;
import com.teamarc.planit.dto.response.*;
import com.teamarc.planit.entity.*;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface BookingMapper {
    
    // User mappings
//    User toEntity(UserRequestDTO dto);
//    UserResponseDTO toUserResponse(User entity);
//    void updateUserFromDTO(UserRequestDTO dto, @MappingTarget User entity);
//
    // Customer mappings
    Customer toEntity(CustomerRequestDTO dto);
    CustomerResponseDTO toCustomerResponse(Customer entity);
    void updateCustomerFromDTO(CustomerRequestDTO dto, @MappingTarget Customer entity);
    
    // Vendor mappings
    Vendor toEntity(VendorRequestDTO dto);
    VendorResponseDTO toVendorResponse(Vendor entity);
    void updateVendorFromDTO(VendorRequestDTO dto, @MappingTarget Vendor entity);
    
    // Event mappings
    Event toEntity(EventRequestDTO dto);
    EventResponseDTO toEventResponse(Event entity);
    void updateEventFromDTO(EventRequestDTO dto, @MappingTarget Event entity);
    
    // Service mappings
    Service toEntity(ServiceRequestDTO dto);
    ServiceResponseDTO toServiceResponse(Service entity);
    void updateServiceFromDTO(ServiceRequestDTO dto, @MappingTarget Service entity);
    
    // Booking mappings
    Booking toEntity(BookingRequestDTO dto);
    BookingResponseDTO toBookingResponse(Booking entity);
    void updateBookingFromDTO(BookingRequestDTO dto, @MappingTarget Booking entity);
    
    // Payment mappings
    Payment toEntity(PaymentRequestDTO dto);
    PaymentResponseDTO toPaymentResponse(Payment entity);
    void updatePaymentFromDTO(PaymentRequestDTO dto, @MappingTarget Payment entity);
    
    // Review mappings
    Review toEntity(ReviewRequestDTO dto);
    ReviewResponseDTO toReviewResponse(Review entity);
    void updateReviewFromDTO(ReviewRequestDTO dto, @MappingTarget Review entity);
    
    // Complaint mappings
    Complaint toEntity(ComplaintRequestDTO dto);
    ComplaintResponseDTO toComplaintResponse(Complaint entity);
    void updateComplaintFromDTO(ComplaintRequestDTO dto, @MappingTarget Complaint entity);
    
    // Dispute mappings
    DisputeManagement toEntity(DisputeManagementRequestDTO dto);
    DisputeManagementResponseDTO toDisputeResponse(DisputeManagement entity);
    void updateDisputeFromDTO(DisputeManagementRequestDTO dto, @MappingTarget DisputeManagement entity);
}
