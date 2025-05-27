package com.example.Backend.controller;

import com.example.Backend.model.Message;
import com.example.Backend.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // REST endpoint to get messages between two users
    @GetMapping("/{user1Id}/{user2Id}")
    public ResponseEntity<List<Message>> getMessagesBetweenUsers(
            @PathVariable String user1Id,
            @PathVariable String user2Id) {
        List<Message> messages = messageService.getMessagesBetweenUsers(user1Id, user2Id);
        return ResponseEntity.ok(messages);
    }

    // REST endpoint to mark messages as read
    @PutMapping("/read/{fromUserId}/{toUserId}")
    public ResponseEntity<Void> markMessagesAsRead(
            @PathVariable String fromUserId,
            @PathVariable String toUserId) {
        messageService.markMessagesAsRead(fromUserId, toUserId);
        return ResponseEntity.ok().build();
    }

    // REST endpoint to get unread messages for a user
    @GetMapping("/unread/{userId}")
    public ResponseEntity<List<Message>> getUnreadMessages(@PathVariable String userId) {
        List<Message> unreadMessages = messageService.getUnreadMessages(userId);
        return ResponseEntity.ok(unreadMessages);
    }

    // WebSocket endpoint to send a message
    @MessageMapping("/chat")
    public void processMessage(@Payload Message message) {
        Message savedMessage = messageService.saveMessage(message);
        
        // Send the message to the specific user's topic
        messagingTemplate.convertAndSend("/topic/messages/" + message.getTo(), savedMessage);
        
        // Also send back to sender for confirmation
        messagingTemplate.convertAndSend("/topic/messages/" + message.getFrom(), savedMessage);
    }
}