package com.stockup.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Supplier entity — backs the Supplier Recommendation and Lead Time
 * Prediction modules. Persisted to PostgreSQL (table "suppliers").
 *
 * Ranking-relevant fields:
 *   unitCost           — average unit cost offered (lower is better)
 *   avgLeadTimeDays    — historical mean lead time in days (lower is better)
 *   leadTimeStdDevDays — variability of lead time (lower = more reliable)
 *   performanceScore   — on-time / quality score 0..100 (higher is better)
 *   fulfilledOrders    — number of orders completed (experience signal)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "suppliers")
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;
    private String contactPerson;
    private String phone;
    private String email;

    @Column(length = 500)
    private String address;

    private String city;
    private String state;

    private String status; // "Active" | "Inactive"

    // ── Ranking / lead-time signals ────────────────────────────────
    private Double unitCost;            // average unit cost offered
    private Double avgLeadTimeDays;     // historical mean lead time (days)
    private Double leadTimeStdDevDays;  // historical lead-time variability (days)
    private Double performanceScore;    // 0..100 on-time + quality score
    private Integer fulfilledOrders;    // completed-order count

    @Column(length = 500)
    private String suppliedCategories;  // comma-separated categories/medicines

    @Column(name = "business_id")
    private String businessId;
}

