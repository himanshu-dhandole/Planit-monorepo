package com.teamarc.planit.services;


import com.teamarc.planit.dto.request.EventRequestDTO;
import com.teamarc.planit.dto.response.BookingResponseDTO;
import com.teamarc.planit.dto.response.EventResponseDTO;
import com.teamarc.planit.entity.Customer;
import com.teamarc.planit.entity.Event;
import com.teamarc.planit.repository.CustomerRepository;
import com.teamarc.planit.repository.EventRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final ModelMapper modelMapper;
    private final CustomerService customerService;
    private final CustomerRepository customerRepository;

    @Transactional
    public EventResponseDTO createNewEvent(EventRequestDTO eventRequestDTO) {
        Customer customer = customerRepository.findById(eventRequestDTO.getCustomerId()).orElseThrow(() -> new RuntimeException("Customer not found with id: " + eventRequestDTO.getCustomerId()));
        Event event = Event.builder()
                .customer(customer)
                .title(eventRequestDTO.getTitle())
                .description(eventRequestDTO.getDescription())
                .startDate(eventRequestDTO.getStartDate())
                .endDate(eventRequestDTO.getEndDate())
                .address(eventRequestDTO.getAddress())
                .build();

        return modelMapper.map(eventRepository.save(event), EventResponseDTO.class);
    }

    public EventResponseDTO getEventById(Long eventId) {
        return modelMapper.map(eventRepository.findByIdAndIsDeleted(eventId, Boolean.FALSE).orElseThrow(() -> new RuntimeException("Event not found with id: " + eventId)), EventResponseDTO.class);
    }

    public EventResponseDTO updateEventDetails(Long eventId, EventRequestDTO eventRequestDTO) {
        Event existingEvent = eventRepository.findById(eventId).orElseThrow(() -> new RuntimeException("Event not found with id: " + eventId));
        existingEvent.setTitle(eventRequestDTO.getTitle());
        existingEvent.setDescription(eventRequestDTO.getDescription());
        if(existingEvent.getBookings().isEmpty()) {
            existingEvent.setStartDate(eventRequestDTO.getStartDate());
            existingEvent.setEndDate(eventRequestDTO.getEndDate());
            existingEvent.setAddress(eventRequestDTO.getAddress());
        }
        return modelMapper.map(eventRepository.save(existingEvent), EventResponseDTO.class);
    }

    public Page<EventResponseDTO> getAllEventByCustomerId(Long customerId, int page, int size) {
        return eventRepository.findAllByIsDeletedAndCustomer_Id(Boolean.FALSE, customerId, PageRequest.of(page, size))
                .map(event -> modelMapper.map(event, EventResponseDTO.class));
    }

    public Page<EventResponseDTO> getAllEventByCustomerIdIncludingDeleted(Long customerId, int page, int size) {
        return eventRepository.findAllByCustomer_Id(customerId, PageRequest.of(page, size))
                .map(event -> modelMapper.map(event, EventResponseDTO.class));
    }

    public Page<BookingResponseDTO> getAllBookingsByEventId(Long eventId, int page, int size) {
        Event event = eventRepository.findByIdAndIsDeleted(eventId, Boolean.FALSE).orElseThrow(() -> new RuntimeException("Event not found with id: " + eventId));
        return event.getBookings().stream()
                .map(booking -> modelMapper.map(booking, BookingResponseDTO.class))
                .collect(java.util.stream.Collectors.collectingAndThen(java.util.stream.Collectors.toList(), list -> new org.springframework.data.domain.PageImpl<>(list, PageRequest.of(page, size), list.size())));
    }
    

    // TODO_Delete_Event



    // TODO_RESCHEDULE_EVENT


    // TODO_CHANGE_EVENT_ADDRESS





}
