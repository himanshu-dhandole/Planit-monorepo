package com.teamarc.planit.dto.request;

import com.teamarc.planit.entity.DisputeManagement;
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
    
    @NotBlank(message = "Reason is required")
    @Size(max = 1000)
    private String reason;
    
    @NotNull(message = "Dispute type is required")
    private DisputeManagement.DisputeType type;
    
    private String resolutionNote;
}
