package com.example.Backend.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.Backend.model.Holiday;

public interface HolidayRepository extends MongoRepository<Holiday, String> {
    List<Holiday> findByDateBetweenOrderByDate(LocalDate startDate, LocalDate endDate);
    List<Holiday> findByDateGreaterThanEqualOrderByDate(LocalDate date);
}