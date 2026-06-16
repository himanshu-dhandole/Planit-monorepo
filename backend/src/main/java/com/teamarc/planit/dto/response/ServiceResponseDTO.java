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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
