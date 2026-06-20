package com.teamarc.planit.repository;

import com.teamarc.planit.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByBookingId(Long bookingId);
    List<Task> findByBookingServicesVendorId(Long vendorId);
}
