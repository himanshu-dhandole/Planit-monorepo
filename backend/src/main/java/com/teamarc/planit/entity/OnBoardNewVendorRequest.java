package com.teamarc.planit.entity;

import com.teamarc.planit.entity.enums.VendorServiceCategory;
import jakarta.persistence.*;
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

    @Column(columnDefinition = "TEXT")
    private String verification;

    @Column(columnDefinition = "TEXT")
    private String location;

}
