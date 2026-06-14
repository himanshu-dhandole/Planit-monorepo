package com.teamarc.planit.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VendorResponseDTO {
    
    private Long id;
    private Long userId;
    private String businessName;
    private String description;
    private String category;
    private String verification;
    private Integer totalBookings;
    private String location;
    private Double karma;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
