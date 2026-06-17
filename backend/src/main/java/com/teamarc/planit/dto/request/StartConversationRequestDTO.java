package com.teamarc.planit.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StartConversationRequestDTO {
    private Long vendorId;
    private Long customerId;
    private Long serviceId;
}
