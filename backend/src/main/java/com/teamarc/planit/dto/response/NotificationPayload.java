package com.teamarc.planit.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPayload {
    private String type;        // "DISPUTE_RAISED", "DISPUTE_STATUS_UPDATED", "DISPUTE_RESOLVED"
    private String title;       // Short heading e.g. "Dispute Raised Against You"
    private String message;     // Human readable message
    private Long disputeId;
    private Long bookingId;
    private String status;      // current dispute status
    private Long recipientUserId; // ID of user to receive the notification
    private LocalDateTime timestamp;
}
