package com.teamarc.planit.entity;

import com.teamarc.planit.entity.enums.DisputeResolutionType;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "dispute_resolutions", indexes = {
    @Index(name = "idx_dispute_resolution", columnList = "dispute_id", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DisputeResolution extends BaseEntity {

    @OneToOne
    @JoinColumn(name = "dispute_id", nullable = false, unique = true, foreignKey = @ForeignKey(name = "fk_resolution_dispute"))
    private Dispute dispute;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id", nullable = false, foreignKey = @ForeignKey(name = "fk_resolution_admin"))
    private Admin admin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DisputeResolutionType resolutionType;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String resolutionDescription;

    @Column(precision = 12, scale = 2)
    private BigDecimal refundAmount;

    @Column(name = "resolved_at", nullable = false)
    private LocalDateTime resolvedAt;

    @Column(length = 500)
    private String notes;

    @Column(name = "is_appealed")
    private Boolean isAppealed = false;

    @Column(name = "appeal_reason")
    private String appealReason;
}
