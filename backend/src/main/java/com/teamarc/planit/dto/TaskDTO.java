package com.teamarc.planit.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TaskDTO {
    private Long id;
    private Long bookingId;
    private String title;
    private String description;
    private Boolean completed;
    private Boolean priority;
    private Boolean assignedByCustomer;
    private Long lastUpdatedByUserId;
    private String attachmentUrl;
    private LocalDateTime dueDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
