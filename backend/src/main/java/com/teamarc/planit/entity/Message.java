package com.teamarc.planit.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Represents an individual message within a Conversation.
 * The sender references the existing security {@link User} entity
 * which is the authenticated principal in the application.
 */
@Entity
@Table(name = "messages", indexes = {
        @Index(name = "idx_conversation_message", columnList = "conversation_id"),
        @Index(name = "idx_message_sender", columnList = "sender_id"),
        @Index(name = "idx_message_sent_at", columnList = "sent_at"),
        @Index(name = "idx_message_is_read", columnList = "is_read")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Message extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false, foreignKey = @ForeignKey(name = "fk_message_conversation"))
    private Conversation conversation;

    /**
     * References the AppUser domain entity which holds the full user profile.
     * Must match the type expected by {@link AppUser#messages} (mappedBy = "sender").
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false, foreignKey = @ForeignKey(name = "fk_message_sender"))
    private AppUser sender;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String messageText;

    @Column(nullable = false)
    private Boolean isRead = false;

    @Column(nullable = false)
    private LocalDateTime sentAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(length = 500)
    private String attachmentUrl;

    @Column(length = 50)
    private String messageType = "TEXT";
}
