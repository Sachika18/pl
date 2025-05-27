package com.example.Backend.repository;

import com.example.Backend.model.Task;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends MongoRepository<Task, String> {
    
    // Find tasks assigned to a specific user
    List<Task> findByAssignedTo(String userId);
    
    // Find tasks by status
    List<Task> findByStatus(Task.TaskStatus status);
    
    // Find tasks assigned to a user with a specific status
    List<Task> findByAssignedToAndStatus(String userId, Task.TaskStatus status);
}