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

    @org.springframework.data.jpa.repository.Query("SELECT s FROM Services s JOIN s.availableLocations l WHERE l.city = :city AND l.state = :state AND s.isAvailable = true")
    Page<Services> findByAvailableLocationCityAndState(@org.springframework.data.repository.query.Param("city") String city, @org.springframework.data.repository.query.Param("state") String state, Pageable pageable);

    Page<Services> findAllByIsAvailableAndVerificationStatus(Boolean isAvailable, com.teamarc.planit.entity.enums.VerificationStatus verificationStatus, Pageable pageable);

    Page<Services> findAllByIsAvailable(Boolean isAvailable, Pageable pageable);

    java.util.List<Services> findAllByVerificationStatus(com.teamarc.planit.entity.enums.VerificationStatus verificationStatus);
}
