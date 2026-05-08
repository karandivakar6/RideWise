import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../utils/currency.dart';

class RideCard extends StatefulWidget {
  final Map<String, dynamic> service;
  final String pickupAddress;
  final String dropoffAddress;

  const RideCard({
    super.key,
    required this.service,
    required this.pickupAddress,
    required this.dropoffAddress,
  });

  @override
  State<RideCard> createState() => _RideCardState();
}

class _RideCardState extends State<RideCard> {
  String _currency = 'INR';

  @override
  void initState() {
    super.initState();
    _loadCurrency();
  }

  Future<void> _loadCurrency() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _currency = prefs.getString('settings_currency') ?? 'INR';
    });
  }

  String _formatPrice() {
    return CurrencyConverter.convertPrice(widget.service['price'].toDouble(), _currency);
  }

  Color _getBrandColor() {
    final brand = widget.service['brand'] as String;
    if (brand.contains('yellow')) return Colors.yellow.shade700;
    if (brand.contains('green')) return Colors.green.shade600;
    if (brand.contains('black')) return Colors.black;
    return Colors.grey;
  }

  Widget _buildProviderLogo() {
    final name = widget.service['name'] as String;
    
    if (name == 'Rapido') {
      return Container(
        decoration: BoxDecoration(
          color: const Color(0xFFFFC107),
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'R',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.black,
              ),
            ),
            Text(
              'RAPIDO',
              style: TextStyle(
                fontSize: 6,
                fontWeight: FontWeight.bold,
                color: Colors.black,
              ),
            ),
          ],
        ),
      );
    }
    
    if (name == 'Namma Yatri') {
      return Container(
        decoration: BoxDecoration(
          color: const Color(0xFF7C3AED),
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'NY',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            Text(
              'NAMMA YATRI',
              style: TextStyle(
                fontSize: 5,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ],
        ),
      );
    }
    
    if (name == 'Uber') {
      return Container(
        decoration: BoxDecoration(
          color: Colors.black,
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'U',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            Text(
              'UBER',
              style: TextStyle(
                fontSize: 6,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ],
        ),
      );
    }
    
    // Fallback for other providers
    return Container(
      decoration: BoxDecoration(
        color: _getBrandColor().withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(
        _getProviderIcon(),
        color: _getBrandColor(),
        size: 28,
      ),
    );
  }

  IconData _getProviderIcon() {
    final name = widget.service['name'] as String;
    if (name == 'Rapido') return Icons.two_wheeler;
    if (name == 'Namma Yatri') return Icons.local_taxi;
    return Icons.directions_car;
  }

  Future<void> _shareRide() async {
    final prefs = await SharedPreferences.getInstance();
    final currency = prefs.getString('settings_currency') ?? 'INR';
    final formattedPrice = CurrencyConverter.convertPrice(service['price'].toDouble(), currency);
    
    final message = '''🚗 Check out this ride option!

🚖 ${widget.service['name']} - ${widget.service['type']}
💰 Price: $formattedPrice

📍 From: ${widget.pickupAddress}
📍 To: ${widget.dropoffAddress}

Found using RideWise - Compare. Save. Ride.''';
    
    Share.share(
      message,
      subject: 'RideWise - ${widget.service['name']} Ride',
    );
  }

  Future<void> _showBookingOptions(BuildContext context) async {
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
              '${widget.service['name']} - ${widget.service['type']}',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                letterSpacing: 1,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _formatPrice(),
              style: const TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.w900,
                color: Colors.teal,
              ),
            ),
            const SizedBox(height: 24),
            
            // QR Code
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: QrImageView(
                data: 'ridewise://book?provider=${widget.service['name']}&type=${widget.service['type']}&price=${widget.service['price']}',
                size: 200,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Scan to book on your phone',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 24),
            
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      _shareRide();
                    },
                    icon: const Icon(Icons.share),
                    label: const Text('SHARE'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.teal,
                      minimumSize: const Size(0, 56),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _launchApp(service['name']),
                    icon: const Icon(Icons.open_in_new),
                    label: const Text('OPEN APP'),
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size(0, 56),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _launchApp(String provider) async {
    // Track ride when user opens the provider's app
    try {
      final prefs = await SharedPreferences.getInstance();
      final userJson = prefs.getString('user');
      if (userJson != null) {
        final user = json.decode(userJson);
        final userId = user['id'];
        
        await http.post(
          Uri.parse('http://localhost:5000/api/users/$userId/increment-ride'),
          headers: {'Content-Type': 'application/json'},
          body: json.encode({'provider': provider}),
        );
        print('🚗 Ride tracked for $provider');
      }
    } catch (e) {
      print('Failed to track ride: $e');
    }
    
    // Simplified - in production, use deep links
    final urls = {
      'Uber': 'https://m.uber.com',
      'Rapido': 'https://rapido.bike',
      'Namma Yatri': 'https://nammayatri.in',
    };
    
    final url = urls[provider];
    if (url != null) {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => _showBookingOptions(context),
        borderRadius: BorderRadius.circular(24),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Provider Logo
              SizedBox(
                width: 48,
                height: 48,
                child: _buildProviderLogo(),
              ),
              const SizedBox(width: 16),
              
              // Service Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.service['name'],
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      widget.service['type'],
                      style: const TextStyle(
                        fontSize: 11,
                        color: Colors.grey,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.access_time, size: 12, color: Colors.grey),
                        const SizedBox(width: 4),
                        Text(
                          widget.service['estimatedTime'],
                          style: const TextStyle(fontSize: 10, color: Colors.grey),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              
              // Price
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    _formatPrice(),
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: Colors.teal,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.green.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text(
                      'BEST',
                      style: TextStyle(
                        fontSize: 8,
                        fontWeight: FontWeight.w900,
                        color: Colors.green,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
