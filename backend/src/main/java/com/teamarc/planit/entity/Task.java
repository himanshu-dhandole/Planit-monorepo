package com.teamarc.planit.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Task {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false)
    private Boolean completed = false;
    
    @Column(nullable = false)
    private Boolean priority = false;
    
    @Column(name = "assigned_by_customer", nullable = false)
    private Boolean assignedByCustomer = true;
    
    @Column(name = "last_updated_by_user_id")
    private Long lastUpdatedByUserId;
    
    @Column(name = "attachment_url")
    private String attachmentUrl;
    
    @Column(name = "due_date")
    private LocalDateTime dueDate;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (completed == null) completed = false;
        if (priority == null) priority = false;
        if (assignedByCustomer == null) assignedByCustomer = true;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
