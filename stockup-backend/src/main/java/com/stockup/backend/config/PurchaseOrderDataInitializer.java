package com.stockup.backend.config;

import com.stockup.backend.model.Item;
import com.stockup.backend.model.PurchaseOrder;
import com.stockup.backend.model.PurchaseOrderStatus;
import com.stockup.backend.model.Supplier;
import com.stockup.backend.repository.ItemRepository;
import com.stockup.backend.repository.PurchaseOrderRepository;
import com.stockup.backend.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Seeds initial purchase order entries on boot if table is empty.
 */
@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class PurchaseOrderDataInitializer implements CommandLineRunner {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ItemRepository itemRepository;
    private final SupplierRepository supplierRepository;

    @Override
    public void run(String... args) {
        if (purchaseOrderRepository.count() > 0) {
            return;
        }

        log.info("Seeding initial purchase orders for procurement ledger...");

        try {
            // Find reference items & suppliers
            Optional<Item> humulin = itemRepository.findByCodeIgnoreCase("0002-0213");
            Optional<Item> pfizerpen = itemRepository.findByCodeIgnoreCase("0049-0430");
            Optional<Item> cleocin = itemRepository.findByCodeIgnoreCase("0009-0775");
            Optional<Item> venlafaxine = itemRepository.findByCodeIgnoreCase("0093-9147");

            Optional<Supplier> lilly = supplierRepository.findByNameIgnoreCase("Lilly Logistics Direct");
            Optional<Supplier> mckesson = supplierRepository.findByNameIgnoreCase("McKesson Health Distribution");
            Optional<Supplier> pfizer = supplierRepository.findByNameIgnoreCase("Pfizer Global Distribution");
            Optional<Supplier> amerisource = supplierRepository.findByNameIgnoreCase("AmerisourceBergen Logistics");

            // PO 1: Submitted / Pending Humulin replenishment
            PurchaseOrder po1 = new PurchaseOrder();
            po1.setPoNumber("PO-2026-1041");
            po1.setItemId(humulin.map(Item::getId).orElse(null));
            po1.setItemCode(humulin.map(Item::getCode).orElse("0002-0213"));
            po1.setItemName(humulin.map(Item::getName).orElse("Humulin Injection, Solution"));
            po1.setSupplierId(lilly.map(Supplier::getId).orElse(null));
            po1.setSupplierName(lilly.map(Supplier::getName).orElse("Lilly Logistics Direct"));
            po1.setQuantityOrdered(150);
            po1.setUnitPrice(44.88);
            po1.setTotalAmount(150 * 44.88);
            po1.setPriority("High");
            po1.setNotes("Scheduled cold-chain batch delivery for diabetes ward.");
            po1.setStatus(PurchaseOrderStatus.SUBMITTED);
            po1.setExpectedDeliveryDate(LocalDate.now().plusDays(2).toString());
            po1.setCreatedAt(LocalDateTime.now().minusHours(8));
            purchaseOrderRepository.save(po1);

            // PO 2: Submitted / Urgent Pfizerpen replenishment
            PurchaseOrder po2 = new PurchaseOrder();
            po2.setPoNumber("PO-2026-1042");
            po2.setItemId(pfizerpen.map(Item::getId).orElse(null));
            po2.setItemCode(pfizerpen.map(Item::getCode).orElse("0049-0430"));
            po2.setItemName(pfizerpen.map(Item::getName).orElse("Pfizerpen Powder, For Solution"));
            po2.setSupplierId(pfizer.map(Supplier::getId).orElse(null));
            po2.setSupplierName(pfizer.map(Supplier::getName).orElse("Pfizer Global Distribution"));
            po2.setQuantityOrdered(200);
            po2.setUnitPrice(47.23);
            po2.setTotalAmount(200 * 47.23);
            po2.setPriority("Urgent");
            po2.setNotes("Critical low-stock restock priority.");
            po2.setStatus(PurchaseOrderStatus.SUBMITTED);
            po2.setExpectedDeliveryDate(LocalDate.now().plusDays(3).toString());
            po2.setCreatedAt(LocalDateTime.now().minusHours(14));
            purchaseOrderRepository.save(po2);

            // PO 3: Draft Cleocin order
            PurchaseOrder po3 = new PurchaseOrder();
            po3.setPoNumber("PO-2026-1043");
            po3.setItemId(cleocin.map(Item::getId).orElse(null));
            po3.setItemCode(cleocin.map(Item::getCode).orElse("0009-0775"));
            po3.setItemName(cleocin.map(Item::getName).orElse("Cleocin Phosphate Injection, Solution"));
            po3.setSupplierId(amerisource.map(Supplier::getId).orElse(null));
            po3.setSupplierName(amerisource.map(Supplier::getName).orElse("AmerisourceBergen Logistics"));
            po3.setQuantityOrdered(75);
            po3.setUnitPrice(124.61);
            po3.setTotalAmount(75 * 124.61);
            po3.setPriority("Medium");
            po3.setNotes("Draft generated from safety stock recommendation.");
            po3.setStatus(PurchaseOrderStatus.DRAFT);
            po3.setExpectedDeliveryDate(LocalDate.now().plusDays(5).toString());
            po3.setCreatedAt(LocalDateTime.now().minusDays(1));
            purchaseOrderRepository.save(po3);

            // PO 4: Received / Fulfilled Venlafaxine order
            PurchaseOrder po4 = new PurchaseOrder();
            po4.setPoNumber("PO-2026-1039");
            po4.setItemId(venlafaxine.map(Item::getId).orElse(null));
            po4.setItemCode(venlafaxine.map(Item::getCode).orElse("0093-9147"));
            po4.setItemName(venlafaxine.map(Item::getName).orElse("Venlafaxine Hydrochloride Tablet"));
            po4.setSupplierId(mckesson.map(Supplier::getId).orElse(null));
            po4.setSupplierName(mckesson.map(Supplier::getName).orElse("McKesson Health Distribution"));
            po4.setQuantityOrdered(100);
            po4.setUnitPrice(39.69);
            po4.setTotalAmount(100 * 39.69);
            po4.setPriority("Medium");
            po4.setNotes("Delivered and inspected at dock 4.");
            po4.setStatus(PurchaseOrderStatus.RECEIVED);
            po4.setExpectedDeliveryDate(LocalDate.now().minusDays(2).toString());
            po4.setCreatedAt(LocalDateTime.now().minusDays(4));
            po4.setReceivedAt(LocalDateTime.now().minusDays(2));
            purchaseOrderRepository.save(po4);

            log.info("Successfully seeded 4 starter purchase orders.");
        } catch (Exception e) {
            log.warn("Failed to seed starter purchase orders: {}", e.getMessage());
        }
    }
}
