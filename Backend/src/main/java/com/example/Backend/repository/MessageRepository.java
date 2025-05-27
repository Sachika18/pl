package com.example.Backend.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.Backend.model.Message;

@Repository
public interface MessageRepository extends MongoRepository<Message, String> {
    
    // Find messages between two users, ordered by timestamp
    @Query("{ $or: [ { 'from': ?0, 'to': ?1 }, { 'from': ?1, 'to': ?0 } ] }")
    List<Message> findMessagesBetweenUsers(String user1Id, String user2Id);
    
    // Find unread messages for a specific user
    List<Message> findByToAndReadFalse(String userId);
    
    // Find all messages for a specific user (sent or received)
    @Query("{ $or: [ { 'from': ?0 }, { 'to': ?0 } ] }")
    List<Message> findAllMessagesForUser(String userId);
}