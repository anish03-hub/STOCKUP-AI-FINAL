package com.stockup.backend.repository;

import com.stockup.backend.model.DocumentProcessing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentProcessingRepository extends JpaRepository<DocumentProcessing, String> {

    List<DocumentProcessing> findAllByBusinessIdOrderByCreatedAtDesc(String businessId);

    Optional<DocumentProcessing> findByIdAndBusinessId(String id, String businessId);

    boolean existsByBusinessIdAndInvoiceNumberAndStatus(String businessId, String invoiceNumber, String status);

    List<DocumentProcessing> findAllByBusinessIdAndInvoiceNumber(String businessId, String invoiceNumber);
}
