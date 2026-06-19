package com.teamarc.planit.repository;

import com.teamarc.planit.entity.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    
    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.services s LEFT JOIN FETCH s.vendor v WHERE v.id = :vendorId")
    Page<Booking> findAllByServices_Vendor_Id(@Param("vendorId") Long vendorId, Pageable pageable);

    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.services s LEFT JOIN FETCH s.vendor v WHERE b.customer.id = :customerId")
    Page<Booking> findAllByCustomer_Id(@Param("customerId") Long customerId, Pageable pageable);

    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.services s LEFT JOIN FETCH s.vendor v WHERE b.event.id = :eventId")
    Page<Booking> findAllByEvent_Id(@Param("eventId") Long eventId, Pageable pageable);

    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.customer.id = :customerId AND b.services.vendor.id = :vendorId AND b.status = com.teamarc.planit.entity.enums.BookingStatus.COMPLETED")
    boolean hasCompletedBooking(@Param("customerId") Long customerId, @Param("vendorId") Long vendorId);
}

