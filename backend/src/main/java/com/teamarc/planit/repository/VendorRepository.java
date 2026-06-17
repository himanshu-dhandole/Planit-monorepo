package com.teamarc.planit.repository;

import com.teamarc.planit.entity.Vendor;
import com.teamarc.planit.entity.enums.VendorServiceCategory;
import org.locationtech.jts.geom.Point;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VendorRepository extends JpaRepository<Vendor, Long> {
    Optional<Vendor> findByUser_Id(long userId);

    Optional<Vendor> findByPhoneNumber(String phoneNumber);

    Page<Vendor> findAllByCategory(VendorServiceCategory vendorServiceCategory, Pageable pageable);

    @Query(value = "SELECT * FROM vendors v WHERE ST_DWithin(CAST(v.coordinates AS geography), CAST(:point AS geography), :distanceInMeters) = true", nativeQuery = true)
    Page<Vendor> findVendorsNear(Point point, double distanceInMeters, Pageable pageable);
}
