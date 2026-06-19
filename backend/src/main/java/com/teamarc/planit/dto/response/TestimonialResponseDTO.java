package com.teamarc.planit.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TestimonialResponseDTO {
    private Long id;
    private Long vendorId;
    private String businessName;
    private Long customerId;
    private String customerName;
    private Long serviceId;
    private String serviceName;
    private String testimonialText;
    private Boolean isFeatured;
    private LocalDateTime createdAt;
}
