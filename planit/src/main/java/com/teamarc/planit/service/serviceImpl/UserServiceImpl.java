package com.teamarc.planit.service.serviceImpl;

import com.teamarc.planit.entity.User;
import com.teamarc.planit.entity.enums.UserRole;
import com.teamarc.planit.exception.ResourceNotFoundException;
import com.teamarc.planit.repository.UserRepository;
import com.teamarc.planit.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByEmail(username).orElse(null);
    }

    @Override
    public User getUserById(UUID userId) {
        return userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    @Override
    public User loadUserByRole(UserRole role) {
        return userRepository.findByRole(role);
    }
}
