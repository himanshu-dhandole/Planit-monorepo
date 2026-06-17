package com.teamarc.planit.dto.request;

import com.teamarc.planit.dto.PointDTO;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class OnBoardNewVendorRequestDTO {

    private Long id;

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "Business name is required")
    @Size(min = 2, max = 100)
    private String businessName;

    @Size(max = 500)
    private String description;

    @NotBlank(message = "Category is required")
    private String category;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;
    
    private String upiAddress;
    
    @NotBlank(message = "Address line 1 is required")
    private String addressLine1;
    
    private String addressLine2;
    
    @NotBlank(message = "Pincode is required")
    private String pincode;
    
    @NotBlank(message = "State is required")
    private String state;
    
    private String profileImageUrl;
    
    @NotBlank(message = "PAN is required")
    private String pan;
    
    @NotBlank(message = "GST number is required")
    private String gstNumber;

    private PointDTO coordinates;

}
