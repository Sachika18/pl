package com.example.Backend.service;

import com.example.Backend.model.Task;
import com.example.Backend.repository.TaskRepository;
import com.example.Backend.repository.UserRepository;
import com.example.Backend.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class TaskServiceImpl implements TaskService {

    @Autowired
    private TaskRepository taskRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Override
    public Task createTask(String title, String description, String assignedTo, LocalDate dueDate, String createdBy) {
        // Verify that the assigned user exists
        userRepository.findById(assignedTo)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + assignedTo));
        
        // Create and save the new task
        Task newTask = new Task(title, description, assignedTo, dueDate, createdBy);
        return taskRepository.save(newTask);
    }
    
    @Override
    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }
    
    @Override
    public Task getTaskById(String id) {
        return taskRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
    }
    
    @Override
    public List<Task> getTasksByUser(String userId) {
        // Verify that the user exists
        userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
            
        return taskRepository.findByAssignedTo(userId);
    }
    
    @Override
    public Task updateTaskStatus(String taskId, Task.TaskStatus newStatus) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));
        
        task.setStatus(newStatus);
        return taskRepository.save(task);
    }
    
    @Override
    public void deleteTask(String taskId) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));
            
        taskRepository.delete(task);
    }
}