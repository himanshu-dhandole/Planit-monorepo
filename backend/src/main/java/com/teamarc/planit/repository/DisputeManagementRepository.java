package com.teamarc.planit.repository;

import com.teamarc.planit.entity.DisputeManagement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DisputeManagementRepository extends JpaRepository<DisputeManagement, Long> {
}
