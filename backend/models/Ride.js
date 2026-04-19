const mongoose = require('mongoose');

const RideSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
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
    distance: Number,
    searchedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Ride', RideSchema);