package com.teamarc.planit.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "service_availabilities", indexes = {
        @Index(name = "idx_service_availability", columnList = "service_id"),
        @Index(name = "idx_available_date", columnList = "available_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ServiceAvailability extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false, foreignKey = @ForeignKey(name = "fk_availability_service"))
    private Service service;

    @Column(nullable = false)
    private LocalDate availableDate;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Column(nullable = false)
    private Boolean isAvailable = true;

    @Column(name = "booked_slots")
    private Integer bookedSlots = 0;

    @Column(name = "max_slots")
    private Integer maxSlots;
}
