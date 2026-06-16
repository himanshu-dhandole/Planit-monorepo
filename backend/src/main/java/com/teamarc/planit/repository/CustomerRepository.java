package com.teamarc.planit.repository;

import com.teamarc.planit.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Customer findByUserId(Long userId);

    java.util.List<Customer> findByVerificationStatus(com.teamarc.planit.entity.enums.VerificationStatus status);
}
