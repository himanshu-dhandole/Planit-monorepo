package com.teamarc.planit.dto.response;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OnBoardNewVendorResponseDTO {

    private Long id;
    private Long userId;
    private String businessName;
    private String description;
    private String category;
    private String verification;
    private String location;


}
