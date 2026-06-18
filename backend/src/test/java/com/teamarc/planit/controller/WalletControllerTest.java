package com.teamarc.planit.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.teamarc.planit.advices.GlobalExceptionHandler;
import com.teamarc.planit.advices.GlobalResponseHandler;
import com.teamarc.planit.dto.WalletDto;
import com.teamarc.planit.dto.request.WalletDepositRequestDTO;
import com.teamarc.planit.dto.request.WalletDepositVerificationDTO;
import com.teamarc.planit.dto.request.WalletWithdrawRequestDTO;
import com.teamarc.planit.dto.response.RazorpayOrderResponseDTO;
import com.teamarc.planit.entity.User;
import com.teamarc.planit.entity.Wallet;
import com.teamarc.planit.services.WalletService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.ArrayList;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class WalletControllerTest {

    private MockMvc mockMvc;

    @Mock
    private WalletService walletService;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private WalletController walletController;

    private User user;
    private Wallet wallet;
    private WalletDto walletDto;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();

        mockMvc = MockMvcBuilders.standaloneSetup(walletController)
                .setControllerAdvice(new GlobalExceptionHandler(), new GlobalResponseHandler())
                .build();

        user = new User();
        user.setId(1L);
        user.setName("Test User");
        user.setEmail("test@example.com");

        wallet = new Wallet();
        wallet.setId(10L);
        wallet.setUser(user);
        wallet.setBalance(100.0);
        wallet.setTransactions(new ArrayList<>());

        walletDto = new WalletDto();
        walletDto.setId(10L);
        walletDto.setBalance(100.0);
        walletDto.setTransactions(new ArrayList<>());

        // Mock Security Context
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(user);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void getMyWallet_success() throws Exception {
        when(walletService.findByUser(any(User.class))).thenReturn(wallet);
        when(modelMapper.map(any(Wallet.class), eq(WalletDto.class))).thenReturn(walletDto);

        mockMvc.perform(get("/api/wallet"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(10))
                .andExpect(jsonPath("$.data.balance").value(100.0));

        verify(walletService, times(1)).findByUser(any(User.class));
    }

    @Test
    void createDepositOrder_success() throws Exception {
        WalletDepositRequestDTO requestDTO = new WalletDepositRequestDTO(BigDecimal.valueOf(100.0));
        RazorpayOrderResponseDTO orderResponse = RazorpayOrderResponseDTO.builder()
                .id("rzp_order_123")
                .amount(10000L)
                .currency("INR")
                .keyId("mock_key")
                .build();

        when(walletService.createDepositOrder(any(User.class), eq(100.0))).thenReturn(orderResponse);

        mockMvc.perform(post("/api/wallet/deposit/order")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value("rzp_order_123"))
                .andExpect(jsonPath("$.data.amount").value(10000));

        verify(walletService, times(1)).createDepositOrder(any(User.class), eq(100.0));
    }

    @Test
    void verifyAndDeposit_success() throws Exception {
        WalletDepositVerificationDTO verificationDTO = new WalletDepositVerificationDTO();
        verificationDTO.setRazorpayOrderId("rzp_order_123");
        verificationDTO.setRazorpayPaymentId("rzp_pay_456");
        verificationDTO.setRazorpaySignature("rzp_sig_789");
        verificationDTO.setAmount(BigDecimal.valueOf(100.0));

        wallet.setBalance(200.0);
        walletDto.setBalance(200.0);

        when(walletService.verifyAndDepositWallet(any(User.class), any(WalletDepositVerificationDTO.class)))
                .thenReturn(wallet);
        when(modelMapper.map(any(Wallet.class), eq(WalletDto.class))).thenReturn(walletDto);

        mockMvc.perform(post("/api/wallet/deposit/verify")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(verificationDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.balance").value(200.0));

        verify(walletService, times(1)).verifyAndDepositWallet(any(User.class), any(WalletDepositVerificationDTO.class));
    }

    @Test
    void withdraw_success() throws Exception {
        WalletWithdrawRequestDTO requestDTO = new WalletWithdrawRequestDTO(BigDecimal.valueOf(50.0));

        wallet.setBalance(50.0);
        walletDto.setBalance(50.0);

        when(walletService.withdrawMoneyFromWallet(any(User.class), eq(50.0))).thenReturn(wallet);
        when(modelMapper.map(any(Wallet.class), eq(WalletDto.class))).thenReturn(walletDto);

        mockMvc.perform(post("/api/wallet/withdraw")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.balance").value(50.0));

        verify(walletService, times(1)).withdrawMoneyFromWallet(any(User.class), eq(50.0));
    }
}
