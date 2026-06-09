package com.teamarc.planit.entity;

import com.teamarc.planit.entity.enums.VendorVerificationStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "vendors", indexes = {
    @Index(name = "idx_verified", columnList = "verification_status"),
    @Index(name = "idx_business_name", columnList = "business_name")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Vendor extends BaseEntity {

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true, foreignKey = @ForeignKey(name = "fk_vendor_user"))
    private User user;

    @Column(nullable = false, length = 200)
    private String businessName;

    @Column(columnDefinition = "TEXT")
    private String businessDescription;

    @Column(length = 500)
    private String businessImageUrl;

    @Column(length = 100)
    private String businessCategory;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VendorVerificationStatus verificationStatus = VendorVerificationStatus.PENDING;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(length = 500)
    private String rejectionReason;

    @Column(nullable = false)
    private Integer totalServices = 0;

    @Column(nullable = false)
    private Integer completedBookings = 0;

    @Column(name = "response_time_hours")
    private Integer responseTimeHours = 24;

    @Column(name = "cancellation_rate", precision = 5, scale = 2)
    private BigDecimal cancellationRate = BigDecimal.ZERO;

    @OneToMany(mappedBy = "vendor", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Service> services = new ArrayList<>();

    @OneToMany(mappedBy = "vendor", cascade = CascadeType.ALL)
    private List<Review> reviews = new ArrayList<>();

    @OneToMany(mappedBy = "vendor", cascade = CascadeType.ALL)
    private List<Booking> bookings = new ArrayList<>();

    @OneToMany(mappedBy = "vendor", cascade = CascadeType.ALL)
    private List<Dispute> disputes = new ArrayList<>();

    @OneToOne(mappedBy = "vendor", cascade = CascadeType.ALL, orphanRemoval = true)
    private KarmaScore karmaScore;

    @OneToMany(mappedBy = "vendor")
    private List<Conversation> conversations = new ArrayList<>();

    @OneToMany(mappedBy = "vendor")
    private List<VendorBankAccount> bankAccounts = new ArrayList<>();

    @Column(name = "is_banned")
    private Boolean isBanned = false;

    @Column(name = "ban_reason")
    private String banReason;
}
