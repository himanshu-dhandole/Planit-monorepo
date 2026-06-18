package com.teamarc.planit.services;

import com.razorpay.Order;
import com.razorpay.OrderClient;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.teamarc.planit.dto.request.WalletDepositVerificationDTO;
import com.teamarc.planit.dto.response.RazorpayOrderResponseDTO;
import com.teamarc.planit.entity.Booking;
import com.teamarc.planit.entity.User;
import com.teamarc.planit.entity.Wallet;
import com.teamarc.planit.entity.WalletTransaction;
import com.teamarc.planit.entity.enums.TransactionMethod;
import com.teamarc.planit.entity.enums.TransactionType;
import com.teamarc.planit.exceptions.ResourceNotFoundException;
import com.teamarc.planit.repository.WalletRepository;
import org.json.JSONObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WalletServiceTest {

    @Mock
    private WalletRepository walletRepository;

    @Mock
    private ModelMapper modelMapper;

    @Mock
    private WalletTransactionService walletTransactionService;

    @Mock
    private RazorpayClient razorpayClient;

    @Mock
    private OrderClient orderClient;

    @InjectMocks
    private WalletService walletService;

    private User user;
    private Wallet wallet;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(walletService, "keyId", "mock_key_id");
        ReflectionTestUtils.setField(walletService, "keySecret", "mock_key_secret");

        // Set the mock OrderClient field on the mock RazorpayClient
        ReflectionTestUtils.setField(razorpayClient, "orders", orderClient);

        user = new User();
        user.setId(1L);
        user.setName("Test User");
        user.setEmail("test@example.com");

        wallet = new Wallet();
        wallet.setId(10L);
        wallet.setUser(user);
        wallet.setBalance(100.0);
        wallet.setTransactions(new ArrayList<>());
    }

    @Test
    void findByUser_success() {
        when(walletRepository.findByUser(user)).thenReturn(Optional.of(wallet));

        Wallet result = walletService.findByUser(user);

        assertNotNull(result);
        assertEquals(wallet.getId(), result.getId());
        assertEquals(user, result.getUser());
        verify(walletRepository, times(1)).findByUser(user);
    }

    @Test
    void findByUser_notFound() {
        when(walletRepository.findByUser(user)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> walletService.findByUser(user));
        verify(walletRepository, times(1)).findByUser(user);
    }

    @Test
    void createNewWallet_success() {
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Wallet result = walletService.createNewWallet(user);

        assertNotNull(result);
        assertEquals(user, result.getUser());
        assertEquals(0.0, result.getBalance());
        verify(walletRepository, times(1)).save(any(Wallet.class));
    }

    @Test
    void findWalletById_success() {
        when(walletRepository.findById(10L)).thenReturn(Optional.of(wallet));

        Wallet result = walletService.findWalletById(10L);

        assertNotNull(result);
        assertEquals(10L, result.getId());
        verify(walletRepository, times(1)).findById(10L);
    }

    @Test
    void findWalletById_notFound() {
        when(walletRepository.findById(10L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> walletService.findWalletById(10L));
    }

    @Test
    void addMoneyToWallet_success() {
        when(walletRepository.findByUser(user)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Wallet result = walletService.addMoneyToWallet(user, 50.0, "TX_123", null, TransactionMethod.BANKING);

        assertNotNull(result);
        assertEquals(150.0, result.getBalance());
        verify(walletTransactionService, times(1)).createNewWalletTransaction(any(WalletTransaction.class));
        verify(walletRepository, times(1)).save(wallet);
    }

    @Test
    void addMoney_success() {
        when(walletRepository.findByUser(user)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        walletService.addMoney(user, BigDecimal.valueOf(75.50), "TX_456", null);

        assertEquals(175.50, wallet.getBalance());
        assertEquals(1, wallet.getTransactions().size());
        assertEquals("TX_456", wallet.getTransactions().get(0).getTransactionId());
        verify(walletTransactionService, times(1)).createNewWalletTransaction(any(WalletTransaction.class));
        verify(walletRepository, times(1)).save(wallet);
    }

    @Test
    void deductMoney_success() {
        when(walletRepository.findByUser(user)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Wallet result = walletService.deductMoney(user, BigDecimal.valueOf(40.0), "TX_789", null);

        assertNotNull(result);
        assertEquals(60.0, result.getBalance());
        assertEquals(1, result.getTransactions().size());
        verify(walletTransactionService, times(1)).createNewWalletTransaction(any(WalletTransaction.class));
        verify(walletRepository, times(1)).save(wallet);
    }

    @Test
    void deductMoney_insufficientBalance() {
        when(walletRepository.findByUser(user)).thenReturn(Optional.of(wallet));

        assertThrows(IllegalArgumentException.class, () -> 
                walletService.deductMoney(user, BigDecimal.valueOf(150.0), "TX_ERR", null)
        );
        verify(walletRepository, never()).save(any(Wallet.class));
    }

    @Test
    void deductMoneyFromWallet_success() {
        when(walletRepository.findByUser(user)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Wallet result = walletService.deductMoneyFromWallet(user, 30.0, "TX_999", null, TransactionMethod.BANKING);

        assertNotNull(result);
        assertEquals(70.0, result.getBalance());
        verify(walletTransactionService, times(1)).createNewWalletTransaction(any(WalletTransaction.class));
        verify(walletRepository, times(1)).save(wallet);
    }

    @Test
    void deductMoneyFromWallet_insufficientBalance() {
        when(walletRepository.findByUser(user)).thenReturn(Optional.of(wallet));

        assertThrows(IllegalArgumentException.class, () -> 
                walletService.deductMoneyFromWallet(user, 200.0, "TX_ERR", null, TransactionMethod.BANKING)
        );
        verify(walletRepository, never()).save(any(Wallet.class));
    }

    @Test
    void withdrawMoneyFromWallet_success() {
        when(walletRepository.findByUser(user)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Wallet result = walletService.withdrawMoneyFromWallet(user, 50.0);

        assertNotNull(result);
        assertEquals(50.0, result.getBalance());
        verify(walletTransactionService, times(1)).createNewWalletTransaction(any(WalletTransaction.class));
        verify(walletRepository, times(1)).save(wallet);
    }

    @Test
    void createDepositOrder_success() throws RazorpayException {
        Order razorpayOrder = mock(Order.class);
        when(razorpayOrder.get("id")).thenReturn("rzp_order_123");
        when(orderClient.create(any(JSONObject.class))).thenReturn(razorpayOrder);

        RazorpayOrderResponseDTO response = walletService.createDepositOrder(user, 100.0);

        assertNotNull(response);
        assertEquals("rzp_order_123", response.getId());
        assertEquals(10000L, response.getAmount()); // 100 * 100 paise
        assertEquals("INR", response.getCurrency());
        assertEquals("mock_key_id", response.getKeyId());
    }

    @Test
    void createDepositOrder_failure() throws RazorpayException {
        when(orderClient.create(any(JSONObject.class))).thenThrow(new RazorpayException("Razorpay failure"));

        assertThrows(RuntimeException.class, () -> walletService.createDepositOrder(user, 100.0));
    }

    @Test
    void verifyAndDepositWallet_success() throws RazorpayException {
        WalletDepositVerificationDTO dto = new WalletDepositVerificationDTO();
        dto.setRazorpayOrderId("rzp_order_123");
        dto.setRazorpayPaymentId("rzp_pay_456");
        dto.setRazorpaySignature("rzp_sig_789");
        dto.setAmount(BigDecimal.valueOf(100.0));

        when(walletRepository.findByUser(user)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        try (MockedStatic<com.razorpay.Utils> utilities = mockStatic(com.razorpay.Utils.class)) {
            utilities.when(() -> com.razorpay.Utils.verifyPaymentSignature(any(JSONObject.class), anyString()))
                     .thenReturn(true);

            Wallet result = walletService.verifyAndDepositWallet(user, dto);

            assertNotNull(result);
            assertEquals(200.0, result.getBalance());
            verify(walletRepository, times(1)).save(wallet);
        }
    }

    @Test
    void verifyAndDepositWallet_invalidSignature() {
        WalletDepositVerificationDTO dto = new WalletDepositVerificationDTO();
        dto.setRazorpayOrderId("rzp_order_123");
        dto.setRazorpayPaymentId("rzp_pay_456");
        dto.setRazorpaySignature("rzp_sig_invalid");
        dto.setAmount(BigDecimal.valueOf(100.0));

        try (MockedStatic<com.razorpay.Utils> utilities = mockStatic(com.razorpay.Utils.class)) {
            utilities.when(() -> com.razorpay.Utils.verifyPaymentSignature(any(JSONObject.class), anyString()))
                     .thenReturn(false);

            assertThrows(IllegalArgumentException.class, () -> walletService.verifyAndDepositWallet(user, dto));
            verify(walletRepository, never()).save(any(Wallet.class));
        }
    }
}
