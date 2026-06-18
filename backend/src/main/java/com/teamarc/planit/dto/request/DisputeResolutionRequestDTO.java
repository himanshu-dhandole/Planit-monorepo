package com.teamarc.planit.dto.request;

import com.teamarc.planit.entity.DisputeManagement;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DisputeResolutionRequestDTO {
    
    @NotNull(message = "Dispute status is required")
    private DisputeManagement.DisputeStatus newStatus;
    
    @Size(max = 2000, message = "Resolution note cannot exceed 2000 characters")
    private String resolutionNote;
}
