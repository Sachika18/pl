package com.example.Backend.service;

import java.util.List;
import java.util.Optional;

import com.example.Backend.model.Notification;

public interface NotificationService {
    Notification createNotification(Notification notification);
    List<Notification> getUserNotifications(String userId);
    List<Notification> getUserUnreadNotifications(String userId);
    List<Notification> getUserPinnedNotifications(String userId);
    Optional<Notification> getNotificationById(String id);
    Notification markAsRead(String id);
    Notification togglePin(String id);
    void deleteNotification(String id);
    long getUnreadCount(String userId);
}