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
@Table(name = "vendor_services")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorService {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @Column(nullable = false, length = 255)
    private String serviceName;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(length = 100)
    private String subcategory;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(precision = 10, scale = 2)
    private BigDecimal hourlyRate;

    @Column(precision = 10, scale = 2)
    private BigDecimal packagePrice;

    @Column
    private Integer minBookingDuration;

    @Column
    private Integer maxBookingDuration;

    @Column(nullable = false)
    private Boolean isAvailable = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Relationships
    @OneToMany(mappedBy = "service")
    private List<Booking> bookings = new ArrayList<>();

    @OneToMany(mappedBy = "service")
    private List<Review> reviews = new ArrayList<>();
}
