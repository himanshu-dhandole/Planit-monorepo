package com.teamarc.planit.services;

import com.teamarc.planit.dto.request.ComplaintRequestDTO;
import com.teamarc.planit.dto.response.ComplaintResponseDTO;
import com.teamarc.planit.entity.Booking;
import com.teamarc.planit.entity.Complaint;
import com.teamarc.planit.entity.User;
import com.teamarc.planit.entity.enums.Role;
import com.teamarc.planit.entity.enums.ComplaintBlame;
import com.teamarc.planit.exceptions.ResourceNotFoundException;
import com.teamarc.planit.exceptions.RuntimeConflictException;
import com.teamarc.planit.mapper.BookingMapper;
import com.teamarc.planit.repository.BookingRepository;
import com.teamarc.planit.repository.ComplaintRepository;
import com.teamarc.planit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final KarmaService karmaService;
    private final BookingMapper bookingMapper;

    @Transactional
    public ComplaintResponseDTO raiseComplaint(ComplaintRequestDTO dto) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        Booking booking = bookingRepository.findById(dto.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + dto.getBookingId()));

        // Validate that current user is party to this booking
        boolean isCustomer = booking.getCustomer().getUser().getId() == currentUser.getId();
        boolean isVendor = booking.getServices().getVendor().getUser().getId() == currentUser.getId();

        if (!isCustomer && !isVendor) {
            throw new AccessDeniedException("You are not a party to this booking and cannot file a complaint.");
        }

        // Create complaint entity
        Complaint complaint = bookingMapper.toEntity(dto);
        complaint.setStatus(Complaint.ComplaintStatus.OPEN);
        complaint.setRaisedByUser(currentUser);

        User againstUser;
        if (isCustomer) {
            againstUser = booking.getServices().getVendor().getUser();
        } else {
            againstUser = booking.getCustomer().getUser();
        }
        complaint.setAgainstUser(againstUser);
        complaint.setRaisedAt(LocalDateTime.now());
        complaint.setUpdatedAt(LocalDateTime.now());

        Complaint saved = complaintRepository.save(complaint);
        return bookingMapper.toComplaintResponse(saved);
    }

    @Transactional
    public ComplaintResponseDTO resolveComplaint(Long complaintId, ComplaintBlame blame) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with ID: " + complaintId));

        if (complaint.getStatus() != Complaint.ComplaintStatus.OPEN) {
            throw new RuntimeConflictException("Only open complaints can be resolved.");
        }

        complaint.setStatus(Complaint.ComplaintStatus.RESOLVED);
        complaint.setBlame(blame.name());
        complaint.setUpdatedAt(LocalDateTime.now());

        Complaint saved = complaintRepository.save(complaint);

        // Apply karma rules based on blame
        if (blame == ComplaintBlame.VENDOR_FAULT) {
            // Find vendor user (which is againstUser if raised by customer, or raisedByUser if raised by vendor)
            User vendorUser = getVendorUserForComplaint(complaint);
            karmaService.applyKarmaChange(
                    vendorUser.getId(),
                    Role.VENDOR,
                    -1.00,
                    "COMPLAINT_RESOLVED_VENDOR_FAULT",
                    complaint.getBooking().getId(),
                    saved.getId(),
                    null,
                    "Complaint resolved blaming the Vendor."
            );
        } else if (blame == ComplaintBlame.CUSTOMER_FAULT) {
            User customerUser = getCustomerUserForComplaint(complaint);
            karmaService.applyKarmaChange(
                    customerUser.getId(),
                    Role.CUSTOMER,
                    -1.00,
                    "COMPLAINT_RESOLVED_CUSTOMER_FAULT",
                    complaint.getBooking().getId(),
                    saved.getId(),
                    null,
                    "Complaint resolved blaming the Customer."
            );
        }

        return bookingMapper.toComplaintResponse(saved);
    }

    @Transactional
    public ComplaintResponseDTO dismissComplaint(Long complaintId, boolean malicious) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with ID: " + complaintId));

        if (complaint.getStatus() != Complaint.ComplaintStatus.OPEN) {
            throw new RuntimeConflictException("Only open complaints can be dismissed.");
        }

        complaint.setStatus(Complaint.ComplaintStatus.DISMISSED);
        complaint.setBlame("DISMISSED" + (malicious ? "_MALICIOUS" : ""));
        complaint.setUpdatedAt(LocalDateTime.now());

        Complaint saved = complaintRepository.save(complaint);

        // If dismiss is malicious, penalize customer who raised it
        if (malicious) {
            User raisedByUser = complaint.getRaisedByUser();
            karmaService.applyKarmaChange(
                    raisedByUser.getId(),
                    Role.CUSTOMER,
                    -0.50,
                    "COMPLAINT_DISMISSED_MALICIOUS",
                    complaint.getBooking().getId(),
                    saved.getId(),
                    null,
                    "Complaint dismissed as a false/malicious accusation."
            );
        }

        return bookingMapper.toComplaintResponse(saved);
    }

    public List<ComplaintResponseDTO> getAllComplaints() {
        return complaintRepository.findAll().stream()
                .map(bookingMapper::toComplaintResponse)
                .toList();
    }

    public List<ComplaintResponseDTO> getMyComplaints() {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        List<Complaint> raised = complaintRepository.findByRaisedByUser_Id(currentUser.getId());
        List<Complaint> against = complaintRepository.findByAgainstUser_Id(currentUser.getId());

        List<Complaint> all = new ArrayList<>();
        all.addAll(raised);
        all.addAll(against);

        return all.stream()
                .distinct()
                .map(bookingMapper::toComplaintResponse)
                .toList();
    }

    private User getVendorUserForComplaint(Complaint complaint) {
        Booking booking = complaint.getBooking();
        return booking.getServices().getVendor().getUser();
    }

    private User getCustomerUserForComplaint(Complaint complaint) {
        Booking booking = complaint.getBooking();
        return booking.getCustomer().getUser();
    }
}
