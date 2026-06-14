package com.teamarc.planit.dto.request;

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

    @Size(max = 500)
    private String verification;

    @Size(max = 300)
    private String location;

}
