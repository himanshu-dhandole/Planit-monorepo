package com.teamarc.planit.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerResponseDTO {
    
    private Long id;
    private Long userId;
    private String name;
    private String bio;
    private String address;
    private Double karma;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
