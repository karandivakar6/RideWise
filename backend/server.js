const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Models
const User = require('./models/User');
const Ride = require('./models/Ride');

// 1. THIS IS THE LINE THAT WAS MISSING!
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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
        res.json({ token, user: { id: user._id, name, email } });
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
        res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
        
    } catch (err) { 
        // 3. Print the EXACT error to your backend terminal
        console.error("🔥 LOGIN CRASH:", err); 
        res.status(500).json({ msg: "Login server error" }); 
    }
});

// --- LIVE DISTANCE MATRIX FARE ENGINE (WITH FALLBACK) ---

// Mathematical fallback if Google API fails
const calculateFallbackDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

app.post('/api/fares', async (req, res) => {
    const { pickup, dropoff, userId } = req.body;
    if (!pickup || !dropoff) return res.status(400).json({ msg: "Invalid locations" });
    
    let distanceKm = 0;
    let durationText = "";

    try {
        // 1. TRY GOOGLE DISTANCE MATRIX FIRST
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${pickup.lat},${pickup.lon}&destinations=${dropoff.lat},${dropoff.lon}&key=${apiKey}`;
        
        const matrixRes = await fetch(url);
        const matrixData = await matrixRes.json();

        // Check if Google actually gave us a valid road route
        if (matrixData?.rows?.[0]?.elements?.[0]?.status === "OK") {
            distanceKm = matrixData.rows[0].elements[0].distance.value / 1000; 
            durationText = matrixData.rows[0].elements[0].duration.text;
            console.log(`✅ Google Matrix Used: ${distanceKm}km`);
        } else {
            throw new Error("Google API rejected the request or returned ZERO_RESULTS");
        }

    } catch (error) {
        // 2. FALLBACK TO MATH IF GOOGLE FAILS
        console.log("⚠️ Google API Failed, using Math Fallback. Reason:", error.message);
        
        distanceKm = calculateFallbackDistance(pickup.lat, pickup.lon, dropoff.lat, dropoff.lon);
        // Simulate duration (roughly 3 mins per km in Bengaluru + 2 mins wait)
        const estMins = Math.round((distanceKm * 3) + 2);
        durationText = `${estMins} mins (Est.)`;
    }

    try {
        // 3. Calculate Fares based on the distance
        const categories = [
            {
                category: "Auto", icon: "🛺",
                services: [
                    { name: "Rapido", type: "Auto", base: 30, perKm: 11, brand: "bg-yellow-500" },
                    { name: "Namma Yatri", type: "Auto", base: 25, perKm: 10, brand: "bg-green-600" },
                    { name: "Uber", type: "Auto", base: 35, perKm: 12, brand: "bg-black" }
                ]
            },
            {
                category: "Bike", icon: "🏍️",
                services: [
                    { name: "Rapido", type: "Bike Direct", base: 15, perKm: 7, brand: "bg-yellow-500" },
                    { name: "Uber", type: "Moto", base: 20, perKm: 8, brand: "bg-black" }
                ]
            },
            {
                category: "Cab Economy", icon: "🚗",
                services: [
                    { name: "Rapido", type: "Cab Non AC", base: 50, perKm: 15, brand: "bg-yellow-500" },
                    { name: "Uber", type: "UberGo", base: 60, perKm: 18, brand: "bg-black" }
                ]
            }
        ];

        const results = categories.map(cat => ({
            ...cat,
            services: cat.services.map(s => ({
                ...s,
                price: Math.round(s.base + (distanceKm * s.perKm)),
            })).sort((a, b) => a.price - b.price)
        }));

        // Optional: Save the ride to the database if the user is logged in
        if (userId) {
             const newRide = new Ride({ userId, pickup, dropoff, distance: parseFloat(distanceKm.toFixed(2)) });
             await newRide.save();
        }

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

app.listen(PORT, () => console.log(`🚀 Server cruising on port ${PORT}`));