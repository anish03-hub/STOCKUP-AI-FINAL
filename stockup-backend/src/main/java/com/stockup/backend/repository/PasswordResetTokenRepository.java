package com.stockup.backend.repository;

import com.stockup.backend.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, String> {

    Optional<PasswordResetToken> findByResetTokenHash(String resetTokenHash);

    List<PasswordResetToken> findByIdentifierAndUsedFalse(String identifier);

    @Query("SELECT COUNT(p) FROM PasswordResetToken p WHERE p.identifier = :identifier AND p.createdAt >= :since")
    long countByIdentifierSince(@Param("identifier") String identifier, @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(p) FROM PasswordResetToken p WHERE p.ipAddress = :ipAddress AND p.createdAt >= :since")
    long countByIpAddressSince(@Param("ipAddress") String ipAddress, @Param("since") LocalDateTime since);
}
