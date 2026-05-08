// Favorites Manager for RideWise Flutter
import 'dart:convert';
import 'package:http/http.dart' as http;

class FavoritesManager {
  static const String _baseUrl = 'http://localhost:5000/api/users';

  /// Get all favorite locations
  static Future<List<Map<String, dynamic>>> getFavorites(String userId) async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/$userId/favorites'));
      
      if (response.statusCode == 200) {
        final List<dynamic> favorites = json.decode(response.body);
        return favorites.map((f) => f as Map<String, dynamic>).toList();
      }
      return [];
    } catch (e) {
      print('Error loading favorites: $e');
      return [];
    }
  }

  /// Add a favorite location
  static Future<bool> addFavorite({
    required String userId,
    required String label,
    required String name,
    required double lat,
    required double lon,
    String icon = 'location_on',
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/$userId/favorites'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'label': label,
          'name': name,
          'lat': lat,
          'lon': lon,
          'icon': icon,
        }),
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error adding favorite: $e');
      return false;
    }
  }

  /// Remove a favorite location
  static Future<bool> removeFavorite(String userId, int index) async {
    try {
      final response = await http.delete(
        Uri.parse('$_baseUrl/$userId/favorites/$index'),
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error removing favorite: $e');
      return false;
    }
  }

  /// Get a specific favorite by label
  static Future<Map<String, dynamic>?> getFavoriteByLabel(String userId, String label) async {
    final favorites = await getFavorites(userId);
    try {
      return favorites.firstWhere((fav) => fav['label'] == label);
    } catch (e) {
      return null;
    }
  }

  /// Check if a label exists
  static Future<bool> hasLabel(String userId, String label) async {
    final favorites = await getFavorites(userId);
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
