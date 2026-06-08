package com.teamarc.planit.service.serviceImpl;

import com.teamarc.planit.entity.User;
import com.teamarc.planit.entity.enums.Role;
import com.teamarc.planit.exception.ResourceNotFoundException;
import com.teamarc.planit.repository.UserRepository;
import com.teamarc.planit.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByEmail(username).orElse(null);
    }

    @Override
    public User getUserById(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    @Override
    public User loadUserByRole(Role role) {
        return userRepository.findByRoles(role);
    }
}
