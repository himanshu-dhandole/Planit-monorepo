package com.teamarc.planit.controller;

import com.teamarc.planit.dto.TaskDTO;
import com.teamarc.planit.entity.Booking;
import com.teamarc.planit.entity.Customer;
import com.teamarc.planit.entity.Vendor;
import com.teamarc.planit.entity.Task;
import com.teamarc.planit.entity.User;
import com.teamarc.planit.repository.BookingRepository;
import com.teamarc.planit.repository.TaskRepository;
import com.teamarc.planit.repository.CustomerRepository;
import com.teamarc.planit.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@Slf4j
public class TaskController {

    private final TaskRepository taskRepository;
    private final BookingRepository bookingRepository;
    private final CustomerRepository customerRepository;
    private final VendorRepository vendorRepository;
    private final ModelMapper modelMapper;
    private final SimpMessagingTemplate messagingTemplate;

    private User getCurrentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @PostMapping
    public ResponseEntity<?> createTask(@RequestBody TaskDTO taskDTO) {
        log.info("Received request to create task: {}", taskDTO);
        Booking booking = bookingRepository.findById(taskDTO.getBookingId())
                .orElseThrow(() -> new IllegalArgumentException("Booking not found with ID: " + taskDTO.getBookingId()));

        User user = getCurrentUser();
        
        Task task = new Task();
        task.setBooking(booking);
        task.setTitle(taskDTO.getTitle());
        task.setDescription(taskDTO.getDescription());
        task.setPriority(taskDTO.getPriority() != null ? taskDTO.getPriority() : false);
        task.setDueDate(taskDTO.getDueDate());
        
        Customer customer = customerRepository.findByUserId(user.getId());
        boolean isCustomer = customer != null;
        task.setAssignedByCustomer(isCustomer);
        task.setLastUpdatedByUserId(user.getId());

        Task savedTask = taskRepository.save(task);
        log.info("Saved task to database: {}", savedTask);

        // Broadcast to event topic
        Long eventId = booking.getEvent().getId();
        broadcastTaskUpdate(eventId);

        return ResponseEntity.ok(convertToDTO(savedTask));
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<TaskDTO>> getTasksByBooking(@PathVariable Long bookingId) {
        log.info("Fetching tasks for booking ID: {}", bookingId);
        List<Task> tasks = taskRepository.findByBookingId(bookingId);
        List<TaskDTO> dtos = tasks.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<List<TaskDTO>> getTasksByVendor(@PathVariable Long vendorId) {
        log.info("Fetching tasks for vendor ID: {}", vendorId);
        List<Task> tasks = taskRepository.findByBookingServicesVendorId(vendorId);
        List<TaskDTO> dtos = tasks.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PutMapping("/{taskId}/toggle")
    public ResponseEntity<TaskDTO> toggleTask(@PathVariable Long taskId) {
        log.info("Toggling task ID: {}", taskId);
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found with ID: " + taskId));

        User user = getCurrentUser();
        task.setCompleted(!task.getCompleted());
        task.setLastUpdatedByUserId(user.getId());

        Task updatedTask = taskRepository.save(task);
        log.info("Updated task: {}", updatedTask);

        // Broadcast to event topic
        Long eventId = task.getBooking().getEvent().getId();
        broadcastTaskUpdate(eventId);

        return ResponseEntity.ok(convertToDTO(updatedTask));
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<?> deleteTask(@PathVariable Long taskId) {
        log.info("Deleting task ID: {}", taskId);
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found with ID: " + taskId));

        Long eventId = task.getBooking().getEvent().getId();
        taskRepository.delete(task);
        log.info("Deleted task ID: {}", taskId);

        // Broadcast to event topic
        broadcastTaskUpdate(eventId);

        return ResponseEntity.ok().build();
    }

    @GetMapping("/urgent-count")
    public ResponseEntity<?> getUrgentCount() {
        User user = getCurrentUser();
        LocalDateTime threshold = LocalDateTime.now().plusHours(48);
        List<Task> tasks;

        Customer customer = customerRepository.findByUserId(user.getId());
        Optional<Vendor> vendorOpt = vendorRepository.findByUser_Id(user.getId());

        if (customer != null) {
            Long customerId = customer.getId();
            tasks = taskRepository.findAll().stream()
                    .filter(t -> t.getBooking().getCustomer().getId().equals(customerId))
                    .filter(t -> !t.getCompleted())
                    .filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(threshold))
                    .collect(Collectors.toList());
        } else if (vendorOpt.isPresent()) {
            Long vendorId = vendorOpt.get().getId();
            tasks = taskRepository.findByBookingServicesVendorId(vendorId).stream()
                    .filter(t -> !t.getCompleted())
                    .filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(threshold))
                    .collect(Collectors.toList());
        } else {
            tasks = List.of();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("count", tasks.size());
        return ResponseEntity.ok(response);
    }

    private void broadcastTaskUpdate(Long eventId) {
        String destination = "/topic/event-tasks/" + eventId;
        log.info("Broadcasting task update over STOMP WebSocket to destination: {}", destination);
        messagingTemplate.convertAndSend(destination, Map.of("eventId", eventId, "updatedAt", LocalDateTime.now().toString()));
    }

    private TaskDTO convertToDTO(Task task) {
        TaskDTO dto = modelMapper.map(task, TaskDTO.class);
        dto.setBookingId(task.getBooking().getId());
        return dto;
    }
}
