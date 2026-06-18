package com.teamarc.planit.controller;

import com.teamarc.planit.dto.request.EventRequestDTO;
import com.teamarc.planit.dto.response.BookingResponseDTO;
import com.teamarc.planit.dto.response.EventResponseDTO;
import com.teamarc.planit.services.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(path = "/api/events")
@RequiredArgsConstructor
public class EventController {


    private final EventService eventService;

    @PostMapping(path = "/create")
    public ResponseEntity<EventResponseDTO> createEvent(@RequestBody @jakarta.validation.Valid EventRequestDTO eventRequestDTO) {
        return ResponseEntity.ok(eventService.createNewEvent(eventRequestDTO));
    }

    @GetMapping(path = "/{id}")
    public ResponseEntity<EventResponseDTO> getEventById(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.getEventById(id));
    }

    @PutMapping(path = "/{id}")
    public ResponseEntity<EventResponseDTO> updateEventDetails(@PathVariable Long id, @RequestBody @jakarta.validation.Valid EventRequestDTO eventRequestDTO) {
        return ResponseEntity.ok(eventService.updateEventDetails(id, eventRequestDTO));
    }

    @GetMapping(path = "/customer/{customerId}")
    public ResponseEntity<Page<EventResponseDTO>> getAllEventByCustomerId(@PathVariable Long customerId, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(eventService.getAllEventByCustomerId(customerId, page, size));
    }

    @GetMapping(path = "/booking/{eventId}")
    public ResponseEntity<Page<BookingResponseDTO>> getBookingsByEventId(@PathVariable Long eventId, @RequestParam int page, @RequestParam int size) {
        return ResponseEntity.ok(eventService.getAllBookingsByEventId(eventId, page, size));
    }

    @DeleteMapping(path = "/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
        return ResponseEntity.ok().build();
    }
}
