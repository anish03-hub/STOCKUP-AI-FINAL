package com.stockup.backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.stockup.backend.model.Item;
import java.util.List;
import java.util.Optional;

@Repository
public interface ItemRepository extends JpaRepository<Item, String> {
    Optional<Item> findByNameIgnoreCase(String name);
    Optional<Item> findFirstByNameIgnoreCase(String name);
    Optional<Item> findByCodeIgnoreCase(String code);
    Optional<Item> findFirstByCodeIgnoreCase(String code);
    List<Item> findByNameContainingIgnoreCase(String name);

    // ── Multi-Tenant Company Queries ─────────────────────────────────────────
    List<Item> findByBusinessId(String businessId);
    long countByBusinessId(String businessId);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @Query("UPDATE Item i SET i.businessId = :defaultBusinessId WHERE i.businessId IS NULL OR TRIM(i.businessId) = ''")
    int assignUnassignedItemsToBusiness(@Param("defaultBusinessId") String defaultBusinessId);

    Optional<Item> findByIdAndBusinessId(String id, String businessId);
    Optional<Item> findByCodeIgnoreCaseAndBusinessId(String code, String businessId);
    Optional<Item> findFirstByCodeIgnoreCaseAndBusinessId(String code, String businessId);
    Optional<Item> findByNameIgnoreCaseAndBusinessId(String name, String businessId);
    Optional<Item> findFirstByNameIgnoreCaseAndBusinessId(String name, String businessId);

    Page<Item> findByBusinessId(String businessId, Pageable pageable);

    // ── Diagnostic Isolation Experiment ──────────────────────────────────────
    // Temporarily disabled searchItemsByBusinessId and searchItems to measure itemRepository boot duration on Render
    /*
    Page<Item> searchItemsByBusinessId(@Param("businessId") String businessId, @Param("search") String search, Pageable pageable);
    Page<Item> searchItems(@Param("search") String search, Pageable pageable);
    */
}