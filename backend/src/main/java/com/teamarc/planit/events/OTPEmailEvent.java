package com.teamarc.planit.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OTPEmailEvent implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long otpId;
    private String email;
    private String userName;
    private String otpCode;
    private String otpType;
    private Integer expiryMinutes;
}
