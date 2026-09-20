package com.stockup.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entity mapping historical pharmacy sales data from the 2020-2025 daily dataset.
 * Persisted in PostgreSQL table "daily_sales".
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "daily_sales", indexes = {
    @Index(name = "idx_daily_sales_business_date", columnList = "business_id, date"),
    @Index(name = "idx_daily_sales_business_med", columnList = "business_id, medicine"),
    @Index(name = "idx_daily_sales_business_country", columnList = "business_id, country"),
    @Index(name = "idx_daily_sales_business_region", columnList = "business_id, region"),
    @Index(name = "idx_daily_sales_business_cat", columnList = "business_id, category"),
    @Index(name = "idx_daily_sales_business_covid", columnList = "business_id, covid_flag")
})
public class DailySale {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "year")
    private Integer year;

    @Column(name = "month")
    private Integer month;

    @Column(name = "day")
    private Integer day;

    @Column(name = "region")
    private String region;

    @Column(name = "country")
    private String country;

    @Column(name = "category")
    private String category;

    @Column(name = "medicine", nullable = false)
    private String medicine;

    @Column(name = "age_group")
    private String ageGroup;

    @Column(name = "units_sold", nullable = false)
    private Integer unitsSold;

    @Column(name = "unit_price", nullable = false)
    private Double unitPrice;

    @Column(name = "total_revenue")
    private Double totalRevenue;

    @Column(name = "stock_level")
    private Integer stockLevel;

    @Column(name = "expiry_days_remaining")
    private Integer expiryDaysRemaining;

    @Column(name = "covid_flag")
    private Boolean covidFlag;

    @Column(name = "business_id", nullable = false)
    private String businessId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (totalRevenue == null && unitsSold != null && unitPrice != null) {
            totalRevenue = unitsSold * unitPrice;
        }
    }
}
