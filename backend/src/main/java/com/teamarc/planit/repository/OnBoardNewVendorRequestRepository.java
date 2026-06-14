package com.teamarc.planit.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.teamarc.planit.entity.OnBoardNewVendorRequest;

@Repository
public interface OnBoardNewVendorRequestRepository extends JpaRepository<OnBoardNewVendorRequest, Long> {
    OnBoardNewVendorRequest findByUserId(Long userId);
}
