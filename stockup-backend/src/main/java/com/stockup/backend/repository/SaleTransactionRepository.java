package com.stockup.backend.repository;

import com.stockup.backend.model.SaleTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SaleTransactionRepository extends JpaRepository<SaleTransaction, String> {

    List<SaleTransaction> findByBusinessIdOrderByCreatedAtDesc(String businessId);

    Page<SaleTransaction> findByBusinessIdOrderByCreatedAtDesc(String businessId, Pageable pageable);

    Optional<SaleTransaction> findByBusinessIdAndInvoiceNumber(String businessId, String invoiceNumber);

    List<SaleTransaction> findTop20ByBusinessIdOrderByCreatedAtDesc(String businessId);

    long countByBusinessId(String businessId);
}
