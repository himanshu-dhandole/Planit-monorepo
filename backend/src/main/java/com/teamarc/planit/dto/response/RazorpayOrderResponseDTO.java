package com.teamarc.planit.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RazorpayOrderResponseDTO {
    private String id;
    private Long amount;
    private String currency;
    private String keyId;
    private Long bookingId;
}
