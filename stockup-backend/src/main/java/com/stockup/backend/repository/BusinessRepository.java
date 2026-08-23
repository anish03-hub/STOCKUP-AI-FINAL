package com.stockup.backend.repository;

import com.stockup.backend.model.Business;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BusinessRepository extends JpaRepository<Business, String> {

    Optional<Business> findByEmail(String email);

    Optional<Business> findByPhone(String phone);

}