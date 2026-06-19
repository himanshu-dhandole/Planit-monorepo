package com.teamarc.planit.repository;

import com.teamarc.planit.entity.Escrow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EscrowRepository extends JpaRepository<Escrow, Long> {
    Optional<Escrow> findByBooking_Id(Long bookingId);
}
