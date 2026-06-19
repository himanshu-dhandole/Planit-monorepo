package com.teamarc.planit.repository;

import com.teamarc.planit.entity.KarmaTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface KarmaTransactionRepository extends JpaRepository<KarmaTransaction, Long> {
    List<KarmaTransaction> findByUserIdOrderByCreatedAtDesc(Long userId);
}
