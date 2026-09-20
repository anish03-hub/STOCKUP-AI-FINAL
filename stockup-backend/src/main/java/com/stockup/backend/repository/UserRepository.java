package com.stockup.backend.repository;

import com.stockup.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByGoogleSubject(String googleSubject);

    Optional<User> findByPhone(String phone);

    List<User> findByBusinessId(String businessId);

    long countByBusinessId(String businessId);

    long countByAuthProvider(String authProvider);

    long countByBusinessIdAndAuthProvider(String businessId, String authProvider);

}