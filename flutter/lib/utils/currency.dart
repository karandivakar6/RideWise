// Currency conversion utilities for RideWise Flutter

class CurrencyConverter {
  // Exchange rates (as of April 2026 - approximate)
  static const Map<String, double> _exchangeRates = {
    'INR': 1.0,
    'USD': 0.012, // 1 INR = 0.012 USD
    'EUR': 0.011, // 1 INR = 0.011 EUR
  };

  // Currency symbols
  static const Map<String, String> _currencySymbols = {
    'INR': '₹',
    'USD': '\$',
    'EUR': '€',
  };

  /// Convert price from INR to target currency
  static String convertPrice(double priceInINR, String targetCurrency) {
    final rate = _exchangeRates[targetCurrency] ?? 1.0;
    final convertedPrice = priceInINR * rate;
    
    // Format based on currency
    String formattedPrice;
    if (targetCurrency == 'INR') {
      formattedPrice = convertedPrice.round().toString(); // No decimals for INR
    } else {
      formattedPrice = convertedPrice.toStringAsFixed(2); // 2 decimals for USD/EUR
    }
    
    final symbol = _currencySymbols[targetCurrency] ?? '₹';
    return '$symbol$formattedPrice';
  }

  /// Get currency symbol
  static String getSymbol(String currency) {
    return _currencySymbols[currency] ?? '₹';
  }
}
