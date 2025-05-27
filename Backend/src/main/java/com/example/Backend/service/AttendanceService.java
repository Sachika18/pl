package com.example.Backend.service;

import com.example.Backend.model.Attendance;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceService {
    Attendance checkIn(String userId);
    Attendance checkOut(String attendanceId);
    Optional<Attendance> getTodayAttendance(String userId);
    List<Attendance> getAttendanceByDateRange(String userId, LocalDate fromDate, LocalDate toDate);
    List<Attendance> getUserAttendanceHistory(String userId, int limit);
}
