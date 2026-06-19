package com.teamarc.planit.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TestimonialRequestDTO {

    @NotNull(message = "Vendor ID is required")
    private Long vendorId;

    private Long serviceId;

    @NotBlank(message = "Testimonial text cannot be blank")
    @Size(max = 1000, message = "Testimonial text cannot exceed 1000 characters")
    private String testimonialText;
}
