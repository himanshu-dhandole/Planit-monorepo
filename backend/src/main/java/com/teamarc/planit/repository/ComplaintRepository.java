package com.teamarc.planit.repository;

import com.teamarc.planit.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    java.util.List<Complaint> findByRaisedByUser_Id(Long raisedByUserId);
    java.util.List<Complaint> findByAgainstUser_Id(Long againstUserId);
}
