const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Models
const User = require('./models/User');
const Ride = require('./models/Ride');

// Email transporter setup
const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 1. THIS IS THE LINE THAT WAS MISSING!
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

// --- EMAIL NOTIFICATION ROUTES ---

// Send ride search notification
app.post('/api/notifications/search', async (req, res) => {
    try {
        const { userEmail, userName, pickup, dropoff, distance, duration } = req.body;
        
        // Check if email is configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('📧 Email not configured - skipping notification');
            return res.json({ msg: 'Email notifications not configured' });
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'RideWise Pro <noreply@ridewise.com>',
            to: userEmail,
            subject: '🚗 Your RideWise Ride Search Results',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; background-color: #0b1120; color: #fff; padding: 20px; }
                        .container { max-width: 600px; margin: 0 auto; background: #161e2d; border-radius: 16px; padding: 30px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .header h1 { color: #3b82f6; margin: 0; }
                        .info-box { background: #0b1120; padding: 20px; border-radius: 12px; margin: 20px 0; }
                        .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
                        .label { color: #94a3b8; font-size: 14px; }
                        .value { color: #fff; font-weight: bold; }
                        .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🚗 RideWise Pro</h1>
                            <p>Your Ride Search Results</p>
                        </div>
                        
                        <p>Hi <strong>${userName}</strong>,</p>
                        <p>You just searched for a ride on RideWise. Here are the details:</p>
                        
                        <div class="info-box">
                            <div class="info-row">
                                <span class="label">📍 Pickup:</span>
                                <span class="value">${pickup}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">🎯 Dropoff:</span>
                                <span class="value">${dropoff}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">📏 Distance:</span>
                                <span class="value">${distance} km</span>
                            </div>
                            <div class="info-row">
                                <span class="label">⏱️ Duration:</span>
                                <span class="value">${duration}</span>
                            </div>
                        </div>
                        
                        <p>Compare prices across Rapido, Uber, and Namma Yatri to find the best deal!</p>
                        
                        <div class="footer">
                            <p>This is an automated email from RideWise Pro</p>
                            <p>You can disable notifications in Settings</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await emailTransporter.sendMail(mailOptions);
        console.log('✅ Notification email sent to:', userEmail);
        res.json({ msg: 'Notification sent successfully' });
        
    } catch (err) {
        console.error('❌ Email error:', err.message);
        // Don't fail the request if email fails
        res.json({ msg: 'Email notification failed', error: err.message });
    }
});

// Send profile update notification
app.post('/api/notifications/profile-update', async (req, res) => {
    try {
        const { userEmail, userName } = req.body;
        
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('📧 Email not configured - skipping notification');
            return res.json({ msg: 'Email notifications not configured' });
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'RideWise Pro <noreply@ridewise.com>',
            to: userEmail,
            subject: '✅ Profile Updated - RideWise Pro',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; background-color: #0b1120; color: #fff; padding: 20px; }
                        .container { max-width: 600px; margin: 0 auto; background: #161e2d; border-radius: 16px; padding: 30px; }
                        .success { background: #10b981; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1 style="color: #3b82f6;">🚗 RideWise Pro</h1>
                        <div class="success">
                            <h2 style="margin: 0;">✅ Profile Updated Successfully</h2>
                        </div>
                        <p>Hi <strong>${userName}</strong>,</p>
                        <p>Your RideWise profile has been updated successfully.</p>
                        <p>If you didn't make this change, please contact support immediately.</p>
                        <div style="text-align: center; margin-top: 30px; color: #64748b; font-size: 12px;">
                            <p>RideWise Pro - Bengaluru Ride Aggregator</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await emailTransporter.sendMail(mailOptions);
        console.log('✅ Profile update email sent to:', userEmail);
        res.json({ msg: 'Notification sent successfully' });
        
    } catch (err) {
        console.error('❌ Email error:', err.message);
        res.json({ msg: 'Email notification failed', error: err.message });
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
            const adjustedDurationMin = Math.round(baseDurationMin * combinedMultiplier);
            
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
        
        const categories = [
            {
                category: "Bike", icon: "🏍️",
                services: [
                    { name: "Rapido", type: "Bike Direct", base: 25, perKm: 7.3, minPerKm: 2.5, brand: "bg-yellow-500" },
                    { name: "Rapido", type: "Bike Saver", base: 20, perKm: 6.5, minPerKm: 2.6, brand: "bg-yellow-500" },
                    { name: "Uber", type: "Moto", base: 28, perKm: 9.5, minPerKm: 2.7, brand: "bg-black" }
                ]
            },
            {
                category: "Auto", icon: "🛺",
                services: [
                    { name: "Rapido", type: "Auto", base: 40, perKm: 13.4, minPerKm: 3.7, brand: "bg-yellow-500" },
                    { name: "Namma Yatri", type: "Auto", base: 40, perKm: 13.4, minPerKm: 3.6, brand: "bg-green-600" },
                    { name: "Uber", type: "Auto", base: 35, perKm: 13.0, minPerKm: 3.8, brand: "bg-black" }
                ]
            },
            {
                category: "Cab Economy", icon: "🚗",
                services: [
                    { name: "Rapido", type: "Non-AC Cab", base: 55, perKm: 15.6, minPerKm: 3.8, brand: "bg-yellow-500" },
                    { name: "Namma Yatri", type: "Non-AC Cab", base: 65, perKm: 20.0, minPerKm: 3.8, brand: "bg-green-600" },
                    { name: "Uber", type: "Go Non-AC", base: 58, perKm: 20.3, minPerKm: 3.8, brand: "bg-black" }
                ]
            },
            {
                category: "Cab AC", icon: "🚕",
                services: [
                    { name: "Rapido", type: "AC Cab", base: 60, perKm: 17.4, minPerKm: 3.8, brand: "bg-yellow-500" },
                    { name: "Namma Yatri", type: "AC Cab", base: 65, perKm: 22.0, minPerKm: 3.8, brand: "bg-green-600" },
                    { name: "Uber", type: "Go (AC)", base: 62, perKm: 20.7, minPerKm: 3.8, brand: "bg-black" }
                ]
            },
            {
                category: "Premium", icon: "✨",
                services: [
                    { name: "Rapido", type: "Cab Premium", base: 80, perKm: 21.7, minPerKm: 3.7, brand: "bg-yellow-500" },
                    { name: "Namma Yatri", type: "Sedan Premium", base: 90, perKm: 25.0, minPerKm: 3.7, brand: "bg-green-600" },
                    { name: "Uber", type: "Go Priority", base: 78, perKm: 23.2, minPerKm: 3.7, brand: "bg-black" },
                    { name: "Uber", type: "Premier", base: 85, perKm: 25.4, minPerKm: 3.7, brand: "bg-black" }
                ]
            },
            {
                category: "XL / Large", icon: "🚙",
                services: [
                    { name: "Rapido", type: "XL Cab", base: 100, perKm: 27.7, minPerKm: 4.0, brand: "bg-yellow-500" },
                    { name: "Namma Yatri", type: "XL Cab", base: 110, perKm: 29.0, minPerKm: 4.0, brand: "bg-green-600" },
                    { name: "Uber", type: "UberXL", base: 123, perKm: 33.1, minPerKm: 4.0, brand: "bg-black" }
                ]
            }
        ];

        const results = categories.map(cat => ({
            ...cat,
            services: cat.services.map(s => {
                // Base fare + per km charge
                const baseFare = s.base + (distanceKm * s.perKm);
                
                // Apply surge pricing during peak traffic
                const surgedFare = baseFare * surgeFactor;
                
                // Add platform fee and round
                const totalPrice = Math.round(surgedFare + platformFee);
                
                const estimatedTime = Math.round(distanceKm * s.minPerKm);
                
                return {
                    ...s,
                    price: totalPrice,
                    estimatedTime: `${estimatedTime} mins`
                };
            }).sort((a, b) => a.price - b.price)
        }));

        console.log(`💰 Real-world pricing: Traffic=${trafficMultiplier.toFixed(2)}x | Surge=${surgeFactor === 1.0 ? 'None' : '+15%'} | Distance=${distanceKm.toFixed(2)}km`);

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