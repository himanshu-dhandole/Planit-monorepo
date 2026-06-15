package com.teamarc.planit.repository;

import com.teamarc.planit.dto.response.BookingResponseDTO;
import com.teamarc.planit.entity.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    Page<Booking> findAllByService_Vendor_Id(Long id, Pageable pageable);
}
