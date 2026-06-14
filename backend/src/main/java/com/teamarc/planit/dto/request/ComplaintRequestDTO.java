package com.teamarc.planit.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintRequestDTO {
    
    @NotNull(message = "Booking ID is required")
    private Long bookingId;
    
    @NotNull(message = "Raised by user ID is required")
    private Long raisedByUserId;
    
    @NotNull(message = "Against user ID is required")
    private Long againstUserId;
    
    @Size(max = 500)
    private String blame;
    
    @NotBlank(message = "Description is required")
    @Size(max = 1000)
    private String description;
}
