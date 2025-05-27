package com.example.Backend.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Backend.config.JwtTokenUtil;
import com.example.Backend.model.Task;
import com.example.Backend.service.TaskService;
import com.example.Backend.service.UserService;
import com.example.Backend.util.NotificationGenerator;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskService taskService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private JwtTokenUtil jwtTokenUtil;
    
    @Autowired
    private NotificationGenerator notificationGenerator;

    // Create a new task
    @PostMapping
    public ResponseEntity<Task> createTask(
            @RequestBody Map<String, Object> taskRequest,
            @RequestHeader("Authorization") String authHeader) {
        
        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            
            // Get user ID from token
            String adminId = jwtTokenUtil.getUserIdFromToken(token);
            
            // Extract task details from request
            String title = (String) taskRequest.get("title");
            String description = (String) taskRequest.get("description");
            String assignedTo = (String) taskRequest.get("assignedTo");
            LocalDate dueDate = LocalDate.parse((String) taskRequest.get("dueDate"));
            
            // Create the task
            Task newTask = taskService.createTask(title, description, assignedTo, dueDate, adminId);
            
            // Generate notification for the assigned user
            notificationGenerator.generateTaskAssignmentNotification(newTask);
            
            return new ResponseEntity<>(newTask, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }
    
    // Get all tasks
    @GetMapping
    public ResponseEntity<List<Task>> getAllTasks() {
        System.out.println("TaskController: getAllTasks() called");
        List<Task> tasks = taskService.getAllTasks();
        System.out.println("TaskController: Found " + tasks.size() + " tasks");
        return new ResponseEntity<>(tasks, HttpStatus.OK);
    }
    
    // Get task by ID
    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(@PathVariable String id) {
        Task task = taskService.getTaskById(id);
        return new ResponseEntity<>(task, HttpStatus.OK);
    }
    
    // Get tasks assigned to a specific user
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Task>> getTasksByUser(@PathVariable String userId) {
        List<Task> tasks = taskService.getTasksByUser(userId);
        return new ResponseEntity<>(tasks, HttpStatus.OK);
    }
    
    // Get tasks assigned to the current user
    @GetMapping("/my-tasks")
    public ResponseEntity<List<Task>> getMyTasks(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            
            // Get user ID from token
            String userId = jwtTokenUtil.getUserIdFromToken(token);
            
            List<Task> tasks = taskService.getTasksByUser(userId);
            return new ResponseEntity<>(tasks, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
    }
    
    // Update task status
    @PutMapping("/{id}/status")
    public ResponseEntity<Task> updateTaskStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> statusUpdate) {
        try {
            System.out.println("TaskController: Updating task status for ID: " + id);
            System.out.println("TaskController: Received status update: " + statusUpdate);
            
            String statusStr = statusUpdate.get("status");
            if (statusStr == null) {
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            }
            
            Task.TaskStatus newStatus = Task.TaskStatus.valueOf(statusStr.toUpperCase());
            Task updatedTask = taskService.updateTaskStatus(id, newStatus);
            
            // If task is completed, generate notification for the task creator
            if (newStatus == Task.TaskStatus.COMPLETED) {
                notificationGenerator.generateTaskCompletionNotification(updatedTask, updatedTask.getCreatedBy());
            }
            
            System.out.println("TaskController: Task status updated successfully: " + updatedTask);
            return new ResponseEntity<>(updatedTask, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            System.out.println("TaskController: Invalid status value: " + e.getMessage());
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            System.out.println("TaskController: Error updating task status: " + e.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    // Delete a task
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable String id) {
        taskService.deleteTask(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}