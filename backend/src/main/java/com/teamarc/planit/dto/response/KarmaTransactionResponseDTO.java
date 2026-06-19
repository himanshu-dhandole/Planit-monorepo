package com.teamarc.planit.dto.response;

import com.teamarc.planit.entity.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KarmaTransactionResponseDTO {
    private Long id;
    private Long userId;
    private Role actionRole;
    private Double amount;
    private Double previousKarma;
    private Double newKarma;
    private String ruleApplied;
    private Long bookingId;
    private Long complaintId;
    private Long reviewId;
    private String description;
    private LocalDateTime createdAt;
}
