import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'dart:async';
import 'results_screen.dart';
import '../utils/recent_searches.dart';
import '../utils/sound_manager.dart';
import '../utils/favorites_manager.dart';

class SearchScreen extends StatefulWidget {
  final Position? currentPosition;

  const SearchScreen({super.key, this.currentPosition});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _pickupController = TextEditingController();
  final TextEditingController _dropoffController = TextEditingController();
  final FocusNode _pickupFocus = FocusNode();
  final FocusNode _dropoffFocus = FocusNode();
  
  List<dynamic> _pickupResults = [];
  List<dynamic> _dropoffResults = [];
  Map<String, dynamic>? _pickupCoords;
  Map<String, dynamic>? _dropoffCoords;
  
  bool _isLoading = false;
  bool _loadingLocation = false;
  List<Map<String, dynamic>> _recentSearches = [];
  List<Map<String, dynamic>> _favorites = [];
  
  final _soundManager = SoundManager();
  String _errorMessage = '';
  Timer? _debounce;
  String? _userId;
  
  Position? _currentLocation;
  String? _focusedInput; // 'pickup' or 'dropoff'

  // Change to your laptop's IP for phone testing (find using: ipconfig)
  // For web/emulator use: http://localhost:5000
  // For phone use: http://192.168.x.x:5000 (your laptop's local IP)
  final String baseUrl = 'http://localhost:5000';
  final String bbox = '77.4601,12.8340,77.8170,13.1437'; // Bengaluru bounding box

  @override
  void initState() {
    super.initState();
    _currentLocation = widget.currentPosition;
    _loadUserId();
    _loadRecentSearches();
    _loadFavorites();
    
    _pickupController.addListener(() {
      _onSearchChanged(_pickupController.text, true);
    });
    
    _dropoffController.addListener(() {
      _onSearchChanged(_dropoffController.text, false);
    });
    
    _pickupFocus.addListener(() {
      if (_pickupFocus.hasFocus) {
        setState(() => _focusedInput = 'pickup');
      }
    });
    
    _dropoffFocus.addListener(() {
      if (_dropoffFocus.hasFocus) {
        setState(() => _focusedInput = 'dropoff');
      }
    });
  }
  
  Future<void> _loadUserId() async {
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString('user');
    if (userJson != null) {
      final user = json.decode(userJson);
      setState(() {
        _userId = user['id'];
      });
    }
  }
  
  Future<void> _loadRecentSearches() async {
    if (_userId == null) {
      // Wait for userId to load
      await Future.delayed(const Duration(milliseconds: 100));
    }
    if (_userId != null) {
      final searches = await RecentSearchesManager.getSearches(_userId!);
      setState(() {
        _recentSearches = searches;
      });
    }
  }

  Future<void> _loadFavorites() async {
    if (_userId == null) {
      // Wait for userId to load
      await Future.delayed(const Duration(milliseconds: 100));
    }
    if (_userId != null) {
      final favorites = await FavoritesManager.getFavorites(_userId!);
      setState(() {
        _favorites = favorites;
      });
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _pickupController.dispose();
    _dropoffController.dispose();
    _pickupFocus.dispose();
    _dropoffFocus.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query, bool isPickup) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    
    if (query.length < 2) {
      setState(() {
        if (isPickup) {
          _pickupResults = [];
        } else {
          _dropoffResults = [];
        }
      });
      return;
    }
    
    _debounce = Timer(const Duration(milliseconds: 300), () {
      _fetchSuggestions(query, isPickup);
    });
  }

  Future<void> _fetchSuggestions(String query, bool isPickup) async {
    try {
      final encodedQuery = Uri.encodeComponent(query);
      final url = 'https://photon.komoot.io/api/?q=$encodedQuery&limit=8&bbox=$bbox&lang=en';
      
      final response = await http.get(Uri.parse(url));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          if (isPickup) {
            _pickupResults = data['features'] ?? [];
          } else {
            _dropoffResults = data['features'] ?? [];
          }
        });
      }
    } catch (e) {
      print('Error fetching suggestions: $e');
    }
  }

  void _selectLocation(dynamic feature, bool isPickup) {
    final coords = feature['geometry']['coordinates'];
    final props = feature['properties'];
    
    String name = props['name'] ?? '';
    
    if (props['suburb'] != null && name != props['suburb']) {
      name = name.isNotEmpty ? '$name, ${props['suburb']}' : props['suburb'];
    } else if (props['district'] != null && name != props['district']) {
      name = name.isNotEmpty ? '$name, ${props['district']}' : props['district'];
    }
    
    if (name.isEmpty && props['street'] != null) {
      name = props['street'];
    }
    
    if (name.isEmpty) {
      name = 'Selected Location';
    }
    
    final locationData = {
      'lat': coords[1],
      'lon': coords[0],
      'name': name,
    };
    
    setState(() {
      if (isPickup) {
        _pickupController.text = name;
        _pickupCoords = locationData;
        _pickupResults = [];
        _focusedInput = null;
        _pickupFocus.unfocus();
      } else {
        _dropoffController.text = name;
        _dropoffCoords = locationData;
        _dropoffResults = [];
        _focusedInput = null;
        _dropoffFocus.unfocus();
      }
    });
  }

  Future<void> _selectFavorite(Map<String, dynamic> favorite, bool isPickup) async {
    final locationData = {
      'lat': favorite['lat'],
      'lon': favorite['lon'],
      'name': favorite['name'],
    };
    
    setState(() {
      if (isPickup) {
        _pickupController.text = favorite['name'];
        _pickupCoords = locationData;
        _pickupResults = [];
        _focusedInput = null;
        _pickupFocus.unfocus();
      } else {
        _dropoffController.text = favorite['name'];
        _dropoffCoords = locationData;
        _dropoffResults = [];
        _focusedInput = null;
        _dropoffFocus.unfocus();
      }
    });
  }

  Future<void> _showSaveFavoriteDialog(Map<String, dynamic> locationData) async {
    final TextEditingController labelController = TextEditingController();
    
    final result = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text(
          'SAVE TO FAVORITES',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              locationData['name'],
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: labelController,
              autofocus: true,
              decoration: const InputDecoration(
                hintText: 'e.g., Home, Work, Gym',
                labelText: 'Label',
                border: OutlineInputBorder(),
              ),
              style: const TextStyle(fontSize: 14),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('CANCEL'),
          ),
          ElevatedButton(
            onPressed: () {
              final label = labelController.text.trim();
              if (label.isNotEmpty) {
                Navigator.pop(context, label);
              }
            },
            child: const Text('SAVE'),
          ),
        ],
      ),
    );
    
    if (result != null && result.isNotEmpty && _userId != null) {
      await FavoritesManager.addFavorite(
        userId: _userId!,
        label: result,
        name: locationData['name'],
        lat: locationData['lat'],
        lon: locationData['lon'],
        icon: FavoritesManager.getSuggestedIcon(result),
      );
      _loadFavorites();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Saved "$result" to favorites')),
        );
      }
    }
  }

  Future<void> _removeFavorite(String label) async {
    if (_userId == null) return;
    
    final index = _favorites.indexWhere((fav) => fav['label'] == label);
    if (index != -1) {
      await FavoritesManager.removeFavorite(_userId!, index);
      _loadFavorites();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Removed "$label" from favorites')),
        );
      }
    }
  }

  IconData _getFavoriteIcon(String iconName) {
    switch (iconName) {
      case 'home':
        return Icons.home;
      case 'work':
        return Icons.work;
      case 'fitness_center':
        return Icons.fitness_center;
      case 'school':
        return Icons.school;
      case 'local_hospital':
        return Icons.local_hospital;
      case 'flight':
        return Icons.flight;
      case 'shopping_bag':
        return Icons.shopping_bag;
      case 'restaurant':
        return Icons.restaurant;
      default:
        return Icons.location_on;
    }
  }

  Future<void> _useCurrentLocation() async {
    final prefs = await SharedPreferences.getInstance();
    final locationEnabled = prefs.getBool('settings_locationSharing') ?? true;
    
    if (!locationEnabled) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Location sharing is disabled in settings')),
        );
      }
      return;
    }
    
    if (_currentLocation != null) {
      setState(() {
        _pickupController.text = 'Current Location';
        _pickupCoords = {
          'lat': _currentLocation!.latitude,
          'lon': _currentLocation!.longitude,
          'name': 'Current Location',
        };
        _pickupResults = [];
        _focusedInput = null;
        _pickupFocus.unfocus();
      });
      return;
    }
    
    setState(() => _loadingLocation = true);
    
    try {
      // Check if location services are enabled
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw Exception('Location services are disabled. Please enable location in your device settings.');
      }

      // Check permission status
      LocationPermission permission = await Geolocator.checkPermission();
      
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw Exception('Location permission denied. Please allow location access in your browser.');
        }
      }
      
      if (permission == LocationPermission.deniedForever) {
        throw Exception('Location permissions are permanently denied. Please enable them in browser settings.');
      }
      
      // Get current position
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );
      
      if (mounted) {
        setState(() {
          _currentLocation = position;
          _pickupController.text = 'Current Location';
          _pickupCoords = {
            'lat': position.latitude,
            'lon': position.longitude,
            'name': 'Current Location',
          };
          _pickupResults = [];
          _loadingLocation = false;
          _focusedInput = null;
          _pickupFocus.unfocus();
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loadingLocation = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            duration: const Duration(seconds: 4),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _swapLocations() {
    final tempText = _pickupController.text;
    final tempCoords = _pickupCoords;
    
    setState(() {
      _pickupController.text = _dropoffController.text;
      _dropoffController.text = tempText;
      _pickupCoords = _dropoffCoords;
      _dropoffCoords = tempCoords;
    });
  }

  Future<void> _searchRides() async {
    if (_pickupCoords == null || _dropoffCoords == null) {
      setState(() {
        _errorMessage = 'Please select both pickup and dropoff locations';
      });
      _soundManager.playError();
      return;
    }

    // Check if pickup and dropoff are the same location
    final double latDiff = (_pickupCoords!['lat'] - _dropoffCoords!['lat']).abs();
    final double lonDiff = (_pickupCoords!['lon'] - _dropoffCoords!['lon']).abs();
    
    if (latDiff < 0.001 && lonDiff < 0.001) {
      setState(() {
        _errorMessage = 'Pickup and dropoff locations cannot be the same. Please select different locations.';
      });
      _soundManager.playError();
      return;
    }

    _soundManager.playSearch();
    
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/fares'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'pickup': {
            'lat': _pickupCoords!['lat'],
            'lon': _pickupCoords!['lon'],
          },
          'dropoff': {
            'lat': _dropoffCoords!['lat'],
            'lon': _dropoffCoords!['lon'],
          },
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        
        // Save to recent searches with coordinates
        if (_userId != null) {
          await RecentSearchesManager.saveSearch(
            _userId!,
            _pickupCoords!['name'],
            _dropoffCoords!['name'],
            pickupLat: _pickupCoords!['lat'],
            pickupLon: _pickupCoords!['lon'],
            dropoffLat: _dropoffCoords!['lat'],
            dropoffLon: _dropoffCoords!['lon'],
          );
          _loadRecentSearches();
        }
        
        if (mounted) {
          _soundManager.playSuccess();
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => ResultsScreen(
                fareData: data,
                pickup: _pickupCoords!['name'],
                dropoff: _dropoffCoords!['name'],
              ),
            ),
          );
        }
      } else {
        _soundManager.playError();
        setState(() {
          _errorMessage = 'Failed to fetch rides. Please try again.';
        });
      }
    } catch (e) {
      _soundManager.playError();
      setState(() {
        _errorMessage = 'Cannot connect to server. Check your backend!';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Widget _buildSuggestionItem(dynamic feature) {
    final props = feature['properties'];
    
    String mainText = '';
    if (props['name'] != null) {
      mainText = props['name'];
    } else if (props['housenumber'] != null && props['street'] != null) {
      mainText = '${props['housenumber']}, ${props['street']}';
    } else if (props['street'] != null) {
      mainText = props['street'];
    } else {
      mainText = 'Location';
    }
    
    List<String> subParts = [];
    if (props['suburb'] != null) {
      subParts.add(props['suburb']);
    } else if (props['district'] != null) {
      subParts.add(props['district']);
    }
    
    if (props['postcode'] != null) {
      subParts.add(props['postcode']);
    }
    
    final city = props['city'] ?? 'Bangalore';
    if (city != mainText && !subParts.contains(city)) {
      subParts.add(city);
    }
    
    if (!subParts.contains('Karnataka')) {
      subParts.add('Karnataka');
    }
    
    final subText = subParts.isNotEmpty ? subParts.join(', ') : 'Bangalore, Karnataka';
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          mainText,
          style: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 15,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          subText,
          style: const TextStyle(
            color: Colors.grey,
            fontSize: 13,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('SEARCH RIDES'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_errorMessage.isNotEmpty)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.1),
                  border: Border.all(color: Colors.red.withOpacity(0.4)),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  _errorMessage,
                  style: const TextStyle(
                    color: Colors.red,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            
            // Pickup Input
            TextField(
              controller: _pickupController,
              focusNode: _pickupFocus,
              decoration: InputDecoration(
                hintText: 'PICKUP LOCATION',
                hintStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                prefixIcon: const Icon(Icons.my_location, color: Colors.teal),
                suffixIcon: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (_pickupController.text.isNotEmpty)
                      IconButton(
                        icon: const Icon(Icons.close, size: 20),
                        onPressed: () {
                          setState(() {
                            _pickupController.clear();
                            _pickupCoords = null;
                            _pickupResults = [];
                          });
                        },
                      ),
                    IconButton(
                      icon: _loadingLocation
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.gps_fixed, size: 20),
                      onPressed: _loadingLocation ? null : _useCurrentLocation,
                    ),
                  ],
                ),
              ),
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            ),
            
            // Pickup suggestions
            if (_focusedInput == 'pickup' && _pickupResults.isNotEmpty)
              Container(
                margin: const EdgeInsets.only(top: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF334155)),
                ),
                constraints: const BoxConstraints(maxHeight: 250),
                child: ListView.separated(
                  shrinkWrap: true,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: _pickupResults.length,
                  separatorBuilder: (_, __) => const Divider(height: 1, color: Color(0xFF334155)),
                  itemBuilder: (context, index) {
                    final feature = _pickupResults[index];
                    final coords = feature['geometry']['coordinates'];
                    final props = feature['properties'];
                    String name = props['name'] ?? '';
                    if (props['suburb'] != null && name != props['suburb']) {
                      name = name.isNotEmpty ? '$name, ${props['suburb']}' : props['suburb'];
                    } else if (props['district'] != null && name != props['district']) {
                      name = name.isNotEmpty ? '$name, ${props['district']}' : props['district'];
                    }
                    if (name.isEmpty && props['street'] != null) name = props['street'];
                    if (name.isEmpty) name = 'Selected Location';
                    
                    return ListTile(
                      dense: true,
                      leading: const Icon(Icons.location_on, color: Colors.teal, size: 20),
                      title: _buildSuggestionItem(feature),
                      trailing: IconButton(
                        icon: const Icon(Icons.star_border, size: 18, color: Colors.grey),
                        onPressed: () {
                          _showSaveFavoriteDialog({
                            'lat': coords[1],
                            'lon': coords[0],
                            'name': name,
                          });
                        },
                      ),
                      onTap: () => _selectLocation(feature, true),
                    );
                  },
                ),
              ),
            
            const SizedBox(height: 16),
            
            // Swap Button
            Center(
              child: IconButton(
                onPressed: _swapLocations,
                icon: const Icon(Icons.swap_vert, color: Colors.teal),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Dropoff Input
            TextField(
              controller: _dropoffController,
              focusNode: _dropoffFocus,
              decoration: InputDecoration(
                hintText: 'DROPOFF LOCATION',
                hintStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                prefixIcon: const Icon(Icons.location_on, color: Colors.red),
                suffixIcon: _dropoffController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.close, size: 20),
                        onPressed: () {
                          setState(() {
                            _dropoffController.clear();
                            _dropoffCoords = null;
                            _dropoffResults = [];
                          });
                        },
                      )
                    : null,
              ),
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            ),
            
            // Dropoff suggestions
            if (_focusedInput == 'dropoff' && _dropoffResults.isNotEmpty)
              Container(
                margin: const EdgeInsets.only(top: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF334155)),
                ),
                constraints: const BoxConstraints(maxHeight: 250),
                child: ListView.separated(
                  shrinkWrap: true,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: _dropoffResults.length,
                  separatorBuilder: (_, __) => const Divider(height: 1, color: Color(0xFF334155)),
                  itemBuilder: (context, index) {
                    final feature = _dropoffResults[index];
                    final coords = feature['geometry']['coordinates'];
                    final props = feature['properties'];
                    String name = props['name'] ?? '';
                    if (props['suburb'] != null && name != props['suburb']) {
                      name = name.isNotEmpty ? '$name, ${props['suburb']}' : props['suburb'];
                    } else if (props['district'] != null && name != props['district']) {
                      name = name.isNotEmpty ? '$name, ${props['district']}' : props['district'];
                    }
                    if (name.isEmpty && props['street'] != null) name = props['street'];
                    if (name.isEmpty) name = 'Selected Location';
                    
                    return ListTile(
                      dense: true,
                      leading: const Icon(Icons.location_on, color: Colors.red, size: 20),
                      title: _buildSuggestionItem(feature),
                      trailing: IconButton(
                        icon: const Icon(Icons.star_border, size: 18, color: Colors.grey),
                        onPressed: () {
                          _showSaveFavoriteDialog({
                            'lat': coords[1],
                            'lon': coords[0],
                            'name': name,
                          });
                        },
                      ),
                      onTap: () => _selectLocation(feature, false),
                    );
                  },
                ),
              ),
            
            const SizedBox(height: 32),
            
            ElevatedButton.icon(
              onPressed: _isLoading ? null : _searchRides,
              icon: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.search),
              label: Text(_isLoading ? 'SEARCHING...' : 'FIND RIDES'),
            ),
            
            // Favorite Locations
            const SizedBox(height: 32),
            const Divider(),
            const SizedBox(height: 16),
            const Text(
              'FAVORITE LOCATIONS',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                letterSpacing: 2,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 16),
            if (_favorites.isEmpty)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF334155)),
                ),
                child: Column(
                  children: [
                    Icon(
                      Icons.star_border,
                      size: 48,
                      color: Colors.grey.withOpacity(0.5),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'No favorites yet',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey.withOpacity(0.7),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Tap the ⭐ icon next to any search result to save it',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.withOpacity(0.5),
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              )
            else
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _favorites.map((favorite) => GestureDetector(
                  onLongPress: () {
                    showDialog(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: Text(favorite['label']),
                        content: Text('Remove "${favorite['label']}" from favorites?'),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context),
                            child: const Text('CANCEL'),
                          ),
                          ElevatedButton(
                            onPressed: () {
                              Navigator.pop(context);
                              _removeFavorite(favorite['label']);
                            },
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                            child: const Text('REMOVE'),
                          ),
                        ],
                      ),
                    );
                  },
                  child: ActionChip(
                    avatar: Icon(
                      _getFavoriteIcon(favorite['icon']),
                      size: 18,
                      color: Colors.teal,
                    ),
                    label: Text(
                      favorite['label'],
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                    onPressed: () {
                      // Show options to use as pickup or dropoff
                      showModalBottomSheet(
                        context: context,
                        backgroundColor: const Color(0xFF1E293B),
                        shape: const RoundedRectangleBorder(
                          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                        ),
                        builder: (context) => Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                favorite['label'],
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                favorite['name'],
                                style: const TextStyle(fontSize: 12, color: Colors.grey),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 24),
                              Row(
                                children: [
                                  Expanded(
                                    child: ElevatedButton.icon(
                                      onPressed: () {
                                        Navigator.pop(context);
                                        _selectFavorite(favorite, true);
                                      },
                                      icon: const Icon(Icons.my_location, size: 20),
                                      label: const Text('PICKUP'),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.teal,
                                        padding: const EdgeInsets.symmetric(vertical: 16),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: ElevatedButton.icon(
                                      onPressed: () {
                                        Navigator.pop(context);
                                        _selectFavorite(favorite, false);
                                      },
                                      icon: const Icon(Icons.location_on, size: 20),
                                      label: const Text('DROPOFF'),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.red,
                                        padding: const EdgeInsets.symmetric(vertical: 16),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                )).toList(),
              ),
            
            // Recent Searches
            if (_recentSearches.isNotEmpty) ...[
              const SizedBox(height: 32),
              const Divider(),
              const SizedBox(height: 16),
              const Text(
                'RECENT SEARCHES',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 16),
              ..._recentSearches.map((search) => Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  dense: true,
                  leading: const Icon(Icons.history, size: 20, color: Colors.teal),
                  title: Row(
                    children: [
                      const Icon(Icons.my_location, size: 14, color: Colors.teal),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          search['pickup'] ?? '',
                          style: const TextStyle(fontSize: 12),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  subtitle: Row(
                    children: [
                      const Icon(Icons.location_on, size: 14, color: Colors.red),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          search['dropoff'] ?? '',
                          style: const TextStyle(fontSize: 12),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 14),
                  onTap: () {
                    _soundManager.playClick();
                    // Populate fields with coordinates from recent search
                    final pickupLat = double.tryParse(search['pickupLat'] ?? '');
                    final pickupLon = double.tryParse(search['pickupLon'] ?? '');
                    final dropoffLat = double.tryParse(search['dropoffLat'] ?? '');
                    final dropoffLon = double.tryParse(search['dropoffLon'] ?? '');
                    
                    if (pickupLat != null && pickupLon != null && dropoffLat != null && dropoffLon != null) {
                      setState(() {
                        _pickupController.text = search['pickup'] ?? '';
                        _pickupCoords = {
                          'lat': pickupLat,
                          'lon': pickupLon,
                          'name': search['pickup'] ?? '',
                        };
                        
                        _dropoffController.text = search['dropoff'] ?? '';
                        _dropoffCoords = {
                          'lat': dropoffLat,
                          'lon': dropoffLon,
                          'name': search['dropoff'] ?? '',
                        };
                        
                        _pickupResults = [];
                        _dropoffResults = [];
                        _focusedInput = null;
                        _pickupFocus.unfocus();
                        _dropoffFocus.unfocus();
                      });
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('This search doesn\'t have location data. Please search again.'),
                          duration: Duration(seconds: 2),
                        ),
                      );
                    }
                  },
                ),
              )),
            ],
          ],
        ),
      ),
    );
  }
}
