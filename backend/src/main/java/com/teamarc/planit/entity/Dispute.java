package com.teamarc.planit.entity;

import com.teamarc.planit.entity.enums.DisputeStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "disputes", indexes = {
        @Index(name = "idx_booking_dispute", columnList = "booking_id"),
        @Index(name = "idx_customer_dispute", columnList = "customer_id"),
        @Index(name = "idx_vendor_dispute", columnList = "vendor_id"),
        @Index(name = "idx_dispute_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Dispute extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false, foreignKey = @ForeignKey(name = "fk_dispute_booking"))
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false, foreignKey = @ForeignKey(name = "fk_dispute_customer"))
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false, foreignKey = @ForeignKey(name = "fk_dispute_vendor"))
    private Vendor vendor;

    @Column(nullable = false, length = 200)
    private String reason;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(length = 500)
    private String evidenceUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DisputeStatus status = DisputeStatus.OPEN;

    @Column(name = "raised_by", nullable = false, length = 50)
    private String raisedBy;

    @Column(name = "raised_at", nullable = false)
    private LocalDateTime raisedAt;

    @OneToOne(mappedBy = "dispute", cascade = CascadeType.ALL, orphanRemoval = true)
    private DisputeResponse response;

    @OneToOne(mappedBy = "dispute", cascade = CascadeType.ALL, orphanRemoval = true)
    private DisputeResolution resolution;

    @Column(name = "is_escalated")
    private Boolean isEscalated = false;

    @Column(name = "escalated_at")
    private LocalDateTime escalatedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
