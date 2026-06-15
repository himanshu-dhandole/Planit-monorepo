package com.teamarc.planit.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RazorpayVerificationRequestDTO {

    @NotEmpty(message = "Razorpay order ID is required")
    private String razorpayOrderId;

    @NotEmpty(message = "Razorpay payment ID is required")
    private String razorpayPaymentId;

    @NotEmpty(message = "Razorpay signature is required")
    private String razorpaySignature;
}
