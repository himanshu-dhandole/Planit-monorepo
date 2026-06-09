package com.teamarc.planit.service;

import com.teamarc.planit.entity.User;
import com.teamarc.planit.entity.enums.UserRole;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.util.UUID;

public interface UserService extends UserDetailsService {
    User getUserById(UUID userId);
    User loadUserByRole(UserRole role);
}
