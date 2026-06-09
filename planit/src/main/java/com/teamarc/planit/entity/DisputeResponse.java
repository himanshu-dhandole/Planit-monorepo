package com.teamarc.planit.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "dispute_responses", indexes = {
    @Index(name = "idx_dispute_response", columnList = "dispute_id", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DisputeResponse extends BaseEntity {

    @OneToOne
    @JoinColumn(name = "dispute_id", nullable = false, unique = true, foreignKey = @ForeignKey(name = "fk_response_dispute"))
    private Dispute dispute;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String responseText;

    @Column(name = "responded_by", nullable = false)
    private String respondedBy;

    @Column(name = "responded_at", nullable = false)
    private LocalDateTime respondedAt;

    @Column(length = 500)
    private String evidenceUrl;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
