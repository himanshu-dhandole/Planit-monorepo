package com.teamarc.planit.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "event_guests", indexes = {
    @Index(name = "idx_event_guest", columnList = "event_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventGuest extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false, foreignKey = @ForeignKey(name = "fk_guest_event"))
    private Event event;

    @Column(nullable = false, length = 150)
    private String guestName;

    @Column(nullable = false, length = 100)
    private String guestEmail;

    @Column(length = 20)
    private String guestPhone;

    @Column(length = 100)
    private String dietaryPreferences;

    @Column(nullable = false)
    private Boolean confirmationStatus = false;

    @Column(name = "rsvp_date")
    private LocalDate rsvpDate;
}
