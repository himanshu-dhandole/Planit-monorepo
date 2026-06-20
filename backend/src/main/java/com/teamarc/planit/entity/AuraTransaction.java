package com.teamarc.planit.entity;

import com.teamarc.planit.entity.enums.Role;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "aura_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuraTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_role", nullable = false)
    private Role actionRole;

    @Column(nullable = false, columnDefinition = "DECIMAL(5,1)")
    private Double amount;

    @Column(name = "previous_aura", nullable = false, columnDefinition = "DECIMAL(5,1)")
    private Double previousAura;

    @Column(name = "new_aura", nullable = false, columnDefinition = "DECIMAL(5,1)")
    private Double newAura;

    @Column(name = "rule_applied", nullable = false)
    private String ruleApplied;

    @Column(name = "booking_id")
    private Long bookingId;

    @Column(name = "complaint_id")
    private Long complaintId;

    @Column(name = "review_id")
    private Long reviewId;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
