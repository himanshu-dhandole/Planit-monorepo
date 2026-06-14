package com.teamarc.planit.dto.response;

import com.teamarc.planit.entity.Payment;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponseDTO {
    
    private Long id;
    private Long bookingId;
    private BigDecimal amount;
    private Payment.PaymentStatus status;
    private LocalDateTime timestamp;
    private String txnId;
}
