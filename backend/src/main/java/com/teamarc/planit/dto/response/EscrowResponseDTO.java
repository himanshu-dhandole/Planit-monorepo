package com.teamarc.planit.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EscrowResponseDTO {
    private Long id;
    private Long bookingId;
    private BigDecimal heldAmount;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime releasedAt;
}
