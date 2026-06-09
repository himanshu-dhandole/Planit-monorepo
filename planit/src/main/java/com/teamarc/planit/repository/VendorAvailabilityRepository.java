package com.teamarc.planit.repository;

import com.teamarc.planit.entity.VendorAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface VendorAvailabilityRepository extends JpaRepository<VendorAvailability, UUID> {
}
