package com.teamarc.planit.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "karma_scores", indexes = {
    @Index(name = "idx_vendor_karma", columnList = "vendor_id", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class KarmaScore extends BaseEntity {

    @OneToOne
    @JoinColumn(name = "vendor_id", nullable = false, unique = true, foreignKey = @ForeignKey(name = "fk_karma_vendor"))
    private Vendor vendor;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal overallScore = BigDecimal.ZERO;

    @Column(nullable = false, precision = 3, scale = 2)
    private BigDecimal ratingAverage = BigDecimal.ZERO;

    @Column(nullable = false)
    private Integer totalReviews = 0;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal completionRate = BigDecimal.ZERO;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal responseRate = BigDecimal.ZERO;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal cancellationRate = BigDecimal.ZERO;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal disputeResolutionRate = BigDecimal.ZERO;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @Column(name = "rank_tier")
    private String rankTier = "BRONZE";
}
