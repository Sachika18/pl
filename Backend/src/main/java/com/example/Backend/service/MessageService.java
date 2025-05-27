package com.example.Backend.service;

import com.example.Backend.model.Message;
import com.example.Backend.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    // Save a new message
    public Message saveMessage(Message message) {
        if (message.getTimestamp() == null) {
            message.setTimestamp(LocalDateTime.now());
        }
        return messageRepository.save(message);
    }

    // Get all messages between two users
    public List<Message> getMessagesBetweenUsers(String user1Id, String user2Id) {
        return messageRepository.findMessagesBetweenUsers(user1Id, user2Id);
    }

    // Mark messages as read
    public void markMessagesAsRead(String fromUserId, String toUserId) {
        List<Message> messages = messageRepository.findMessagesBetweenUsers(fromUserId, toUserId);
        messages.forEach(message -> {
            if (message.getTo().equals(toUserId) && !message.isRead()) {
                message.setRead(true);
                messageRepository.save(message);
            }
        });
    }

    // Get unread messages for a user
    public List<Message> getUnreadMessages(String userId) {
        return messageRepository.findByToAndReadFalse(userId);
    }

    // Get all messages for a user (sent or received)
    public List<Message> getAllMessagesForUser(String userId) {
        return messageRepository.findAllMessagesForUser(userId);
    }
}