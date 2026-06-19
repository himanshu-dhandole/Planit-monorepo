package com.teamarc.planit.controller;

import com.teamarc.planit.dto.request.ReviewRequestDTO;
import com.teamarc.planit.dto.response.ReviewResponseDTO;
import com.teamarc.planit.services.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ReviewResponseDTO> createReview(@RequestBody @Valid ReviewRequestDTO reviewRequestDTO) {
        return ResponseEntity.ok(reviewService.createReview(reviewRequestDTO));
    }

    @GetMapping("/service/{serviceId}")
    public ResponseEntity<List<ReviewResponseDTO>> getReviewsByServiceId(@PathVariable Long serviceId) {
        return ResponseEntity.ok(reviewService.getReviewsByServiceId(serviceId));
    }
}
