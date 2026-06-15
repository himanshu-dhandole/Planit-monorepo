package com.teamarc.planit.services;

import com.teamarc.planit.dto.LoginRequestDTO;
import com.teamarc.planit.dto.LoginResponseDTO;
import com.teamarc.planit.dto.SignupDTO;
import com.teamarc.planit.dto.UserDTO;
import com.teamarc.planit.dto.request.OTPVerificationDTO;
import com.teamarc.planit.entity.OTP;
import com.teamarc.planit.entity.User;
import com.teamarc.planit.entity.enums.Role;
import com.teamarc.planit.exceptions.ResourceNotFoundException;
import com.teamarc.planit.exceptions.RuntimeConflictException;
import com.teamarc.planit.repository.UserRepository;
import com.teamarc.planit.security.JWTService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final ModelMapper modelMapper;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JWTService jwtService;
    private final OTPService otpService;

    @Transactional
    public UserDTO signUp(SignupDTO signupDto) {
        java.util.Optional<User> existingUserOpt = userRepository.findByEmail(signupDto.getEmail());
        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();
            
            if (existingUser.getIsEmailVerified() != null && !existingUser.getIsEmailVerified()) {
                otpService.resendOTP(existingUser.getEmail(), OTP.OTPType.EMAIL_VERIFICATION);
                return modelMapper.map(existingUser, UserDTO.class);
            }
            throw new RuntimeConflictException("User already exists with email: " + signupDto.getEmail());
        }

        User user = modelMapper.map(signupDto, User.class);
        user.setPassword(passwordEncoder.encode(signupDto.getPassword()));
        user.setRole(new java.util.HashSet<>(java.util.Collections.singleton(Role.CUSTOMER)));
        user.setIsEmailVerified(false);
        User savedUser = userRepository.save(user);

        otpService.generateAndSendOTP(savedUser.getEmail(), OTP.OTPType.EMAIL_VERIFICATION);

        return modelMapper.map(savedUser, UserDTO.class);
    }

    public LoginResponseDTO login(LoginRequestDTO loginRequestDTO) {
        User user = userRepository.findByEmail(loginRequestDTO.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + loginRequestDTO.getEmail()));

        if (user.getIsEmailVerified() != null && !user.getIsEmailVerified()) {
            throw new BadCredentialsException("Please verify your email before logging in.");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequestDTO.getEmail(), loginRequestDTO.getPassword())
        );

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        LoginResponseDTO response = new LoginResponseDTO(accessToken);
        response.setRefreshToken(refreshToken);
        response.setId(user.getId());
        return response;
    }

    public String refreshToken(String refreshToken) {
        Long userId = jwtService.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return jwtService.generateAccessToken(user);
    }

    @Transactional
    public void verifyEmailOTP(OTPVerificationDTO verificationDTO) {
        otpService.verifyOTP(verificationDTO);
        User user = userRepository.findByEmail(verificationDTO.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        user.setIsEmailVerified(true);
        userRepository.save(user);
    }

    @Transactional
    public void verifyPasswordResetOTP(OTPVerificationDTO verificationDTO) {
        otpService.verifyPasswordResetOTP(verificationDTO);
    }
}
