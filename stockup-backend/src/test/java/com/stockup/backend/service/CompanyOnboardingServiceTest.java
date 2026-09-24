package com.stockup.backend.service;

import com.stockup.backend.model.Business;
import com.stockup.backend.model.Item;
import com.stockup.backend.model.Supplier;
import com.stockup.backend.repository.BusinessRepository;
import com.stockup.backend.repository.DailySaleRepository;
import com.stockup.backend.repository.ItemRepository;
import com.stockup.backend.repository.PurchaseOrderRepository;
import com.stockup.backend.repository.SupplierRepository;
import com.stockup.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.Optional;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class CompanyOnboardingServiceTest {

    @Mock
    private BusinessRepository businessRepository;

    @Mock
    private ItemRepository itemRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DailySaleRepository dailySaleRepository;

    @Mock
    private TransactionTemplate transactionTemplate;

    @InjectMocks
    private CompanyOnboardingService companyOnboardingService;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        doAnswer(invocation -> {
            Consumer<Object> action = invocation.getArgument(0);
            action.accept(null);
            return null;
        }).when(transactionTemplate).executeWithoutResult(any());
    }

    @Test
    public void testEnsureCompanyCatalogInitialized_ZeroItems_ClonesCatalogWithTargetBusinessId() {
        String targetBusinessId = "biz-medicare-123";
        String companyName = "medicare";

        Item defaultItem = new Item();
        defaultItem.setCode("MED-001");
        defaultItem.setName("Paracetamol");
        defaultItem.setCategory("Analgesic");
        defaultItem.setPrice(10.0);
        defaultItem.setBusinessId(CompanyOnboardingService.DEFAULT_BUSINESS_ID);

        Supplier defaultSupplier = new Supplier();
        defaultSupplier.setName("Pharma Supplier");
        defaultSupplier.setBusinessId(CompanyOnboardingService.DEFAULT_BUSINESS_ID);

        when(itemRepository.countByBusinessId(targetBusinessId)).thenReturn(0L);
        when(itemRepository.findByBusinessId(CompanyOnboardingService.DEFAULT_BUSINESS_ID)).thenReturn(List.of(defaultItem));

        when(supplierRepository.countByBusinessId(targetBusinessId)).thenReturn(0L);
        when(supplierRepository.findByBusinessId(CompanyOnboardingService.DEFAULT_BUSINESS_ID)).thenReturn(List.of(defaultSupplier));

        when(purchaseOrderRepository.countByBusinessId(targetBusinessId)).thenReturn(0L);
        when(dailySaleRepository.countByBusinessId(targetBusinessId)).thenReturn(0L);

        companyOnboardingService.ensureCompanyCatalogInitialized(targetBusinessId, companyName);

        // Verify items cloned with targetBusinessId
        ArgumentCaptor<List<Item>> itemCaptor = ArgumentCaptor.forClass(List.class);
        verify(itemRepository, times(1)).saveAll(itemCaptor.capture());
        List<Item> savedItems = itemCaptor.getValue();
        assertEquals(1, savedItems.size());
        assertEquals("MED-001", savedItems.get(0).getCode());
        assertEquals(targetBusinessId, savedItems.get(0).getBusinessId());

        // Verify suppliers cloned with targetBusinessId
        ArgumentCaptor<List<Supplier>> supplierCaptor = ArgumentCaptor.forClass(List.class);
        verify(supplierRepository, times(1)).saveAll(supplierCaptor.capture());
        List<Supplier> savedSuppliers = supplierCaptor.getValue();
        assertEquals(1, savedSuppliers.size());
        assertEquals(targetBusinessId, savedSuppliers.get(0).getBusinessId());
    }

    @Test
    public void testEnsureCompanyCatalogInitialized_ExistingItems_SkipsDuplicateInitialization() {
        String targetBusinessId = "biz-medicare-123";
        String companyName = "medicare";

        when(itemRepository.countByBusinessId(targetBusinessId)).thenReturn(100L);
        when(supplierRepository.countByBusinessId(targetBusinessId)).thenReturn(5L);
        when(purchaseOrderRepository.countByBusinessId(targetBusinessId)).thenReturn(2L);
        when(dailySaleRepository.countByBusinessId(targetBusinessId)).thenReturn(50L);

        companyOnboardingService.ensureCompanyCatalogInitialized(targetBusinessId, companyName);

        verify(itemRepository, never()).saveAll(any());
        verify(supplierRepository, never()).saveAll(any());
        verify(purchaseOrderRepository, never()).save(any());
    }

    @Test
    public void testEnsureCompanyCatalogInitialized_DefaultBusinessId_DoesNotDuplicateSelf() {
        String defaultId = CompanyOnboardingService.DEFAULT_BUSINESS_ID;

        when(itemRepository.countByBusinessId(defaultId)).thenReturn(2511L);
        when(supplierRepository.countByBusinessId(defaultId)).thenReturn(15L);
        when(purchaseOrderRepository.countByBusinessId(defaultId)).thenReturn(1L);

        companyOnboardingService.ensureCompanyCatalogInitialized(defaultId, "Default Tenant");

        verify(itemRepository, never()).saveAll(any());
        verify(supplierRepository, never()).saveAll(any());
        verify(dailySaleRepository, never()).copyBaselineSalesToBusiness(any(), any());
    }

    @Test
    public void testOnApplicationReady_DiscoversAllBusinessesAndInitializesEachWithinTransactionBoundary() {
        Business biz1 = new Business();
        biz1.setId("biz-medicare-123");
        biz1.setBusinessName("Medicare Pharmacy");

        Business biz2 = new Business();
        biz2.setId("biz-apollo-456");
        biz2.setBusinessName("Apollo Pharmacy");

        when(businessRepository.findAll()).thenReturn(List.of(biz1, biz2));
        when(userRepository.findByEmail("ag584160@gmail.com")).thenReturn(Optional.empty());

        when(itemRepository.countByBusinessId("biz-medicare-123")).thenReturn(0L);
        when(itemRepository.countByBusinessId("biz-apollo-456")).thenReturn(10L);

        companyOnboardingService.onApplicationReady();

        // TransactionTemplate executed for unassigned entities check and for each business
        verify(transactionTemplate, atLeast(2)).executeWithoutResult(any());
        verify(itemRepository, times(1)).countByBusinessId("biz-medicare-123");
        verify(itemRepository, times(1)).countByBusinessId("biz-apollo-456");
    }
}
