package com.teamarc.planit.entity;

import com.teamarc.planit.entity.enums.*;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(nullable = false, length = 255)
    private String passwordHash;

    @Column(length = 20)
    private String phone;

    @Column(length = 100)
    private String firstName;

    @Column(length = 100)
    private String lastName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private AccountStatus accountStatus = AccountStatus.ACTIVE;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isVerified = false;

    @Column(length = 255)
    private String verificationToken;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Relationships
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Vendor vendor;

    @OneToMany(mappedBy = "organizer", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Event> organizedEvents = new ArrayList<>();

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Booking> bookings = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Notification> notifications = new ArrayList<>();

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private NotificationPreference notificationPreference;

    @OneToMany(mappedBy = "assignedTo")
    @Builder.Default
    private List<Task> assignedTasks = new ArrayList<>();

    @OneToMany(mappedBy = "raisedBy")
    @Builder.Default
    private List<Dispute> raisedDisputes = new ArrayList<>();

    @OneToMany(mappedBy = "resolvedBy")
    @Builder.Default
    private List<Dispute> resolvedDisputes = new ArrayList<>();

    @OneToMany(mappedBy = "cancelledBy")
    @Builder.Default
    private List<Cancellation> cancelledBookings = new ArrayList<>();

    @OneToMany(mappedBy = "participant1")
    @Builder.Default
    private List<Conversation> conversationsAsParticipant1 = new ArrayList<>();

    @OneToMany(mappedBy = "participant2")
    @Builder.Default
    private List<Conversation> conversationsAsParticipant2 = new ArrayList<>();

    @OneToMany(mappedBy = "sender")
    @Builder.Default
    private List<ChatMessage> sentMessages = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ActivityLog> activityLogs = new ArrayList<>();

    @OneToMany(mappedBy = "customer")
    @Builder.Default
    private List<Review> reviews = new ArrayList<>();

    // UserDetails implementation
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return accountStatus != AccountStatus.SUSPENDED;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return accountStatus == AccountStatus.ACTIVE;
    }
}
