// Favorites Manager for RideWise Flutter
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class FavoritesManager {
  static const String _key = 'favoriteLocations';

  /// Get all favorite locations
  static Future<List<Map<String, dynamic>>> getFavorites() async {
    final prefs = await SharedPreferences.getInstance();
    final encoded = prefs.getStringList(_key) ?? [];
    
    return encoded.map((s) {
      final Map<String, dynamic> decoded = json.decode(s);
      return {
        'label': decoded['label'] as String,
        'name': decoded['name'] as String,
        'lat': decoded['lat'] as double,
        'lon': decoded['lon'] as double,
        'icon': decoded['icon'] as String? ?? 'location_on',
      };
    }).toList();
  }

  /// Add a favorite location
  static Future<void> addFavorite({
    required String label,
    required String name,
    required double lat,
    required double lon,
    String icon = 'location_on',
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final favorites = await getFavorites();

    // Check if label already exists
    final existingIndex = favorites.indexWhere((fav) => fav['label'] == label);
    
    final newFavorite = {
      'label': label,
      'name': name,
      'lat': lat,
      'lon': lon,
      'icon': icon,
    };

    if (existingIndex >= 0) {
      // Update existing favorite
      favorites[existingIndex] = newFavorite;
    } else {
      // Add new favorite
      favorites.add(newFavorite);
    }

    // Save back to storage
    final encoded = favorites.map((f) => json.encode(f)).toList();
    await prefs.setStringList(_key, encoded);
  }

  /// Remove a favorite location
  static Future<void> removeFavorite(String label) async {
    final prefs = await SharedPreferences.getInstance();
    final favorites = await getFavorites();

    favorites.removeWhere((fav) => fav['label'] == label);

    // Save back to storage
    final encoded = favorites.map((f) => json.encode(f)).toList();
    await prefs.setStringList(_key, encoded);
  }

  /// Get a specific favorite by label
  static Future<Map<String, dynamic>?> getFavoriteByLabel(String label) async {
    final favorites = await getFavorites();
    try {
      return favorites.firstWhere((fav) => fav['label'] == label);
    } catch (e) {
      return null;
    }
  }

  /// Check if a label exists
  static Future<bool> hasLabel(String label) async {
    final favorites = await getFavorites();
    return favorites.any((fav) => fav['label'] == label);
  }

  /// Get suggested icon for common labels
  static String getSuggestedIcon(String label) {
    final lowerLabel = label.toLowerCase();
    if (lowerLabel.contains('home')) return 'home';
    if (lowerLabel.contains('work') || lowerLabel.contains('office')) return 'work';
    if (lowerLabel.contains('gym') || lowerLabel.contains('fitness')) return 'fitness_center';
    if (lowerLabel.contains('school') || lowerLabel.contains('college')) return 'school';
    if (lowerLabel.contains('hospital')) return 'local_hospital';
    if (lowerLabel.contains('airport')) return 'flight';
    if (lowerLabel.contains('mall') || lowerLabel.contains('shop')) return 'shopping_bag';
    if (lowerLabel.contains('restaurant') || lowerLabel.contains('cafe')) return 'restaurant';
    return 'location_on';
  }
}
