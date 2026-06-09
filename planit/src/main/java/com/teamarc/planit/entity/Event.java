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
@Table(name = "events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organizer_id", nullable = false)
    private User organizer;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(length = 100)
    private String eventType;

    @Column(nullable = false)
    private LocalDate eventDate;

    private LocalTime eventStartTime;

    private LocalTime eventEndTime;

    @Column(length = 255)
    private String venueName;

    @Column(length = 500)
    private String venueAddress;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(length = 20)
    private String pincode;

    private Integer guestCount;

    @Column(precision = 15, scale = 2)
    private BigDecimal budgetAmount;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private Visibility visibility = Visibility.PRIVATE;

    @Column(columnDefinition = "TEXT")
    private String description;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Relationships
    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EventGuest> guests = new ArrayList<>();

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EventTimeline> timelines = new ArrayList<>();

    @OneToOne(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    private Budget budget;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Task> tasks = new ArrayList<>();

    @OneToMany(mappedBy = "event")
    private List<Booking> bookings = new ArrayList<>();

    @OneToMany(mappedBy = "event")
    private List<Conversation> conversations = new ArrayList<>();
}
