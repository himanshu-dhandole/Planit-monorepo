package com.teamarc.planit.controller;

import com.teamarc.planit.dto.request.ChatMessageRequestDTO;
import com.teamarc.planit.dto.request.StartConversationRequestDTO;
import com.teamarc.planit.dto.response.ChatMessageResponseDTO;
import com.teamarc.planit.dto.response.ConversationResponseDTO;
import com.teamarc.planit.dto.response.UserSearchResponseDTO;
import com.teamarc.planit.entity.User;
import com.teamarc.planit.services.ChatService;
import com.teamarc.planit.services.KafkaProducerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final ChatService chatService;
    private final KafkaProducerService kafkaProducerService;

    @PostMapping("/api/chat/conversations")
    public ResponseEntity<ConversationResponseDTO> startConversation(
            @RequestBody StartConversationRequestDTO request) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(chatService.startConversation(user.getId(), request));
    }

    @GetMapping("/api/chat/conversations")
    public ResponseEntity<List<ConversationResponseDTO>> getUserConversations() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(chatService.getUserConversations(user.getId()));
    }

    @GetMapping("/api/chat/conversations/{conversationId}/messages")
    public ResponseEntity<List<ChatMessageResponseDTO>> getMessagesHistory(
            @PathVariable Long conversationId) {
        return ResponseEntity.ok(chatService.getMessagesHistory(conversationId));
    }

    @GetMapping("/api/chat/search")
    public ResponseEntity<UserSearchResponseDTO> searchByPhoneNumber(
            @RequestParam String phoneNumber) {
        return ResponseEntity.ok(chatService.searchByPhoneNumber(phoneNumber));
    }

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessageRequestDTO request) {
        log.info("WebSocket chat.sendMessage received request: {}", request);
        ChatMessageResponseDTO savedMsg = chatService.saveMessage(
                request.getConversationId(),
                request.getSenderId(),
                request.getContent()
        );
        kafkaProducerService.sendMessage(savedMsg);
    }
}
