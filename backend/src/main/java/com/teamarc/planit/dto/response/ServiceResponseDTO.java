package com.teamarc.planit.dto.response;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceResponseDTO {
    
    private Long id;
    private Long vendorId;
    private String name;
    private String description;
    private BigDecimal price;
    private String category;
    private Boolean isAvailable;
    private String location;
    
    private Double rating;
    private java.util.List<com.teamarc.planit.dto.response.ReviewResponseDTO> reviews;
    private java.util.List<com.teamarc.planit.dto.ServiceLocationDTO> availableLocations;
    private java.util.List<String> photos;

    private com.teamarc.planit.entity.enums.VerificationStatus verificationStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
