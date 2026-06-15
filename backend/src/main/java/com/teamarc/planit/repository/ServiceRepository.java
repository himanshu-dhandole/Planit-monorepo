package com.teamarc.planit.repository;
import com.teamarc.planit.dto.response.ServiceResponseDTO;
import com.teamarc.planit.entity.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ServiceRepository extends JpaRepository<Service, Long> {
    Page<Service> findAllByVendor_Id(Long vendorId, Pageable pageable);

}
