package com.teamarc.planit.configs;

import com.teamarc.planit.entity.Booking;
import com.teamarc.planit.entity.Task;
import com.teamarc.planit.entity.User;
import com.teamarc.planit.repository.BookingRepository;
import com.teamarc.planit.repository.TaskRepository;
import com.teamarc.planit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final TaskRepository taskRepository;

    @Override
    public void run(String... args) throws Exception {
        log.info("Starting DataLoader database verification and seeding...");

        Optional<User> userOpt = userRepository.findByEmail("yashmzade@gmail.com");
        if (userOpt.isEmpty()) {
            log.info("User 'yashmzade@gmail.com' not found in database. Seeding skipped.");
            return;
        }

        User user = userOpt.get();
        log.info("Found user yashmzade@gmail.com (ID: {}). Checking bookings...", user.getId());

        // Find all bookings for this user as a customer
        List<Booking> bookings = bookingRepository.findAll().stream()
                .filter(b -> b.getCustomer().getUser().getId() == user.getId())
                .toList();

        if (bookings.isEmpty()) {
            log.info("No bookings found for customer yashmzade@gmail.com. Seeding skipped.");
            return;
        }

        log.info("Found {} bookings for yashmzade@gmail.com.", bookings.size());

        for (Booking booking : bookings) {
            List<Task> existingTasks = taskRepository.findByBookingId(booking.getId());
            if (existingTasks.isEmpty()) {
                log.info("Seeding initial collaborative tasks for booking ID: {}", booking.getId());

                Task task1 = new Task();
                task1.setBooking(booking);
                task1.setTitle("Review and approve vendor catering menu");
                task1.setDescription("Confirm dessert selection and gluten-free alternatives with the caterer.");
                task1.setCompleted(false);
                task1.setPriority(true);
                task1.setAssignedByCustomer(true);
                task1.setLastUpdatedByUserId(user.getId());
                task1.setDueDate(LocalDateTime.now().plusDays(5));
                taskRepository.save(task1);

                Task task2 = new Task();
                task2.setBooking(booking);
                task2.setTitle("Verify venue logistics and lighting requirements");
                task2.setDescription("Arrange extension boards, backup generator, and layout plans.");
                task2.setCompleted(false);
                task2.setPriority(false);
                task2.setAssignedByCustomer(true);
                task2.setLastUpdatedByUserId(user.getId());
                task2.setDueDate(LocalDateTime.now().plusDays(10));
                taskRepository.save(task2);

                Task task3 = new Task();
                task3.setBooking(booking);
                task3.setTitle("Pay venue deposit and finalize invoice details");
                task3.setDescription("Transfer advance payment from the wallet balance.");
                task3.setCompleted(true); // Seeding one completed task
                task3.setPriority(true);
                task3.setAssignedByCustomer(true);
                task3.setLastUpdatedByUserId(user.getId());
                task3.setDueDate(LocalDateTime.now().minusDays(2));
                taskRepository.save(task3);

                log.info("Seeded 3 tasks for booking ID: {}", booking.getId());
            } else {
                log.info("Booking ID: {} already has {} tasks. Seeding skipped.", booking.getId(), existingTasks.size());
            }
        }
    }
}
