package com.teamarc.planit.service;

import com.teamarc.planit.entity.User;
import com.teamarc.planit.entity.enums.Role;
import org.springframework.security.core.userdetails.UserDetailsService;

public interface UserService extends UserDetailsService {
    User getUserById(Long userId);
    User loadUserByRole(Role role);
}
