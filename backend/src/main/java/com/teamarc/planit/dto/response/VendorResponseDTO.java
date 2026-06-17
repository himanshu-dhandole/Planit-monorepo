package com.teamarc.planit.dto.response;

import com.teamarc.planit.dto.PointDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VendorResponseDTO {
    
    private Long id;
    private String businessName;
    private String ownerName;
    private String phoneNumber;
    private String upiAddress;
    private String addressLine1;
    private String addressLine2;
    private String pincode;
    private String state;
    private String profileImageUrl;
    private String pan;
    private String gstNumber;
    private String aadharUrl;
    private String description;
    private String category;
    private com.teamarc.planit.entity.enums.VerificationStatus verificationStatus;
    private java.lang.Integer totalBookings;
    private java.lang.Double karma;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private PointDTO coordinates;
}
