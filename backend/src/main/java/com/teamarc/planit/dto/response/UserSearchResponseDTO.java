package com.teamarc.planit.dto.response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSearchResponseDTO {
    private Long id; // vendorId or customerId
    private String name; // businessName for vendor, firstName + lastName for customer
    private String type; // "VENDOR" or "CUSTOMER"
    private String phoneNumber;
    private Long serviceId;
    private String serviceName;
}
