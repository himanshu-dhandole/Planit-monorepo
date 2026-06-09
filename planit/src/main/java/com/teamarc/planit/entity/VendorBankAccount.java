package com.teamarc.planit.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vendor_bank_accounts", indexes = {
    @Index(name = "idx_vendor_bank", columnList = "vendor_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VendorBankAccount extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false, foreignKey = @ForeignKey(name = "fk_bank_vendor"))
    private Vendor vendor;

    @Column(nullable = false, length = 100)
    private String accountHolderName;

    @Column(nullable = false, length = 50)
    private String accountNumber;

    @Column(nullable = false, length = 20)
    private String ifscCode;

    @Column(length = 100)
    private String bankName;

    @Column(nullable = false)
    private Boolean isVerified = false;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(nullable = false)
    private Boolean isPrimary = false;
}
