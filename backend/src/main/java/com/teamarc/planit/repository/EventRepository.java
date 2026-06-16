package com.teamarc.planit.repository;


import com.teamarc.planit.entity.Event;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    Page<Event> findAllByCustomer_Id(Long id, Pageable pageable);

    Page<Event> findAllByIsDeletedAndCustomer_Id(Boolean isDeleted, Long customerId, Pageable pageable);

    Optional<Event> findByIdAndIsDeleted(Long eventId, Boolean isDeleted);
}
