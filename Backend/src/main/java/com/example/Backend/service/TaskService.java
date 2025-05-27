package com.example.Backend.service;

import com.example.Backend.model.Task;
import java.time.LocalDate;
import java.util.List;

public interface TaskService {
    
    // Create a new task
    Task createTask(String title, String description, String assignedTo, LocalDate dueDate, String createdBy);
    
    // Get all tasks
    List<Task> getAllTasks();
    
    // Get task by ID
    Task getTaskById(String id);
    
    // Get tasks assigned to a specific user
    List<Task> getTasksByUser(String userId);
    
    // Update task status
    Task updateTaskStatus(String taskId, Task.TaskStatus newStatus);
    
    // Delete a task
    void deleteTask(String taskId);
}