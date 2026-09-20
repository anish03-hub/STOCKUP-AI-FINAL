package com.stockup.backend.service;

import com.stockup.backend.dto.LeadTimePredictionResponse;
import com.stockup.backend.model.Supplier;
import com.stockup.backend.repository.SupplierRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Optional;

/**
 * Lead Time Prediction Module.
 *
 * Addresses the research gap "Variable lead times → estimate lead time".
 * Models a supplier's delivery lead time as a normal distribution
 * N(mean, stdDev) built from historical performance, and returns a
 * service-level planning value:
 *
 *   plannedLeadTime = mean + Z(serviceLevel) · stdDev
 *
 * where Z is the standard-normal quantile for the requested service level.
 * The variability (stdDev relative to mean) is mapped to a risk level so
 * planners know how much buffer the estimate carries.
 */
@Service
public class LeadTimePredictionService {

    private static final Logger logger = LoggerFactory.getLogger(LeadTimePredictionService.class);

    private final SupplierRepository supplierRepository;

    public LeadTimePredictionService(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    public LeadTimePredictionResponse predict(String supplierId, String supplierName, double serviceLevel) {
        Optional<Supplier> found = Optional.empty();
        if (supplierId != null && !supplierId.isBlank()) {
            found = supplierRepository.findById(supplierId);
        }
        if (found.isEmpty() && supplierName != null && !supplierName.isBlank()) {
            found = supplierRepository.findByNameIgnoreCase(supplierName.trim());
        }
        if (found.isEmpty()) {
            throw new IllegalArgumentException("Supplier not found for the given id/name.");
        }

        Supplier s = found.get();
        double mean = s.getAvgLeadTimeDays() == null ? 0.0 : s.getAvgLeadTimeDays();
        double std = s.getLeadTimeStdDevDays() == null ? 0.0 : s.getLeadTimeStdDevDays();
        double level = (serviceLevel <= 0 || serviceLevel >= 1) ? 0.95 : serviceLevel;

        double z = zScore(level);
        double planned = mean + z * std;
        double lower = Math.max(0, mean - z * std);

        // Coefficient of variation drives the risk classification.
        double cv = mean > 0 ? std / mean : 0;
        String risk;
        if (cv < 0.15) {
            risk = "LOW";
        } else if (cv < 0.35) {
            risk = "MEDIUM";
        } else {
            risk = "HIGH";
        }

        LeadTimePredictionResponse resp = new LeadTimePredictionResponse();
        resp.setSupplierId(s.getId());
        resp.setSupplierName(s.getName());
        resp.setPredictedLeadTimeDays(round(mean));
        resp.setLowerBoundDays(round(lower));
        resp.setUpperBoundDays(round(planned));
        resp.setServiceLevel(level);
        resp.setRiskLevel(risk);
        resp.setMethod("Normal-distribution service-level estimate: mean + Z(" + level + ")·stdDev");
        resp.setExplanation(String.format(Locale.US,
                "Expected lead time %.1f days. Plan for %.1f days to meet a %.0f%% service level "
                + "(variability ±%.1f days, %s risk).",
                mean, planned, level * 100, std, risk));

        logger.info("Lead-time prediction for '{}': mean={}, planned={}, risk={}",
                s.getName(), mean, planned, risk);
        return resp;
    }

    /**
     * Standard-normal quantile (inverse CDF) for common service levels.
     * Falls back to a rational approximation (Beasley-Springer/Moro) otherwise.
     */
    private static double zScore(double p) {
        if (p >= 0.995) return 2.576;
        if (p >= 0.99) return 2.326;
        if (p >= 0.975) return 1.960;
        if (p >= 0.95) return 1.645;
        if (p >= 0.90) return 1.282;
        if (p >= 0.85) return 1.036;
        if (p >= 0.80) return 0.842;
        return inverseNormalCdf(p);
    }

    private static double inverseNormalCdf(double p) {
        // Acklam's rational approximation.
        final double a1 = -39.6968302866538, a2 = 220.946098424521, a3 = -275.928510446969;
        final double a4 = 138.357751867269, a5 = -30.6647980661472, a6 = 2.50662827745924;
        final double b1 = -54.4760987982241, b2 = 161.585836858041, b3 = -155.698979859887;
        final double b4 = 66.8013118877197, b5 = -13.2806815528857;
        final double c1 = -0.00778489400243029, c2 = -0.322396458041136, c3 = -2.40075827716184;
        final double c4 = -2.54973253934373, c5 = 4.37466414146497, c6 = 2.93816398269878;
        final double d1 = 0.00778469570904146, d2 = 0.32246712907004, d3 = 2.445134137143;
        final double d4 = 3.75440866190742;
        final double pLow = 0.02425, pHigh = 1 - pLow;
        double q, r;
        if (p < pLow) {
            q = Math.sqrt(-2 * Math.log(p));
            return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6)
                    / ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
        } else if (p <= pHigh) {
            q = p - 0.5; r = q * q;
            return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q
                    / (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
        } else {
            q = Math.sqrt(-2 * Math.log(1 - p));
            return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6)
                    / ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
        }
    }

    private static double round(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
