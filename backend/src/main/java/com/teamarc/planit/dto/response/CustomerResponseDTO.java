package com.teamarc.planit.dto.response;

import com.teamarc.planit.dto.PointDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerResponseDTO {
    
    private Long id;
    private Long userId;
    private String firstName;
    private String middleName;
    private String lastName;
    private String phoneNumber;
    private String profilePictureUrl;
    private String bio;
    private String addressLine1;
    private String addressLine2;
    private String state;
    private String pincode;
    private String aadharUrl;
    private com.teamarc.planit.entity.enums.VerificationStatus verificationStatus;
    private Double aura;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private PointDTO coordinates;
}
