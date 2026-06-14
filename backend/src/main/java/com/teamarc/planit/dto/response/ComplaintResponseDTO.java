package com.teamarc.planit.dto.response;

import com.teamarc.planit.entity.Complaint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintResponseDTO {
    
    private Long id;
    private Long bookingId;
    private Long raisedByUserId;
    private Long againstUserId;
    private Complaint.ComplaintStatus status;
    private String blame;
    private String description;
    private LocalDateTime raisedAt;
    private LocalDateTime updatedAt;
}
