
package com.example.Backend.service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.Backend.model.Attendance;
import com.example.Backend.repository.AttendanceRepository;

@Service
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRepository attendanceRepository;

    @Autowired
    public AttendanceServiceImpl(AttendanceRepository attendanceRepository) {
        this.attendanceRepository = attendanceRepository;
    }

    @Override
    public Attendance checkIn(String userId) {
        // Create a new attendance record with current time
        Attendance attendance = new Attendance(userId, LocalDateTime.now());
        return attendanceRepository.save(attendance);
    }

    @Override
    public Attendance checkOut(String attendanceId) {
        // Find the attendance record by ID
        Optional<Attendance> attendanceOpt = attendanceRepository.findById(attendanceId);

        if (attendanceOpt.isPresent()) {
            Attendance attendance = attendanceOpt.get();

            // Set check-out time (which also calculates hours and updates status)
            attendance.setCheckOutTime(LocalDateTime.now());

            // Save and return updated record
            return attendanceRepository.save(attendance);
        } else {
            throw new RuntimeException("Attendance record not found");
        }
    }

    @Override
    public Optional<Attendance> getTodayAttendance(String userId) {
        try {
            // Get today's date range (from start to end of day)
            LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
            LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

            // Find attendance record for today using a more direct approach
            List<Attendance> todayAttendances = attendanceRepository.findByUserIdAndDateBetweenOrderByDateDesc(userId, startOfDay, endOfDay);
            
            if (!todayAttendances.isEmpty()) {
                return Optional.of(todayAttendances.get(0));
            } else {
                return Optional.empty();
            }
        } catch (Exception e) {
            System.err.println("Error in getTodayAttendance: " + e.getMessage());
            e.printStackTrace();
            return Optional.empty();
        }
    }

    @Override
    public List<Attendance> getAttendanceByDateRange(String userId, LocalDate fromDate, LocalDate toDate) {
        // Convert dates to LocalDateTime (start of first day to end of last day)
        LocalDateTime startDateTime = fromDate.atStartOfDay();
        LocalDateTime endDateTime = toDate.atTime(LocalTime.MAX);

        // Get attendance records for the date range
        return attendanceRepository.findByUserIdAndDateBetweenOrderByDateDesc(userId, startDateTime, endDateTime);
    }

    @Override
    public List<Attendance> getUserAttendanceHistory(String userId, int limit) {
        // Get most recent attendance records
        return attendanceRepository.findByUserIdOrderByDateDesc(userId, limit);
    }
}