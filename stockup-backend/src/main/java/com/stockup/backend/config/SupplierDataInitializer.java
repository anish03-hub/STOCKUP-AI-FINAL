package com.stockup.backend.config;

import com.stockup.backend.model.Supplier;
import com.stockup.backend.repository.SupplierRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Seeds a starter set of suppliers on first boot so the Supplier
 * Recommendation and Lead Time Prediction modules have data to work with.
 * Runs only when the suppliers table is empty — safe on every restart.
 */
@Component
public class SupplierDataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(SupplierDataInitializer.class);

    private final SupplierRepository supplierRepository;

    public SupplierDataInitializer(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    @Override
    public void run(String... args) {
        if (supplierRepository.count() > 0) {
            return;
        }
        logger.info("Seeding initial suppliers for recommendation/lead-time modules...");

        List<Supplier> seed = List.of(
                supplier("McKesson Health Distribution", "Sarah Jenkins", "+1-415-555-0192", "orders@mckessonhealth.com",
                        "1 Post St, 28th Floor", "San Francisco", "CA", "Active",
                        18.50, 2.5, 0.6, 97.0, 420,
                        "General Medicine, Insulin [CS], Insulin Analog [EPC], Anti-Inflammatory Agents, Corticosteroid Hormone Receptor Agonists [MoA]"),
                supplier("AmerisourceBergen Logistics", "Marcus Vance", "+1-610-555-0143", "logistics@amerisourcebergen.com",
                        "1 West First Ave, Conshohocken Suite 300", "Conshohocken", "PA", "Active",
                        19.20, 3.0, 0.5, 98.0, 512,
                        "General Medicine, Penicillin-class Antibacterial [EPC], Decreased Cell Wall Integrity [PE], Antibacterial, Anti-epileptic Agent [EPC]"),
                supplier("Cardinal Health Solutions", "Elena Rodriguez", "+1-614-555-0118", "supply@cardinalhealth.com",
                        "7000 Cardinal Place", "Dublin", "OH", "Active",
                        17.80, 2.8, 0.7, 96.0, 388,
                        "General Medicine, Corticosteroid Hormone Receptor Agonists [MoA], Central Nervous System Stimulant [EPC], Angiotensin 2 Receptor Antagonists [MoA]"),
                supplier("Lilly Logistics Direct", "David Thornton", "+1-317-555-0187", "orders@lillylogistics.com",
                        "Lilly Corporate Center, Suite 400", "Indianapolis", "IN", "Active",
                        24.50, 2.0, 0.4, 99.0, 310,
                        "Insulin [CS], Insulin Analog [EPC], G-Protein-linked Receptor Interactions [MoA], General Medicine"),
                supplier("Pfizer Global Distribution", "Rachel Adams", "+1-212-555-0120", "distribution@pfizerglobal.com",
                        "66 Hudson Blvd E, Floor 14", "New York", "NY", "Active",
                        22.00, 3.2, 0.6, 95.0, 460,
                        "Penicillin-class Antibacterial [EPC], Anti-Inflammatory Agents, Full Opioid Agonists [MoA], Decreased Cell Wall Integrity [PE]"),
                supplier("MedLife Pharma Distributors", "Alice Smith", "+1-212-555-0165", "alice.smith@medlifepharma.com",
                        "450 Lexington Ave, Suite 1200", "New York", "NY", "Active",
                        14.50, 4.0, 0.8, 91.0, 215,
                        "General Medicine, Anti-Inflammatory Agents, Cholinergic Nicotinic Agonist [EPC], Allergens [CS]"),
                supplier("BioGen Therapeutics Supply", "Evan Wright", "+1-858-555-0149", "supply@biogentherapeutics.com",
                        "10240 Science Center Dr", "San Diego", "CA", "Active",
                        28.00, 2.2, 0.5, 98.5, 275,
                        "Insulin [CS], Insulin Analog [EPC], Blood Coagulation Factor [EPC], Breast Cancer Resistance Protein Inhibitors [MoA]"),
                supplier("Apex Rx Logistics", "Brian O'Connor", "+1-312-555-0177", "support@apexrxlogistics.com",
                        "300 S Riverside Plaza, Suite 900", "Chicago", "IL", "Active",
                        15.20, 3.5, 0.9, 92.0, 198,
                        "Angiotensin 2 Receptor Antagonists [MoA], Adrenergic alpha1-Agonists [MoA], Adrenergic alpha-Agonists [MoA], General Medicine"),
                supplier("NovaCare Pharmaceutical Network", "Jennifer Wu", "+1-617-555-0182", "contact@novacarepharma.com",
                        "500 Boylston St, 16th Floor", "Boston", "MA", "Active",
                        16.90, 3.8, 1.0, 89.0, 160,
                        "Anti-epileptic Agent [EPC], Central Nervous System Stimulant [EPC], Atypical Antipsychotic [EPC], Benzodiazepine [EPC]"),
                supplier("Zenith Pharma Direct", "George Miller", "+1-303-555-0199", "orders@zenithpharmadirect.com",
                        "1700 Lincoln St, Suite 2200", "Denver", "CO", "Active",
                        13.80, 4.5, 1.1, 87.0, 185,
                        "Decreased Respiratory Secretion Viscosity [PE], Histamine H1 Receptor Antagonists [MoA], General Medicine, Anti-Inflammatory Agents"),
                supplier("OmniMed Express Distribution", "Teresa Ramirez", "+1-214-555-0134", "orders@omnimedexpress.com",
                        "2001 Ross Ave, Suite 700", "Dallas", "TX", "Active",
                        20.10, 2.9, 0.7, 94.0, 320,
                        "Blood Coagulation Factor [EPC], Actively Acquired Immunity [PE], Kinase Inhibitor [EPC], G-Protein-linked Receptor Interactions [MoA]"),
                supplier("PrimeRx Medical Wholesale", "Kevin Patel", "+1-404-555-0156", "sales@primerxwholesale.com",
                        "3344 Peachtree Rd NE, Suite 1100", "Atlanta", "GA", "Active",
                        12.80, 5.2, 1.2, 85.0, 140,
                        "General Medicine, Cytochrome P450 2D6 Inhibitors [MoA], Sigma-1 Agonist [EPC], Anti-Inflammatory Agents"),
                supplier("HealthFirst Supply Chain", "Diana Prince", "+1-206-555-0168", "supply@healthfirstsupplies.com",
                        "1201 3rd Ave, Suite 1800", "Seattle", "WA", "Active",
                        16.40, 3.4, 0.8, 93.0, 240,
                        "Insulin [CS], Corticosteroid Hormone Receptor Agonists [MoA], Penicillin-class Antibacterial [EPC]"),
                supplier("CarePlus Healthcare Logistics", "Charlie Davis", "+1-617-555-0191", "charlie@careplusmed.com",
                        "100 High St, 9th Floor", "Boston", "MA", "Inactive",
                        26.50, 6.5, 1.5, 81.0, 55,
                        "General Medicine, Full Opioid Agonists [MoA]")
        );

        supplierRepository.saveAll(seed);
        logger.info("Seeded {} suppliers.", seed.size());
    }

    private Supplier supplier(String name, String contact, String phone, String email, String address,
                              String city, String state, String status,
                              double unitCost, double avgLead, double leadStd, double perf,
                              int orders, String categories) {
        Supplier s = new Supplier();
        s.setName(name);
        s.setContactPerson(contact);
        s.setPhone(phone);
        s.setEmail(email);
        s.setAddress(address);
        s.setCity(city);
        s.setState(state);
        s.setStatus(status);
        s.setUnitCost(unitCost);
        s.setAvgLeadTimeDays(avgLead);
        s.setLeadTimeStdDevDays(leadStd);
        s.setPerformanceScore(perf);
        s.setFulfilledOrders(orders);
        s.setSuppliedCategories(categories);
        return s;
    }
}
