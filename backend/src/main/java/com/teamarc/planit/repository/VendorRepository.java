package com.teamarc.planit.repository;

import com.teamarc.planit.entity.Vendor;
import com.teamarc.planit.entity.enums.VendorServiceCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VendorRepository extends JpaRepository<Vendor, Long> {
    Optional<Vendor> findByUser_Id(long user_Id);

    Page<Vendor> findAllByCategory(VendorServiceCategory vendorServiceCategory, Pageable pageable);
}
