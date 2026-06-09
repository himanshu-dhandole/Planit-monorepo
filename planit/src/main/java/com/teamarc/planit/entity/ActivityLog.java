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
@Table(name = "activity_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLog {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 100)
    private ActionType actionType;

    @Column(length = 100)
    private String entityType;

    private UUID entityId;

    @Column(columnDefinition = "jsonb")
    private String oldValues;

    @Column(columnDefinition = "jsonb")
    private String newValues;

    @Column(length = 45)
    private String ipAddress;

    @Column(columnDefinition = "TEXT")
    private String userAgent;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
