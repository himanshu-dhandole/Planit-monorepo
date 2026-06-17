package com.teamarc.planit.services;

import com.teamarc.planit.dto.request.StartConversationRequestDTO;
import com.teamarc.planit.dto.response.ChatMessageResponseDTO;
import com.teamarc.planit.dto.response.ConversationResponseDTO;
import com.teamarc.planit.dto.response.UserSearchResponseDTO;
import com.teamarc.planit.entity.*;
import com.teamarc.planit.exceptions.ResourceNotFoundException;
import com.teamarc.planit.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final CustomerRepository customerRepository;
    private final VendorRepository vendorRepository;
    private final ServicesRepository servicesRepository;
    private final UserRepository userRepository;

    @Transactional
    public ConversationResponseDTO startConversation(Long currentUserId, StartConversationRequestDTO request) {
        Customer customer = null;
        Vendor vendor = null;

        if (request.getCustomerId() != null) {
            customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.getCustomerId()));
            vendor = vendorRepository.findByUser_Id(currentUserId)
                    .orElseThrow(() -> new ResourceNotFoundException("Vendor profile not found for current user: " + currentUserId));
        } else if (request.getVendorId() != null) {
            vendor = vendorRepository.findById(request.getVendorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + request.getVendorId()));
            customer = customerRepository.findByUserId(currentUserId);
            if (customer == null) {
                throw new ResourceNotFoundException("Customer profile not found for current user: " + currentUserId);
            }
        } else {
            throw new IllegalArgumentException("Either vendorId or customerId must be provided");
        }

        Services service = null;
        if (request.getServiceId() != null) {
            service = servicesRepository.findById(request.getServiceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Service not found with id: " + request.getServiceId()));
        }

        Optional<Conversation> existingOpt;
        if (service != null) {
            existingOpt = conversationRepository.findByCustomer_IdAndVendor_IdAndService_Id(
                    customer.getId(), vendor.getId(), service.getId()
            );
        } else {
            existingOpt = conversationRepository.findByCustomer_IdAndVendor_IdAndServiceIsNull(
                    customer.getId(), vendor.getId()
            );
        }

        Conversation conversation;
        if (existingOpt.isPresent()) {
            conversation = existingOpt.get();
        } else {
            conversation = Conversation.builder()
                    .customer(customer)
                    .vendor(vendor)
                    .service(service)
                    .build();
            conversation = conversationRepository.save(conversation);
        }

        return mapToConversationResponse(conversation);
    }

    public List<ConversationResponseDTO> getUserConversations(Long currentUserId) {
        Customer customer = customerRepository.findByUserId(currentUserId);
        Vendor vendor = vendorRepository.findByUser_Id(currentUserId).orElse(null);

        List<Conversation> conversations = new ArrayList<>();
        if (customer != null) {
            conversations.addAll(conversationRepository.findByCustomer_Id(customer.getId()));
        }
        if (vendor != null) {
            conversations.addAll(conversationRepository.findByVendor_Id(vendor.getId()));
        }

        Set<Long> uniqueIds = new HashSet<>();
        List<Conversation> uniqueConversations = new ArrayList<>();
        for (Conversation c : conversations) {
            if (uniqueIds.add(c.getId())) {
                uniqueConversations.add(c);
            }
        }

        return uniqueConversations.stream()
                .map(this::mapToConversationResponse)
                .sorted((a, b) -> {
                    LocalDateTime t1 = a.getLastMessageTime() != null ? a.getLastMessageTime() : LocalDateTime.MIN;
                    LocalDateTime t2 = b.getLastMessageTime() != null ? b.getLastMessageTime() : LocalDateTime.MIN;
                    return t2.compareTo(t1);
                })
                .collect(Collectors.toList());
    }

    public List<ChatMessageResponseDTO> getMessagesHistory(Long conversationId) {
        return chatMessageRepository.findByConversation_IdOrderByTimestampAsc(conversationId).stream()
                .map(this::mapToChatMessageResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ChatMessageResponseDTO saveMessage(Long conversationId, Long senderId, String content) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));

        ChatMessage msg = ChatMessage.builder()
                .conversation(conversation)
                .senderId(senderId)
                .content(content)
                .timestamp(LocalDateTime.now())
                .build();

        msg = chatMessageRepository.save(msg);
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        return mapToChatMessageResponse(msg);
    }

    private ConversationResponseDTO mapToConversationResponse(Conversation conv) {
        List<ChatMessage> msgs = chatMessageRepository.findByConversation_IdOrderByTimestampAsc(conv.getId());
        String lastMessage = msgs.isEmpty() ? "" : msgs.get(msgs.size() - 1).getContent();
        LocalDateTime lastTime = msgs.isEmpty() ? conv.getCreatedAt() : msgs.get(msgs.size() - 1).getTimestamp();

        String customerName = conv.getCustomer().getFirstName() + " " + conv.getCustomer().getLastName();
        String vendorName = conv.getVendor().getBusinessName();

        return ConversationResponseDTO.builder()
                .id(conv.getId())
                .customerId(conv.getCustomer().getId())
                .customerName(customerName)
                .vendorId(conv.getVendor().getId())
                .vendorBusinessName(vendorName)
                .serviceId(conv.getService() != null ? conv.getService().getId() : null)
                .serviceName(conv.getService() != null ? conv.getService().getName() : "General Inquiry")
                .lastMessage(lastMessage)
                .lastMessageTime(lastTime)
                .build();
    }

    private ChatMessageResponseDTO mapToChatMessageResponse(ChatMessage msg) {
        User sender = userRepository.findById(msg.getSenderId()).orElse(null);
        String senderName = sender != null ? sender.getName() : "Unknown";

        return ChatMessageResponseDTO.builder()
                .id(msg.getId())
                .conversationId(msg.getConversation().getId())
                .senderId(msg.getSenderId())
                .senderName(senderName)
                .content(msg.getContent())
                .timestamp(msg.getTimestamp())
                .build();
    }

    public UserSearchResponseDTO searchByPhoneNumber(String phoneNumber) {
        Optional<Vendor> vendorOpt = vendorRepository.findByPhoneNumber(phoneNumber);
        if (vendorOpt.isPresent()) {
            Vendor v = vendorOpt.get();
            return UserSearchResponseDTO.builder()
                    .id(v.getId())
                    .name(v.getBusinessName())
                    .type("VENDOR")
                    .phoneNumber(v.getPhoneNumber())
                    .build();
        }

        Optional<Customer> customerOpt = customerRepository.findByPhoneNumber(phoneNumber);
        if (customerOpt.isPresent()) {
            Customer c = customerOpt.get();
            return UserSearchResponseDTO.builder()
                    .id(c.getId())
                    .name(c.getFirstName() + " " + c.getLastName())
                    .type("CUSTOMER")
                    .phoneNumber(c.getPhoneNumber())
                    .build();
        }

        throw new ResourceNotFoundException("No vendor or customer found with phone number: " + phoneNumber);
    }
}
