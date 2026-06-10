package com.teamarc.planit.entity;

import com.teamarc.planit.entity.enums.UserRole;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents an admin profile in the domain model.
 * Named AppAdmin to avoid conflicts with any reserved keywords or other classes.
 */
@Entity
@Table(name = "app_admins")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AppAdmin extends BaseEntity {

    @OneToOne
    @JoinColumn(name = "app_user_id", nullable = false, unique = true, foreignKey = @ForeignKey(name = "fk_admin_app_user"))
    private AppUser appUser;

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

    @OneToMany(mappedBy = "appAdmin", cascade = CascadeType.ALL)
    private List<AdminLog> logs = new ArrayList<>();

    @OneToMany(mappedBy = "appAdmin", cascade = CascadeType.ALL)
    private List<DisputeResolution> resolutions = new ArrayList<>();

    @Column(name = "last_action_at")
    private LocalDateTime lastActionAt;
}
