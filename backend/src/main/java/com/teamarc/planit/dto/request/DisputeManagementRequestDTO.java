package com.teamarc.planit.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DisputeManagementRequestDTO {
    
    @NotNull(message = "Booking ID is required")
    private Long bookingId;
    
    @NotNull(message = "Raised by user ID is required")
    private Long raisedByUserId;
    
    @NotNull(message = "Against user ID is required")
    private Long againstUserId;
    
    @NotBlank(message = "Reason is required")
    @Size(max = 1000)
    private String reason;
    
    private String resolutionNote;
}
