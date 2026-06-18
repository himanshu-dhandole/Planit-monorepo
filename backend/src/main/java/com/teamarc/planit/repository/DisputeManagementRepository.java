package com.teamarc.planit.repository;
import com.teamarc.planit.entity.DisputeManagement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DisputeManagementRepository extends JpaRepository<DisputeManagement, Long> {
    Optional<DisputeManagement> findByBooking_Id(Long bookingId);
    Page<DisputeManagement> findByStatus(DisputeManagement.DisputeStatus status, Pageable pageable);
    List<DisputeManagement> findByRaisedByUser_Id(Long userId);
    List<DisputeManagement> findByAgainstUser_Id(Long userId);
    boolean existsByBooking_Id(Long bookingId);
}
