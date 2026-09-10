package com.stockup.backend.repository;

import com.stockup.backend.model.Forecast;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ForecastRepository extends JpaRepository<Forecast, String> {
    List<Forecast> findByProductCodeIgnoreCaseOrderByCreatedAtDesc(String productCode);
    List<Forecast> findTop50ByOrderByCreatedAtDesc();
}
