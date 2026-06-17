package com.teamarc.planit.entity;

import com.teamarc.planit.entity.enums.VendorServiceCategory;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.Set;

@Entity
@Table(name = "services")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Services {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;
    
    @Column(nullable = false)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false, columnDefinition = "DECIMAL(10,2)")
    private BigDecimal price;
    
    @Column(name = "is_available", nullable = false)
    @ColumnDefault("true")
    private Boolean isAvailable;
    
    @Column(columnDefinition = "TEXT")
    private String location;

    @org.hibernate.annotations.ColumnDefault("0.0")
    private Double rating = 0.0;

    @OneToMany(mappedBy = "services", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<Review> reviews = new java.util.ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "service_locations", joinColumns = @JoinColumn(name = "service_id"))
    private java.util.List<ServiceLocation> availableLocations;

    @ElementCollection
    @CollectionTable(name = "service_photos", joinColumns = @JoinColumn(name = "service_id"))
    @Column(name = "photo_url")
    @jakarta.validation.constraints.Size(max = 5, message = "Maximum 5 photos allowed")
    private java.util.List<String> photos;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VendorServiceCategory category;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "services", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Booking> bookings;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status")
    private com.teamarc.planit.entity.enums.VerificationStatus verificationStatus;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isAvailable == null) isAvailable = true;
        if (verificationStatus == null) verificationStatus = com.teamarc.planit.entity.enums.VerificationStatus.PENDING;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
