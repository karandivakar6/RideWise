import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/sound_manager.dart';

class SettingsModal extends StatefulWidget {
  const SettingsModal({super.key});

  @override
  State<SettingsModal> createState() => _SettingsModalState();
}

class _SettingsModalState extends State<SettingsModal> {
  bool _soundEnabled = true;
  bool _locationSharing = true;
  bool _autoSave = true;
  String _language = 'en';
  String _currency = 'INR';
  
  final _soundManager = SoundManager();

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _soundEnabled = prefs.getBool('settings_soundEffects') ?? true;
      _locationSharing = prefs.getBool('settings_locationSharing') ?? true;
      _autoSave = prefs.getBool('settings_autoSave') ?? true;
      _language = prefs.getString('settings_language') ?? 'en';
      _currency = prefs.getString('settings_currency') ?? 'INR';
    });
  }

  Future<void> _saveSetting(String key, dynamic value) async {
    final prefs = await SharedPreferences.getInstance();
    if (value is bool) {
      await prefs.setBool(key, value);
    } else if (value is String) {
      await prefs.setString(key, value);
    }
    _soundManager.playClick();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF1E293B),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'SETTINGS',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w900,
              letterSpacing: 2,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          
          // Sound Effects
          SwitchListTile(
            title: const Text(
              'Sound Effects',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
            subtitle: const Text(
              'Play sounds on actions',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
            value: _soundEnabled,
            activeColor: Colors.teal,
            onChanged: (val) {
              setState(() => _soundEnabled = val);
              _saveSetting('settings_soundEffects', val);
            },
          ),
          
          // Location Sharing
          SwitchListTile(
            title: const Text(
              'Location Access',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
            subtitle: const Text(
              'Allow using current location for pickup',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
            value: _locationSharing,
            activeColor: Colors.teal,
            onChanged: (val) {
              setState(() => _locationSharing = val);
              _saveSetting('settings_locationSharing', val);
            },
          ),
          
          // Auto-save Searches
          SwitchListTile(
            title: const Text(
              'Auto-save Searches',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
            subtitle: const Text(
              'Save recent searches automatically',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
            value: _autoSave,
            activeColor: Colors.teal,
            onChanged: (val) {
              setState(() => _autoSave = val);
              _saveSetting('settings_autoSave', val);
            },
          ),
          
          const Divider(height: 32),
          
          // Language
          ListTile(
            title: const Text(
              'Language',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
            trailing: DropdownButton<String>(
              value: _language,
              dropdownColor: const Color(0xFF1E293B),
              items: const [
                DropdownMenuItem(value: 'en', child: Text('English')),
                DropdownMenuItem(value: 'hi', child: Text('हिंदी (Hindi)')),
                DropdownMenuItem(value: 'kn', child: Text('ಕನ್ನಡ (Kannada)')),
                DropdownMenuItem(value: 'ta', child: Text('தமிழ் (Tamil)')),
              ],
              onChanged: (val) {
                if (val != null) {
                  setState(() => _language = val);
                  _saveSetting('settings_language', val);
                }
              },
            ),
          ),
          
          // Currency
          ListTile(
            title: const Text(
              'Currency',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
            trailing: DropdownButton<String>(
              value: _currency,
              dropdownColor: const Color(0xFF1E293B),
              items: const [
                DropdownMenuItem(value: 'INR', child: Text('₹ INR')),
                DropdownMenuItem(value: 'USD', child: Text('\$ USD')),
                DropdownMenuItem(value: 'EUR', child: Text('€ EUR')),
              ],
              onChanged: (val) {
                if (val != null) {
                  setState(() => _currency = val);
                  _saveSetting('settings_currency', val);
                }
              },
            ),
          ),
          
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('CLOSE'),
          ),
        ],
      ),
    );
  }
}
