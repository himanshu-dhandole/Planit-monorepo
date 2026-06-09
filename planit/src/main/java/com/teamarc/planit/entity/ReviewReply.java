package com.teamarc.planit.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "review_replies", indexes = {
    @Index(name = "idx_review_reply", columnList = "review_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReviewReply extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false, foreignKey = @ForeignKey(name = "fk_reply_review"))
    private Review review;

    @Column(nullable = false, length = 50)
    private String repliedBy;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String replyText;

    @Column(name = "replied_at", nullable = false)
    private LocalDateTime repliedAt;
}
