package com.stockup.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Forecast entity — persists demand-forecast results (the FORECAST table from
 * the system schema). Linked to {@link Item} by a foreign key so each forecast
 * traces back to the product it was generated for
 * (PRODUCT → FORECAST relationship).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "forecasts")
public class Forecast {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    /** Foreign key to the product/item this forecast is for. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id")
    private Item item;

    /** Denormalised label kept for convenience / when the item is external. */
    private String productCode;
    private String productName;

    private String forecastDate;        // ISO date the forecast targets
    private Double predictedDemand;
    private String model;               // e.g. "RandomForest", "GradientBoosting"
    private Double confidence;          // optional 0..1

    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
