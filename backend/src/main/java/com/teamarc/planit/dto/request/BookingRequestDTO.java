package com.teamarc.planit.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingRequestDTO {
    
    @NotNull(message = "Event ID is required")
    private Long eventId;
    
    @NotNull(message = "Service ID is required")
    private Long serviceId;
    
    @NotNull(message = "Customer ID is required")
    private Long customerId;
    
    @NotNull(message = "Start date is required")
    private LocalDateTime startDt;
    
    @NotNull(message = "End date is required")
    private LocalDateTime endDt;
    
    @NotNull(message = "Booking amount is required")
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal bookingAmount;
}
