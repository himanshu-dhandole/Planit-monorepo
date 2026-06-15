package com.teamarc.planit.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WalletDepositVerificationDTO {

    @NotEmpty(message = "Razorpay order ID is required")
    private String razorpayOrderId;

    @NotEmpty(message = "Razorpay payment ID is required")
    private String razorpayPaymentId;

    @NotEmpty(message = "Razorpay signature is required")
    private String razorpaySignature;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Amount must be greater than zero")
    private BigDecimal amount;
}
