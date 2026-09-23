package com.stockup.backend.repository;

import com.stockup.backend.model.PurchaseOrder;
import com.stockup.backend.model.PurchaseOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, String> {

    Optional<PurchaseOrder> findByPoNumber(String poNumber);

    List<PurchaseOrder> findAllByOrderByCreatedAtDesc();

    List<PurchaseOrder> findByStatusOrderByCreatedAtDesc(PurchaseOrderStatus status);

    List<PurchaseOrder> findByItemId(String itemId);

    long countByStatus(PurchaseOrderStatus status);

    // ── Multi-Tenant Company Queries ─────────────────────────────────────────
    List<PurchaseOrder> findByBusinessIdOrderByCreatedAtDesc(String businessId);
    long countByBusinessId(String businessId);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @org.springframework.data.jpa.repository.Query("UPDATE PurchaseOrder po SET po.businessId = :defaultBusinessId WHERE po.businessId IS NULL OR TRIM(po.businessId) = ''")
    int assignUnassignedPurchaseOrdersToBusiness(@org.springframework.data.repository.query.Param("defaultBusinessId") String defaultBusinessId);

    List<PurchaseOrder> findByBusinessIdAndStatusOrderByCreatedAtDesc(String businessId, PurchaseOrderStatus status);

    Optional<PurchaseOrder> findByIdAndBusinessId(String id, String businessId);

    Optional<PurchaseOrder> findByPoNumberAndBusinessId(String poNumber, String businessId);

    long countByBusinessIdAndStatus(String businessId, PurchaseOrderStatus status);
}

