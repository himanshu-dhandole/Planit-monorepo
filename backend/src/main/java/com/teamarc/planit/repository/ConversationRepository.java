package com.teamarc.planit.repository;

import com.teamarc.planit.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findByCustomer_Id(Long customerId);
    List<Conversation> findByVendor_Id(Long vendorId);
    Optional<Conversation> findByCustomer_IdAndVendor_IdAndService_Id(Long customerId, Long vendorId, Long serviceId);
    Optional<Conversation> findByCustomer_IdAndVendor_IdAndServiceIsNull(Long customerId, Long vendorId);
}
