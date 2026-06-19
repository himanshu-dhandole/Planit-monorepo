package com.teamarc.planit.controller;

import com.teamarc.planit.dto.request.TestimonialRequestDTO;
import com.teamarc.planit.dto.response.TestimonialResponseDTO;
import com.teamarc.planit.services.TestimonialService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/testimonials")
@RequiredArgsConstructor
public class TestimonialController {

    private final TestimonialService testimonialService;

    @PostMapping
    public ResponseEntity<TestimonialResponseDTO> createTestimonial(@RequestBody @Valid TestimonialRequestDTO dto) {
        return ResponseEntity.ok(testimonialService.createTestimonial(dto));
    }

    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<List<TestimonialResponseDTO>> getVendorTestimonials(
            @PathVariable Long vendorId,
            @RequestParam(defaultValue = "false") boolean onlyFeatured) {
        return ResponseEntity.ok(testimonialService.getTestimonialsByVendor(vendorId, onlyFeatured));
    }

    @GetMapping("/vendor/{vendorId}/featured")
    public ResponseEntity<List<TestimonialResponseDTO>> getVendorFeaturedTestimonials(@PathVariable Long vendorId) {
        return ResponseEntity.ok(testimonialService.getTestimonialsByVendor(vendorId, true));
    }

    @PutMapping("/{id}/feature")
    public ResponseEntity<TestimonialResponseDTO> toggleFeatureTestimonial(@PathVariable Long id) {
        return ResponseEntity.ok(testimonialService.toggleFeatureTestimonial(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTestimonial(@PathVariable Long id) {
        testimonialService.deleteTestimonial(id);
        return ResponseEntity.noContent().build();
    }
}
