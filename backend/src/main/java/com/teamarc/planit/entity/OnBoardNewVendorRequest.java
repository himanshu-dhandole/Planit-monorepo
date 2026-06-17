package com.teamarc.planit.entity;

import com.teamarc.planit.entity.enums.VendorServiceCategory;
import jakarta.persistence.*;
import org.locationtech.jts.geom.Point;
import lombok.*;


@Entity
@AllArgsConstructor
@RequiredArgsConstructor
@Builder
@Getter
@Setter
public class OnBoardNewVendorRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    @Column(nullable = false)
    private String businessName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VendorServiceCategory category;

    @Column(nullable = false)
    private String phoneNumber;
    
    @Column
    private String upiAddress;
    
    @Column(nullable = false)
    private String addressLine1;
    
    @Column
    private String addressLine2;
    
    @Column(nullable = false)
    private String pincode;
    
    @Column(nullable = false)
    private String state;
    
    @Column
    private String profileImageUrl;
    
    @Column(nullable = false)
    private String pan;
    
    @Column(nullable = false)
    private String gstNumber;

    @Column(columnDefinition = "geometry(Point, 4326)")
    private Point coordinates;

}
