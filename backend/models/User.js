const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    photo: { type: String },
    isAdmin: { type: Boolean, default: false },
    rideCount: { type: Number, default: 0 },
    favorites: [{
        label: String,
        name: String,
        lat: Number,
        lon: Number,
        icon: String
    }],
    recentSearches: [{
        pickup: {
            name: String,
            lat: Number,
            lon: Number
        },
        dropoff: {
            name: String,
            lat: Number,
            lon: Number
        },
        timestamp: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);