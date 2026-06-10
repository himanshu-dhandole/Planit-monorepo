package com.teamarc.planit.entity;

import com.teamarc.planit.entity.enums.AdminActionType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "admin_logs", indexes = {
        @Index(name = "idx_admin_log", columnList = "admin_id"),
        @Index(name = "idx_admin_action", columnList = "action"),
        @Index(name = "idx_admin_action_at", columnList = "action_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdminLog extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id", nullable = false, foreignKey = @ForeignKey(name = "fk_log_admin"))
    private AppAdmin appAdmin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AdminActionType action;

    @Column(nullable = false, length = 100)
    private String targetEntity;

    @Column(nullable = false)
    private UUID targetId;

    @Column(columnDefinition = "TEXT")
    private String changes;

    @Column(nullable = false)
    private LocalDateTime actionAt;

    @Column(length = 500)
    private String ipAddress;

    @Column(columnDefinition = "TEXT")
    private String reason;
}
