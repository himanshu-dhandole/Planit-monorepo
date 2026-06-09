package com.teamarc.planit.entity;

import com.teamarc.planit.entity.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "admins")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Admin extends BaseEntity {

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true, foreignKey = @ForeignKey(name = "fk_admin_user"))
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role = UserRole.ADMIN;

    @Column(nullable = false)
    private String department;

    @Column(nullable = false)
    private Boolean canManageUsers = false;

    @Column(nullable = false)
    private Boolean canManageDisputes = false;

    @Column(nullable = false)
    private Boolean canManagePayments = false;

    @Column(nullable = false)
    private Boolean canVerifyVendors = false;

    @Column(nullable = false)
    private Boolean canSuspendUsers = false;

    @OneToMany(mappedBy = "admin", cascade = CascadeType.ALL)
    private List<AdminLog> logs = new ArrayList<>();

    @OneToMany(mappedBy = "admin", cascade = CascadeType.ALL)
    private List<DisputeResolution> resolutions = new ArrayList<>();

    @Column(name = "last_action_at")
    private LocalDateTime lastActionAt;
}
