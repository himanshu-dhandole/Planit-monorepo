package com.teamarc.planit.dto.response;

import com.teamarc.planit.entity.DisputeManagement;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DisputeManagementResponseDTO {
    
    private Long id;
    private Long bookingId;
    private Long raisedByUserId;
    private Long againstUserId;
    private String reason;
    private DisputeManagement.DisputeStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String resolutionNote;
    private DisputeManagement.DisputeType type;
    private LocalDateTime resolvedAt;
    private Long resolvedByUserId;
}
