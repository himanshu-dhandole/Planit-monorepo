package com.teamarc.planit.controller;

import com.teamarc.planit.dto.LoginRequestDTO;
import com.teamarc.planit.dto.LoginResponseDTO;
import com.teamarc.planit.dto.SignupDTO;
import com.teamarc.planit.dto.UserDTO;
import com.teamarc.planit.dto.request.OTPVerificationDTO;
import com.teamarc.planit.dto.response.OTPResponseDTO;
import com.teamarc.planit.entity.OTP;
import com.teamarc.planit.services.AuthService;
import com.teamarc.planit.services.OTPService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

@RestController
@RequestMapping(path = "/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final OTPService otpService;

    @PostMapping(path = "/signup")
    public ResponseEntity<UserDTO> signUp(@RequestBody SignupDTO signupDto) {
        UserDTO userDto = authService.signUp(signupDto);
        return ResponseEntity.ok(userDto);
    }

    @PostMapping(path = "/login")
    public ResponseEntity<LoginResponseDTO> login(@RequestBody LoginRequestDTO loginRequestDTO, HttpServletResponse response) {

        String[] token= authService.login(loginRequestDTO);

        Cookie cookie = new Cookie("refreshToken", token[1]);
        cookie.setHttpOnly(true);
        cookie.setSecure("production".equals(System.getenv("APP_ENV")));
        response.addCookie(cookie);

        return ResponseEntity.ok(new LoginResponseDTO(token[0]));
    }

    @PostMapping(path = "/refresh")
    public ResponseEntity<LoginResponseDTO> refresh(HttpServletRequest request) {
        String refreshToken = Arrays.stream(request.getCookies())
                .filter(cookie -> "refreshToken".equals(cookie.getName()))
                .findFirst()
                .map(Cookie::getValue)
                .orElseThrow(() -> new AuthenticationServiceException("Refresh token not found inside the Cookies"));

        String accessToken = authService.refreshToken(refreshToken);
        return ResponseEntity.ok(new LoginResponseDTO(accessToken));
    }

    @PostMapping(path = "/verify-email-otp")
    public ResponseEntity<java.util.Map<String, String>> verifyEmailOTP(@RequestBody @Valid OTPVerificationDTO verificationDTO) {
        authService.verifyEmailOTP(verificationDTO);
        return ResponseEntity.ok(java.util.Map.of("message", "Email verified successfully. You can now login."));
    }

    @PostMapping(path = "/resend-otp")
    public ResponseEntity<OTPResponseDTO> resendOTP(@RequestParam @Email String email) {
        return ResponseEntity.ok(otpService.resendOTP(email, OTP.OTPType.EMAIL_VERIFICATION));
    }

    @PostMapping(path = "/request-password-reset")
    public ResponseEntity<OTPResponseDTO> requestPasswordReset(@RequestParam @Email String email) {
        return ResponseEntity.ok(otpService.generateAndSendOTP(email, OTP.OTPType.PASSWORD_RESET));
    }

    @PostMapping(path = "/verify-password-reset-otp")
    public ResponseEntity<java.util.Map<String, String>> verifyPasswordResetOTP(@RequestBody @Valid OTPVerificationDTO verificationDTO) {
        authService.verifyPasswordResetOTP(verificationDTO);
        return ResponseEntity.ok(java.util.Map.of("message", "OTP verified. You can now reset your password."));
    }
}
