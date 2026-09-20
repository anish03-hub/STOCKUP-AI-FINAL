package com.stockup.backend.controller;

import com.stockup.backend.dto.SupplierRecommendationDTO;
import com.stockup.backend.model.Supplier;
import com.stockup.backend.repository.SupplierRepository;
import com.stockup.backend.security.CurrentUserService;
import com.stockup.backend.service.SupplierRecommendationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * REST controller for suppliers: CRUD plus the data-driven ranking endpoint
 * that powers the Supplier Recommendation Module.
 */
@RestController
@RequestMapping("/api/suppliers")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class SupplierController {

    private final SupplierRepository supplierRepository;
    private final SupplierRecommendationService recommendationService;
    private final CurrentUserService currentUserService;

    public SupplierController(SupplierRepository supplierRepository,
                               SupplierRecommendationService recommendationService,
                               CurrentUserService currentUserService) {
        this.supplierRepository = supplierRepository;
        this.recommendationService = recommendationService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public ResponseEntity<List<Supplier>> getAll() {
        Optional<String> bOpt = currentUserService.getCurrentUserBusinessIdOptional();
        List<Supplier> suppliers = bOpt.isPresent()
                ? supplierRepository.findByBusinessId(bOpt.get())
                : supplierRepository.findAll();
        return ResponseEntity.ok(suppliers);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Supplier> getById(@PathVariable @NonNull String id) {
        Optional<String> bOpt = currentUserService.getCurrentUserBusinessIdOptional();
        Optional<Supplier> supplier = bOpt.isPresent()
                ? supplierRepository.findByIdAndBusinessId(id, bOpt.get())
                : supplierRepository.findById(id);
        return supplier
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Supplier> create(@RequestBody Supplier supplier) {
        supplier.setId(null);
        if (supplier.getBusinessId() == null || supplier.getBusinessId().isBlank()) {
            currentUserService.getCurrentUserBusinessIdOptional().ifPresent(supplier::setBusinessId);
        }
        Supplier saved = supplierRepository.save(supplier);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Supplier> update(@PathVariable @NonNull String id, @RequestBody Supplier supplier) {
        Optional<String> bOpt = currentUserService.getCurrentUserBusinessIdOptional();
        if (bOpt.isPresent()) {
            if (supplierRepository.findByIdAndBusinessId(id, bOpt.get()).isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            supplier.setBusinessId(bOpt.get());
        } else if (!supplierRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        supplier.setId(id);
        return ResponseEntity.ok(supplierRepository.save(supplier));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable @NonNull String id) {
        Optional<String> bOpt = currentUserService.getCurrentUserBusinessIdOptional();
        Optional<Supplier> existing = bOpt.isPresent()
                ? supplierRepository.findByIdAndBusinessId(id, bOpt.get())
                : supplierRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        supplierRepository.delete(existing.get());
        return ResponseEntity.noContent().build();
    }

    /**
     * Data-driven supplier ranking.
     *
     * @param category optional category/medicine filter
     * @param limit    max recommendations (default 10)
     */
    @GetMapping("/recommend")
    public ResponseEntity<List<SupplierRecommendationDTO>> recommend(
            @RequestParam(required = false) String category,
            @RequestParam(required = false, defaultValue = "10") int limit) {
        return ResponseEntity.ok(recommendationService.recommend(category, limit));
    }
}
