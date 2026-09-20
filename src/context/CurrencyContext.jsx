import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { currencyApi, getToken } from '../services/api';
import { BASE_CURRENCY, SUPPORTED_CURRENCIES, formatMonetaryValue } from '../services/currencyService';

export const CurrencyContext = createContext(null);

const STORAGE_KEY_CURRENCY = 'stockup_currency';
const STORAGE_KEY_RATES = 'stockup_cached_rates';
const STORAGE_KEY_RATE_TIME = 'stockup_rates_time';

export const CurrencyProvider = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENCY);
      return saved && SUPPORTED_CURRENCIES[saved] ? saved : 'USD';
    } catch {
      return 'USD';
    }
  });

  const [rates, setRates] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RATES);
      return saved ? JSON.parse(saved) : { USD: 1.0, INR: 95.8178 };
    } catch {
      return { USD: 1.0, INR: 95.8178 };
    }
  });

  const [rateUpdatedAt, setRateUpdatedAt] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RATE_TIME);
      return saved || 'just now';
    } catch {
      return 'just now';
    }
  });

  const [rateSource, setRateSource] = useState('Open Exchange Rates (Live)');
  const [isCached, setIsCached] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch latest rates from backend
  const fetchRates = useCallback(async (targetCurr = selectedCurrency) => {
    setLoading(true);
    setError(null);
    try {
      const data = await currencyApi.getRates(BASE_CURRENCY);
      if (data && data.rates) {
        setRates(data.rates);
        const timeStr = data.lastUpdatedFormatted || new Date().toLocaleString();
        setRateUpdatedAt(timeStr);
        setRateSource(data.provider || 'Open Exchange Rates');
        setIsCached(Boolean(data.cached));

        localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(data.rates));
        localStorage.setItem(STORAGE_KEY_RATE_TIME, timeStr);
      }
    } catch (err) {
      console.warn('Could not fetch latest exchange rates, using local cached rates:', err);
      // Fallback rate check
      if (!rates || Object.keys(rates).length === 0) {
        setError('Unable to fetch live exchange rates. Using default rates.');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedCurrency, rates]);

  // Initial load: fetch rates and if logged in, sync business currency setting
  useEffect(() => {
    fetchRates();

    if (getToken()) {
      currencyApi.getSettings().then((settings) => {
        if (settings?.currency && SUPPORTED_CURRENCIES[settings.currency]) {
          setSelectedCurrency(settings.currency);
          localStorage.setItem(STORAGE_KEY_CURRENCY, settings.currency);
        }
      }).catch((err) => {
        console.warn('Could not fetch tenant currency settings:', err);
      });
    }
  }, []);

  // Compute active exchange rate (USD -> selectedCurrency)
  const exchangeRate = useMemo(() => {
    if (selectedCurrency === BASE_CURRENCY) return 1.0;
    const r = rates[selectedCurrency];
    return typeof r === 'number' && r > 0 ? r : 1.0;
  }, [selectedCurrency, rates]);

  // Currency change handler with persistence & backend sync
  const changeCurrency = useCallback(async (newCurrency) => {
    const target = (newCurrency || 'USD').toUpperCase();
    if (!SUPPORTED_CURRENCIES[target]) {
      console.warn(`Unsupported currency: ${target}`);
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      setSelectedCurrency(target);
      localStorage.setItem(STORAGE_KEY_CURRENCY, target);

      // If user is logged in, persist to backend for tenant
      if (getToken()) {
        try {
          await currencyApi.saveSettings(target);
        } catch (apiErr) {
          console.warn('Failed to persist currency preference to backend:', apiErr);
        }
      }

      // Ensure we have active rate for this currency
      if (!rates[target] || rates[target] === 1.0) {
        await fetchRates(target);
      }

      return true;
    } catch (err) {
      setError(err.message || 'Failed to update currency');
      return false;
    } finally {
      setLoading(false);
    }
  }, [rates, fetchRates]);

  // Format base amount into selected currency
  const formatCurrency = useCallback((amount, options = {}) => {
    if (amount == null || isNaN(amount)) return '—';
    const num = Number(amount);
    const converted = num * exchangeRate;
    return formatMonetaryValue(converted, selectedCurrency, options);
  }, [exchangeRate, selectedCurrency]);

  // Convert base amount into raw numeric value in selected currency
  const convertCurrency = useCallback((amount) => {
    if (amount == null || isNaN(amount)) return 0;
    return Number(amount) * exchangeRate;
  }, [exchangeRate]);

  // Format a historical transaction that has already recorded currency & rate/amount
  const formatHistorical = useCallback((baseAmount, txCurrency, txRate, txAmount, options = {}) => {
    const currencyCode = txCurrency || selectedCurrency || 'USD';
    let valueToFormat;

    if (txAmount != null && !isNaN(txAmount) && Number(txAmount) > 0) {
      valueToFormat = Number(txAmount);
    } else if (txRate != null && !isNaN(txRate) && Number(txRate) > 0 && baseAmount != null) {
      valueToFormat = Number(baseAmount) * Number(txRate);
    } else if (baseAmount != null) {
      // Fallback: convert using current rate
      valueToFormat = Number(baseAmount) * (rates[currencyCode] || 1.0);
    } else {
      return '—';
    }

    return formatMonetaryValue(valueToFormat, currencyCode, options);
  }, [selectedCurrency, rates]);

  const currencyConfig = SUPPORTED_CURRENCIES[selectedCurrency] || SUPPORTED_CURRENCIES.USD;

  const value = {
    baseCurrency: BASE_CURRENCY,
    currency: selectedCurrency,
    selectedCurrency,
    currencySymbol: currencyConfig.symbol,
    currencyConfig,
    supportedCurrencies: SUPPORTED_CURRENCIES,
    exchangeRate,
    rates,
    rateUpdatedAt,
    rateSource,
    isCached,
    loading,
    error,
    changeCurrency,
    setCurrency: changeCurrency,
    formatCurrency,
    convertCurrency,
    formatHistorical,
    refreshRates: fetchRates,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};
