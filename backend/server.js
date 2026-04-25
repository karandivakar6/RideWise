const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Models
const User = require('./models/User');
const Ride = require('./models/Ride');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
// Increase payload limit for profile photo uploads (base64 images)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- MONGODB CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ DB Error:", err));

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) return res.status(400).json({ msg: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ name, email: email.toLowerCase(), password: hashedPassword });
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { id: user._id, name, email, phone: '', photo: '' } });
    } catch (err) { 
        res.status(500).json({ msg: "Registration failed" }); 
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // 1. Safety Check: Did the frontend actually send the data?
        if (!email || !password) {
            console.log("❌ Login failed: Missing email or password");
            return res.status(400).json({ msg: "Please provide email and password" });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            console.log(`❌ Login failed: User not found for ${email}`);
            return res.status(400).json({ msg: "Invalid Credentials: User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`❌ Login failed: Wrong password for ${email}`);
            return res.status(400).json({ msg: "Invalid Credentials: Wrong password" });
        }

        // 2. Safety Check: Does the JWT_SECRET exist?
        if (!process.env.JWT_SECRET) {
             console.error("🚨 CRITICAL: JWT_SECRET is missing from your .env file!");
             return res.status(500).json({ msg: "Server configuration error" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log(`✅ User Logged In: ${user.email}`);
        res.json({ token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, photo: user.photo } });
        
    } catch (err) { 
        // 3. Print the EXACT error to your backend terminal
        console.error("🔥 LOGIN CRASH:", err); 
        res.status(500).json({ msg: "Login server error" }); 
    }
});

// --- USER PROFILE ROUTES ---

// Get User Stats
app.get('/api/users/:id/stats', async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Get all rides for this user
        const rides = await Ride.find({ userId });
        
        const stats = {
            totalRides: rides.length,
            totalDistance: rides.reduce((sum, ride) => sum + (ride.distance || 0), 0),
            avgCost: 0, // Will be calculated when booking feature is implemented
            mostUsedProvider: rides.length > 0 ? 'Rapido' : 'No rides yet'
        };
        
        res.json(stats);
    } catch (err) {
        console.error('Stats error:', err);
        res.status(500).json({ msg: 'Failed to fetch stats' });
    }
});

// Update User Profile
app.put('/api/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, email, phone, photo } = req.body;
        
        console.log('📝 Update request for user:', userId);
        console.log('📥 Update data:', { name, email, phone, photo: photo ? 'base64 image' : 'none' });
        
        // Validate MongoDB ObjectId format
        if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
            console.error('❌ Invalid user ID format:', userId);
            return res.status(400).json({ msg: 'Invalid user ID format' });
        }
        
        const user = await User.findByIdAndUpdate(
            userId,
            { name, email, phone, photo },
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!user) {
            console.error('❌ User not found with ID:', userId);
            return res.status(404).json({ msg: 'User not found' });
        }
        
        console.log('✅ User updated successfully:', user._id);
        res.json({ id: user._id, name: user.name, email: user.email, phone: user.phone, photo: user.photo });
    } catch (err) {
        console.error('❌ Update profile error:', err.message);
        console.error('Full error:', err);
        res.status(500).json({ msg: 'Failed to update profile', error: err.message });
    }
});

// --- FARE ENGINE USING OSRM WITH TRAFFIC-AWARE DURATION ESTIMATES ---

// Mathematical fallback if OSRM API is unavailable
const calculateFallbackDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Smart Traffic Congestion Calculator for Bengaluru
const getTrafficMultiplier = () => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    const minute = now.getMinutes();
    
    // Weekend traffic (lighter)
    if (day === 0 || day === 6) {
        if (hour >= 11 && hour <= 14) return 1.15; // Lunch time rush
        if (hour >= 18 && hour <= 21) return 1.25; // Evening shopping/dining
        return 1.05; // Normal weekend traffic
    }
    
    // Weekday traffic patterns
    // Early morning (5-7 AM) - Light traffic
    if (hour >= 5 && hour < 7) return 1.1;
    
    // Morning peak (7-10 AM) - Heavy congestion
    if (hour >= 7 && hour < 10) {
        if (hour === 8 || hour === 9) return 2.1; // Peak morning rush
        return 1.8;
    }
    
    // Late morning to early afternoon (10 AM - 4 PM) - Moderate
    if (hour >= 10 && hour < 16) {
        if (hour >= 12 && hour <= 14) return 1.4; // Lunch hour spike
        return 1.25;
    }
    
    // Evening peak (4-9 PM) - Severe congestion
    if (hour >= 16 && hour < 21) {
        // Absolute peak: 5:30 PM - 8:30 PM
        if (hour >= 17 && hour <= 20) {
            if ((hour === 17 && minute >= 30) || (hour === 18) || (hour === 19) || (hour === 20 && minute <= 30)) {
                return 2.5; // Worst Bengaluru traffic
            }
            return 2.2;
        }
        return 1.9;
    }
    
    // Night (9 PM - 5 AM) - Clear roads
    if (hour >= 21 || hour < 5) return 1.0;
    
    // Default moderate traffic
    return 1.3;
};

// Additional congestion for high-traffic corridors
const getCorridorCongestion = (pickup, dropoff) => {
    // High congestion zones in Bengaluru (lat/lon ranges)
    const hotspots = [
        { name: "Outer Ring Road", lat: [12.92, 13.05], lon: [77.55, 77.72], factor: 1.3 },
        { name: "Silk Board Junction", lat: [12.91, 12.93], lon: [77.62, 77.64], factor: 1.5 },
        { name: "Whitefield", lat: [12.96, 12.99], lon: [77.72, 77.76], factor: 1.4 },
        { name: "Electronic City", lat: [12.83, 12.86], lon: [77.65, 77.68], factor: 1.35 },
        { name: "MG Road/Brigade", lat: [12.97, 12.98], lon: [77.59, 77.61], factor: 1.45 }
    ];
    
    let maxFactor = 1.0;
    
    // Check if route passes through or near hotspots
    hotspots.forEach(zone => {
        const pickupInZone = pickup.lat >= zone.lat[0] && pickup.lat <= zone.lat[1] && 
                           pickup.lon >= zone.lon[0] && pickup.lon <= zone.lon[1];
        const dropoffInZone = dropoff.lat >= zone.lat[0] && dropoff.lat <= zone.lat[1] && 
                            dropoff.lon >= zone.lon[0] && dropoff.lon <= zone.lon[1];
        
        if (pickupInZone || dropoffInZone) {
            maxFactor = Math.max(maxFactor, zone.factor);
        }
    });
    
    return maxFactor;
};

app.post('/api/fares', async (req, res) => {
    const { pickup, dropoff, userId } = req.body;
    if (!pickup || !dropoff) return res.status(400).json({ msg: "Invalid locations" });
    
    let distanceKm = 0;
    let baseDurationMin = 0;
    let adjustedDurationMin = 0;
    let durationText = "";

    try {
        // 1. USE OSRM (OPEN SOURCE ROUTING MACHINE) - 100% FREE!
        // No API key needed, no billing, no limits!
        const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lon},${pickup.lat};${dropoff.lon},${dropoff.lat}?overview=false`;
        
        const osrmRes = await fetch(url);
        const osrmData = await osrmRes.json();

        // Check if OSRM returned a valid route
        if (osrmData?.routes?.[0]) {
            distanceKm = osrmData.routes[0].distance / 1000; // Convert meters to km
            baseDurationMin = Math.round(osrmData.routes[0].duration / 60); // Base duration
            
            // Apply traffic-aware multipliers
            const trafficMultiplier = getTrafficMultiplier();
            const corridorMultiplier = getCorridorCongestion(pickup, dropoff);
            const combinedMultiplier = trafficMultiplier * corridorMultiplier;
            
            // Calculate realistic duration with traffic
            adjustedDurationMin = Math.round(baseDurationMin * combinedMultiplier);
            
            // Add traffic indicator
            let trafficStatus = "";
            if (combinedMultiplier >= 2.3) trafficStatus = "🔴 Heavy Traffic";
            else if (combinedMultiplier >= 1.8) trafficStatus = "🟠 Moderate Traffic";
            else if (combinedMultiplier >= 1.3) trafficStatus = "🟡 Light Traffic";
            else trafficStatus = "🟢 Clear Roads";
            
            durationText = `${adjustedDurationMin} mins ${trafficStatus}`;
            
            console.log(`✅ Traffic-Aware Route: ${distanceKm.toFixed(2)}km | Base: ${baseDurationMin}min | Traffic: ${combinedMultiplier.toFixed(2)}x | Final: ${adjustedDurationMin}min | ${trafficStatus}`);
        } else {
            throw new Error("OSRM returned no valid route");
        }

    } catch (error) {
        // 2. FALLBACK TO MATH IF OSRM IS DOWN
        console.log("⚠️ OSRM API Failed, using Math Fallback. Reason:", error.message);
        
        distanceKm = calculateFallbackDistance(pickup.lat, pickup.lon, dropoff.lat, dropoff.lon);
        const trafficMultiplier = getTrafficMultiplier();
        // Base Bengaluru speed: ~20 km/h in traffic, ~40 km/h without
        const avgSpeed = 20 / trafficMultiplier; // Slower in heavy traffic
        const estMins = Math.round((distanceKm / avgSpeed) * 60);
        adjustedDurationMin = estMins; // Set for fare calculation
        durationText = `${estMins} mins (Est.)`;
    }

    try {
        // 3. Calculate Fares based on Real-World Pricing (Reverse-engineered from actual Rapido/Uber/Namma Yatri rates)
        // Platform fee - included in base fare, no separate charge
        const platformFee = 0;
        
        // Get traffic/surge multiplier based on current time
        const trafficMultiplier = getTrafficMultiplier();
        
        // Light surge during peak hours (most apps apply 10-20% surge)
        const surgeFactor = trafficMultiplier >= 2.0 ? 1.15 : 1.0;
        
        // Extract actual duration in minutes from OSRM response
        const actualDurationMin = adjustedDurationMin || Math.round((distanceKm / 20) * 60);
        
        const categories = [
            {
                category: "Bike", icon: "🏍️",
                services: [
                    { name: "Rapido", type: "Bike Direct", algorithm: "rapido", base: 20, perKm: 7.5, perMin: 1, brand: "bg-yellow-500" },
                    { name: "Rapido", type: "Bike Saver", algorithm: "rapido", base: 18, perKm: 7, perMin: 0.9, brand: "bg-yellow-500" },
                    { name: "Uber", type: "Moto", algorithm: "uber", base: 22, perKm: 7, perMin: 1.1, brand: "bg-black" }
                ]
            },
            {
                category: "Auto", icon: "🛺",
                services: [
                    { name: "Rapido", type: "Auto", algorithm: "rapido", base: 38, perKm: 13, perMin: 1.2, brand: "bg-yellow-500" },
                    { name: "Namma Yatri", type: "Auto", algorithm: "nammayatri", base: 28, perKm: 13.5, perMin: 1.3, brand: "bg-green-600" },
                    { name: "Uber", type: "Auto", algorithm: "uber", base: 38, perKm: 12.5, perMin: 1.4, brand: "bg-black" }
                ]
            },
            {
                category: "Cab Economy", icon: "🚗",
                services: [
                    { name: "Rapido", type: "Non-AC Cab", algorithm: "rapido", base: 50, perKm: 10, perMin: 1.2, brand: "bg-yellow-500" },
                    { name: "Namma Yatri", type: "Non-AC Cab", algorithm: "nammayatri", base: 45, perKm: 12, perMin: 1.3, brand: "bg-green-600" },
                    { name: "Uber", type: "Go Non-AC", algorithm: "uber", base: 45, perKm: 9, perMin: 1.2, brand: "bg-black" }
                ]
            },
            {
                category: "Cab AC", icon: "🚕",
                services: [
                    { name: "Rapido", type: "AC Cab", algorithm: "rapido", base: 62, perKm: 11.5, perMin: 1.4, brand: "bg-yellow-500" },
                    { name: "Namma Yatri", type: "AC Cab", algorithm: "nammayatri", base: 58, perKm: 13.5, perMin: 1.5, brand: "bg-green-600" },
                    { name: "Uber", type: "Go (AC)", algorithm: "uber", base: 55, perKm: 10.5, perMin: 1.3, brand: "bg-black" }
                ]
            },
            {
                category: "Premium", icon: "✨",
                services: [
                    { name: "Rapido", type: "Cab Premium", algorithm: "rapido", base: 80, perKm: 13.5, perMin: 1.6, brand: "bg-yellow-500" },
                    { name: "Namma Yatri", type: "Sedan Premium", algorithm: "nammayatri", base: 75, perKm: 16, perMin: 1.7, brand: "bg-green-600" },
                    { name: "Uber", type: "Go Priority", algorithm: "uber", base: 78, perKm: 13.5, perMin: 1.5, brand: "bg-black" },
                    { name: "Uber", type: "Premier", algorithm: "uber", base: 88, perKm: 15, perMin: 1.8, brand: "bg-black" }
                ]
            },
            {
                category: "XL / Large", icon: "🚙",
                services: [
                    { name: "Rapido", type: "XL Cab", algorithm: "rapido", base: 110, perKm: 18, perMin: 2, brand: "bg-yellow-500" },
                    { name: "Namma Yatri", type: "XL Cab", algorithm: "nammayatri", base: 105, perKm: 21, perMin: 2.2, brand: "bg-green-600" },
                    { name: "Uber", type: "UberXL", algorithm: "uber", base: 108, perKm: 19, perMin: 2.1, brand: "bg-black" }
                ]
            }
        ];

        const results = categories.map(cat => ({
            ...cat,
            services: cat.services.map(s => {
                let totalPrice;
                
                // Provider-specific pricing algorithms using Uber's formula:
                // Base + (Distance × PerKm) + (Duration × PerMin)
                
                if (s.algorithm === 'uber') {
                    // UBER: Base + Distance + Time components
                    const baseFare = s.base + (distanceKm * s.perKm) + (actualDurationMin * s.perMin);
                    
                    // Light surge during peak hours
                    const hour = new Date().getHours();
                    const isPeakHour = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
                    const surgeFactor = isPeakHour ? 1.1 : 1.0;
                    
                    totalPrice = Math.round(baseFare * surgeFactor);
                    
                } else if (s.algorithm === 'rapido') {
                    // RAPIDO: Base + Distance + Time components
                    const baseFare = s.base + (distanceKm * s.perKm) + (actualDurationMin * s.perMin);
                    
                    // Minimal peak hour increase
                    const hour = new Date().getHours();
                    const isPeakHour = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
                    const peakMultiplier = isPeakHour ? 1.02 : 1.0;
                    
                    totalPrice = Math.round(baseFare * peakMultiplier);
                    
                } else if (s.algorithm === 'nammayatri') {
                    // NAMMA YATRI: Government meter-based with time component
                    const meterFare = s.base + (distanceKm * s.perKm) + (actualDurationMin * s.perMin);
                    
                    // Fixed night charge (10 PM - 6 AM)
                    const hour = new Date().getHours();
                    const isNightTime = hour >= 22 || hour < 6;
                    const nightCharge = isNightTime ? 50 : 0;
                    
                    // Total before rounding
                    const beforeRounding = meterFare + nightCharge;
                    
                    // Round to nearest ₹5 (government regulation)
                    totalPrice = Math.round(beforeRounding / 5) * 5;
                    
                } else {
                    // Fallback
                    const baseFare = s.base + (distanceKm * s.perKm) + (actualDurationMin * s.perMin);
                    totalPrice = Math.round(baseFare);
                }
                
                return {
                    ...s,
                    price: totalPrice,
                    estimatedTime: durationText
                };
            }).sort((a, b) => a.price - b.price)
        }));

        const hour = new Date().getHours();
        const isPeakHour = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
        console.log(`💰 Uber Formula Applied: Base + (${distanceKm.toFixed(2)}km × PerKm) + (${actualDurationMin}min × PerMin) | Peak=${isPeakHour ? 'Yes' : 'No'}`);

        // NOTE: Rides are only saved when user actually books, not during price searches
        // TODO: Implement booking endpoint (POST /api/bookings) to save actual rides
        
        res.json({ 
            distance: distanceKm.toFixed(2), 
            duration: durationText,
            categories: results 
        });

    } catch (error) {
        console.error("Critical Engine Error:", error);
        res.status(500).json({ msg: "Critical engine failure" });
    }
});

// --- ADMIN/TESTING ENDPOINTS ---

// Clear all rides for a user (for testing/debugging)
app.delete('/api/users/:id/rides', async (req, res) => {
    try {
        const userId = req.params.id;
        const result = await Ride.deleteMany({ userId });
        console.log(`🗑️ Cleared ${result.deletedCount} rides for user ${userId}`);
        res.json({ msg: `Deleted ${result.deletedCount} rides`, deletedCount: result.deletedCount });
    } catch (err) {
        console.error('Delete rides error:', err);
        res.status(500).json({ msg: 'Failed to delete rides' });
    }
});

app.listen(PORT, () => console.log(`🚀 Server cruising on port ${PORT}`));