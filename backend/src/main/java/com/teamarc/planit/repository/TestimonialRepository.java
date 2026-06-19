package com.teamarc.planit.repository;

import com.teamarc.planit.entity.Testimonial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TestimonialRepository extends JpaRepository<Testimonial, Long> {
    List<Testimonial> findByVendor_IdOrderByCreatedAtDesc(Long vendorId);
    List<Testimonial> findByVendor_IdAndIsFeaturedTrueOrderByCreatedAtDesc(Long vendorId);
}
