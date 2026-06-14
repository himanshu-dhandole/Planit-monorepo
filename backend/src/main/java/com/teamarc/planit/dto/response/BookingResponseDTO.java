package com.teamarc.planit.dto.response;

import com.teamarc.planit.entity.Booking;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponseDTO {
    
    private Long id;
    private Long eventId;
    private Long serviceId;
    private Long customerId;
    private Booking.BookingStatus status;
    private Long cancelledByUserId;
    private String cancellationReason;
    private BigDecimal bookingAmount;
    private LocalDateTime startDt;
    private LocalDateTime endDt;
    private LocalDateTime bookedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
