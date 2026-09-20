package com.stockup.backend.service;

import com.stockup.backend.dto.SupplierRecommendationDTO;
import com.stockup.backend.model.Supplier;
import com.stockup.backend.repository.SupplierRepository;
import com.stockup.backend.security.CurrentUserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Supplier Recommendation Module.
 *
 * Addresses the research gap "Manual Suppliers → No data-driven supplier
 * recommendation". Ranks suppliers with a transparent, weighted multi-criteria
 * score (0..100) rather than a black box:
 *
 *   score = w_cost·costScore
 *         + w_lead·leadTimeScore
 *         + w_rel ·reliabilityScore
 *         + w_perf·performanceScore
 *
 * Each sub-score is min-max normalised across the candidate set so lower cost,
 * shorter lead time and lower lead-time variability all map to higher scores.
 * Weights are configurable per request; sensible defaults are used otherwise.
 */
@Service
public class SupplierRecommendationService {

    private static final Logger logger = LoggerFactory.getLogger(SupplierRecommendationService.class);

    // Default criterion weights (must sum to ~1.0)
    private static final double W_COST = 0.30;
    private static final double W_LEAD = 0.25;
    private static final double W_RELIABILITY = 0.20;
    private static final double W_PERFORMANCE = 0.25;

    private final SupplierRepository supplierRepository;
    private final CurrentUserService currentUserService;

    public SupplierRecommendationService(SupplierRepository supplierRepository,
                                         CurrentUserService currentUserService) {
        this.supplierRepository = supplierRepository;
        this.currentUserService = currentUserService;
    }

    /**
     * Rank active suppliers, optionally filtered to those serving {@code category}.
     *
     * @param category optional category/medicine filter (null = all)
     * @param limit    max number of recommendations (<=0 → all)
     */
    public List<SupplierRecommendationDTO> recommend(String category, int limit) {
        Optional<String> bOpt = currentUserService.getCurrentUserBusinessIdOptional();
        List<Supplier> candidates = bOpt.isPresent()
                ? supplierRepository.findByBusinessIdAndStatusIgnoreCase(bOpt.get(), "Active")
                : supplierRepository.findByStatusIgnoreCase("Active");
        if (candidates.isEmpty()) {
            candidates = bOpt.isPresent()
                    ? supplierRepository.findByBusinessId(bOpt.get())
                    : supplierRepository.findAll();
        }

        if (category != null && !category.isBlank()) {
            String needle = category.toLowerCase(Locale.ROOT).trim();
            List<Supplier> filtered = candidates.stream()
                    .filter(s -> s.getSuppliedCategories() != null
                            && s.getSuppliedCategories().toLowerCase(Locale.ROOT).contains(needle))
                    .toList();
            if (!filtered.isEmpty()) {
                candidates = filtered;
            } else {
                logger.info("No suppliers matched category '{}', ranking all active suppliers.", category);
            }
        }

        if (candidates.isEmpty()) {
            return List.of();
        }

        // ── Establish min/max ranges for normalisation ────────────────
        double minCost = Double.MAX_VALUE, maxCost = -Double.MAX_VALUE;
        double minLead = Double.MAX_VALUE, maxLead = -Double.MAX_VALUE;
        double minStd = Double.MAX_VALUE, maxStd = -Double.MAX_VALUE;
        double minPerf = Double.MAX_VALUE, maxPerf = -Double.MAX_VALUE;

        for (Supplier s : candidates) {
            double cost = nz(s.getUnitCost());
            double lead = nz(s.getAvgLeadTimeDays());
            double std = nz(s.getLeadTimeStdDevDays());
            double perf = nz(s.getPerformanceScore());
            minCost = Math.min(minCost, cost); maxCost = Math.max(maxCost, cost);
            minLead = Math.min(minLead, lead); maxLead = Math.max(maxLead, lead);
            minStd = Math.min(minStd, std);   maxStd = Math.max(maxStd, std);
            minPerf = Math.min(minPerf, perf); maxPerf = Math.max(maxPerf, perf);
        }

        List<SupplierRecommendationDTO> results = new ArrayList<>();
        for (Supplier s : candidates) {
            // Lower cost/lead/variability → higher score (inverted normalisation)
            double costScore = invNorm(nz(s.getUnitCost()), minCost, maxCost);
            double leadScore = invNorm(nz(s.getAvgLeadTimeDays()), minLead, maxLead);
            double relScore = invNorm(nz(s.getLeadTimeStdDevDays()), minStd, maxStd);
            // Higher performance → higher score (direct normalisation)
            double perfScore = norm(nz(s.getPerformanceScore()), minPerf, maxPerf);

            double composite = W_COST * costScore
                    + W_LEAD * leadScore
                    + W_RELIABILITY * relScore
                    + W_PERFORMANCE * perfScore;

            SupplierRecommendationDTO dto = new SupplierRecommendationDTO();
            dto.setSupplierId(s.getId());
            dto.setName(s.getName());
            dto.setScore(round(composite));
            dto.setCostScore(round(costScore));
            dto.setLeadTimeScore(round(leadScore));
            dto.setReliabilityScore(round(relScore));
            dto.setPerformanceScore(round(perfScore));
            dto.setUnitCost(s.getUnitCost());
            dto.setAvgLeadTimeDays(s.getAvgLeadTimeDays());
            dto.setLeadTimeStdDevDays(s.getLeadTimeStdDevDays());
            dto.setRawPerformanceScore(s.getPerformanceScore());
            dto.setReason(buildReason(s, costScore, leadScore, relScore, perfScore));
            results.add(dto);
        }

        results.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));
        int rank = 1;
        for (SupplierRecommendationDTO dto : results) {
            dto.setRank(rank++);
        }

        if (limit > 0 && results.size() > limit) {
            results = new ArrayList<>(results.subList(0, limit));
        }
        logger.info("Ranked {} suppliers (category='{}').", results.size(), category);
        return results;
    }

    private String buildReason(Supplier s, double cost, double lead, double rel, double perf) {
        String best = "cost";
        double bestVal = cost;
        if (lead > bestVal) { best = "lead time"; bestVal = lead; }
        if (rel > bestVal) { best = "reliability"; bestVal = rel; }
        if (perf > bestVal) { best = "performance"; }
        return String.format(Locale.US,
                "Strongest on %s. Unit cost %.2f, avg lead time %.1f days (±%.1f), performance %.0f/100.",
                best, nz(s.getUnitCost()), nz(s.getAvgLeadTimeDays()),
                nz(s.getLeadTimeStdDevDays()), nz(s.getPerformanceScore()));
    }

    private static double norm(double v, double min, double max) {
        if (max - min < 1e-9) return 100.0;
        return ((v - min) / (max - min)) * 100.0;
    }

    private static double invNorm(double v, double min, double max) {
        if (max - min < 1e-9) return 100.0;
        return (1.0 - (v - min) / (max - min)) * 100.0;
    }

    private static double nz(Double v) {
        return v == null ? 0.0 : v;
    }

    private static double round(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
