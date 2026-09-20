package com.stockup.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "items")
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    private String name;
    private String code;
    private String category;
    private String manufacturer;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private Double price;
    private Double sellingPrice;
    
    private Integer quantity; // mapped from Quantity / currentStock
    private String expiryDate; // ISO date string YYYY-MM-DD
    private String status; // "In Stock", "Low Stock", "Out of Stock", "Expired"
    
    @Column(name = "business_id")
    private String businessId;
}