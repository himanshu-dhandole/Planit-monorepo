package com.teamarc.planit.repository;
import com.teamarc.planit.entity.Services;
import com.teamarc.planit.entity.enums.VendorServiceCategory;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ServicesRepository extends JpaRepository<Services, Long> {
    Page<Services> findAllByVendor_Id(Long vendorId, Pageable pageable);

    Page<Services> findAllByCategory(VendorServiceCategory vendorServiceCategory, Pageable pageable);

    Page<Services> findAllByCategoryAndIsAvailable(VendorServiceCategory vendorServiceCategory, Boolean isAvailable, Pageable pageable);

    Page<Services> findAllByLocationAndIsAvailable(VendorServiceCategory vendorServiceCategory, Boolean isAvailable, Pageable pageable);

    java.util.List<Services> findAllByVerificationStatus(com.teamarc.planit.entity.enums.VerificationStatus verificationStatus);
}
