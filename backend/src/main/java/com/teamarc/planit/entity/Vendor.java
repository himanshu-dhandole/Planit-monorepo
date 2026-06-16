package com.teamarc.planit.entity;

import com.teamarc.planit.entity.enums.VendorServiceCategory;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;
import java.time.LocalDateTime;

@Entity
@Table(name = "vendors")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vendor {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    
    @Column(nullable = false)
    private String businessName;
    
    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VendorServiceCategory category;
    
    @Column(columnDefinition = "TEXT")
    private String verification;

    @Column(name = "is_verified", nullable = false)
    @ColumnDefault("false")
    private Boolean isVerified;

    @Column(name = "is_active", nullable = false)
    @ColumnDefault("true")
    private Boolean isActive;
    
    @Column(nullable = false)
    @ColumnDefault("0")
    private Integer totalBookings;
    
    @Column(columnDefinition = "TEXT")
    private String location;
    
    @Column(nullable = false, columnDefinition = "DECIMAL(3,2)")
    @ColumnDefault("5.0")
    private Double karma;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "vendor", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.Set<Services> services;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (karma == null) karma = 5.0;
        if (totalBookings == null) totalBookings = 0;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
