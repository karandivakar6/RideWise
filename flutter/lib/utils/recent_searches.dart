// Recent Searches Manager for RideWise Flutter
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class RecentSearchesManager {
  static const String _baseUrl = 'http://localhost:5000/api/users';

  /// Save a search to recent searches
  static Future<void> saveSearch(
    String userId,
    String pickup,
    String dropoff, {
    required double pickupLat,
    required double pickupLon,
    required double dropoffLat,
    required double dropoffLon,
  }) async {
    try {
      // Check if auto-save is enabled
      final prefs = await SharedPreferences.getInstance();
      final autoSave = prefs.getBool('settings_autoSave') ?? true;
      if (!autoSave) return;

      await http.post(
        Uri.parse('$_baseUrl/$userId/recent-searches'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'pickup': {
            'name': pickup,
            'lat': pickupLat,
            'lon': pickupLon,
          },
          'dropoff': {
            'name': dropoff,
            'lat': dropoffLat,
            'lon': dropoffLon,
          }
        }),
      );
    } catch (e) {
      print('Error saving recent search: $e');
    }
  }

  /// Get recent searches
  static Future<List<Map<String, dynamic>>> getSearches(String userId) async {
    try {
      // Check if auto-save is enabled
      final prefs = await SharedPreferences.getInstance();
      final autoSave = prefs.getBool('settings_autoSave') ?? true;
      if (!autoSave) return [];

      final response = await http.get(Uri.parse('$_baseUrl/$userId/recent-searches'));
      
      if (response.statusCode == 200) {
        final List<dynamic> searches = json.decode(response.body);
        return searches.map((s) {
          final search = s as Map<String, dynamic>;
          return {
            'pickup': search['pickup']['name'] as String? ?? '',
            'dropoff': search['dropoff']['name'] as String? ?? '',
            'pickupLat': search['pickup']['lat']?.toString() ?? '',
            'pickupLon': search['pickup']['lon']?.toString() ?? '',
            'dropoffLat': search['dropoff']['lat']?.toString() ?? '',
            'dropoffLon': search['dropoff']['lon']?.toString() ?? '',
            'timestamp': search['timestamp'] as String? ?? '',
          };
        }).toList();
      }
      return [];
    } catch (e) {
      print('Error loading recent searches: $e');
      return [];
    }
  }

  /// Clear all recent searches
  static Future<void> clearSearches() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}
