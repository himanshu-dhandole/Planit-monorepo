package com.teamarc.planit.entity;

import com.teamarc.planit.entity.enums.BookingStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "booking_status_changes", indexes = {
        @Index(name = "idx_booking_status_change", columnList = "booking_id"),
        @Index(name = "idx_status_change_date", columnList = "changed_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BookingStatusChange extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false, foreignKey = @ForeignKey(name = "fk_status_change_booking"))
    private Booking booking;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus oldStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus newStatus;

    @Column(nullable = false)
    private LocalDateTime changedAt;

    @Column(nullable = false, length = 50)
    private String changedBy;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(length = 500)
    private String metadata;
}
