package com.teamarc.planit.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DisputeNotificationEvent implements Serializable {
    private static final long serialVersionUID = 1L;
    
    private Long disputeId;
    private String recipientEmail;
    private String recipientName;
    private String eventType; // "RAISED", "STATUS_UPDATED", "RESOLVED"
    private String reason;
    private String resolutionNote;
    private String newStatus;
    private Long bookingId;
}
