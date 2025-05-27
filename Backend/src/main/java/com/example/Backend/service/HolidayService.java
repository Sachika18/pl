package com.example.Backend.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.Backend.model.Holiday;
import com.example.Backend.repository.HolidayRepository;

@Service
public class HolidayService {

    @Autowired
    private HolidayRepository holidayRepository;

    public List<Holiday> getAllHolidays() {
        return holidayRepository.findAll();
    }

    public List<Holiday> getHolidaysInRange(LocalDate startDate, LocalDate endDate) {
        return holidayRepository.findByDateBetweenOrderByDate(startDate, endDate);
    }

    public List<Holiday> getUpcomingHolidays() {
        return holidayRepository.findByDateGreaterThanEqualOrderByDate(LocalDate.now());
    }

    public Optional<Holiday> getHolidayById(String id) {
        return holidayRepository.findById(id);
    }

    public Holiday createHoliday(Holiday holiday) {
        return holidayRepository.save(holiday);
    }

    public void deleteHoliday(String id) {
        holidayRepository.deleteById(id);
    }
}