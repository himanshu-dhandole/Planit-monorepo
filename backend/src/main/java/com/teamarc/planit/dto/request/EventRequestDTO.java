package com.teamarc.planit.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventRequestDTO {
    
    @NotNull(message = "Customer ID is required")
    private Long customerId;
    
    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 100)
    private String title;
    
    @Size(max = 500)
    private String description;
    
    @Size(max = 500)
    private String address;
    
    @NotNull(message = "Start date is required")
    @FutureOrPresent(message = "Start date must be in future or present")
    private LocalDateTime startDate;
    
    @NotNull(message = "End date is required")
    private LocalDateTime endDate;
}
