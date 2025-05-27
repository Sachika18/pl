package com.example.Backend.service;

import com.example.Backend.model.Notification;
import com.example.Backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class NotificationServiceImpl implements NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Override
    public Notification createNotification(Notification notification) {
        return notificationRepository.save(notification);
    }

    @Override
    public List<Notification> getUserNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public List<Notification> getUserUnreadNotifications(String userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    }

    @Override
    public List<Notification> getUserPinnedNotifications(String userId) {
        return notificationRepository.findByUserIdAndIsPinnedTrueOrderByCreatedAtDesc(userId);
    }

    @Override
    public Optional<Notification> getNotificationById(String id) {
        return notificationRepository.findById(id);
    }

    @Override
    public Notification markAsRead(String id) {
        Optional<Notification> notificationOpt = notificationRepository.findById(id);
        if (notificationOpt.isPresent()) {
            Notification notification = notificationOpt.get();
            notification.setRead(true);
            return notificationRepository.save(notification);
        }
        throw new IllegalArgumentException("Notification not found with id: " + id);
    }

    @Override
    public Notification togglePin(String id) {
        Optional<Notification> notificationOpt = notificationRepository.findById(id);
        if (notificationOpt.isPresent()) {
            Notification notification = notificationOpt.get();
            notification.setPinned(!notification.isPinned());
            return notificationRepository.save(notification);
        }
        throw new IllegalArgumentException("Notification not found with id: " + id);
    }

    @Override
    public void deleteNotification(String id) {
        notificationRepository.deleteById(id);
    }

    @Override
    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }
}