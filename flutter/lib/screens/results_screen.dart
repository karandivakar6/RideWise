import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import '../widgets/ride_card.dart';

class ResultsScreen extends StatelessWidget {
  final Map<String, dynamic> fareData;
  final String pickup;
  final String dropoff;

  const ResultsScreen({
    super.key,
    required this.fareData,
    required this.pickup,
    required this.dropoff,
  });

  void _shareRideDetails(BuildContext context) {
    final categories = fareData['categories'] as List<dynamic>;
    final distance = fareData['distance'];
    final duration = fareData['duration'];
    
    // Find cheapest option
    double minPrice = double.infinity;
    String cheapestProvider = '';
    
    for (var category in categories) {
      for (var service in category['services']) {
        double price = double.parse(service['price'].toString());
        if (price < minPrice) {
          minPrice = price;
          cheapestProvider = '${service['name']} - ${service['type']}';
        }
      }
    }
    
    final message = '''🚗 RideWise - Ride Comparison

📍 From: $pickup
📍 To: $dropoff

📏 Distance: $distance km
⏱ Duration: $duration

💰 Best Price: ₹${minPrice.toStringAsFixed(0)} ($cheapestProvider)

Compare prices across Uber, Rapido & Namma Yatri with RideWise!''';
    
    Share.share(
      message,
      subject: 'My RideWise Trip Details',
    );
  }

  @override
  Widget build(BuildContext context) {
    final categories = fareData['categories'] as List<dynamic>;
    final distance = fareData['distance'];
    final duration = fareData['duration'];

    return Scaffold(
      appBar: AppBar(
        title: const Text('AVAILABLE RIDES'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.share),
            tooltip: 'Share ride details',
            onPressed: () => _shareRideDetails(context),
          ),
        ],
      ),
      body: Column(
        children: [
          // Trip Info Header
          Container(
            padding: const EdgeInsets.all(16),
            color: const Color(0xFF1E293B),
            child: Column(
              children: [
                Row(
                  children: [
                    const Icon(Icons.my_location, color: Colors.teal, size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        pickup,
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.location_on, color: Colors.red, size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        dropoff,
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Divider(),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    Column(
                      children: [
                        const Icon(Icons.straighten, size: 16, color: Colors.grey),
                        const SizedBox(height: 4),
                        Text(
                          '$distance km',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    Column(
                      children: [
                        const Icon(Icons.access_time, size: 16, color: Colors.grey),
                        const SizedBox(height: 4),
                        Text(
                          duration,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          // Ride Categories
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: categories.length,
              itemBuilder: (context, index) {
                final category = categories[index];
                final services = category['services'] as List<dynamic>;
                
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Row(
                        children: [
                          Text(
                            category['icon'],
                            style: const TextStyle(fontSize: 20),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            category['category'].toString().toUpperCase(),
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 2,
                              color: Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                    ...services.map((service) => RideCard(
                          service: service,
                          pickupAddress: pickup,
                          dropoffAddress: dropoff,
                        )),
                    const SizedBox(height: 8),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
