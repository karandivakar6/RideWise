// Sound Effects Manager for RideWise Flutter
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SoundManager {
  static final SoundManager _instance = SoundManager._internal();
  factory SoundManager() => _instance;
  SoundManager._internal();

  Future<bool> _isEnabled() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('settings_soundEffects') ?? true;
  }

  Future<void> playClick() async {
    if (await _isEnabled()) {
      HapticFeedback.lightImpact();
    }
  }

  Future<void> playSuccess() async {
    if (await _isEnabled()) {
      HapticFeedback.mediumImpact();
    }
  }

  Future<void> playError() async {
    if (await _isEnabled()) {
      HapticFeedback.heavyImpact();
    }
  }

  Future<void> playSearch() async {
    if (await _isEnabled()) {
      HapticFeedback.selectionClick();
    }
  }
}
