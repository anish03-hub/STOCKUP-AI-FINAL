package com.stockup.backend.repository;

import com.stockup.backend.model.DailySale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DailySaleRepository extends JpaRepository<DailySale, String> {

    @Modifying
    @Transactional
    @Query(value = """
        INSERT INTO daily_sales (
            id, age_group, business_id, category, country, covid_flag,
            created_at, date, day, expiry_days_remaining, medicine, month,
            region, stock_level, total_revenue, unit_price, units_sold, year
        )
        SELECT 
            gen_random_uuid(), age_group, :targetBusinessId, category, country, covid_flag,
            NOW(), date, day, expiry_days_remaining, medicine, month,
            region, stock_level, total_revenue, unit_price, units_sold, year
        FROM daily_sales
        WHERE business_id = :sourceBusinessId
    """, nativeQuery = true)
    int copyBaselineSalesToBusiness(@Param("sourceBusinessId") String sourceBusinessId, @Param("targetBusinessId") String targetBusinessId);

    long countByBusinessId(String businessId);

    long countByBusinessIdAndMedicineIgnoreCase(String businessId, String medicine);

    Page<DailySale> findByBusinessId(String businessId, Pageable pageable);

    @Query("SELECT MIN(s.date) FROM DailySale s WHERE s.businessId = :businessId")
    LocalDate findMinDateByBusinessId(@Param("businessId") String businessId);

    @Query("SELECT MAX(s.date) FROM DailySale s WHERE s.businessId = :businessId")
    LocalDate findMaxDateByBusinessId(@Param("businessId") String businessId);

    @Query("SELECT DISTINCT s.medicine FROM DailySale s WHERE s.businessId = :businessId ORDER BY s.medicine ASC")
    List<String> findDistinctMedicinesByBusinessId(@Param("businessId") String businessId);

    @Query("SELECT DISTINCT s.country FROM DailySale s WHERE s.businessId = :businessId ORDER BY s.country ASC")
    List<String> findDistinctCountriesByBusinessId(@Param("businessId") String businessId);

    @Query("SELECT DISTINCT s.region FROM DailySale s WHERE s.businessId = :businessId ORDER BY s.region ASC")
    List<String> findDistinctRegionsByBusinessId(@Param("businessId") String businessId);

    @Query("SELECT DISTINCT s.category FROM DailySale s WHERE s.businessId = :businessId ORDER BY s.category ASC")
    List<String> findDistinctCategoriesByBusinessId(@Param("businessId") String businessId);

    @Query("SELECT DISTINCT s.ageGroup FROM DailySale s WHERE s.businessId = :businessId ORDER BY s.ageGroup ASC")
    List<String> findDistinctAgeGroupsByBusinessId(@Param("businessId") String businessId);

    // ── High Performance Aggregations ──────────────────────────────────────────

    @Query(value = """
        SELECT 
            COALESCE(SUM(s.units_sold), 0) AS totalUnitsSold,
            COALESCE(SUM(s.units_sold * s.unit_price), 0) AS totalRevenue,
            COALESCE(AVG(s.unit_price), 0) AS averageUnitPrice,
            COUNT(s.id) AS totalTransactions,
            COUNT(DISTINCT s.medicine) AS activeMedicines,
            COUNT(DISTINCT s.country) AS countriesCovered,
            COUNT(DISTINCT s.region) AS regionsCovered,
            MIN(s.date) AS minDate,
            MAX(s.date) AS maxDate
        FROM daily_sales s
        WHERE s.business_id = :businessId
          AND (CAST(:startDate AS date) IS NULL OR s.date >= CAST(:startDate AS date))
          AND (CAST(:endDate AS date) IS NULL OR s.date <= CAST(:endDate AS date))
          AND (CAST(:medicine AS varchar) IS NULL OR s.medicine = CAST(:medicine AS varchar))
          AND (CAST(:country AS varchar) IS NULL OR s.country = CAST(:country AS varchar))
          AND (CAST(:region AS varchar) IS NULL OR s.region = CAST(:region AS varchar))
          AND (CAST(:category AS varchar) IS NULL OR s.category = CAST(:category AS varchar))
    """, nativeQuery = true)
    List<Object[]> getSalesSummary(
            @Param("businessId") String businessId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("medicine") String medicine,
            @Param("country") String country,
            @Param("region") String region,
            @Param("category") String category
    );

    @Query(value = """
        SELECT 
            TO_CHAR(s.date, 'YYYY-MM') AS period,
            COALESCE(SUM(s.units_sold), 0) AS unitsSold,
            COALESCE(SUM(s.units_sold * s.unit_price), 0) AS revenue,
            COALESCE(AVG(s.unit_price), 0) AS averagePrice,
            COUNT(s.id) AS transactionCount
        FROM daily_sales s
        WHERE s.business_id = :businessId
          AND (CAST(:startDate AS date) IS NULL OR s.date >= CAST(:startDate AS date))
          AND (CAST(:endDate AS date) IS NULL OR s.date <= CAST(:endDate AS date))
          AND (CAST(:medicine AS varchar) IS NULL OR s.medicine = CAST(:medicine AS varchar))
          AND (CAST(:country AS varchar) IS NULL OR s.country = CAST(:country AS varchar))
          AND (CAST(:region AS varchar) IS NULL OR s.region = CAST(:region AS varchar))
          AND (CAST(:category AS varchar) IS NULL OR s.category = CAST(:category AS varchar))
        GROUP BY TO_CHAR(s.date, 'YYYY-MM')
        ORDER BY period ASC
    """, nativeQuery = true)
    List<Object[]> getMonthlySalesTrend(
            @Param("businessId") String businessId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("medicine") String medicine,
            @Param("country") String country,
            @Param("region") String region,
            @Param("category") String category
    );

    @Query(value = """
        SELECT 
            TO_CHAR(s.date, 'YYYY-MM-DD') AS period,
            COALESCE(SUM(s.units_sold), 0) AS unitsSold,
            COALESCE(SUM(s.units_sold * s.unit_price), 0) AS revenue,
            COALESCE(AVG(s.unit_price), 0) AS averagePrice,
            COUNT(s.id) AS transactionCount
        FROM daily_sales s
        WHERE s.business_id = :businessId
          AND (CAST(:startDate AS date) IS NULL OR s.date >= CAST(:startDate AS date))
          AND (CAST(:endDate AS date) IS NULL OR s.date <= CAST(:endDate AS date))
          AND (CAST(:medicine AS varchar) IS NULL OR s.medicine = CAST(:medicine AS varchar))
          AND (CAST(:country AS varchar) IS NULL OR s.country = CAST(:country AS varchar))
          AND (CAST(:region AS varchar) IS NULL OR s.region = CAST(:region AS varchar))
          AND (CAST(:category AS varchar) IS NULL OR s.category = CAST(:category AS varchar))
        GROUP BY s.date
        ORDER BY s.date ASC
        LIMIT :limit
    """, nativeQuery = true)
    List<Object[]> getDailySalesTrend(
            @Param("businessId") String businessId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("medicine") String medicine,
            @Param("country") String country,
            @Param("region") String region,
            @Param("category") String category,
            @Param("limit") int limit
    );

    @Query(value = """
        SELECT 
            s.medicine,
            MAX(s.category) AS category,
            COALESCE(SUM(s.units_sold), 0) AS unitsSold,
            COALESCE(SUM(s.units_sold * s.unit_price), 0) AS revenue,
            COALESCE(AVG(s.unit_price), 0) AS averagePrice
        FROM daily_sales s
        WHERE s.business_id = :businessId
          AND (CAST(:startDate AS date) IS NULL OR s.date >= CAST(:startDate AS date))
          AND (CAST(:endDate AS date) IS NULL OR s.date <= CAST(:endDate AS date))
          AND (CAST(:country AS varchar) IS NULL OR s.country = CAST(:country AS varchar))
          AND (CAST(:region AS varchar) IS NULL OR s.region = CAST(:region AS varchar))
          AND (CAST(:category AS varchar) IS NULL OR s.category = CAST(:category AS varchar))
        GROUP BY s.medicine
        ORDER BY unitsSold DESC
        LIMIT :limit
    """, nativeQuery = true)
    List<Object[]> getTopMedicines(
            @Param("businessId") String businessId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("country") String country,
            @Param("region") String region,
            @Param("category") String category,
            @Param("limit") int limit
    );

    @Query(value = """
        SELECT 
            s.country,
            MAX(s.region) AS region,
            COALESCE(SUM(s.units_sold), 0) AS unitsSold,
            COALESCE(SUM(s.units_sold * s.unit_price), 0) AS revenue
        FROM daily_sales s
        WHERE s.business_id = :businessId
          AND (CAST(:startDate AS date) IS NULL OR s.date >= CAST(:startDate AS date))
          AND (CAST(:endDate AS date) IS NULL OR s.date <= CAST(:endDate AS date))
          AND (CAST(:medicine AS varchar) IS NULL OR s.medicine = CAST(:medicine AS varchar))
          AND (CAST(:region AS varchar) IS NULL OR s.region = CAST(:region AS varchar))
          AND (CAST(:category AS varchar) IS NULL OR s.category = CAST(:category AS varchar))
        GROUP BY s.country
        ORDER BY revenue DESC
    """, nativeQuery = true)
    List<Object[]> getSalesByCountry(
            @Param("businessId") String businessId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("medicine") String medicine,
            @Param("region") String region,
            @Param("category") String category
    );

    @Query(value = """
        SELECT 
            s.region,
            COALESCE(SUM(s.units_sold), 0) AS unitsSold,
            COALESCE(SUM(s.units_sold * s.unit_price), 0) AS revenue
        FROM daily_sales s
        WHERE s.business_id = :businessId
          AND (CAST(:startDate AS date) IS NULL OR s.date >= CAST(:startDate AS date))
          AND (CAST(:endDate AS date) IS NULL OR s.date <= CAST(:endDate AS date))
          AND (CAST(:medicine AS varchar) IS NULL OR s.medicine = CAST(:medicine AS varchar))
          AND (CAST(:country AS varchar) IS NULL OR s.country = CAST(:country AS varchar))
          AND (CAST(:category AS varchar) IS NULL OR s.category = CAST(:category AS varchar))
        GROUP BY s.region
        ORDER BY revenue DESC
    """, nativeQuery = true)
    List<Object[]> getSalesByRegion(
            @Param("businessId") String businessId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("medicine") String medicine,
            @Param("country") String country,
            @Param("category") String category
    );

    @Query(value = """
        SELECT 
            s.category,
            COALESCE(SUM(s.units_sold), 0) AS unitsSold,
            COALESCE(SUM(s.units_sold * s.unit_price), 0) AS revenue
        FROM daily_sales s
        WHERE s.business_id = :businessId
          AND (CAST(:startDate AS date) IS NULL OR s.date >= CAST(:startDate AS date))
          AND (CAST(:endDate AS date) IS NULL OR s.date <= CAST(:endDate AS date))
          AND (CAST(:medicine AS varchar) IS NULL OR s.medicine = CAST(:medicine AS varchar))
          AND (CAST(:country AS varchar) IS NULL OR s.country = CAST(:country AS varchar))
          AND (CAST(:region AS varchar) IS NULL OR s.region = CAST(:region AS varchar))
        GROUP BY s.category
        ORDER BY revenue DESC
    """, nativeQuery = true)
    List<Object[]> getSalesByCategory(
            @Param("businessId") String businessId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("medicine") String medicine,
            @Param("country") String country,
            @Param("region") String region
    );

    @Query(value = """
        SELECT 
            s.age_group AS ageGroup,
            COALESCE(SUM(s.units_sold), 0) AS unitsSold,
            COALESCE(SUM(s.units_sold * s.unit_price), 0) AS revenue
        FROM daily_sales s
        WHERE s.business_id = :businessId
          AND (CAST(:startDate AS date) IS NULL OR s.date >= CAST(:startDate AS date))
          AND (CAST(:endDate AS date) IS NULL OR s.date <= CAST(:endDate AS date))
          AND (CAST(:medicine AS varchar) IS NULL OR s.medicine = CAST(:medicine AS varchar))
          AND (CAST(:country AS varchar) IS NULL OR s.country = CAST(:country AS varchar))
          AND (CAST(:region AS varchar) IS NULL OR s.region = CAST(:region AS varchar))
          AND (CAST(:category AS varchar) IS NULL OR s.category = CAST(:category AS varchar))
        GROUP BY s.age_group
        ORDER BY ageGroup ASC
    """, nativeQuery = true)
    List<Object[]> getSalesByAgeGroup(
            @Param("businessId") String businessId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("medicine") String medicine,
            @Param("country") String country,
            @Param("region") String region,
            @Param("category") String category
    );

    @Query(value = """
        SELECT 
            s.covid_flag AS covidFlag,
            COALESCE(SUM(s.units_sold), 0) AS unitsSold,
            COALESCE(SUM(s.units_sold * s.unit_price), 0) AS revenue,
            COUNT(s.id) AS transactionCount,
            COALESCE(AVG(s.unit_price), 0) AS avgPrice,
            COUNT(DISTINCT s.date) AS distinctDays
        FROM daily_sales s
        WHERE s.business_id = :businessId
          AND (CAST(:startDate AS date) IS NULL OR s.date >= CAST(:startDate AS date))
          AND (CAST(:endDate AS date) IS NULL OR s.date <= CAST(:endDate AS date))
          AND (CAST(:medicine AS varchar) IS NULL OR s.medicine = CAST(:medicine AS varchar))
          AND (CAST(:country AS varchar) IS NULL OR s.country = CAST(:country AS varchar))
        GROUP BY s.covid_flag
    """, nativeQuery = true)
    List<Object[]> getCovidComparison(
            @Param("businessId") String businessId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("medicine") String medicine,
            @Param("country") String country
    );

    @Query(value = """
        SELECT 
            TO_CHAR(s.date, 'YYYY-MM') AS period,
            COALESCE(AVG(s.stock_level), 0) AS avgStockLevel,
            COALESCE(SUM(s.units_sold), 0) AS unitsSold,
            COALESCE(AVG(s.expiry_days_remaining), 0) AS avgExpiryDays
        FROM daily_sales s
        WHERE s.business_id = :businessId
          AND (CAST(:startDate AS date) IS NULL OR s.date >= CAST(:startDate AS date))
          AND (CAST(:endDate AS date) IS NULL OR s.date <= CAST(:endDate AS date))
          AND (CAST(:medicine AS varchar) IS NULL OR s.medicine = CAST(:medicine AS varchar))
          AND (CAST(:country AS varchar) IS NULL OR s.country = CAST(:country AS varchar))
        GROUP BY TO_CHAR(s.date, 'YYYY-MM')
        ORDER BY period ASC
    """, nativeQuery = true)
    List<Object[]> getStockTrends(
            @Param("businessId") String businessId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("medicine") String medicine,
            @Param("country") String country
    );
}
