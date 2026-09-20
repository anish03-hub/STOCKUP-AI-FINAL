/**
 * Centralized Currency Metadata and Formatting Service for StockUp AI
 */

export const BASE_CURRENCY = 'USD';

export const SUPPORTED_CURRENCIES = {
  USD: {
    code: 'USD',
    symbol: '$',
    label: 'USD ($) — US Dollar',
    locale: 'en-US',
    decimals: 2,
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    label: 'INR (₹) — Indian Rupee',
    locale: 'en-IN',
    decimals: 2,
  },
};

export const isValidCurrency = (currencyCode) => {
  if (!currencyCode) return false;
  const upper = String(currencyCode).trim().toUpperCase();
  return upper === 'USD' || upper === 'INR';
};

/**
 * Format a numeric amount with the given currency config and options.
 * Does NOT perform currency exchange rate multiplication itself;
 * the caller or formatCurrency hook should supply the already-converted amount.
 */
export const formatMonetaryValue = (convertedAmount, currencyCode = 'USD', options = {}) => {
  if (convertedAmount == null || isNaN(convertedAmount)) {
    return '—';
  }

  const num = Number(convertedAmount);
  const config = SUPPORTED_CURRENCIES[currencyCode] || {
    code: currencyCode,
    symbol: currencyCode,
    locale: 'en-US',
    decimals: 2,
  };

  const decimals = options.decimals !== undefined ? options.decimals : config.decimals;

  // Formatting using Intl.NumberFormat for precision
  const formattedNumber = num.toLocaleString(config.locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (options.compact) {
    if (Math.abs(num) >= 1e7 && currencyCode === 'INR') {
      return `${config.symbol}${(num / 1e7).toFixed(2)} Cr`;
    }
    if (Math.abs(num) >= 1e5 && currencyCode === 'INR') {
      return `${config.symbol}${(num / 1e5).toFixed(2)} L`;
    }
    if (Math.abs(num) >= 1e6) {
      return `${config.symbol}${(num / 1e6).toFixed(2)}M`;
    }
    if (Math.abs(num) >= 1e3) {
      return `${config.symbol}${(num / 1e3).toFixed(2)}k`;
    }
  }

  return `${config.symbol}${formattedNumber}`;
};
