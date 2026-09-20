import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiTrendingUp,
  FiDollarSign,
  FiPackage,
  FiGlobe,
  FiRefreshCw,
  FiCalendar,
  FiFilter,
  FiActivity,
  FiLayers,
  FiShield,
  FiInfo,
  FiZap,
  FiArrowRight,
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { salesApi } from '../../services/api';
import { useCurrency } from '../../context/useCurrency';
import '../../styles/sales/sales.css';

const CATEGORY_COLORS = ['#2563eb', '#059669', '#7c3aed', '#d97706', '#e11d48', '#0891b2'];
const AGE_COLORS = ['#38bdf8', '#818cf8', '#a855f7', '#ec4899', '#f43f5e'];

const SalesAnalytics = () => {
  const { formatCurrency, currencySymbol } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter States
  const [selectedPreset, setSelectedPreset] = useState('ALL'); // ALL, 2025, 2024, 2023, 2022, 2021, 2020
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState('2025-12-31');
  const [interval, setInterval] = useState('monthly'); // monthly, daily
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Dropdown filter options from backend
  const [filterOptions, setFilterOptions] = useState({
    medicines: [],
    countries: [],
    regions: [],
    categories: [],
    ageGroups: []
  });

  // Data States
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [topMedicines, setTopMedicines] = useState([]);
  const [countrySales, setCountrySales] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [ageGroupSales, setAgeGroupSales] = useState([]);
  const [covidAnalysis, setCovidAnalysis] = useState([]);
  const [stockTrends, setStockTrends] = useState([]);

  // Authenticated user
  const user = React.useMemo(() => {
    try {
      const saved = localStorage.getItem('stockup_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  // Preset Date Handler
  const handlePresetChange = (preset) => {
    setSelectedPreset(preset);
    if (preset === 'ALL') {
      setStartDate('2020-01-01');
      setEndDate('2025-12-31');
    } else {
      setStartDate(`${preset}-01-01`);
      setEndDate(`${preset}-12-31`);
    }
  };

  // Fetch Filter Dropdowns once on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const filters = await salesApi.getFilters();
        setFilterOptions(filters || {});
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    };
    loadFilters();
  }, []);

  // Fetch Analytics Data
  const fetchData = useCallback(async () => {
    // Validate date range
    if (startDate && endDate && startDate > endDate) {
      setError(`Invalid Date Range: Start date (${startDate}) cannot be after end date (${endDate}).`);
      setSummary(null);
      setTrends([]);
      setTopMedicines([]);
      setCountrySales([]);
      setCategorySales([]);
      setAgeGroupSales([]);
      setCovidAnalysis([]);
      setStockTrends([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const params = {
        startDate,
        endDate,
        medicine: selectedMedicine ? selectedMedicine.trim() : undefined,
        country: selectedCountry ? selectedCountry.trim() : undefined,
        category: selectedCategory ? selectedCategory.trim() : undefined
      };

      const [
        summaryRes,
        trendsRes,
        topMedRes,
        countryRes,
        catRes,
        ageRes,
        covidRes,
        stockRes
      ] = await Promise.all([
        salesApi.getSummary(params),
        salesApi.getTrends({ ...params, interval }),
        salesApi.getTopMedicines({ ...params, limit: 10 }),
        salesApi.getCountries(params),
        salesApi.getCategories(params),
        salesApi.getAgeGroups(params),
        salesApi.getCovidAnalysis(params),
        salesApi.getStockTrends(params)
      ]);

      setSummary(summaryRes);
      setTrends(trendsRes || []);
      setTopMedicines(topMedRes || []);
      setCountrySales((countryRes || []).slice(0, 10)); // Top 10 countries for chart readability
      setCategorySales(catRes || []);
      setAgeGroupSales(ageRes || []);
      setCovidAnalysis(covidRes || []);
      setStockTrends(stockRes || []);
    } catch (err) {
      setError(err.message || 'Failed to load sales analytics data.');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, interval, selectedMedicine, selectedCountry, selectedCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const companyName = summary?.businessName || user?.businessName || user?.business_name || 'StockUp Enterprise';
  const hasData = summary && summary.totalTransactions > 0;
  const isFilterActive = Boolean(selectedMedicine || selectedCountry || selectedCategory || (selectedPreset !== 'ALL' && (startDate !== '2020-01-01' || endDate !== '2025-12-31')));

  const clearAllFilters = () => {
    setSelectedPreset('ALL');
    setStartDate('2020-01-01');
    setEndDate('2025-12-31');
    setSelectedMedicine('');
    setSelectedCountry('');
    setSelectedCategory('');
  };

  return (
    <div className="sales-analytics-page">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="sales-header">
        <div className="sales-header-left">
          <h1>
            <FiTrendingUp className="sales-header-icon" /> Historical Sales Analytics &amp; Intelligence
          </h1>
          <p className="page-description">
            6-year longitudinal sales velocity across 19 countries for <strong style={{ color: 'var(--text-primary)' }}>{companyName}</strong>
          </p>
        </div>

        <button
          className="dashboard-refresh-btn"
          onClick={fetchData}
          disabled={loading}
          title="Refresh Data"
        >
          <FiRefreshCw className={loading ? 'spinning' : ''} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* ── Filter Controls Bar ─────────────────────────────────── */}
      <div className="sales-filters-bar">
        <div className="filter-row">
          <div className="filter-group">
            <FiCalendar color="#2563eb" />
            <span className="filter-label">Date Preset:</span>
            <div className="date-preset-pills">
              {['ALL', '2025', '2024', '2023', '2022', '2021', '2020'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`date-pill ${selectedPreset === preset ? 'active' : ''}`}
                  onClick={() => handlePresetChange(preset)}
                >
                  {preset === 'ALL' ? '2020–2025 (Full)' : preset}
                </button>
              ))}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginLeft: '12px' }}>
              <input
                type="date"
                className="filter-select"
                style={{ padding: '6px 10px', fontSize: '12px' }}
                value={startDate}
                min="2020-01-01"
                max="2025-12-31"
                onChange={(e) => {
                  setSelectedPreset('CUSTOM');
                  setStartDate(e.target.value);
                }}
              />
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>to</span>
              <input
                type="date"
                className="filter-select"
                style={{ padding: '6px 10px', fontSize: '12px' }}
                value={endDate}
                min="2020-01-01"
                max="2025-12-31"
                onChange={(e) => {
                  setSelectedPreset('CUSTOM');
                  setEndDate(e.target.value);
                }}
              />
            </div>
          </div>

          <div className="interval-toggle">
            <button
              type="button"
              className={`interval-btn ${interval === 'monthly' ? 'active' : ''}`}
              onClick={() => setInterval('monthly')}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`interval-btn ${interval === 'daily' ? 'active' : ''}`}
              onClick={() => setInterval('daily')}
            >
              Daily
            </button>
          </div>
        </div>

        <div className="filter-row" style={{ paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
          <div className="filter-group">
            <FiFilter color="#64748b" />
            <span className="filter-label">Medicine:</span>
            <select
              className="filter-select"
              value={selectedMedicine}
              onChange={(e) => setSelectedMedicine(e.target.value)}
            >
              <option value="">All Medicines (10)</option>
              {(filterOptions.medicines || []).map((med) => (
                <option key={med} value={med}>{med}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <span className="filter-label">Country:</span>
            <select
              className="filter-select"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              <option value="">All Countries (19)</option>
              {(filterOptions.countries || []).map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <span className="filter-label">Category:</span>
            <select
              className="filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {(filterOptions.categories || []).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {(selectedMedicine || selectedCountry || selectedCategory) && (
            <button
              type="button"
              onClick={() => {
                setSelectedMedicine('');
                setSelectedCountry('');
                setSelectedCategory('');
              }}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Error Banner ────────────────────────────────────────── */}
      {error && (
        <div className="dashboard-error-banner" style={{ marginBottom: '24px' }}>
          <div className="error-content">
            <h3>Unable to load sales analytics</h3>
            <p>{error}</p>
          </div>
          <button className="error-retry-btn" onClick={fetchData}>
            Retry
          </button>
        </div>
      )}

      {/* ── 5 Executive Sales KPI Cards (Shown when not in error state) ── */}
      {!error && (
        <div className="sales-kpi-grid">
          <div className="sales-kpi-card emerald">
            <div className="sales-kpi-header">
              <div className="sales-kpi-icon"><FiDollarSign /></div>
              <div className="sales-kpi-title">Gross Revenue</div>
            </div>
            <div className="sales-kpi-value">
              {loading ? '...' : formatCurrency(summary?.totalRevenue || 0, { compact: true })}
            </div>
            <div className="sales-kpi-subtitle">
              {loading ? 'Calculating total revenue...' : `Total sales generated across ${(summary?.totalTransactions || 0).toLocaleString()} transactions`}
            </div>
          </div>

          <div className="sales-kpi-card blue">
            <div className="sales-kpi-header">
              <div className="sales-kpi-icon"><FiPackage /></div>
              <div className="sales-kpi-title">Units Sold</div>
            </div>
            <div className="sales-kpi-value">
              {loading ? '...' : `${((summary?.totalUnitsSold || 0) / 1e6).toFixed(2)}M Units`}
            </div>
            <div className="sales-kpi-subtitle">
              {loading ? 'Aggregating unit volume...' : `${(summary?.totalUnitsSold || 0).toLocaleString()} total pharmaceutical units`}
            </div>
          </div>

          <div className="sales-kpi-card amber">
            <div className="sales-kpi-header">
              <div className="sales-kpi-icon"><FiActivity /></div>
              <div className="sales-kpi-title">Avg Unit Price</div>
            </div>
            <div className="sales-kpi-value">
              {loading ? '...' : formatCurrency(summary?.averageUnitPrice || 0)}
            </div>
            <div className="sales-kpi-subtitle">
              Weighted average selling price per unit
            </div>
          </div>

          <div className="sales-kpi-card purple">
            <div className="sales-kpi-header">
              <div className="sales-kpi-icon"><FiLayers /></div>
              <div className="sales-kpi-title">Active Portfolio</div>
            </div>
            <div className="sales-kpi-value">
              {loading ? '...' : `${summary?.activeMedicines || 0} Medicines`}
            </div>
            <div className="sales-kpi-subtitle">
              Tracked across 5 major therapeutic categories
            </div>
          </div>

          <div className="sales-kpi-card rose">
            <div className="sales-kpi-header">
              <div className="sales-kpi-icon"><FiGlobe /></div>
              <div className="sales-kpi-title">Global Footprint</div>
            </div>
            <div className="sales-kpi-value">
              {loading ? '...' : `${summary?.countriesCovered || 0} Countries`}
            </div>
            <div className="sales-kpi-subtitle">
              Spread across {summary?.regionsCovered || 0} worldwide geographic regions
            </div>
          </div>
        </div>
      )}

      {/* ── Empty State Handling ─ */}
      {!hasData && !loading && !error && (
        <div className="sales-empty-state">
          <div className="empty-state-icon">
            <FiInfo />
          </div>
          {isFilterActive ? (
            <>
              <h3>No sales data found for the selected filters.</h3>
              <p>
                No historical sales records matched the selected combination of date range, medicine, country, or category.
              </p>
              <button
                type="button"
                className="dashboard-refresh-btn"
                onClick={clearAllFilters}
                style={{ marginTop: '16px' }}
              >
                Clear All Filters
              </button>
            </>
          ) : (
            <>
              <h3>No Historical Sales Data for {companyName}</h3>
              <p>
                This company does not currently have historical daily sales records imported in PostgreSQL.
                Historical sales intelligence is strictly company-isolated.
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Visual Analytics Section ────────────────────────────── */}
      {hasData && (
        <>
          {/* AI Demand Forecasting Pipeline Connection Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #1e293b 100%)',
            border: '1px solid rgba(129, 140, 248, 0.25)',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 10px 25px -5px rgba(30, 27, 75, 0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '22px',
                flexShrink: 0,
              }}>
                <FiZap />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
                  AI Demand Forecasting Pipeline Active
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#c7d2fe', lineHeight: 1.4 }}>
                  Historical sales data (177.9K records) is integrated into our Machine Learning pipeline (MAE: 60.82) for 7/14/30-day recursive demand forecasting.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Link
                to="/prediction"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#6366f1',
                  color: '#ffffff',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
                }}
              >
                <FiActivity /> Generate Demand Forecast <FiArrowRight />
              </Link>
            </div>
          </div>

          {/* 1. Sales Trend & Velocity */}
          <div className="chart-card full-width" style={{ marginBottom: '28px' }}>
            <div className="chart-card-header">
              <div>
                <h2><FiTrendingUp style={{ color: '#2563eb' }} /> Sales Velocity &amp; Revenue Over Time</h2>
                <div className="chart-card-subtitle">
                  {interval === 'monthly' ? 'Monthly' : 'Daily'} aggregate units sold and gross revenue trend (2020–2025)
                </div>
              </div>
            </div>
            <div className="chart-container" style={{ height: '340px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `${(v/1e6).toFixed(1)}M`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => formatCurrency(v, { compact: true })} />
                  <Tooltip
                    formatter={(value, name) => [
                      name.includes('Revenue') ? formatCurrency(value) : Number(value).toLocaleString(),
                      name
                    ]}
                    contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0' }}
                  />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="unitsSold" name="Units Sold" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" name={`Revenue (${currencySymbol})`} stroke="#059669" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Top Selling Medicines & Country Breakdown */}
          <div className="charts-grid-2col">
            <div className="chart-card">
              <div className="chart-card-header">
                <div>
                  <h2><FiPackage style={{ color: '#7c3aed' }} /> Top Selling Medicines</h2>
                  <div className="chart-card-subtitle">Volume and therapeutic category breakdown</div>
                </div>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topMedicines} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickFormatter={(v) => `${(v/1e6).toFixed(1)}M`} />
                    <YAxis dataKey="medicine" type="category" tick={{ fontSize: 12, fill: 'var(--text-primary)' }} width={90} />
                    <Tooltip formatter={(v) => [`${Number(v).toLocaleString()} units`, 'Units Sold']} />
                    <Bar dataKey="unitsSold" fill="#7c3aed" radius={[0, 6, 6, 0]}>
                      {topMedicines.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-card-header">
                <div>
                  <h2><FiGlobe style={{ color: '#059669' }} /> Revenue by Top Markets</h2>
                  <div className="chart-card-subtitle">Top revenue generating countries</div>
                </div>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={countrySales} margin={{ top: 5, right: 20, left: 20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b', angle: -25, textAnchor: 'end' }} interval={0} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => formatCurrency(v, { compact: true })} />
                    <Tooltip formatter={(v) => [formatCurrency(v), 'Revenue']} />
                    <Bar dataKey="revenue" fill="#059669" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 3. Category Distribution & Age Group Demographics */}
          <div className="charts-grid-2col">
            <div className="chart-card">
              <div className="chart-card-header">
                <div>
                  <h2><FiLayers style={{ color: '#d97706' }} /> Sales by Category</h2>
                  <div className="chart-card-subtitle">Therapeutic segment market share</div>
                </div>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categorySales} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `${(v/1e6).toFixed(0)}M`} />
                    <Tooltip formatter={(v, n, item) => [`${Number(v).toLocaleString()} units (${item.payload.percentage}%)`, 'Units Sold']} />
                    <Bar dataKey="unitsSold" fill="#d97706" radius={[6, 6, 0, 0]}>
                      {categorySales.map((_, index) => (
                        <Cell key={`cat-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-card-header">
                <div>
                  <h2><FiActivity style={{ color: '#ec4899' }} /> Demand by Age Cohort</h2>
                  <div className="chart-card-subtitle">Demographic consumption breakdown</div>
                </div>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageGroupSales} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="ageGroup" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `${(v/1e6).toFixed(0)}M`} />
                    <Tooltip formatter={(v, n, item) => [`${Number(v).toLocaleString()} units (${item.payload.percentage}%)`, 'Units Sold']} />
                    <Bar dataKey="unitsSold" fill="#ec4899" radius={[6, 6, 0, 0]}>
                      {ageGroupSales.map((_, index) => (
                        <Cell key={`age-${index}`} fill={AGE_COLORS[index % AGE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 4. COVID-19 Period Impact Comparison */}
          {covidAnalysis.length > 0 && (
            <div className="covid-section-card">
              <div className="chart-card-header" style={{ marginBottom: '10px' }}>
                <div>
                  <h2><FiShield style={{ color: '#e11d48' }} /> COVID-19 Demand Impact Analysis</h2>
                  <div className="chart-card-subtitle">
                    Comparative evaluation of pharmaceutical velocity during COVID surge periods vs baseline operations
                  </div>
                </div>
              </div>

              <div className="covid-comparison-grid">
                {covidAnalysis.map((item, idx) => (
                  <div key={idx} className={`covid-stat-box ${item.covidFlag ? 'covid-active' : 'covid-baseline'}`}>
                    <div className="covid-box-header">
                      <span className="covid-box-title">{item.period}</span>
                      <span style={{ fontSize: '12px', fontWeight: '700', padding: '3px 8px', borderRadius: '12px', background: item.covidFlag ? '#ffe4e6' : '#dcfce7' }}>
                        {item.transactionCount.toLocaleString()} Transactions
                      </span>
                    </div>
                    <div className="covid-stat-row">
                      <span className="stat-label">Total Volume Sold:</span>
                      <span className="stat-value">{item.unitsSold.toLocaleString()} units</span>
                    </div>
                    <div className="covid-stat-row">
                      <span className="stat-label">Total Period Revenue:</span>
                      <span className="stat-value">{formatCurrency(item.revenue)}</span>
                    </div>
                    <div className="covid-stat-row">
                      <span className="stat-label">Average Velocity / Day:</span>
                      <span className="stat-value">{item.avgUnitsPerDay.toLocaleString()} units/day</span>
                    </div>
                    <div className="covid-stat-row">
                      <span className="stat-label">Avg Selling Price:</span>
                      <span className="stat-value">{formatCurrency(item.averageUnitPrice)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Historical Buffer & Stock Level Trends */}
          <div className="chart-card full-width">
            <div className="chart-card-header">
              <div>
                <h2><FiTrendingUp style={{ color: '#0891b2' }} /> Historical Inventory Buffer &amp; Stock Levels</h2>
                <div className="chart-card-subtitle">
                  Average monthly safety stock buffer and remaining shelf life days across transactions
                </div>
              </div>
            </div>
            <div className="chart-container" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stockTrends} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#64748b' }} domain={['auto', 'auto']} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#64748b' }} unit="d" />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="avgStockLevel" name="Avg Stock Level" stroke="#0891b2" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="avgExpiryDaysRemaining" name="Avg Expiry Days Remaining" stroke="#d97706" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SalesAnalytics;
