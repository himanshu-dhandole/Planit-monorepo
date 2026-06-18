package com.teamarc.planit.services;

import com.teamarc.planit.dto.response.DisputeManagementResponseDTO;
import com.teamarc.planit.entity.DisputeManagement;
import com.teamarc.planit.entity.User;
import com.teamarc.planit.mapper.BookingMapper;
import com.teamarc.planit.repository.BookingRepository;
import com.teamarc.planit.repository.DisputeManagementRepository;
import com.teamarc.planit.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DisputeServiceTest {

    @Mock
    private DisputeManagementRepository disputeRepository;
    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private UserRepository userRepository;
    @org.mockito.Spy
    private BookingMapper bookingMapper = new com.teamarc.planit.mapper.BookingMapperImpl();
    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private DisputeService disputeService;

    @Test
    void testGetMyDisputes() {
        User mockUser = new User();
        mockUser.setId(1L);

        SecurityContext securityContext = Mockito.mock(SecurityContext.class);
        Authentication authentication = Mockito.mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(mockUser);
        SecurityContextHolder.setContext(securityContext);

        DisputeManagement dispute = new DisputeManagement();
        dispute.setId(10L);
        dispute.setCreatedAt(LocalDateTime.now());
        
        // Let's test with empty fields to verify null-safety
        dispute.setBooking(null);
        dispute.setRaisedByUser(null);
        dispute.setAgainstUser(null);
        dispute.setResolvedBy(null);

        List<DisputeManagement> raised = new ArrayList<>();
        raised.add(dispute);
        
        when(disputeRepository.findByRaisedByUser_Id(1L)).thenReturn(raised);
        when(disputeRepository.findByAgainstUser_Id(1L)).thenReturn(new ArrayList<>());

        List<DisputeManagementResponseDTO> result = disputeService.getMyDisputes();
        assertNotNull(result);
    }
}
