package com.teamarc.planit.dto;

import com.teamarc.planit.entity.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class UserDTO {

    private UUID id;

    @NotEmpty(message = "First name cannot be empty")
    private String firstName;
    
    private String lastName;

    @Email(message = "Invalid email format")
    @NotEmpty(message = "Email cannot be empty")
    private String email;

    @NotNull(message = "Role cannot be null")
    private UserRole role;

}
