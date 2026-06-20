package com.teamarc.planit.repository;

import com.teamarc.planit.entity.AuraTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AuraTransactionRepository extends JpaRepository<AuraTransaction, Long> {
    List<AuraTransaction> findByUserIdOrderByCreatedAtDesc(Long userId);
}
