package com.stockup.backend.repository;

import com.stockup.backend.model.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, String> {
    Optional<Supplier> findByNameIgnoreCase(String name);
    List<Supplier> findByStatusIgnoreCase(String status);

    // ── Multi-Tenant Company Queries ─────────────────────────────────────────
    List<Supplier> findByBusinessId(String businessId);
    long countByBusinessId(String businessId);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @org.springframework.data.jpa.repository.Query("UPDATE Supplier s SET s.businessId = :defaultBusinessId WHERE s.businessId IS NULL OR TRIM(s.businessId) = ''")
    int assignUnassignedSuppliersToBusiness(@org.springframework.data.repository.query.Param("defaultBusinessId") String defaultBusinessId);

    Optional<Supplier> findByIdAndBusinessId(String id, String businessId);
    Optional<Supplier> findByNameIgnoreCaseAndBusinessId(String name, String businessId);
    List<Supplier> findByBusinessIdAndStatusIgnoreCase(String businessId, String status);
}

