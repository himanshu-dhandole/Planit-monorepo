package com.teamarc.planit.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationResponseDTO {
    private Long id;
    private Long customerId;
    private String customerName;
    private Long vendorId;
    private String vendorBusinessName;
    private Long serviceId;
    private String serviceName;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
}
