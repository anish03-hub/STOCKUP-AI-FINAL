package com.stockup.backend.service;

import com.stockup.backend.dto.DynamicReorderResponse;
import com.stockup.backend.dto.ReorderRequest;
import com.stockup.backend.model.Item;
import com.stockup.backend.repository.ItemRepository;
import com.stockup.backend.security.CurrentUserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for the dynamic safety-stock implementation in ReorderOptimizationService.
 *
 * Formula under test:
 *   Safety Stock = Z × σ_demand × √(leadTimeHours)
 *   Reorder Point = expectedLeadTimeDemand + safetyStock
 *   Reorder Qty   = max(0, targetStock - currentStock)
 */
public class ReorderOptimizationServiceTest {

    private ItemRepository itemRepository;
    private DemandStatisticsService demandStatisticsService;
    private CurrentUserService currentUserService;
    private ReorderOptimizationService service;

    // ── Test item fixtures ─────────────────────────────────────────────────────
    private Item aspirin;      // N02BA, 8 units, $2.50
    private Item paracetamol;  // N02BE, 150 units, $1.50

    // ── Fake demand stats (not from real CSV — controlled values for testing) ──
    private DemandStatisticsService.DemandStats highVariabilityStats;   // σ = 2.0
    private DemandStatisticsService.DemandStats lowVariabilityStats;    // σ = 0.1
    private DemandStatisticsService.DemandStats zeroVariabilityStats;   // σ = 0.0

    @BeforeEach
    public void setUp() {
        itemRepository = Mockito.mock(ItemRepository.class);
        demandStatisticsService = Mockito.mock(DemandStatisticsService.class);
        currentUserService = Mockito.mock(CurrentUserService.class);
        service = new ReorderOptimizationService(itemRepository, demandStatisticsService, currentUserService);

        // Inject configurable defaults via reflection
        setField(service, "defaultLeadTimeHours", 24);
        setField(service, "defaultServiceLevel", 0.95);

        // Fixtures
        aspirin = new Item();
        aspirin.setName("Aspirin");
        aspirin.setCode("N02BA");
        aspirin.setQuantity(8);
        aspirin.setPrice(2.50);

        paracetamol = new Item();
        paracetamol.setName("Paracetamol");
        paracetamol.setCode("N02BE");
        paracetamol.setQuantity(150);
        paracetamol.setPrice(1.50);

        // DemandStats records
        highVariabilityStats  = new DemandStatisticsService.DemandStats("N02BA", 1.0, 2.0, 50000);
        lowVariabilityStats   = new DemandStatisticsService.DemandStats("N02BE", 1.0, 0.1, 50000);
        zeroVariabilityStats  = new DemandStatisticsService.DemandStats("N02BE", 1.0, 0.0, 50000);
    }

    // ── Test 1: Normal variability produces positive safety stock ──────────────

    @Test
    public void test1_NormalVariability_ProducesPositiveSafetyStock() {
        Mockito.when(itemRepository.findByNameIgnoreCase("Aspirin")).thenReturn(Optional.of(aspirin));
        Mockito.when(demandStatisticsService.getStats("N02BA")).thenReturn(Optional.of(highVariabilityStats));

        ReorderRequest req = new ReorderRequest("Aspirin", 50);
        DynamicReorderResponse resp = service.optimizeReorder(req);

        assertTrue(resp.getSafetyStock() > 0,
                "Safety stock must be positive when demand variability > 0");
        assertTrue(resp.isHistoricalDataAvailable());
    }

    // ── Test 2: Higher variability → higher safety stock ──────────────────────

    @Test
    public void test2_HigherVariability_ProducesHigherSafetyStock() {
        // Aspirin: high variability (σ = 2.0)
        Mockito.when(itemRepository.findByNameIgnoreCase("Aspirin")).thenReturn(Optional.of(aspirin));
        Mockito.when(demandStatisticsService.getStats("N02BA")).thenReturn(Optional.of(highVariabilityStats));

        // Paracetamol: low variability (σ = 0.1)
        Mockito.when(itemRepository.findByNameIgnoreCase("Paracetamol")).thenReturn(Optional.of(paracetamol));
        Mockito.when(demandStatisticsService.getStats("N02BE")).thenReturn(Optional.of(lowVariabilityStats));

        DynamicReorderResponse highVar = service.optimizeReorder(new ReorderRequest("Aspirin", 50));
        DynamicReorderResponse lowVar  = service.optimizeReorder(new ReorderRequest("Paracetamol", 50));

        assertTrue(highVar.getSafetyStock() > lowVar.getSafetyStock(),
                "Higher demand variability must produce higher safety stock. " +
                "High=" + highVar.getSafetyStock() + ", Low=" + lowVar.getSafetyStock());
    }

    // ── Test 3: Longer lead time → higher safety stock ────────────────────────

    @Test
    public void test3_LongerLeadTime_ProducesHigherSafetyStock() {
        Mockito.when(itemRepository.findByNameIgnoreCase("Aspirin")).thenReturn(Optional.of(aspirin));
        Mockito.when(demandStatisticsService.getStats("N02BA")).thenReturn(Optional.of(highVariabilityStats));

        ReorderRequest shortLT = new ReorderRequest("Aspirin", 50);
        shortLT.setLeadTimeHours(8);

        ReorderRequest longLT = new ReorderRequest("Aspirin", 50);
        longLT.setLeadTimeHours(48);

        DynamicReorderResponse short_resp = service.optimizeReorder(shortLT);
        DynamicReorderResponse long_resp  = service.optimizeReorder(longLT);

        assertTrue(long_resp.getSafetyStock() > short_resp.getSafetyStock(),
                "Longer lead time must produce higher safety stock. " +
                "Short=" + short_resp.getSafetyStock() + ", Long=" + long_resp.getSafetyStock());
    }

    // ── Test 4: Higher service level → higher safety stock ────────────────────

    @Test
    public void test4_HigherServiceLevel_ProducesHigherSafetyStock() {
        Mockito.when(itemRepository.findByNameIgnoreCase("Aspirin")).thenReturn(Optional.of(aspirin));
        Mockito.when(demandStatisticsService.getStats("N02BA")).thenReturn(Optional.of(highVariabilityStats));

        ReorderRequest sl90 = new ReorderRequest("Aspirin", 50);
        sl90.setServiceLevel(0.90);

        ReorderRequest sl99 = new ReorderRequest("Aspirin", 50);
        sl99.setServiceLevel(0.99);

        DynamicReorderResponse resp90 = service.optimizeReorder(sl90);
        DynamicReorderResponse resp99 = service.optimizeReorder(sl99);

        assertTrue(resp99.getSafetyStock() > resp90.getSafetyStock(),
                "99% service level must produce higher safety stock than 90%. " +
                "99%=" + resp99.getSafetyStock() + ", 90%=" + resp90.getSafetyStock());
    }

    // ── Test 5: Zero variability → non-negative safety stock ─────────────────

    @Test
    public void test5_ZeroVariability_ProducesNonNegativeSafetyStock() {
        Mockito.when(itemRepository.findByNameIgnoreCase("Paracetamol")).thenReturn(Optional.of(paracetamol));
        Mockito.when(demandStatisticsService.getStats("N02BE")).thenReturn(Optional.of(zeroVariabilityStats));

        DynamicReorderResponse resp = service.optimizeReorder(new ReorderRequest("Paracetamol", 50));

        assertEquals(0.0, resp.getSafetyStock(), 0.001,
                "Zero demand variability must produce exactly zero safety stock");
        assertTrue(resp.getSafetyStock() >= 0, "Safety stock must never be negative");
    }

    // ── Test 6: Stock above reorder point → zero reorder quantity ─────────────

    @Test
    public void test6_StockAboveReorderPoint_ProducesZeroReorderQuantity() {
        // Paracetamol has 150 units, low variability.
        // With σ=0.1, LT=24h, Z=1.645:
        //   safetyStock ~ 1.645 * 0.1 * sqrt(24) ≈ 0.806
        //   expectedLTDemand = 1.0 * 24 = 24
        //   reorderPoint ≈ 24.806
        //   targetStock = reorderPoint + predictedDemand(10) ≈ 34.806
        //   reorderQty = max(0, 34.806 - 150) = 0
        Mockito.when(itemRepository.findByNameIgnoreCase("Paracetamol")).thenReturn(Optional.of(paracetamol));
        Mockito.when(demandStatisticsService.getStats("N02BE")).thenReturn(Optional.of(lowVariabilityStats));

        DynamicReorderResponse resp = service.optimizeReorder(new ReorderRequest("Paracetamol", 10));

        assertEquals(0, resp.getReorderQuantity(),
                "When current stock (150) exceeds target stock, reorder quantity must be 0");
    }

    // ── Test 7: Stock below reorder point → positive reorder quantity ─────────

    @Test
    public void test7_StockBelowReorderPoint_ProducesPositiveReorderQuantity() {
        // Aspirin has only 8 units, high variability σ=2.0, LT=24h, demand=100
        //   safetyStock = 1.645 * 2.0 * sqrt(24) ≈ 16.12
        //   expectedLTDemand = 1.0 * 24 = 24
        //   reorderPoint ≈ 40.12
        //   targetStock = 40.12 + 100 = 140.12
        //   reorderQty = max(0, 140.12 - 8) = 133 (ceil)
        Mockito.when(itemRepository.findByNameIgnoreCase("Aspirin")).thenReturn(Optional.of(aspirin));
        Mockito.when(demandStatisticsService.getStats("N02BA")).thenReturn(Optional.of(highVariabilityStats));

        DynamicReorderResponse resp = service.optimizeReorder(new ReorderRequest("Aspirin", 100));

        assertTrue(resp.getReorderQuantity() > 0,
                "When current stock (8) is far below target stock, reorder quantity must be positive");
        assertTrue(resp.getEstimatedCost() > 0,
                "Estimated cost must be positive when reorder quantity > 0");
    }

    // ── Test 8: Product code resolves correctly from PostgreSQL ───────────────

    @Test
    public void test8_ProductCodeResolvesFromPostgres() {
        Mockito.when(itemRepository.findByNameIgnoreCase("Aspirin")).thenReturn(Optional.of(aspirin));
        Mockito.when(demandStatisticsService.getStats("N02BA")).thenReturn(Optional.of(highVariabilityStats));

        DynamicReorderResponse resp = service.optimizeReorder(new ReorderRequest("Aspirin", 50));

        assertEquals("N02BA", resp.getProductCode(),
                "Product code must be resolved from the Item.code field in PostgreSQL");
        assertTrue(resp.isHistoricalDataAvailable(),
                "Historical data must be flagged as available when code matches");
    }

    // ── Test 9: Unsupported / unknown medicine handled safely ─────────────────

    @Test
    public void test9_UnsupportedMedicine_HandledSafely() {
        Mockito.when(itemRepository.findByNameIgnoreCase("UnknownDrug")).thenReturn(Optional.empty());

        DynamicReorderResponse resp = service.optimizeReorder(new ReorderRequest("UnknownDrug", 50));

        assertFalse(resp.isItemFound(), "Item not found must be flagged");
        assertFalse(resp.isHistoricalDataAvailable(), "No historical data for unknown medicine");
        assertEquals(0.0, resp.getSafetyStock(), 0.001, "Safety stock should be 0 with no historical data");
        assertNotNull(resp.getCalculationNote(), "Calculation note must always be present");
    }

    // ── Test 10: Z-score resolution correctness ───────────────────────────────

    @Test
    public void test10_ZScoreResolution_CorrectForKnownServiceLevels() {
        assertEquals(1.282, ReorderOptimizationService.resolveZScore(0.90), 0.001, "90% → Z=1.282");
        assertEquals(1.645, ReorderOptimizationService.resolveZScore(0.95), 0.001, "95% → Z=1.645");
        assertEquals(2.326, ReorderOptimizationService.resolveZScore(0.99), 0.001, "99% → Z=2.326");
    }

    // ── Test 11: Response exposes all required fields ────────────────────────

    @Test
    public void test11_Response_ExposesAllRequiredFields() {
        Mockito.when(itemRepository.findByNameIgnoreCase("Aspirin")).thenReturn(Optional.of(aspirin));
        Mockito.when(demandStatisticsService.getStats("N02BA")).thenReturn(Optional.of(highVariabilityStats));

        DynamicReorderResponse resp = service.optimizeReorder(new ReorderRequest("Aspirin", 50));

        assertAll("All required response fields must be set",
                () -> assertNotNull(resp.getMedicineName()),
                () -> assertNotNull(resp.getProductCode()),
                () -> assertTrue(resp.getLeadTimeHours() > 0),
                () -> assertTrue(resp.getServiceLevel() > 0),
                () -> assertTrue(resp.getzScore() > 0),
                () -> assertTrue(resp.getSafetyStock() >= 0),
                () -> assertTrue(resp.getExpectedLeadTimeDemand() >= 0),
                () -> assertTrue(resp.getReorderPoint() >= 0),
                () -> assertTrue(resp.getTargetStock() >= 0),
                () -> assertNotNull(resp.getCalculationNote())
        );
    }

    // ── Test 12: Safety-stock formula verification ────────────────────────────

    @Test
    public void test12_SafetyStockFormula_MatchesExpectedCalculation() {
        // σ=2.0, LT=24h, Z=1.645
        // Expected: 1.645 * 2.0 * sqrt(24) = 1.645 * 2.0 * 4.8990 ≈ 16.116
        Mockito.when(itemRepository.findByNameIgnoreCase("Aspirin")).thenReturn(Optional.of(aspirin));
        Mockito.when(demandStatisticsService.getStats("N02BA")).thenReturn(Optional.of(highVariabilityStats));

        ReorderRequest req = new ReorderRequest("Aspirin", 50);
        req.setLeadTimeHours(24);
        req.setServiceLevel(0.95);

        DynamicReorderResponse resp = service.optimizeReorder(req);

        double expected = 1.645 * 2.0 * Math.sqrt(24);
        assertEquals(expected, resp.getSafetyStock(), 0.01,
                "Safety stock formula: Z × σ × √(LT) = 1.645 × 2.0 × √24 ≈ " + expected);
    }

    // ── Helper: inject private fields via reflection ──────────────────────────

    private void setField(Object target, String fieldName, Object value) {
        try {
            var field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (Exception e) {
            throw new RuntimeException("Could not set field " + fieldName + ": " + e.getMessage(), e);
        }
    }
}
