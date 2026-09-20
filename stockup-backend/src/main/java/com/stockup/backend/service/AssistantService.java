package com.stockup.backend.service;

import com.stockup.backend.dto.ActionItemDTO;
import com.stockup.backend.dto.AssistantQueryResponse;
import com.stockup.backend.dto.DashboardSummaryDTO;
import com.stockup.backend.dto.DynamicReorderResponse;
import com.stockup.backend.dto.ExpiryAlertSummary;
import com.stockup.backend.dto.ExpiryItemDetails;
import com.stockup.backend.dto.MedicineDemandPredictionRequest;
import com.stockup.backend.dto.MedicineDemandPredictionResponse;
import com.stockup.backend.dto.ReorderRequest;
import com.stockup.backend.dto.StockoutRequest;
import com.stockup.backend.dto.StockoutResponse;
import com.stockup.backend.dto.SupplierRecommendationDTO;
import com.stockup.backend.model.Item;
import com.stockup.backend.repository.ItemRepository;
import com.stockup.backend.security.CurrentUserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Deterministic StockUp AI Data Assistant Service.
 *
 * Architecture:
 *   Natural Language Message -> Intent Detection -> Internal Services & PostgreSQL -> Structured Response
 */
@Service
public class AssistantService {

    private static final Logger logger = LoggerFactory.getLogger(AssistantService.class);

    // ── Intent identifiers ────────────────────────────────────────────────────
    private static final String INTENT_INVENTORY_LOOKUP        = "INVENTORY_LOOKUP";
    private static final String INTENT_LOW_STOCK               = "LOW_STOCK";
    private static final String INTENT_EXPIRY                  = "EXPIRY";
    private static final String INTENT_SUPPLIER_RECOMMENDATION = "SUPPLIER_RECOMMENDATION";
    private static final String INTENT_DEMAND_PREDICTION       = "DEMAND_PREDICTION";
    private static final String INTENT_STOCKOUT_RISK           = "STOCKOUT_RISK";
    private static final String INTENT_REORDER                 = "REORDER";
    private static final String INTENT_INVENTORY_VALUE         = "INVENTORY_VALUE";
    private static final String INTENT_INVENTORY_SUMMARY       = "INVENTORY_SUMMARY";
    private static final String INTENT_MEDICINE_SEARCH         = "MEDICINE_SEARCH";
    private static final String INTENT_DOCUMENT_PROCESSING     = "DOCUMENT_PROCESSING";
    private static final String INTENT_UNKNOWN                 = "UNKNOWN";

    // ── Dependencies — all internal StockUp services ─────────────────────────
    private final ItemRepository itemRepository;
    private final ExpiryAlertService expiryAlertService;
    private final InventoryHealthService inventoryHealthService;
    private final StockoutPredictionService stockoutPredictionService;
    private final ReorderOptimizationService reorderOptimizationService;
    private final MedicineDemandPredictionService medicineDemandPredictionService;
    private final SupplierRecommendationService supplierRecommendationService;
    private final RestTemplate restTemplate;
    private final CurrentUserService currentUserService;

    @Autowired
    public AssistantService(
            ItemRepository itemRepository,
            ExpiryAlertService expiryAlertService,
            InventoryHealthService inventoryHealthService,
            StockoutPredictionService stockoutPredictionService,
            ReorderOptimizationService reorderOptimizationService,
            MedicineDemandPredictionService medicineDemandPredictionService,
            SupplierRecommendationService supplierRecommendationService,
            RestTemplate restTemplate,
            CurrentUserService currentUserService) {
        this.itemRepository = itemRepository;
        this.expiryAlertService = expiryAlertService;
        this.inventoryHealthService = inventoryHealthService;
        this.stockoutPredictionService = stockoutPredictionService;
        this.reorderOptimizationService = reorderOptimizationService;
        this.medicineDemandPredictionService = medicineDemandPredictionService;
        this.supplierRecommendationService = supplierRecommendationService;
        this.restTemplate = restTemplate;
        this.currentUserService = currentUserService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC ENTRY POINT
    // ─────────────────────────────────────────────────────────────────────────

    public AssistantQueryResponse processQuery(String message) {
        if (message == null || message.trim().isEmpty()) {
            return new AssistantQueryResponse(INTENT_UNKNOWN,
                    "Please ask a question about your StockUp inventory.");
        }

        String normalizedMessage = message.toLowerCase(Locale.ROOT).trim();
        String intent = detectIntent(normalizedMessage);

        logger.info("Assistant intent detected: {} for message: '{}'", intent, message);

        return switch (intent) {
            case INTENT_DOCUMENT_PROCESSING    -> handleDocumentProcessing();
            case INTENT_SUPPLIER_RECOMMENDATION -> handleSupplierRecommendation(normalizedMessage, message);
            case INTENT_INVENTORY_LOOKUP       -> handleInventoryLookup(normalizedMessage, message);
            case INTENT_LOW_STOCK              -> handleLowStock();
            case INTENT_EXPIRY                 -> handleExpiry();
            case INTENT_DEMAND_PREDICTION      -> handleDemandPrediction(normalizedMessage, message);
            case INTENT_STOCKOUT_RISK          -> handleStockoutRisk();
            case INTENT_REORDER                -> handleReorder(normalizedMessage, message);
            case INTENT_INVENTORY_VALUE        -> handleInventoryValue();
            case INTENT_INVENTORY_SUMMARY      -> handleInventorySummary();
            case INTENT_MEDICINE_SEARCH        -> handleMedicineSearch(normalizedMessage, message);
            default                            -> handleUnknown(message);
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INTENT DETECTION
    // ─────────────────────────────────────────────────────────────────────────

    private String detectIntent(String msg) {
        // DOCUMENT_PROCESSING
        if (containsAny(msg, "upload document", "upload pdf", "upload csv", "upload invoice", "upload bill",
                "upload medicine", "import document", "import pdf", "import csv", "import invoice",
                "document processing", "upload pharmacy document", "process invoice", "read bill", "scan invoice")) {
            return INTENT_DOCUMENT_PROCESSING;
        }

        // SUPPLIER_RECOMMENDATION
        if (containsAny(msg, "supplier", "distributor", "vendor", "who can supply", "recommend supplier",
                "who supplies", "who supply", "suppliers for", "distributors for", "vendors for", "who sells",
                "procure from", "supply of", "distributor recommendation")) {
            return INTENT_SUPPLIER_RECOMMENDATION;
        }

        // DEMAND_PREDICTION
        if (containsAny(msg, "predict", "prediction", "forecast", "demand", "next hour", "next-hour", "next_hour",
                "will demand", "expected demand", "future demand")) {
            return INTENT_DEMAND_PREDICTION;
        }

        // STOCKOUT_RISK
        if (containsAny(msg, "stockout", "stock-out", "stock out", "run out", "risk of stockout", "deplete",
                "stock risk", "will run out", "about to run out")) {
            return INTENT_STOCKOUT_RISK;
        }

        // REORDER
        if (containsAny(msg, "reorder", "re-order", "purchase order", "buy stock", "procurement",
                "how much to order", "cost to reorder", "reorder quantity")) {
            return INTENT_REORDER;
        }

        // EXPIRY
        if (containsAny(msg, "expir", "expire", "expiry", "spoil", "near expir", "expiring soon",
                "about to expire", "near expiry", "spoilage")) {
            return INTENT_EXPIRY;
        }

        // LOW_STOCK
        if (containsAny(msg, "low stock", "low in stock", "critical stock", "need attention",
                "stock alert", "running low", "almost out", "low-stock", "under stocked")) {
            return INTENT_LOW_STOCK;
        }

        // INVENTORY_VALUE
        if (containsAny(msg, "total value", "inventory value", "total inventory value", "worth",
                "financial valuation", "valuation of inventory", "total cost", "value of inventory")) {
            return INTENT_INVENTORY_VALUE;
        }

        // INVENTORY_SUMMARY
        if (containsAny(msg, "summary", "overview", "dashboard", "how is my inventory",
                "status report", "overall", "stockup summary", "today's summary", "kpi")) {
            return INTENT_INVENTORY_SUMMARY;
        }

        // INVENTORY_LOOKUP — specific quantity/stock question
        if (containsAny(msg, "stock of", "how many", "how much", "quantity of", "units of",
                "how much do we have", "how much stock", "current stock", "do we have",
                "stock level", "inventory of", "in stock")) {
            return INTENT_INVENTORY_LOOKUP;
        }

        // MEDICINE_SEARCH
        if (containsAny(msg, "tell me about", "show details", "what category", "about",
                "what is", "information on", "details of", "describe", "info on", "lookup")) {
            return INTENT_MEDICINE_SEARCH;
        }

        // If a medicine or NDC is mentioned directly without keywords
        if (!findMatchingItems(msg).isEmpty()) {
            return INTENT_INVENTORY_LOOKUP;
        }

        return INTENT_UNKNOWN;
    }

    private boolean containsAny(String text, String... keywords) {
        for (String kw : keywords) {
            if (text.contains(kw)) return true;
        }
        return false;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MEDICINE LOOKUP & EXTRACTION
    // ─────────────────────────────────────────────────────────────────────────

    private List<Item> findMatchingItems(String query) {
        if (query == null || query.isBlank()) return List.of();
        String q = query.toLowerCase(Locale.ROOT).trim();

        Optional<String> bOpt = currentUserService.getCurrentUserBusinessIdOptional();
        List<Item> allItems = bOpt.isPresent()
                ? itemRepository.findByBusinessId(bOpt.get())
                : itemRepository.findAll();

        // 1. Check if there is an NDC pattern like 0002-0213 or 0002
        Pattern ndcPattern = Pattern.compile("\\b(\\d{4,5}-\\d{3,4}|\\d{4,5})\\b");
        Matcher matcher = ndcPattern.matcher(q);
        if (matcher.find()) {
            String ndc = matcher.group(1);
            List<Item> ndcMatches = allItems.stream()
                    .filter(i -> i.getCode() != null && i.getCode().toLowerCase(Locale.ROOT).contains(ndc))
                    .limit(10)
                    .collect(Collectors.toList());
            if (!ndcMatches.isEmpty()) return ndcMatches;
        }

        // 2. Direct substring search against full medicine names
        for (Item item : allItems) {
            if (item.getName() != null && item.getName().length() >= 4) {
                String brand = item.getName().toLowerCase(Locale.ROOT);
                // Extract first word of brand name (e.g. "humulin" from "Humulin Injection, Solution")
                String firstWord = brand.split("[\\s,\\-]")[0];
                if (firstWord.length() >= 4 && q.contains(firstWord)) {
                    List<Item> brandMatches = allItems.stream()
                            .filter(i -> i.getName() != null && i.getName().toLowerCase(Locale.ROOT).startsWith(firstWord))
                            .limit(10)
                            .collect(Collectors.toList());
                    if (!brandMatches.isEmpty()) return brandMatches;
                }
            }
        }

        // 3. Stopwords to strip when extracting drug name
        List<String> stopwords = List.of(
                "what is our current stock of", "what is the current stock of", "what is our stock of",
                "what is the stock of", "what is current stock of", "what is stock of",
                "what is our", "what is the", "current stock of", "stock level for", "stock level of",
                "stock level", "available stock of", "available stock", "do we have any", "do we have",
                "how many units of", "how many", "how much of", "how much", "in stock", "units of",
                "quantity of", "tell me about", "details of", "check stock of", "check stock for",
                "check stock", "can you check", "who can supply", "who supplies", "suppliers for",
                "distributors for", "reorder", "predict demand for", "predict", "please", "current stock",
                "our stock of", "our stock", "is there any", "stock of"
        );
        String cleaned = q;
        for (String sw : stopwords) {
            cleaned = cleaned.replace(sw, " ");
        }
        cleaned = cleaned.replaceAll("[^a-zA-Z0-9\\-\\s]", " ").trim();

        if (cleaned.length() >= 3) {
            String target = cleaned;
            List<Item> matches = allItems.stream()
                    .filter(i -> (i.getName() != null && i.getName().toLowerCase(Locale.ROOT).contains(target)) ||
                                 (i.getCode() != null && i.getCode().toLowerCase(Locale.ROOT).contains(target)) ||
                                 (i.getCategory() != null && i.getCategory().toLowerCase(Locale.ROOT).contains(target)))
                    .limit(10)
                    .collect(Collectors.toList());
            if (!matches.isEmpty()) return matches;
        }

        // 4. Token-by-token search (tokens >= 3 chars, not common filler words)
        Set<String> fillerWords = Set.of("what", "is", "our", "the", "have", "with", "from", "that", "this", "item", "items", "stock", "level", "current", "units");
        String[] tokens = q.replaceAll("[^a-zA-Z0-9\\-]", " ").split("\\s+");
        for (String token : tokens) {
            if (token.length() >= 3 && !fillerWords.contains(token)) {
                List<Item> tokenMatches = allItems.stream()
                        .filter(i -> (i.getName() != null && i.getName().toLowerCase(Locale.ROOT).contains(token)) ||
                                     (i.getCode() != null && i.getCode().toLowerCase(Locale.ROOT).contains(token)))
                        .limit(10)
                        .collect(Collectors.toList());
                if (!tokenMatches.isEmpty()) return tokenMatches;
            }
        }

        return List.of();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INTENT HANDLERS
    // ─────────────────────────────────────────────────────────────────────────

    /** INTENT: SUPPLIER_RECOMMENDATION — ranks pharmaceutical distributors for category */
    private AssistantQueryResponse handleSupplierRecommendation(String normalized, String original) {
        String category = null;

        // Check if a known category was mentioned
        List<String> knownCategories = List.of(
                "Insulin [CS]", "Insulin Analog [EPC]", "General Medicine",
                "Penicillin-class Antibacterial [EPC]", "Corticosteroid Hormone Receptor Agonists [MoA]",
                "Anti-Inflammatory Agents", "Central Nervous System Stimulant [EPC]",
                "Angiotensin 2 Receptor Antagonists [MoA]", "Blood Coagulation Factor [EPC]",
                "Anti-epileptic Agent [EPC]", "G-Protein-linked Receptor Interactions [MoA]",
                "Decreased Cell Wall Integrity [PE]", "Full Opioid Agonists [MoA]"
        );

        for (String cat : knownCategories) {
            String cleanCat = cat.replaceAll("\\[.*?\\]", "").toLowerCase().trim();
            if (normalized.contains(cleanCat) || normalized.contains(cat.toLowerCase())) {
                category = cat;
                break;
            }
        }

        // If no direct category, check if a medicine was mentioned and get its category
        if (category == null) {
            List<Item> items = findMatchingItems(normalized);
            if (!items.isEmpty() && items.get(0).getCategory() != null) {
                category = items.get(0).getCategory();
            }
        }

        List<SupplierRecommendationDTO> recs = supplierRecommendationService.recommend(category, 5);

        if (recs.isEmpty()) {
            return new AssistantQueryResponse(INTENT_SUPPLIER_RECOMMENDATION,
                    "I couldn't find specific distributor recommendations. Please explore all 14 active distributors in the [Suppliers](/suppliers) directory.");
        }

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("### 🏢 AI-Ranked Distributors for **%s**\n\n",
                category != null ? category : "General Pharmaceutical Supply"));

        sb.append("| Rank | Distributor | AI Score | Lead Time | Reliability | Performance | Unit Cost |\n");
        sb.append("| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n");

        for (SupplierRecommendationDTO r : recs) {
            sb.append(String.format("| **#%d** | **%s** | **%.1f** | %.1fd | ±%.1fd | %.0f%% | $%.2f |\n",
                    r.getRank(),
                    r.getName(),
                    r.getScore(),
                    r.getAvgLeadTimeDays() != null ? r.getAvgLeadTimeDays() : 3.0,
                    r.getLeadTimeStdDevDays() != null ? r.getLeadTimeStdDevDays() : 0.5,
                    r.getRawPerformanceScore() != null ? r.getRawPerformanceScore() : 90.0,
                    r.getUnitCost() != null ? r.getUnitCost() : 15.0));
        }

        SupplierRecommendationDTO top = recs.get(0);
        sb.append(String.format("\n**Top Recommendation:** **%s**\n", top.getName()));
        sb.append(String.format("• **Rationale:** %s\n", top.getReason()));
        sb.append(String.format("• **Lead Time:** %.1f days (±%.1fd variance) | **Quality Score:** %.0f%%\n\n",
                top.getAvgLeadTimeDays() != null ? top.getAvgLeadTimeDays() : 3.0,
                top.getLeadTimeStdDevDays() != null ? top.getLeadTimeStdDevDays() : 0.5,
                top.getRawPerformanceScore() != null ? top.getRawPerformanceScore() : 95.0));

        sb.append("💡 *You can create an automated Purchase Order directly from the [Suppliers](/suppliers) or [Reorder Optimization](/reorder) dashboard.*");

        return new AssistantQueryResponse(INTENT_SUPPLIER_RECOMMENDATION, sb.toString().trim(), recs);
    }

    /** INTENT: INVENTORY_LOOKUP — look up current quantity and pricing for medicines */
    private AssistantQueryResponse handleInventoryLookup(String normalized, String original) {
        List<Item> matches = findMatchingItems(normalized);
        if (matches.isEmpty()) {
            return new AssistantQueryResponse(INTENT_INVENTORY_LOOKUP,
                    "I couldn't find that medicine or NDC code in the 2,511-item PostgreSQL catalog. " +
                    "Please provide a medicine name (e.g. *Humulin*, *Amoxicillin*) or an NDC code (e.g. *0002-0213*).");
        }

        if (matches.size() == 1) {
            Item item = matches.get(0);
            double totalVal = (item.getQuantity() != null ? item.getQuantity() : 0) * (item.getPrice() != null ? item.getPrice() : 0.0);

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("### 📦 %s (`%s`)\n\n", item.getName(), item.getCode() != null ? item.getCode() : "N/A"));
            sb.append(String.format("• **Current Stock:** **%d units** (%s)\n",
                    item.getQuantity() != null ? item.getQuantity() : 0,
                    (item.getQuantity() != null && item.getQuantity() <= 50) ? "⚠️ Low Stock" : "✅ Healthy"));
            sb.append(String.format("• **Unit Cost:** $%.2f | **Selling Price:** $%.2f\n",
                    item.getPrice() != null ? item.getPrice() : 0.0,
                    item.getSellingPrice() != null ? item.getSellingPrice() : 0.0));
            sb.append(String.format("• **Total Batch Valuation:** $%.2f\n", totalVal));
            sb.append(String.format("• **Therapeutic Category:** %s\n", item.getCategory() != null ? item.getCategory() : "General"));
            sb.append(String.format("• **Manufacturer / Labeler:** %s\n", item.getManufacturer() != null ? item.getManufacturer() : "N/A"));
            sb.append(String.format("• **Expiry Date:** %s", item.getExpiryDate() != null ? item.getExpiryDate() : "Not specified"));

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("medicineName", item.getName());
            data.put("productCode", item.getCode());
            data.put("quantity", item.getQuantity());
            data.put("price", item.getPrice());
            data.put("category", item.getCategory());

            return new AssistantQueryResponse(INTENT_INVENTORY_LOOKUP, sb.toString().trim(), data);
        }

        // Multiple presentations matching query
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("### 📦 Stock Results (%d matching formulations)\n\n", matches.size()));
        sb.append("| Medicine Formulation | NDC Code | Stock Level | Unit Price | Expiry Date | Status |\n");
        sb.append("| :--- | :--- | :--- | :--- | :--- | :--- |\n");

        int totalUnits = 0;
        for (Item item : matches) {
            int qty = item.getQuantity() != null ? item.getQuantity() : 0;
            totalUnits += qty;
            sb.append(String.format("| **%s** | `%s` | **%d units** | $%.2f | %s | %s |\n",
                    item.getName(),
                    item.getCode() != null ? item.getCode() : "—",
                    qty,
                    item.getPrice() != null ? item.getPrice() : 0.0,
                    item.getExpiryDate() != null ? item.getExpiryDate() : "—",
                    qty <= 50 ? "⚠️ Low" : "✅ In Stock"));
        }

        sb.append(String.format("\n**Aggregate Available Stock:** **%d units** across all presentations.\n", totalUnits));
        sb.append(String.format("**Primary Therapeutic Category:** %s\n", matches.get(0).getCategory() != null ? matches.get(0).getCategory() : "General"));
        sb.append(String.format("**Primary Manufacturer:** %s", matches.get(0).getManufacturer() != null ? matches.get(0).getManufacturer() : "N/A"));

        return new AssistantQueryResponse(INTENT_INVENTORY_LOOKUP, sb.toString().trim(), matches);
    }

    /** INTENT: LOW_STOCK — list medicines with quantity <= 50 from PostgreSQL */
    private AssistantQueryResponse handleLowStock() {
        Optional<String> bOpt = currentUserService.getCurrentUserBusinessIdOptional();
        List<Item> allItems = bOpt.isPresent()
                ? itemRepository.findByBusinessId(bOpt.get())
                : itemRepository.findAll();
        List<Item> lowStock = allItems.stream()
                .filter(item -> item.getQuantity() != null && item.getQuantity() <= 50)
                .sorted(Comparator.comparingInt(item -> item.getQuantity() != null ? item.getQuantity() : 0))
                .collect(Collectors.toList());

        if (lowStock.isEmpty()) {
            return new AssistantQueryResponse(INTENT_LOW_STOCK,
                    "✅ **All medicines currently have healthy stock levels** (above 50 units).");
        }

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("### ⚠️ Low-Stock Restock Priority Queue\n\n"));
        sb.append(String.format("Found **%d medicines** with stock levels &le; 50 units. Top critical items:\n\n", lowStock.size()));

        sb.append("| Medicine Name | NDC Code | Current Stock | Unit Cost | Category | Status |\n");
        sb.append("| :--- | :--- | :--- | :--- | :--- | :--- |\n");

        for (Item item : lowStock.stream().limit(8).collect(Collectors.toList())) {
            sb.append(String.format("| **%s** | `%s` | **%d units** | $%.2f | %s | 🚨 CRITICAL |\n",
                    item.getName(),
                    item.getCode() != null ? item.getCode() : "—",
                    item.getQuantity() != null ? item.getQuantity() : 0,
                    item.getPrice() != null ? item.getPrice() : 0.0,
                    item.getCategory() != null ? item.getCategory() : "General"));
        }

        sb.append(String.format("\n💡 *You can trigger Dynamic Safety Stock optimization for any item in [Reorder Optimization](/reorder) or review the full [Low Stock](/medicines?status=LOW_STOCK) catalog.*"));

        return new AssistantQueryResponse(INTENT_LOW_STOCK, sb.toString().trim(), lowStock.subList(0, Math.min(8, lowStock.size())));
    }

    /** INTENT: EXPIRY — delegates to ExpiryAlertService */
    private AssistantQueryResponse handleExpiry() {
        ExpiryAlertSummary summary = expiryAlertService.getExpiryAlerts();

        StringBuilder sb = new StringBuilder();
        sb.append("### 📋 Live Expiration & Spoilage Analysis\n\n");
        sb.append(String.format("• **Critical (< 30 Days):** **%d medicine(s)** (Immediate Action Required)\n", summary.getTotalCriticalItems()));
        sb.append(String.format("• **Warning (31–90 Days):** **%d medicine(s)** (Moderate Risk)\n", summary.getTotalWarningItems()));
        sb.append(String.format("• **Safe (> 90 Days):** **%d medicine(s)** (Healthy Shelf Life)\n", summary.getTotalSafeItems()));
        sb.append(String.format("• **Total At-Risk Exposure:** **$%,.2f**\n\n", summary.getTotalAtRiskValue()));

        if (summary.getAtRiskItems() != null && !summary.getAtRiskItems().isEmpty()) {
            sb.append("#### Most Urgent Batches Approaching Expiration:\n\n");
            sb.append("| Medicine Name | Manufacturer | Expiry Date | Days Left | Risk Level | Financial Exposure |\n");
            sb.append("| :--- | :--- | :--- | :--- | :--- | :--- |\n");

            for (ExpiryItemDetails item : summary.getAtRiskItems().stream().limit(6).collect(Collectors.toList())) {
                sb.append(String.format("| **%s** | %s | %s | **%s** | `%s` | **$%,.2f** |\n",
                        item.getMedicineName(),
                        item.getManufacturer() != null ? item.getManufacturer() : "—",
                        item.getExpiryDate() != null ? item.getExpiryDate() : "—",
                        item.getDaysUntilExpiry() <= 0 ? "Expired" : item.getDaysUntilExpiry() + " days",
                        item.getRiskLevel(),
                        item.getFinancialRisk()));
            }
        }

        sb.append("\n💡 *Action items: Review batch details in [Expiry Alerts](/expiry) or initiate discounted clearance.*");
        return new AssistantQueryResponse(INTENT_EXPIRY, sb.toString().trim(), summary);
    }

    /** INTENT: DEMAND_PREDICTION — delegates to MedicineDemandPredictionService → FastAPI */
    private AssistantQueryResponse handleDemandPrediction(String normalized, String original) {
        if (containsAny(normalized, "next year", "next month", "next week", "annual", "monthly",
                "weekly", "yearly", "year", "month", "week")) {
            return new AssistantQueryResponse(INTENT_DEMAND_PREDICTION,
                    "ℹ️ The current StockUp Random Forest v2 model predicts next-hour demand based on historical hourly series. " +
                    "Multi-month forecasts are not currently active.");
        }

        List<Item> matches = findMatchingItems(normalized);
        String code = "0002-0213";
        String name = "Humulin Injection, Solution";

        if (!matches.isEmpty()) {
            code = matches.get(0).getCode();
            name = matches.get(0).getName();
        }

        try {
            MedicineDemandPredictionRequest req = new MedicineDemandPredictionRequest(code);
            MedicineDemandPredictionResponse pred = medicineDemandPredictionService.predictMedicineDemand(req);

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("### 🔮 AI Demand Prediction: **%s** (`%s`)\n\n", name, code));
            sb.append(String.format("• **Model:** Random Forest v2 (FastAPI Service on :8001)\n"));
            sb.append(String.format("• **Latest Observed Demand:** **%.4f units/hr**\n", pred.getLatestObservedDemand()));
            sb.append(String.format("• **Predicted Next-Hour Demand:** **%.4f units**\n", pred.getPredictedNextHourDemand()));
            sb.append(String.format("• **Target Timestamp:** %s\n\n", pred.getLatestTimestamp() != null ? pred.getLatestTimestamp() : "Next hour"));
            sb.append("💡 *You can view full forecast history and model importance in [Demand Forecasting](/forecast).*");

            return new AssistantQueryResponse(INTENT_DEMAND_PREDICTION, sb.toString().trim(), pred);
        } catch (Exception e) {
            logger.warn("Demand prediction failed for {}: {}", code, e.getMessage());
            return new AssistantQueryResponse(INTENT_DEMAND_PREDICTION,
                    "⚠️ Demand prediction is temporarily unavailable. Please verify FastAPI (:8001) is running.");
        }
    }

    /** INTENT: STOCKOUT_RISK */
    private AssistantQueryResponse handleStockoutRisk() {
        Optional<String> bOpt = currentUserService.getCurrentUserBusinessIdOptional();
        List<Item> allItems = bOpt.isPresent()
                ? itemRepository.findByBusinessId(bOpt.get())
                : itemRepository.findAll();
        List<Item> lowStock = allItems.stream()
                .filter(i -> i.getQuantity() != null && i.getQuantity() <= 50)
                .limit(5)
                .collect(Collectors.toList());

        StringBuilder sb = new StringBuilder("### 🚨 Stock-out Risk Assessment\n\n");
        sb.append(String.format("Found **%d items** at potential stock-out risk due to low buffer margins (&le; 50 units):\n\n", lowStock.size()));

        sb.append("| Medicine Name | NDC Code | Current Stock | Risk Level | Recommendation |\n");
        sb.append("| :--- | :--- | :--- | :--- | :--- |\n");

        for (Item item : lowStock) {
            int qty = item.getQuantity() != null ? item.getQuantity() : 0;
            StockoutResponse risk = stockoutPredictionService.calculateStockoutRisk(
                    new StockoutRequest(item.getName(), qty, 100));
            sb.append(String.format("| **%s** | `%s` | **%d units** | %s | %s |\n",
                    item.getName(),
                    item.getCode() != null ? item.getCode() : "—",
                    qty,
                    "HIGH".equalsIgnoreCase(risk.getRiskLevel()) ? "🔴 HIGH" : "🟡 MEDIUM",
                    risk.getRecommendation()));
        }

        return new AssistantQueryResponse(INTENT_STOCKOUT_RISK, sb.toString().trim(), lowStock);
    }

    /** INTENT: REORDER */
    private AssistantQueryResponse handleReorder(String normalized, String original) {
        List<Item> matches = findMatchingItems(normalized);
        Item item = matches.isEmpty() ? null : matches.get(0);

        if (item != null) {
            try {
                ReorderRequest req = new ReorderRequest(item.getName(), 100);
                req.setProductCode(item.getCode());
                DynamicReorderResponse resp = reorderOptimizationService.optimizeReorder(req);

                String answer = String.format(
                        "### 📦 Reorder Calculation: **%s** (`%s`)\n\n" +
                        "• **Current Stock:** **%d units** in database\n" +
                        "• **Predicted Demand:** **100 units** (coverage period)\n" +
                        "• **Dynamic Safety Stock:** **%.2f units** (Z=%.3f &times; &sigma;=%.4f &times; &radic;LT=%.0fh)\n" +
                        "• **Reorder Point:** **%.2f units**\n" +
                        "• **Recommended Reorder Quantity:** **%d units**\n" +
                        "• **Unit Cost:** $%.2f | **Estimated Total:** **$%,.2f**\n\n" +
                        "💡 *You can customize service level and lead time directly in [Reorder Optimization](/reorder).*",
                        item.getName(),
                        item.getCode() != null ? item.getCode() : "—",
                        item.getQuantity() != null ? item.getQuantity() : 0,
                        resp.getSafetyStock(),
                        resp.getzScore(),
                        resp.getDemandStdDev(),
                        resp.getLeadTimeHours(),
                        resp.getReorderPoint(),
                        resp.getReorderQuantity(),
                        resp.getUnitPrice(),
                        resp.getEstimatedCost()
                );

                return new AssistantQueryResponse(INTENT_REORDER, answer, resp);
            } catch (Exception e) {
                logger.warn("Reorder failed: {}", e.getMessage());
            }
        }

        return handleLowStock();
    }

    /** INTENT: INVENTORY_VALUE */
    private AssistantQueryResponse handleInventoryValue() {
        Optional<String> bOpt = currentUserService.getCurrentUserBusinessIdOptional();
        List<Item> allItems = bOpt.isPresent()
                ? itemRepository.findByBusinessId(bOpt.get())
                : itemRepository.findAll();
        double totalVal = allItems.stream()
                .mapToDouble(i -> (i.getQuantity() != null ? i.getQuantity() : 0) * (i.getPrice() != null ? i.getPrice() : 0.0))
                .sum();

        String answer = String.format(
                "### 💰 Total Inventory Valuation\n\n" +
                "• **Total Valuation:** **$%,.2f**\n" +
                "• **Active FDA Items (SKUs):** **%d catalog records**\n" +
                "• **Average Valuation per Item:** **$%,.2f**",
                totalVal,
                allItems.size(),
                allItems.isEmpty() ? 0.0 : totalVal / allItems.size()
        );

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("totalInventoryValue", totalVal);
        data.put("totalItems", allItems.size());

        return new AssistantQueryResponse(INTENT_INVENTORY_VALUE, answer, data);
    }

    /** INTENT: INVENTORY_SUMMARY */
    private AssistantQueryResponse handleInventorySummary() {
        DashboardSummaryDTO summary = inventoryHealthService.getDashboardSummary();

        StringBuilder sb = new StringBuilder("### 📊 Executive Inventory Health Summary\n\n");
        sb.append(String.format("• **Total Medicines:** **%d items** (FDA catalog)\n", summary.getTotalItems()));
        sb.append(String.format("• **Total Inventory Valuation:** **$%,.2f**\n", summary.getTotalInventoryValue()));
        sb.append(String.format("• **Low-Stock Items (&le; 50 units):** **%d items**\n", summary.getLowStockItemsCount()));
        sb.append(String.format("• **Critical Expiry (< 30 days):** **%d items**\n", summary.getCriticalExpiryItemsCount()));
        sb.append(String.format("• **Immediate Spoilage Risk:** **$%,.2f**\n", summary.getSpoilageRiskValue()));
        sb.append(String.format("• **Pharmaceutical Distributors:** **14 active certified distributors**\n\n"));

        if (summary.getActionItems() != null && !summary.getActionItems().isEmpty()) {
            sb.append("#### AI System Priorities:\n");
            for (ActionItemDTO action : summary.getActionItems()) {
                String priority = action.getType() != null ? action.getType() : action.getPriority();
                sb.append(String.format("• **[%s]** %s\n", priority != null ? priority : "INFO", action.getMessage()));
            }
        }

        return new AssistantQueryResponse(INTENT_INVENTORY_SUMMARY, sb.toString().trim(), summary);
    }

    /** INTENT: MEDICINE_SEARCH */
    private AssistantQueryResponse handleMedicineSearch(String normalized, String original) {
        return handleInventoryLookup(normalized, original);
    }

    /** INTENT: UNKNOWN */
    private AssistantQueryResponse handleUnknown(String original) {
        try {
            String url = "http://localhost:8000/api/chat";
            PythonChatRequest chatReq = new PythonChatRequest(original);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<PythonChatRequest> entity = new HttpEntity<>(chatReq, headers);

            ResponseEntity<PythonChatResponse> response = restTemplate.postForEntity(
                    url,
                    entity,
                    PythonChatResponse.class
            );

            PythonChatResponse body = response.getBody();
            if (response.getStatusCode().is2xxSuccessful() && body != null) {
                return new AssistantQueryResponse(INTENT_UNKNOWN, body.getReply());
            }
        } catch (Exception e) {
            logger.debug("Python chat fallback not reached: {}", e.getMessage());
        }

        return new AssistantQueryResponse(INTENT_UNKNOWN,
                "I'm your **StockUp AI Inventory Assistant**. I can help you analyze:\n\n" +
                "• **Document Upload & AI Processing:** e.g. *\"Upload pharmacy document\"* or attach a PDF / CSV\n" +
                "• **Stock Levels & Pricing:** e.g. *\"Do we have Humulin in stock?\"* or *\"Stock of 0002-0213\"*\n" +
                "• **Supplier Recommendations:** e.g. *\"Who can supply Insulin?\"* or *\"Recommend distributor for Antibacterials\"*\n" +
                "• **Expiry Alerts & Spoilage:** e.g. *\"Which medicines are expiring soon?\"*\n" +
                "• **Low-Stock Restock Queue:** e.g. *\"Which items need immediate reorder?\"*\n" +
                "• **Reorder Optimization:** e.g. *\"Calculate reorder for Humulin\"*\n" +
                "• **Executive Summary:** e.g. *\"Give me an inventory health summary\"*");
    }

    private AssistantQueryResponse handleDocumentProcessing() {
        return new AssistantQueryResponse(INTENT_DOCUMENT_PROCESSING,
                "### 📄 **Document Upload & AI Processing Pipeline**\n\n" +
                "You can upload pharmacy documents directly through the **Upload Pharmacy Document** dropzone above:\n\n" +
                "1. **Supported Formats:** PDF (`.pdf`) and CSV (`.csv`)\n" +
                "2. **Recognized Documents:**\n" +
                "   • **Purchase Invoices / Bills:** Auto-extracts supplier, items, prices, and adds purchased quantities to inventory stock.\n" +
                "   • **Sales Invoices / Receipts:** Validates stock levels, deducts quantities, and records official sales transactions.\n" +
                "   • **Medicine Master Lists / Inventory CSVs:** Detects existing medicines, updates quantities/prices, and adds new drugs.\n" +
                "3. **Safe Workflow:** StockUp AI always performs extraction and shows an **interactive diff preview** before modifying any database records.\n\n" +
                "Drop your file into the upload box above or click **Choose File** to begin analysis!");
    }

    @SuppressWarnings("unused")
    private static class PythonChatRequest {
        private String message;
        private List<Map<String, String>> history = new ArrayList<>();

        public PythonChatRequest(String message) {
            this.message = message;
        }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public List<Map<String, String>> getHistory() { return history; }
        public void setHistory(List<Map<String, String>> history) { this.history = history; }
    }

    @SuppressWarnings("unused")
    private static class PythonChatResponse {
        private String reply;
        private String model;

        public String getReply() { return reply; }
        public void setReply(String reply) { this.reply = reply; }
        public String getModel() { return model; }
        public void setModel(String model) { this.model = model; }
    }
}
