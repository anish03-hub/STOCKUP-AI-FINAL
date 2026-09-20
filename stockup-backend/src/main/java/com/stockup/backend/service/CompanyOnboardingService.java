package com.stockup.backend.service;

import com.stockup.backend.model.Business;
import com.stockup.backend.model.Item;
import com.stockup.backend.model.PurchaseOrder;
import com.stockup.backend.model.PurchaseOrderStatus;
import com.stockup.backend.model.Supplier;
import com.stockup.backend.model.User;
import com.stockup.backend.repository.BusinessRepository;
import com.stockup.backend.repository.DailySaleRepository;
import com.stockup.backend.repository.ItemRepository;
import com.stockup.backend.repository.PurchaseOrderRepository;
import com.stockup.backend.repository.SupplierRepository;
import com.stockup.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class CompanyOnboardingService implements CommandLineRunner {

    public static final String DEFAULT_BUSINESS_ID = "e7320361-9bb5-4de1-a3db-131400c4b7aa"; // fda_tester@stockup.com
    public static final String APOLLO_BUSINESS_ID  = "f87f86c9-4381-4149-96b4-b0aea80144e0"; // Apollo Apex Healthcare
    public static final String MEDLIFE_BUSINESS_ID = "0291fb20-e8ce-4814-afde-dc547c9282da"; // MedLife Care Pharma

    private final BusinessRepository businessRepository;
    private final ItemRepository itemRepository;
    private final SupplierRepository supplierRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final UserRepository userRepository;
    private final DailySaleRepository dailySaleRepository;

    @Value("classpath:medicines_2020_2025.csv")
    private Resource masterCsvResource;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking multi-tenant database isolation and company catalog assignments...");

        // 1. Assign existing unassigned items to default company (fda_tester@stockup.com)
        List<Item> unassignedItems = itemRepository.findAll().stream()
                .filter(item -> item.getBusinessId() == null || item.getBusinessId().trim().isEmpty())
                .toList();

        if (!unassignedItems.isEmpty()) {
            log.info("Assigning {} existing catalog items to default business ({})", unassignedItems.size(), DEFAULT_BUSINESS_ID);
            for (Item item : unassignedItems) {
                item.setBusinessId(DEFAULT_BUSINESS_ID);
            }
            itemRepository.saveAll(unassignedItems);
        }

        // 2. Assign existing unassigned suppliers
        List<Supplier> unassignedSuppliers = supplierRepository.findAll().stream()
                .filter(supp -> supp.getBusinessId() == null || supp.getBusinessId().trim().isEmpty())
                .toList();

        if (!unassignedSuppliers.isEmpty()) {
            log.info("Assigning {} existing suppliers to default business ({})", unassignedSuppliers.size(), DEFAULT_BUSINESS_ID);
            for (Supplier supp : unassignedSuppliers) {
                supp.setBusinessId(DEFAULT_BUSINESS_ID);
            }
            supplierRepository.saveAll(unassignedSuppliers);
        }

        // 3. Assign existing unassigned purchase orders
        List<PurchaseOrder> unassignedPos = purchaseOrderRepository.findAll().stream()
                .filter(po -> po.getBusinessId() == null || po.getBusinessId().trim().isEmpty())
                .toList();

        if (!unassignedPos.isEmpty()) {
            log.info("Assigning {} existing purchase orders to default business ({})", unassignedPos.size(), DEFAULT_BUSINESS_ID);
            for (PurchaseOrder po : unassignedPos) {
                po.setBusinessId(DEFAULT_BUSINESS_ID);
            }
            purchaseOrderRepository.saveAll(unassignedPos);
        }

        // 4. Ensure seed demo businesses have company catalog & suppliers initialized
        List<String> demoBusinessIds = List.of(DEFAULT_BUSINESS_ID, APOLLO_BUSINESS_ID, MEDLIFE_BUSINESS_ID);
        for (String busId : demoBusinessIds) {
            businessRepository.findById(busId).ifPresent(b -> ensureCompanyCatalogInitialized(b.getId(), b.getBusinessName()));
        }

        // 5. Connect target Google user (ag584160@gmail.com) to a valid Business & import existing master datasheet
        Optional<User> googleUserOpt = userRepository.findByEmail("ag584160@gmail.com");
        if (googleUserOpt.isPresent()) {
            User googleUser = googleUserOpt.get();
            String busId = googleUser.getBusinessId();
            Business googleBusiness = null;

            if (busId != null && !busId.isBlank()) {
                googleBusiness = businessRepository.findById(busId).orElse(null);
            }

            if (googleBusiness == null) {
                log.info("Creating a new valid Business for target Google user ag584160@gmail.com...");
                Business newBiz = new Business();
                newBiz.setBusinessName("StockUp Pharmacy");
                newBiz.setOwnerName(googleUser.getFullName() != null && !googleUser.getFullName().isBlank() ? googleUser.getFullName() : "anish");
                newBiz.setEmail(googleUser.getEmail());
                newBiz.setPhone(googleUser.getPhone() != null ? googleUser.getPhone() : "");
                newBiz.setBusinessType("Hospital Pharmacy");
                newBiz.setCreatedAt(LocalDateTime.now());
                googleBusiness = businessRepository.save(newBiz);

                googleUser.setBusinessId(googleBusiness.getId());
                googleUser.setRole("ADMIN");
                userRepository.save(googleUser);
                log.info("Assigned new Business {} ({}) to Google user ag584160@gmail.com", googleBusiness.getBusinessName(), googleBusiness.getId());
            }

            // Import existing master datasheet into Google user's Business
            importMasterDatasheetForBusiness(googleBusiness.getId(), googleBusiness.getBusinessName());
        }

        log.info("Multi-tenant company catalog assignments completed successfully.");
    }

    @Transactional
    public void importMasterDatasheetForBusiness(String businessId, String companyName) {
        if (businessId == null || businessId.trim().isEmpty()) return;

        ensureDailySalesInitialized(businessId, companyName);

        // Duplicate protection check
        List<Item> existingItems = itemRepository.findByBusinessId(businessId);
        if (!existingItems.isEmpty()) {
            log.info("Business {} ({}) already has {} items in database. Skipping duplicate import.", companyName, businessId, existingItems.size());
            return;
        }

        log.info("Importing existing master medicine datasheet for company: {} (businessId={})", companyName, businessId);

        List<Item> itemsToSave = new ArrayList<>();
        Set<String> uniqueManufacturers = new LinkedHashSet<>();

        try (BufferedReader reader = openMasterCsvReader()) {
            if (reader == null) {
                log.warn("Master CSV medicines_2020_2025.csv not found for business import.");
                return;
            }

            String headerLine = reader.readLine(); // skip header
            if (headerLine == null) return;

            String line;
            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                List<String> columns = parseCsvLine(line);
                if (columns.size() < 10) continue;

                Item item = new Item();
                item.setCode(columns.get(0).trim());
                item.setName(columns.get(1).trim());
                item.setCategory(columns.get(2).trim());

                String mfr = columns.get(3).trim();
                item.setManufacturer(mfr);
                if (!mfr.isEmpty()) {
                    uniqueManufacturers.add(mfr);
                }

                item.setDescription(columns.get(4).trim());

                try {
                    item.setPrice(Double.parseDouble(columns.get(5).trim()));
                } catch (Exception e) {
                    item.setPrice(25.0);
                }

                try {
                    item.setSellingPrice(Double.parseDouble(columns.get(6).trim()));
                } catch (Exception e) {
                    item.setSellingPrice(item.getPrice() * 1.30);
                }

                try {
                    item.setQuantity(Integer.parseInt(columns.get(7).trim()));
                } catch (Exception e) {
                    item.setQuantity(100);
                }

                item.setExpiryDate(columns.get(8).trim());
                item.setStatus(columns.get(9).trim());
                item.setBusinessId(businessId);

                itemsToSave.add(item);
            }

            if (!itemsToSave.isEmpty()) {
                itemRepository.saveAll(itemsToSave);
                log.info("Successfully imported {} medicines from master datasheet for business {} ({})", itemsToSave.size(), companyName, businessId);
            }
        } catch (Exception e) {
            log.error("Failed to import master datasheet for business {}: {}", businessId, e.getMessage(), e);
        }

        // Import corresponding suppliers from manufacturer column if supplier list is empty for this business
        List<Supplier> existingSuppliers = supplierRepository.findByBusinessId(businessId);
        if (existingSuppliers.isEmpty() && !uniqueManufacturers.isEmpty()) {
            List<Supplier> suppliersToSave = new ArrayList<>();
            for (String mfr : uniqueManufacturers) {
                Supplier s = new Supplier();
                s.setName(mfr);
                s.setContactPerson(mfr + " Account Manager");
                s.setPhone("+1 800-555-" + (Math.abs(mfr.hashCode()) % 9000 + 1000));
                s.setEmail("contact@" + mfr.toLowerCase().replaceAll("[^a-z0-9]", "") + ".com");
                s.setStatus("ACTIVE");
                s.setUnitCost(15.0);
                s.setAvgLeadTimeDays(3.0);
                s.setLeadTimeStdDevDays(0.5);
                s.setPerformanceScore(95.0);
                s.setFulfilledOrders(20);
                s.setBusinessId(businessId);
                suppliersToSave.add(s);
            }
            supplierRepository.saveAll(suppliersToSave);
            log.info("Successfully created {} suppliers for business {} ({})", suppliersToSave.size(), companyName, businessId);
        }
    }

    private BufferedReader openMasterCsvReader() {
        try {
            if (masterCsvResource != null && masterCsvResource.exists()) {
                return new BufferedReader(new InputStreamReader(masterCsvResource.getInputStream(), StandardCharsets.UTF_8));
            }
            File file = new File("medicines_2020_2025.csv");
            if (file.exists()) {
                return new BufferedReader(new FileReader(file, StandardCharsets.UTF_8));
            }
            File backendFile = new File("stockup-backend/medicines_2020_2025.csv");
            if (backendFile.exists()) {
                return new BufferedReader(new FileReader(backendFile, StandardCharsets.UTF_8));
            }
        } catch (Exception e) {
            log.warn("Could not open master CSV file: {}", e.getMessage());
        }
        return null;
    }

    private List<String> parseCsvLine(String line) {
        List<String> result = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '\"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                result.add(cleanField(sb.toString()));
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        result.add(cleanField(sb.toString()));
        return result;
    }

    private String cleanField(String field) {
        String trimmed = field.trim();
        if (trimmed.startsWith("\"") && trimmed.endsWith("\"") && trimmed.length() >= 2) {
            return trimmed.substring(1, trimmed.length() - 1).replace("\"\"", "\"").trim();
        }
        return trimmed;
    }

    @Transactional
    public void ensureCompanyCatalogInitialized(String businessId, String companyName) {
        if (businessId == null || businessId.trim().isEmpty()) return;

        ensureDailySalesInitialized(businessId, companyName);

        List<Item> existingCompanyItems = itemRepository.findByBusinessId(businessId);
        if (existingCompanyItems.isEmpty()) {
            log.info("Initializing baseline multi-tenant catalog for company: {} (businessId={})", companyName, businessId);

            // Clone baseline items from DEFAULT_BUSINESS_ID
            List<Item> defaultItems = itemRepository.findByBusinessId(DEFAULT_BUSINESS_ID);
            if (defaultItems.isEmpty()) {
                defaultItems = itemRepository.findAll();
            }

            List<Item> companyItems = new ArrayList<>();
            for (Item src : defaultItems) {
                Item clone = new Item();
                clone.setName(src.getName());
                clone.setCode(src.getCode());
                clone.setCategory(src.getCategory());
                clone.setManufacturer(src.getManufacturer());
                clone.setDescription(src.getDescription());
                clone.setPrice(src.getPrice());
                clone.setSellingPrice(src.getSellingPrice());
                clone.setQuantity(src.getQuantity());
                clone.setExpiryDate(src.getExpiryDate());
                clone.setStatus(src.getStatus());
                clone.setBusinessId(businessId);
                companyItems.add(clone);
            }
            itemRepository.saveAll(companyItems);
            log.info("Initialized {} catalog items for company {}", companyItems.size(), companyName);
        }

        List<Supplier> existingCompanySuppliers = supplierRepository.findByBusinessId(businessId);
        if (existingCompanySuppliers.isEmpty()) {
            List<Supplier> defaultSuppliers = supplierRepository.findByBusinessId(DEFAULT_BUSINESS_ID);
            if (defaultSuppliers.isEmpty()) {
                defaultSuppliers = supplierRepository.findAll();
            }

            List<Supplier> companySuppliers = new ArrayList<>();
            for (Supplier src : defaultSuppliers) {
                Supplier clone = new Supplier();
                clone.setName(src.getName());
                clone.setContactPerson(src.getContactPerson());
                clone.setPhone(src.getPhone());
                clone.setEmail(src.getEmail());
                clone.setAddress(src.getAddress());
                clone.setCity(src.getCity());
                clone.setState(src.getState());
                clone.setStatus(src.getStatus());
                clone.setUnitCost(src.getUnitCost());
                clone.setAvgLeadTimeDays(src.getAvgLeadTimeDays());
                clone.setLeadTimeStdDevDays(src.getLeadTimeStdDevDays());
                clone.setPerformanceScore(src.getPerformanceScore());
                clone.setFulfilledOrders(src.getFulfilledOrders());
                clone.setSuppliedCategories(src.getSuppliedCategories());
                clone.setBusinessId(businessId);
                companySuppliers.add(clone);
            }
            supplierRepository.saveAll(companySuppliers);
            log.info("Initialized {} suppliers for company {}", companySuppliers.size(), companyName);
        }

        // Initialize sample purchase orders if empty
        List<PurchaseOrder> existingPos = purchaseOrderRepository.findByBusinessIdOrderByCreatedAtDesc(businessId);
        if (existingPos.isEmpty()) {
            List<Item> companyItems = itemRepository.findByBusinessId(businessId);
            if (!companyItems.isEmpty()) {
                Item item = companyItems.get(0);
                String prefix = businessId.length() >= 8 ? businessId.substring(0, 8).toUpperCase() : businessId.toUpperCase();
                PurchaseOrder po = new PurchaseOrder();
                po.setPoNumber("PO-" + prefix + "-101");
                po.setItemId(item.getId());
                po.setItemCode(item.getCode());
                po.setItemName(item.getName());
                po.setQuantityOrdered(100);
                po.setUnitPrice(item.getPrice() != null ? item.getPrice() : 25.0);
                po.setTotalAmount(100 * (item.getPrice() != null ? item.getPrice() : 25.0));
                po.setPriority("Urgent");
                po.setStatus(PurchaseOrderStatus.SUBMITTED);
                po.setBusinessId(businessId);
                po.setNotes("Initial replenishment for " + companyName);
                po.setCreatedAt(LocalDateTime.now());
                purchaseOrderRepository.save(po);
            }
        }
    }

    @Transactional
    public void ensureDailySalesInitialized(String businessId, String companyName) {
        if (businessId == null || businessId.trim().isEmpty()) return;
        long count = dailySaleRepository.countByBusinessId(businessId);
        if (count == 0 && !DEFAULT_BUSINESS_ID.equals(businessId)) {
            long defaultCount = dailySaleRepository.countByBusinessId(DEFAULT_BUSINESS_ID);
            if (defaultCount > 0) {
                log.info("Initializing baseline historical sales dataset for company: {} (businessId={})...", companyName, businessId);
                int copied = dailySaleRepository.copyBaselineSalesToBusiness(DEFAULT_BUSINESS_ID, businessId);
                log.info("Successfully copied {} historical sales records for company {}", copied, companyName);
            }
        }
    }
}
