package com.stockup.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.stockup.backend.model.Item;
import java.util.Optional;

@Repository
public interface ItemRepository extends JpaRepository<Item, String> {
    Optional<Item> findByNameIgnoreCase(String name);
    Optional<Item> findByCodeIgnoreCase(String code);
}