import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';

class RideCard extends StatelessWidget {
  final Map<String, dynamic> service;
  final String pickupAddress;
  final String dropoffAddress;

  const RideCard({
    super.key,
    required this.service,
    required this.pickupAddress,
    required this.dropoffAddress,
  });

  Color _getBrandColor() {
    final brand = service['brand'] as String;
    if (brand.contains('yellow')) return Colors.yellow.shade700;
    if (brand.contains('green')) return Colors.green.shade600;
    if (brand.contains('black')) return Colors.black;
    return Colors.grey;
  }

  Widget _buildProviderLogo() {
    final name = service['name'] as String;
    
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
    final name = service['name'] as String;
    if (name == 'Rapido') return Icons.two_wheeler;
    if (name == 'Namma Yatri') return Icons.local_taxi;
    return Icons.directions_car;
  }

  void _shareRide() {
    final message = '''🚗 Check out this ride option!

🚖 ${service['name']} - ${service['type']}
💰 Price: ₹${service['price']}

📍 From: $pickupAddress
📍 To: $dropoffAddress

Found using RideWise - Compare. Save. Ride.''';
    
    Share.share(
      message,
      subject: 'RideWise - ${service['name']} Ride',
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
              '${service['name']} - ${service['type']}',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                letterSpacing: 1,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '₹${service['price']}',
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
                data: 'ridewise://book?provider=${service['name']}&type=${service['type']}&price=${service['price']}',
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
                      service['name'],
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      service['type'],
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
                          service['estimatedTime'],
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
                    '₹${service['price']}',
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
