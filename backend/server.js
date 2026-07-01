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

        // All registered users are regular users (not admin)
        user = new User({ name, email: email.toLowerCase(), password: hashedPassword, isAdmin: false });
        await user.save();
        console.log(`✅ New user registered: ${email} (isAdmin: false)`);

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { id: user._id, name, email, phone: '', photo: '', isAdmin: false } });
    } catch (err) { 
        console.error('❌ Registration failed:', err);
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

        // Check for hardcoded admin credentials
        if (email.toLowerCase() === 'admin@gmail.com' && password === 'Admin@1234') {
            if (!process.env.JWT_SECRET) {
                console.error('🚨 CRITICAL: JWT_SECRET is missing!');
                return res.status(500).json({ msg: 'Server configuration error' });
            }
            const token = jwt.sign({ id: 'admin-hardcoded' }, process.env.JWT_SECRET, { expiresIn: '1h' });
            console.log(`✅ Admin Logged In: ${email}`);
            console.log('🔑 Admin token created with ID: admin-hardcoded');
            return res.json({ 
                token, 
                user: { 
                    id: 'admin-hardcoded', 
                    name: 'Admin', 
                    email: 'admin@gmail.com', 
                    phone: '', 
                    photo: '', 
                    isAdmin: true, 
                    rideCount: 0 
                } 
            });
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
        
        // Ensure backward compatibility for old users without isAdmin/rideCount fields
        const userResponse = {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            photo: user.photo || '',
            isAdmin: false, // Regular users are never admin
            rideCount: user.rideCount || 0
        };
        
        res.json({ token, user: userResponse });
        
    } catch (err) { 
        // 3. Print the EXACT error to your backend terminal
        console.error("🔥 LOGIN CRASH:", err); 
        res.status(500).json({ msg: "Login server error" }); 
    }
});

// --- USER FAVORITES ROUTES ---

// Get user favorites
app.get('/api/users/:userId/favorites', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user.favorites || []);
    } catch (err) {
        console.error('Error fetching favorites:', err);
        res.status(500).json({ msg: 'Failed to fetch favorites' });
    }
});

// Add favorite
app.post('/api/users/:userId/favorites', async (req, res) => {
    try {
        const { label, name, lat, lon, icon } = req.body;
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        // Check if favorite already exists
        const exists = user.favorites.some(fav => 
            fav.name === name && fav.lat === lat && fav.lon === lon
        );
        if (exists) {
            return res.status(400).json({ msg: 'Favorite already exists' });
        }
        
        user.favorites.push({ label, name, lat, lon, icon });
        await user.save();
        res.json(user.favorites);
    } catch (err) {
        console.error('Error adding favorite:', err);
        res.status(500).json({ msg: 'Failed to add favorite' });
    }
});

// Remove favorite
app.delete('/api/users/:userId/favorites/:index', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        user.favorites.splice(parseInt(req.params.index), 1);
        await user.save();
        res.json(user.favorites);
    } catch (err) {
        console.error('Error removing favorite:', err);
        res.status(500).json({ msg: 'Failed to remove favorite' });
    }
});

// --- USER RECENT SEARCHES ROUTES ---

// Get recent searches
app.get('/api/users/:userId/recent-searches', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        // Return most recent first, limit to 10
        const recentSearches = (user.recentSearches || [])
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10);
        
        res.json(recentSearches);
    } catch (err) {
        console.error('Error fetching recent searches:', err);
        res.status(500).json({ msg: 'Failed to fetch recent searches' });
    }
});

// Add recent search
app.post('/api/users/:userId/recent-searches', async (req, res) => {
    try {
        const { pickup, dropoff } = req.body;
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        // Remove duplicate if exists
        user.recentSearches = user.recentSearches.filter(search => 
            !(search.pickup.name === pickup.name && search.dropoff.name === dropoff.name)
        );
        
        // Add new search at the beginning
        user.recentSearches.unshift({ pickup, dropoff, timestamp: new Date() });
        
        // Keep only last 10 searches
        user.recentSearches = user.recentSearches.slice(0, 10);
        
        await user.save();
        res.json(user.recentSearches);
    } catch (err) {
        console.error('Error adding recent search:', err);
        res.status(500).json({ msg: 'Failed to add recent search' });
    }
});

// --- ADMIN ROUTES ---

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            console.log('❌ Admin auth failed: No token provided');
            return res.status(401).json({ msg: 'No authentication token' });
        }
        
        console.log('🔍 Verifying admin token...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Token decoded:', decoded);
        
        // Check if it's the hardcoded admin
        if (decoded.id === 'admin-hardcoded') {
            console.log('✅ Hardcoded admin access granted');
            req.user = { id: 'admin-hardcoded', isAdmin: true, name: 'Admin' };
            return next();
        }
        
        // Otherwise check database
        const user = await User.findById(decoded.id);
        
        if (!user || !user.isAdmin) {
            console.log('❌ Admin auth failed: User not admin or not found');
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }
        
        console.log('✅ Database admin access granted');
        req.user = user;
        next();
    } catch (err) {
        console.error('❌ Admin auth error:', err.message);
        res.status(401).json({ msg: 'Invalid token' });
    }
};

// Get all users (admin only)
app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
        console.log('📋 Fetching all users from database...');
        const users = await User.find({ isAdmin: false }).select('-password');
        console.log(`✅ Found ${users.length} users:`, users.map(u => ({ email: u.email, isAdmin: u.isAdmin })));
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ msg: 'Failed to fetch users' });
    }
});

// Get all reports (admin only)
app.get('/api/admin/reports', requireAdmin, async (req, res) => {
    try {
        const Report = require('./models/Report');
        const reports = await Report.find().populate('userId', 'name email phone').sort({ createdAt: -1 });
        res.json(reports);
    } catch (err) {
        console.error('Error fetching reports:', err);
        res.status(500).json({ msg: 'Failed to fetch reports' });
    }
});

// Update report status (admin only)
app.patch('/api/admin/reports/:id', requireAdmin, async (req, res) => {
    try {
        const Report = require('./models/Report');
        const { status } = req.body;
        const report = await Report.findByIdAndUpdate(
            req.params.id, 
            { status, resolvedAt: status === 'resolved' ? new Date() : null },
            { new: true }
        ).populate('userId', 'name email phone');
        res.json(report);
    } catch (err) {
        console.error('Error updating report:', err);
        res.status(500).json({ msg: 'Failed to update report' });
    }
});

// --- REPORT ROUTES ---

// Submit a report
app.post('/api/reports', async (req, res) => {
    try {
        const { userId, description } = req.body;
        
        if (!userId || !description) {
            return res.status(400).json({ msg: 'User ID and description are required' });
        }
        
        const Report = require('./models/Report');
        const report = new Report({ userId, description });
        await report.save();
        
        res.json({ msg: 'Report submitted successfully', report });
    } catch (err) {
        console.error('Error submitting report:', err);
        res.status(500).json({ msg: 'Failed to submit report' });
    }
});

// Increment ride count when user opens provider app
app.post('/api/users/:userId/increment-ride', async (req, res) => {
    try {
        const { provider } = req.body;
        const user = await User.findById(req.params.userId);
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        user.rideCount = (user.rideCount || 0) + 1;
        await user.save();
        
        console.log(`✅ Ride count incremented for ${user.email} -> ${user.rideCount} (Provider: ${provider})`);
        
        res.json({ 
            msg: 'Ride count incremented', 
            rideCount: user.rideCount 
        });
    } catch (err) {
        console.error('Error incrementing ride count:', err);
        res.status(500).json({ msg: 'Failed to increment ride count' });
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

// Free-flow city speed used as the fare's time basis. Fares are billed on the
// free-flow trip time (like real ride apps); peak congestion is reflected via
// the surge factor, NOT by inflating the billed minutes with traffic.
const FREE_FLOW_SPEED_KMPH = 22;

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

    // Reject same pickup & dropoff (~0.001 deg ≈ 111m), matching the client-side guard
    const latDiff = Math.abs(pickup.lat - dropoff.lat);
    const lonDiff = Math.abs(pickup.lon - dropoff.lon);
    if (latDiff < 0.001 && lonDiff < 0.001) {
        return res.status(400).json({ msg: "Pickup and dropoff locations cannot be the same" });
    }

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
        // Displayed ETA is traffic-aware, but the effective speed is floored at
        // 12 km/h so heavy-traffic estimates stay realistic instead of collapsing
        // to ~8 km/h (which used to double the trip time).
        const etaSpeed = Math.max(20 / trafficMultiplier, 12);
        const estMins = Math.round((distanceKm / etaSpeed) * 60);
        adjustedDurationMin = estMins; // Traffic-aware ETA for display only
        // Free-flow trip time is the basis for the FARE (see fareDurationMin below).
        baseDurationMin = Math.round((distanceKm / FREE_FLOW_SPEED_KMPH) * 60);
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
        
        // FARE TIME BASIS: use the free-flow trip time, NOT the traffic-inflated
        // ETA. Peak-hour cost is applied through the per-provider surge factor
        // below. Charging on the inflated ETA (up to ~2.5x) while ALSO surging
        // was double-counting congestion and massively overshooting real fares.
        const fareDurationMin = baseDurationMin > 0
            ? baseDurationMin
            : Math.max(1, Math.round((distanceKm / FREE_FLOW_SPEED_KMPH) * 60));
        
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
                    { name: "Rapido", type: "Auto", algorithm: "rapido", base: 40, perKm: 14, perMin: 1.3, brand: "bg-yellow-500" },
                    { name: "Namma Yatri", type: "Auto", algorithm: "nammayatri", base: 30, perKm: 15, perMin: 1.4, brand: "bg-green-600" },
                    { name: "Uber", type: "Auto", algorithm: "uber", base: 40, perKm: 13.5, perMin: 1.5, brand: "bg-black" }
                ]
            },
            {
                category: "Cab Economy", icon: "🚗",
                services: [
                    { name: "Rapido", type: "Non-AC Cab", algorithm: "rapido", base: 70, perKm: 12.5, perMin: 1.6, brand: "bg-yellow-500" },
                    { name: "Namma Yatri", type: "Non-AC Cab", algorithm: "nammayatri", base: 65, perKm: 13.4, perMin: 1.8, brand: "bg-green-600" },
                    { name: "Uber", type: "Go Non-AC", algorithm: "uber", base: 68, perKm: 10.7, perMin: 1.5, brand: "bg-black" }
                ]
            },
            {
                category: "Cab AC", icon: "🚕",
                services: [
                    { name: "Rapido", type: "AC Cab", algorithm: "rapido", base: 85, perKm: 13, perMin: 1.8, brand: "bg-yellow-500" },
                    { name: "Namma Yatri", type: "AC Cab", algorithm: "nammayatri", base: 80, perKm: 15, perMin: 2.0, brand: "bg-green-600" },
                    { name: "Uber", type: "Go (AC)", algorithm: "uber", base: 82, perKm: 12, perMin: 1.7, brand: "bg-black" }
                ]
            },
            {
                category: "Premium", icon: "✨",
                services: [
                    { name: "Rapido", type: "Cab Premium", algorithm: "rapido", base: 110, perKm: 14.8, perMin: 2.0, brand: "bg-yellow-500" },
                    { name: "Namma Yatri", type: "Sedan Premium", algorithm: "nammayatri", base: 105, perKm: 17.8, perMin: 2.3, brand: "bg-green-600" },
                    { name: "Uber", type: "Go Priority", algorithm: "uber", base: 108, perKm: 15.5, perMin: 2.0, brand: "bg-black" },
                    { name: "Uber", type: "Premier", algorithm: "uber", base: 125, perKm: 16.7, perMin: 2.4, brand: "bg-black" }
                ]
            },
            {
                category: "XL / Large", icon: "🚙",
                services: [
                    { name: "Rapido", type: "XL Cab", algorithm: "rapido", base: 145, perKm: 14.6, perMin: 1.9, brand: "bg-yellow-500" },
                    { name: "Namma Yatri", type: "XL Cab", algorithm: "nammayatri", base: 140, perKm: 20.5, perMin: 2.7, brand: "bg-green-600" },
                    { name: "Uber", type: "UberXL", algorithm: "uber", base: 148, perKm: 17.4, perMin: 2.3, brand: "bg-black" }
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
                    const baseFare = s.base + (distanceKm * s.perKm) + (fareDurationMin * s.perMin);
                    
                    // Light surge during peak hours
                    const hour = new Date().getHours();
                    const isPeakHour = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
                    const surgeFactor = isPeakHour ? 1.1 : 1.0;
                    
                    totalPrice = Math.round(baseFare * surgeFactor);
                    
                } else if (s.algorithm === 'rapido') {
                    // RAPIDO: Base + Distance + Time components
                    const baseFare = s.base + (distanceKm * s.perKm) + (fareDurationMin * s.perMin);
                    
                    // Minimal peak hour increase
                    const hour = new Date().getHours();
                    const isPeakHour = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
                    const peakMultiplier = isPeakHour ? 1.02 : 1.0;
                    
                    totalPrice = Math.round(baseFare * peakMultiplier);
                    
                } else if (s.algorithm === 'nammayatri') {
                    // NAMMA YATRI: Government meter-based with time component
                    const meterFare = s.base + (distanceKm * s.perKm) + (fareDurationMin * s.perMin);
                    
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
                    const baseFare = s.base + (distanceKm * s.perKm) + (fareDurationMin * s.perMin);
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
        console.log(`💰 Uber Formula Applied: Base + (${distanceKm.toFixed(2)}km × PerKm) + (${fareDurationMin}min × PerMin) | Peak=${isPeakHour ? 'Yes' : 'No'}`);

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