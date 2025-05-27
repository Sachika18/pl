package com.example.Backend.util;

import com.example.Backend.model.Holiday;
import com.example.Backend.repository.HolidayRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Component
@Order(3) // Run after other initializers
public class HolidayInitializer implements CommandLineRunner {

    @Autowired
    private HolidayRepository holidayRepository;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("HolidayInitializer is running...");
        
        // Check if holidays already exist
        long count = holidayRepository.count();
        System.out.println("Current holiday count: " + count);
        
        if (count == 0) {
            // Create sample holidays for 2025
            List<Holiday> holidays = Arrays.asList(
                // National holidays
                new Holiday(null, "New Year's Day", LocalDate.of(2025, 1, 1), "NATIONAL", "New Year's Day celebration", "#05CD99"),
                new Holiday(null, "Republic Day", LocalDate.of(2025, 1, 26), "NATIONAL", "Republic Day celebration", "#05CD99"),
                new Holiday(null, "Independence Day", LocalDate.of(2025, 8, 15), "NATIONAL", "Independence Day celebration", "#05CD99"),
                new Holiday(null, "Gandhi Jayanti", LocalDate.of(2025, 10, 2), "NATIONAL", "Gandhi Jayanti celebration", "#05CD99"),
                
                // Festival holidays
                new Holiday(null, "Holi", LocalDate.of(2025, 3, 14), "FESTIVAL", "Festival of colors", "#FF9800"),
                new Holiday(null, "Diwali", LocalDate.of(2025, 11, 12), "FESTIVAL", "Festival of lights", "#FF9800"),
                new Holiday(null, "Christmas", LocalDate.of(2025, 12, 25), "FESTIVAL", "Christmas celebration", "#FF9800"),
                
                // Government holidays
                new Holiday(null, "Labor Day", LocalDate.of(2025, 5, 1), "GOVERNMENT", "International Workers' Day", "#3F51B5"),
                new Holiday(null, "Constitution Day", LocalDate.of(2025, 11, 26), "GOVERNMENT", "Constitution Day of India", "#3F51B5"),
                
                // Company holidays
                new Holiday(null, "Company Foundation Day", LocalDate.of(2025, 6, 15), "COMPANY", "Company foundation day celebration", "#9C27B0"),
                new Holiday(null, "Annual Day", LocalDate.of(2025, 9, 20), "COMPANY", "Company annual day celebration", "#9C27B0")
            );
            
            holidayRepository.saveAll(holidays);
            System.out.println("Sample holidays created successfully!");
        } else {
            System.out.println("Holidays already exist, skipping initialization.");
        }
    }
}