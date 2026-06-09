package com.teamarc.planit.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "event_tasks", indexes = {
    @Index(name = "idx_event_task", columnList = "event_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventTask extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false, foreignKey = @ForeignKey(name = "fk_task_event"))
    private Event event;

    @Column(nullable = false, length = 200)
    private String taskName;

    @Column(columnDefinition = "TEXT")
    private String taskDescription;

    @Column(nullable = false)
    private LocalDate dueDate;

    @Column(nullable = false)
    private Boolean isCompleted = false;

    @Column(name = "priority")
    private String priority = "MEDIUM";

    @Column(name = "assigned_to")
    private String assignedTo;
}
