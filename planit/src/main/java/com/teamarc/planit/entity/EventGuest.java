package com.teamarc.planit.entity;

import com.teamarc.planit.entity.enums.*;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Entity
@Table(name = "event_guests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventGuest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false, length = 255)
    private String guestName;

    @Column(length = 255)
    private String guestEmail;

    @Column(length = 20)
    private String guestPhone;

    @Column(columnDefinition = "TEXT")
    private String dietaryPreferences;

    private Boolean isAttending;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private InvitationStatus invitationStatus = InvitationStatus.PENDING;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
