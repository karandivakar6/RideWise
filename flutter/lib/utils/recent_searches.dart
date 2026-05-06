// Recent Searches Manager for RideWise Flutter
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class RecentSearchesManager {
  static const String _key = 'recentSearches';
  static const int _maxSearches = 3;

  /// Save a search to recent searches
  static Future<void> saveSearch(
    String pickup,
    String dropoff, {
    double? pickupLat,
    double? pickupLon,
    double? dropoffLat,
    double? dropoffLon,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    
    // Check if auto-save is enabled
    final autoSave = prefs.getBool('settings_autoSave') ?? true;
    if (!autoSave) return;

    // Get existing searches
    final searches = await getSearches();

    // Create new search object
    final newSearch = {
      'pickup': pickup,
      'dropoff': dropoff,
      'pickupLat': pickupLat?.toString() ?? '',
      'pickupLon': pickupLon?.toString() ?? '',
      'dropoffLat': dropoffLat?.toString() ?? '',
      'dropoffLon': dropoffLon?.toString() ?? '',
      'timestamp': DateTime.now().toIso8601String(),
    };

    // Remove if already exists (to avoid duplicates)
    searches.removeWhere((search) => 
      search['pickup'] == pickup && search['dropoff'] == dropoff
    );

    // Add to beginning
    searches.insert(0, newSearch);

    // Keep only last 3
    if (searches.length > _maxSearches) {
      searches.removeRange(_maxSearches, searches.length);
    }

    // Save back to storage
    final encoded = searches.map((s) => json.encode(s)).toList();
    await prefs.setStringList(_key, encoded);
  }

  /// Get recent searches
  static Future<List<Map<String, dynamic>>> getSearches() async {
    final prefs = await SharedPreferences.getInstance();
    
    // Check if auto-save is enabled
    final autoSave = prefs.getBool('settings_autoSave') ?? true;
    if (!autoSave) return [];

    final encoded = prefs.getStringList(_key) ?? [];
    
    return encoded.map((s) {
      final Map<String, dynamic> decoded = json.decode(s);
      return {
        'pickup': decoded['pickup'] as String? ?? '',
        'dropoff': decoded['dropoff'] as String? ?? '',
        'pickupLat': decoded['pickupLat'] as String? ?? '',
        'pickupLon': decoded['pickupLon'] as String? ?? '',
        'dropoffLat': decoded['dropoffLat'] as String? ?? '',
        'dropoffLon': decoded['dropoffLon'] as String? ?? '',
        'timestamp': decoded['timestamp'] as String? ?? '',
      };
    }).toList();
  }

  /// Clear all recent searches
  static Future<void> clearSearches() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}
