package com.teamarc.planit.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "services", indexes = {
    @Index(name = "idx_vendor_service", columnList = "vendor_id"),
    @Index(name = "idx_service_category", columnList = "category"),
    @Index(name = "idx_service_available", columnList = "available")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Service extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false, foreignKey = @ForeignKey(name = "fk_service_vendor"))
    private Vendor vendor;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(length = 500)
    private String serviceImageUrl;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal hourlyRate;

    @Column(precision = 12, scale = 2)
    private BigDecimal packagePrice;

    @Column(nullable = false)
    private Integer minDuration = 1;

    @Column(nullable = false)
    private Integer maxDuration = 480;

    @Column(nullable = false)
    private Boolean available = true;

    @Column(name = "total_bookings")
    private Integer totalBookings = 0;

    @Column(name = "average_rating", precision = 3, scale = 2)
    private BigDecimal averageRating = BigDecimal.ZERO;

    @OneToMany(mappedBy = "service", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ServiceAvailability> availability = new ArrayList<>();

    @OneToMany(mappedBy = "service", cascade = CascadeType.ALL)
    private List<Booking> bookings = new ArrayList<>();

    @Column(name = "requires_advance_booking_days")
    private Integer advanceBookingDays = 1;
}
