// Currency conversion utilities for RideWise

// Exchange rates (as of April 2026 - approximate)
const exchangeRates = {
  INR: 1,
  USD: 0.012, // 1 INR = 0.012 USD
  EUR: 0.011, // 1 INR = 0.011 EUR
};

// Currency symbols
const currencySymbols = {
  INR: '₹',
  USD: '$',
  EUR: '€',
};

/**
 * Convert price from INR to target currency
 * @param {number} priceInINR - Price in Indian Rupees
 * @param {string} targetCurrency - Target currency code (INR, USD, EUR)
 * @returns {string} - Formatted price with currency symbol
 */
export const convertCurrency = (priceInINR, targetCurrency = 'INR') => {
  if (!priceInINR || isNaN(priceInINR)) return `${currencySymbols[targetCurrency] || '₹'}0`;
  
  const rate = exchangeRates[targetCurrency] || 1;
  const convertedPrice = priceInINR * rate;
  
  // Format based on currency
  let formattedPrice;
  if (targetCurrency === 'INR') {
    formattedPrice = Math.round(convertedPrice); // No decimals for INR
  } else {
    formattedPrice = convertedPrice.toFixed(2); // 2 decimals for USD/EUR
  }
  
  return `${currencySymbols[targetCurrency]}${formattedPrice}`;
};

/**
 * Get currency symbol
 * @param {string} currency - Currency code
 * @returns {string} - Currency symbol
 */
export const getCurrencySymbol = (currency = 'INR') => {
  return currencySymbols[currency] || '₹';
};

/**
 * Format price with current currency setting
 * @param {number} priceInINR - Price in INR
 * @returns {string} - Formatted price with symbol
 */
export const formatPrice = (priceInINR) => {
  const currency = localStorage.getItem('settings_currency') || 'INR';
  return convertCurrency(priceInINR, currency);
};
