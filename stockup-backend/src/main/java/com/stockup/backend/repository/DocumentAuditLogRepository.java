package com.stockup.backend.repository;

import com.stockup.backend.model.DocumentAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentAuditLogRepository extends JpaRepository<DocumentAuditLog, String> {

    List<DocumentAuditLog> findAllByBusinessIdOrderByTimestampDesc(String businessId);
}
