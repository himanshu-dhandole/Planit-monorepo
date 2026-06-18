package com.teamarc.planit.services;

import com.teamarc.planit.configs.RabbitMQConfig;
import com.teamarc.planit.dto.request.DisputeManagementRequestDTO;
import com.teamarc.planit.dto.request.DisputeResolutionRequestDTO;
import com.teamarc.planit.dto.response.DisputeManagementResponseDTO;
import com.teamarc.planit.dto.response.NotificationPayload;
import com.teamarc.planit.entity.Booking;
import com.teamarc.planit.entity.DisputeManagement;
import com.teamarc.planit.entity.DisputeManagement.DisputeStatus;
import com.teamarc.planit.entity.User;
import com.teamarc.planit.entity.enums.BookingStatus;
import com.teamarc.planit.entity.enums.Role;
import com.teamarc.planit.events.DisputeNotificationEvent;
import com.teamarc.planit.exceptions.ResourceNotFoundException;
import com.teamarc.planit.exceptions.RuntimeConflictException;
import com.teamarc.planit.mapper.BookingMapper;
import com.teamarc.planit.repository.BookingRepository;
import com.teamarc.planit.repository.DisputeManagementRepository;
import com.teamarc.planit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DisputeService {

    private final DisputeManagementRepository disputeRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final BookingMapper bookingMapper;
    private final RabbitTemplate rabbitTemplate;

    @Transactional
    public DisputeManagementResponseDTO raiseDispute(DisputeManagementRequestDTO dto) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        
        Booking booking = bookingRepository.findById(dto.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + dto.getBookingId()));

        if (booking.getStatus() != BookingStatus.CONFIRMED && booking.getStatus() != BookingStatus.COMPLETED) {
            throw new RuntimeConflictException("Disputes can only be raised for confirmed or completed bookings");
        }

        if (disputeRepository.existsByBooking_Id(dto.getBookingId())) {
            throw new RuntimeConflictException("A dispute already exists for this booking");
        }

        User raisedByUser = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUser.getId()));

        User againstUser = null;
        if (booking.getCustomer().getUser().getId() == currentUser.getId()) {
            againstUser = booking.getServices().getVendor().getUser();
        } else if (booking.getServices().getVendor().getUser().getId() == currentUser.getId()) {
            againstUser = booking.getCustomer().getUser();
        } else {
            throw new AccessDeniedException("You are not a party to this booking");
        }

        DisputeManagement dispute = new DisputeManagement();
        dispute.setBooking(booking);
        dispute.setRaisedByUser(raisedByUser);
        dispute.setAgainstUser(againstUser);
        dispute.setReason(dto.getReason());
        dispute.setStatus(DisputeStatus.OPEN);
        dispute.setType(dto.getType());

        DisputeManagement savedDispute = disputeRepository.save(dispute);

        // 1. Publish DisputeNotificationEvent for emails
        DisputeNotificationEvent raisedEmailEvent = DisputeNotificationEvent.builder()
                .disputeId(savedDispute.getId())
                .recipientEmail(raisedByUser.getEmail())
                .recipientName(raisedByUser.getName())
                .eventType("RAISED_CONFIRMATION")
                .reason(dto.getReason())
                .resolutionNote(null)
                .newStatus("OPEN")
                .bookingId(booking.getId())
                .build();

        DisputeNotificationEvent againstEmailEvent = DisputeNotificationEvent.builder()
                .disputeId(savedDispute.getId())
                .recipientEmail(againstUser.getEmail())
                .recipientName(againstUser.getName())
                .eventType("RAISED")
                .reason(dto.getReason())
                .resolutionNote(null)
                .newStatus("OPEN")
                .bookingId(booking.getId())
                .build();

        rabbitTemplate.convertAndSend(RabbitMQConfig.NOTIFICATION_EXCHANGE, RabbitMQConfig.DISPUTE_NOTIFICATION_ROUTING_KEY, raisedEmailEvent);
        rabbitTemplate.convertAndSend(RabbitMQConfig.NOTIFICATION_EXCHANGE, RabbitMQConfig.DISPUTE_NOTIFICATION_ROUTING_KEY, againstEmailEvent);

        // 2. Publish NotificationPayload for WebSockets
        NotificationPayload againstPayload = NotificationPayload.builder()
                .type("DISPUTE_RAISED")
                .title("A Dispute Has Been Raised Against You")
                .message("A dispute has been filed for Booking #" + booking.getId() + ". Reason: " + dto.getReason())
                .disputeId(savedDispute.getId())
                .bookingId(booking.getId())
                .status("OPEN")
                .recipientUserId(againstUser.getId())
                .timestamp(LocalDateTime.now())
                .build();
        rabbitTemplate.convertAndSend(RabbitMQConfig.NOTIFICATION_EXCHANGE, RabbitMQConfig.DISPUTE_WS_ROUTING_KEY, againstPayload);

        NotificationPayload raisedPayload = NotificationPayload.builder()
                .type("DISPUTE_RAISED_CONFIRMATION")
                .title("Your Dispute Has Been Submitted")
                .message("Your dispute for Booking #" + booking.getId() + " has been submitted and is under review.")
                .disputeId(savedDispute.getId())
                .bookingId(booking.getId())
                .status("OPEN")
                .recipientUserId(raisedByUser.getId())
                .timestamp(LocalDateTime.now())
                .build();
        rabbitTemplate.convertAndSend(RabbitMQConfig.NOTIFICATION_EXCHANGE, RabbitMQConfig.DISPUTE_WS_ROUTING_KEY, raisedPayload);

        return bookingMapper.toDisputeResponse(savedDispute);
    }

    @Transactional(readOnly = true)
    public DisputeManagementResponseDTO getDisputeById(Long disputeId) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        DisputeManagement dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispute not found with id: " + disputeId));

        validateUserAccess(dispute, currentUser);

        return bookingMapper.toDisputeResponse(dispute);
    }

    @Transactional(readOnly = true)
    public DisputeManagementResponseDTO getDisputeByBookingId(Long bookingId) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        DisputeManagement dispute = disputeRepository.findByBooking_Id(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispute not found for booking id: " + bookingId));

        validateUserAccess(dispute, currentUser);

        return bookingMapper.toDisputeResponse(dispute);
    }

    @Transactional(readOnly = true)
    public List<DisputeManagementResponseDTO> getMyDisputes() {
        try {
            org.springframework.security.core.Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null) {
                throw new AccessDeniedException("No authentication token found in security context");
            }
            Object principal = authentication.getPrincipal();
            if (principal == null || principal.equals("anonymousUser")) {
                throw new AccessDeniedException("User is not authenticated");
            }
            if (!(principal instanceof User)) {
                throw new AccessDeniedException("Principal in security context is not of type User. Actual class: " + principal.getClass().getName());
            }
            User currentUser = (User) principal;

            List<DisputeManagement> raisedDisputes = disputeRepository.findByRaisedByUser_Id(currentUser.getId());
            List<DisputeManagement> againstDisputes = disputeRepository.findByAgainstUser_Id(currentUser.getId());

            List<DisputeManagement> mergedList = new ArrayList<>();
            mergedList.addAll(raisedDisputes);
            mergedList.addAll(againstDisputes);

            return mergedList.stream()
                    .distinct()
                    .sorted((d1, d2) -> {
                        LocalDateTime c1 = d1.getCreatedAt();
                        LocalDateTime c2 = d2.getCreatedAt();
                        if (c1 == null && c2 == null) return 0;
                        if (c1 == null) return 1; // Nulls go to the end
                        if (c2 == null) return -1;
                        return c2.compareTo(c1); // Descending order
                    })
                    .map(bookingMapper::toDisputeResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            try {
                java.io.PrintWriter pw = new java.io.PrintWriter(new java.io.FileWriter("dispute_error.log", true));
                pw.println("--- ERROR IN getMyDisputes (" + LocalDateTime.now() + ") ---");
                e.printStackTrace(pw);
                pw.close();
            } catch (Exception ex) {
                // ignore
            }
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public Page<DisputeManagementResponseDTO> getAllDisputes(DisputeStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<DisputeManagement> disputePage;
        if (status == null) {
            disputePage = disputeRepository.findAll(pageable);
        } else {
            disputePage = disputeRepository.findByStatus(status, pageable);
        }
        return disputePage.map(bookingMapper::toDisputeResponse);
    }

    @Transactional
    public DisputeManagementResponseDTO updateDisputeStatus(Long disputeId, DisputeResolutionRequestDTO dto) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        
        DisputeManagement dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispute not found with id: " + disputeId));

        if (dispute.getStatus() == DisputeStatus.CLOSED) {
            throw new RuntimeConflictException("Closed disputes cannot be modified");
        }

        dispute.setStatus(dto.getNewStatus());

        User adminUser = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found"));

        boolean isResolvedOrClosed = dto.getNewStatus() == DisputeStatus.RESOLVED || dto.getNewStatus() == DisputeStatus.CLOSED;
        if (isResolvedOrClosed) {
            dispute.setResolutionNote(dto.getResolutionNote());
            dispute.setResolvedAt(LocalDateTime.now());
            dispute.setResolvedBy(adminUser);
        }

        DisputeManagement savedDispute = disputeRepository.save(dispute);

        // Notify both parties
        User raisedByUser = savedDispute.getRaisedByUser();
        User againstUser = savedDispute.getAgainstUser();

        // 1. Email publishes
        DisputeNotificationEvent raisedEmailEvent = DisputeNotificationEvent.builder()
                .disputeId(savedDispute.getId())
                .recipientEmail(raisedByUser.getEmail())
                .recipientName(raisedByUser.getName())
                .eventType("STATUS_UPDATED")
                .reason(savedDispute.getReason())
                .resolutionNote(savedDispute.getResolutionNote())
                .newStatus(dto.getNewStatus().name())
                .bookingId(savedDispute.getBooking().getId())
                .build();

        DisputeNotificationEvent againstEmailEvent = DisputeNotificationEvent.builder()
                .disputeId(savedDispute.getId())
                .recipientEmail(againstUser.getEmail())
                .recipientName(againstUser.getName())
                .eventType("STATUS_UPDATED")
                .reason(savedDispute.getReason())
                .resolutionNote(savedDispute.getResolutionNote())
                .newStatus(dto.getNewStatus().name())
                .bookingId(savedDispute.getBooking().getId())
                .build();

        rabbitTemplate.convertAndSend(RabbitMQConfig.NOTIFICATION_EXCHANGE, RabbitMQConfig.DISPUTE_NOTIFICATION_ROUTING_KEY, raisedEmailEvent);
        rabbitTemplate.convertAndSend(RabbitMQConfig.NOTIFICATION_EXCHANGE, RabbitMQConfig.DISPUTE_NOTIFICATION_ROUTING_KEY, againstEmailEvent);

        // 2. WebSocket publishes
        NotificationPayload raisedPayload = NotificationPayload.builder()
                .type(isResolvedOrClosed ? "DISPUTE_RESOLVED" : "DISPUTE_STATUS_UPDATED")
                .title(isResolvedOrClosed ? "Dispute Resolved" : "Dispute Status Updated")
                .message("The dispute for booking #" + savedDispute.getBooking().getId() + " status has been updated to: " + dto.getNewStatus())
                .disputeId(savedDispute.getId())
                .bookingId(savedDispute.getBooking().getId())
                .status(dto.getNewStatus().name())
                .recipientUserId(raisedByUser.getId())
                .timestamp(LocalDateTime.now())
                .build();

        NotificationPayload againstPayload = NotificationPayload.builder()
                .type(isResolvedOrClosed ? "DISPUTE_RESOLVED" : "DISPUTE_STATUS_UPDATED")
                .title(isResolvedOrClosed ? "Dispute Resolved" : "Dispute Status Updated")
                .message("The dispute for booking #" + savedDispute.getBooking().getId() + " status has been updated to: " + dto.getNewStatus())
                .disputeId(savedDispute.getId())
                .bookingId(savedDispute.getBooking().getId())
                .status(dto.getNewStatus().name())
                .recipientUserId(againstUser.getId())
                .timestamp(LocalDateTime.now())
                .build();

        rabbitTemplate.convertAndSend(RabbitMQConfig.NOTIFICATION_EXCHANGE, RabbitMQConfig.DISPUTE_WS_ROUTING_KEY, raisedPayload);
        rabbitTemplate.convertAndSend(RabbitMQConfig.NOTIFICATION_EXCHANGE, RabbitMQConfig.DISPUTE_WS_ROUTING_KEY, againstPayload);

        return bookingMapper.toDisputeResponse(savedDispute);
    }

    private void validateUserAccess(DisputeManagement dispute, User currentUser) {
        boolean isRaisedByMe = dispute.getRaisedByUser().getId() == currentUser.getId();
        boolean isAgainstMe = dispute.getAgainstUser().getId() == currentUser.getId();
        boolean isAdmin = currentUser.getRole().contains(Role.ADMIN);

        if (!isRaisedByMe && !isAgainstMe && !isAdmin) {
            throw new AccessDeniedException("You do not have access to view this dispute");
        }
    }
}
