package com.teamarc.planit.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OTPResponseDTO {

    private Long otpId;
    private String email;
    private Integer validityMinutes;
    private String message;
}
