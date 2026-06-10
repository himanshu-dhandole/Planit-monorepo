package com.teamarc.planit.entity;

import com.teamarc.planit.entity.enums.PaymentMethod;
import com.teamarc.planit.entity.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "payments", indexes = {
        @Index(name = "idx_booking_payment", columnList = "booking_id", unique = true),
        @Index(name = "idx_transaction_id", columnList = "transaction_id"),
        @Index(name = "idx_payment_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Payment extends BaseEntity {

    @OneToOne
    @JoinColumn(name = "booking_id", nullable = false, unique = true, foreignKey = @ForeignKey(name = "fk_payment_booking"))
    private Booking booking;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency = "INR";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod paymentMethod;

    @Column(length = 100)
    private String transactionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "payment_gateway")
    private String paymentGateway;

    @Column(columnDefinition = "TEXT")
    private String paymentDetails;

    @OneToMany(mappedBy = "payment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Refund> refunds = new ArrayList<>();

    @Column(name = "total_refunded_amount", precision = 12, scale = 2)
    private BigDecimal totalRefundedAmount = BigDecimal.ZERO;

    @Column(name = "receipt_url")
    private String receiptUrl;
}
