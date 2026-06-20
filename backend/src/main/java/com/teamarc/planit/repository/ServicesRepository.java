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

    @org.springframework.data.jpa.repository.Query("SELECT s FROM Services s WHERE s.category = :vendorServiceCategory AND s.isAvailable = :isAvailable AND s.vendor.isActive = true ORDER BY s.vendor.user.aura DESC")
    Page<Services> findAllByCategoryAndIsAvailable(@org.springframework.data.repository.query.Param("vendorServiceCategory") VendorServiceCategory vendorServiceCategory, @org.springframework.data.repository.query.Param("isAvailable") Boolean isAvailable, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT s FROM Services s WHERE s.category = :vendorServiceCategory AND s.isAvailable = :isAvailable AND s.vendor.isActive = true ORDER BY s.vendor.user.aura DESC")
    Page<Services> findAllByLocationAndIsAvailable(@org.springframework.data.repository.query.Param("vendorServiceCategory") VendorServiceCategory vendorServiceCategory, @org.springframework.data.repository.query.Param("isAvailable") Boolean isAvailable, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT s FROM Services s JOIN s.availableLocations l WHERE l.city = :city AND l.state = :state AND s.isAvailable = true AND s.vendor.isActive = true ORDER BY s.vendor.user.aura DESC")
    Page<Services> findByAvailableLocationCityAndState(@org.springframework.data.repository.query.Param("city") String city, @org.springframework.data.repository.query.Param("state") String state, Pageable pageable);

    Page<Services> findAllByIsAvailableAndVerificationStatus(Boolean isAvailable, com.teamarc.planit.entity.enums.VerificationStatus verificationStatus, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT s FROM Services s WHERE s.isAvailable = :isAvailable AND s.vendor.isActive = true ORDER BY s.vendor.user.aura DESC")
    Page<Services> findAllByIsAvailable(@org.springframework.data.repository.query.Param("isAvailable") Boolean isAvailable, Pageable pageable);

    java.util.List<Services> findAllByVerificationStatus(com.teamarc.planit.entity.enums.VerificationStatus verificationStatus);
}
