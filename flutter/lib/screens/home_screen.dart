import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:convert';
import 'auth_screen.dart';
import 'search_screen.dart';
import '../widgets/settings_modal.dart';
import '../widgets/logo.dart';
import '../main.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? _user;
  Position? _currentPosition;
  bool _locationEnabled = false;

  @override
  void initState() {
    super.initState();
    _loadUser();
    _checkLocationPermission();
  }

  Future<void> _loadUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    if (userStr != null) {
      setState(() {
        _user = json.decode(userStr);
      });
    }
  }

  Future<void> _checkLocationPermission() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final locationEnabled = prefs.getBool('settings_locationSharing') ?? true;
      
      if (!locationEnabled) return;
      
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) return;

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        return; // Don't auto-request on home screen, let user trigger it
      }
      
      if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
        _getCurrentLocation();
      }
    } catch (e) {
      // Silently fail on home screen
    }
  }

  Future<void> _getCurrentLocation() async {
    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 5),
      );
      if (mounted) {
        setState(() {
          _currentPosition = position;
          _locationEnabled = true;
        });
      }
    } catch (e) {
      // Handle error silently
    }
  }

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const AuthScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'RIDEWISE',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 6,
                          color: Theme.of(context).brightness == Brightness.dark
                              ? const Color(0xFFCBD5E1) // slate-300
                              : const Color(0xFF475569), // slate-600
                        ),
                      ),
                      Text(
                        'Hi, ${_user?['name'] ?? 'User'}!',
                        style: TextStyle(
                          fontSize: 12,
                          color: Theme.of(context).brightness == Brightness.dark
                              ? const Color(0xFF94A3B8) // slate-400
                              : const Color(0xFF64748B), // slate-500
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      IconButton(
                        icon: Icon(
                          Theme.of(context).brightness == Brightness.dark
                              ? Icons.light_mode
                              : Icons.dark_mode,
                          color: Colors.grey,
                        ),
                        onPressed: () {
                          RideWiseApp.of(context)?.toggleTheme();
                        },
                      ),
                      IconButton(
                        icon: const Icon(Icons.settings, color: Colors.grey),
                        onPressed: () {
                          showModalBottomSheet(
                            context: context,
                            backgroundColor: Colors.transparent,
                            isScrollControlled: true,
                            builder: (_) => const SettingsModal(),
                          );
                        },
                      ),
                      IconButton(
                        icon: const Icon(Icons.logout, color: Colors.red),
                        onPressed: _logout,
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 32),
              
              // Main Card
              Expanded(
                child: Card(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(32),
                    side: const BorderSide(color: Color(0xFF1E293B), width: 1),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Logo(
                          size: 120,
                          showTagline: false,
                        ),
                        const SizedBox(height: 24),
                        const Text(
                          'COMPARE RIDES',
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 3,
                          ),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'Find the best prices across\nUber, Rapido & Namma Yatri',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey,
                            height: 1.5,
                          ),
                        ),
                        const SizedBox(height: 40),
                        
                        ElevatedButton.icon(
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => SearchScreen(
                                  currentPosition: _currentPosition,
                                ),
                              ),
                            );
                          },
                          icon: const Icon(Icons.search),
                          label: const Text('SEARCH RIDES'),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 32,
                              vertical: 20,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
