// =============================================================================
// Deterministic, pure replica of the fare logic in ../server.js (POST /api/fares)
// -----------------------------------------------------------------------------
// This module exists ONLY for unit testing. It lets us exercise the exact
// pricing formulas WITHOUT starting the Express server, touching MongoDB, or
// making the live OSRM network call.
//
// It mirrors three things from server.js:
//   1. calculateFallbackDistance  -> haversineDistanceKm
//   2. getTrafficMultiplier       -> getTrafficMultiplier(now)  (clock injected)
//   3. the inline fare formulas   -> calculateFares(...)
//
// IMPORTANT: If you change the pricing tables or formulas in server.js, mirror
// the change here so the tests keep reflecting real behaviour.
// =============================================================================

// Same-location threshold used by the client (App.jsx) and by the backend
// guard. ~0.001 degrees ≈ 111 metres.
const SAME_LOCATION_THRESHOLD = 0.001;

/**
 * Mirrors the same-location validation done on the clients and in the backend
 * guard. Returns true when pickup and dropoff are effectively the same point.
 */
function isSameLocation(pickup, dropoff) {
  const latDiff = Math.abs(pickup.lat - dropoff.lat);
  const lonDiff = Math.abs(pickup.lon - dropoff.lon);
  return latDiff < SAME_LOCATION_THRESHOLD && lonDiff < SAME_LOCATION_THRESHOLD;
}

/**
 * Haversine great-circle distance in km.
 * Exact mirror of calculateFallbackDistance() in server.js.
 */
function haversineDistanceKm(pickup, dropoff) {
  const R = 6371; // km
  const dLat = (dropoff.lat - pickup.lat) * (Math.PI / 180);
  const dLon = (dropoff.lon - pickup.lon) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(pickup.lat * (Math.PI / 180)) *
      Math.cos(dropoff.lat * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Bengaluru traffic multiplier. Exact mirror of getTrafficMultiplier() in
 * server.js, except the clock is injected so tests are deterministic.
 * @param {Date} now
 */
function getTrafficMultiplier(now) {
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
  if (hour >= 5 && hour < 7) return 1.1; // Early morning

  if (hour >= 7 && hour < 10) { // Morning peak
    if (hour === 8 || hour === 9) return 2.1;
    return 1.8;
  }

  if (hour >= 10 && hour < 16) { // Late morning -> early afternoon
    if (hour >= 12 && hour <= 14) return 1.4; // Lunch hour spike
    return 1.25;
  }

  if (hour >= 16 && hour < 21) { // Evening peak
    if (hour >= 17 && hour <= 20) {
      if ((hour === 17 && minute >= 30) || hour === 18 || hour === 19 || (hour === 20 && minute <= 30)) {
        return 2.5;
      }
      return 2.2;
    }
    return 1.9;
  }

  if (hour >= 21 || hour < 5) return 1.0; // Night

  return 1.3; // Default
}

// Free-flow city speed used as the fare's time basis (mirror of server.js).
const FREE_FLOW_SPEED_KMPH = 22;

/**
 * Traffic-aware ETA shown to the user. Mirror of the OSRM-fallback ETA in
 * server.js: the effective speed is floored at 12 km/h so heavy-traffic
 * estimates stay realistic. NOTE: this is display-only and no longer feeds the
 * fare — see freeFlowDurationMin().
 */
function estimateDurationMin(distanceKm, trafficMultiplier) {
  const etaSpeed = Math.max(20 / trafficMultiplier, 12);
  return Math.round((distanceKm / etaSpeed) * 60);
}

/**
 * Free-flow trip time that the FARE is billed on. Mirror of server.js
 * `fareDurationMin` (fallback branch: distanceKm / FREE_FLOW_SPEED_KMPH).
 * Peak-hour cost is applied via the surge factor in calculateFares, NOT by
 * inflating this minute count with traffic.
 */
function freeFlowDurationMin(distanceKm) {
  return Math.max(1, Math.round((distanceKm / FREE_FLOW_SPEED_KMPH) * 60));
}

// Exact copy of the category/service pricing tables from server.js.
const CATEGORIES = [
  {
    category: 'Bike', icon: '🏍️',
    services: [
      { name: 'Rapido', type: 'Bike Direct', algorithm: 'rapido', base: 20, perKm: 7.5, perMin: 1, brand: 'bg-yellow-500' },
      { name: 'Rapido', type: 'Bike Saver', algorithm: 'rapido', base: 18, perKm: 7, perMin: 0.9, brand: 'bg-yellow-500' },
      { name: 'Uber', type: 'Moto', algorithm: 'uber', base: 22, perKm: 7, perMin: 1.1, brand: 'bg-black' },
    ],
  },
  {
    category: 'Auto', icon: '🛺',
    services: [
      { name: 'Rapido', type: 'Auto', algorithm: 'rapido', base: 40, perKm: 14, perMin: 1.3, brand: 'bg-yellow-500' },
      { name: 'Namma Yatri', type: 'Auto', algorithm: 'nammayatri', base: 30, perKm: 15, perMin: 1.4, brand: 'bg-green-600' },
      { name: 'Uber', type: 'Auto', algorithm: 'uber', base: 40, perKm: 13.5, perMin: 1.5, brand: 'bg-black' },
    ],
  },
  {
    category: 'Cab Economy', icon: '🚗',
    services: [
      { name: 'Rapido', type: 'Non-AC Cab', algorithm: 'rapido', base: 70, perKm: 12.5, perMin: 1.6, brand: 'bg-yellow-500' },
      { name: 'Namma Yatri', type: 'Non-AC Cab', algorithm: 'nammayatri', base: 65, perKm: 13.4, perMin: 1.8, brand: 'bg-green-600' },
      { name: 'Uber', type: 'Go Non-AC', algorithm: 'uber', base: 68, perKm: 10.7, perMin: 1.5, brand: 'bg-black' },
    ],
  },
  {
    category: 'Cab AC', icon: '🚕',
    services: [
      { name: 'Rapido', type: 'AC Cab', algorithm: 'rapido', base: 85, perKm: 13, perMin: 1.8, brand: 'bg-yellow-500' },
      { name: 'Namma Yatri', type: 'AC Cab', algorithm: 'nammayatri', base: 80, perKm: 15, perMin: 2.0, brand: 'bg-green-600' },
      { name: 'Uber', type: 'Go (AC)', algorithm: 'uber', base: 82, perKm: 12, perMin: 1.7, brand: 'bg-black' },
    ],
  },
  {
    category: 'Premium', icon: '✨',
    services: [
      { name: 'Rapido', type: 'Cab Premium', algorithm: 'rapido', base: 110, perKm: 14.8, perMin: 2.0, brand: 'bg-yellow-500' },
      { name: 'Namma Yatri', type: 'Sedan Premium', algorithm: 'nammayatri', base: 105, perKm: 17.8, perMin: 2.3, brand: 'bg-green-600' },
      { name: 'Uber', type: 'Go Priority', algorithm: 'uber', base: 108, perKm: 15.5, perMin: 2.0, brand: 'bg-black' },
      { name: 'Uber', type: 'Premier', algorithm: 'uber', base: 125, perKm: 16.7, perMin: 2.4, brand: 'bg-black' },
    ],
  },
  {
    category: 'XL / Large', icon: '🚙',
    services: [
      { name: 'Rapido', type: 'XL Cab', algorithm: 'rapido', base: 145, perKm: 14.6, perMin: 1.9, brand: 'bg-yellow-500' },
      { name: 'Namma Yatri', type: 'XL Cab', algorithm: 'nammayatri', base: 140, perKm: 20.5, perMin: 2.7, brand: 'bg-green-600' },
      { name: 'Uber', type: 'UberXL', algorithm: 'uber', base: 148, perKm: 17.4, perMin: 2.3, brand: 'bg-black' },
    ],
  },
];

/**
 * Compute fares for every category/service given a distance, duration and clock.
 * Exact mirror of the per-provider formulas in server.js.
 * @param {{distanceKm:number, durationMin:number, now:Date}} params
 * @returns categories array with a `price` on each service (sorted ascending).
 */
function calculateFares({ distanceKm, durationMin, now }) {
  const hour = now.getHours();
  const isPeakHour = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
  const isNightTime = hour >= 22 || hour < 6;

  return CATEGORIES.map(cat => ({
    category: cat.category,
    icon: cat.icon,
    services: cat.services
      .map(s => {
        let totalPrice;

        if (s.algorithm === 'uber') {
          const baseFare = s.base + distanceKm * s.perKm + durationMin * s.perMin;
          const surgeFactor = isPeakHour ? 1.1 : 1.0;
          totalPrice = Math.round(baseFare * surgeFactor);
        } else if (s.algorithm === 'rapido') {
          const baseFare = s.base + distanceKm * s.perKm + durationMin * s.perMin;
          const peakMultiplier = isPeakHour ? 1.02 : 1.0;
          totalPrice = Math.round(baseFare * peakMultiplier);
        } else if (s.algorithm === 'nammayatri') {
          const meterFare = s.base + distanceKm * s.perKm + durationMin * s.perMin;
          const nightCharge = isNightTime ? 50 : 0;
          totalPrice = Math.round((meterFare + nightCharge) / 5) * 5;
        } else {
          totalPrice = Math.round(s.base + distanceKm * s.perKm + durationMin * s.perMin);
        }

        return { ...s, price: totalPrice };
      })
      .sort((a, b) => a.price - b.price),
  }));
}

/**
 * Full offline pipeline used by the tests: distance + fallback duration + fares.
 * Mirrors the server.js OSRM-failed fallback path, except the distance can be
 * overridden with a known real-world road distance (what OSRM would return in
 * production) instead of the straight-line haversine estimate.
 * @param {{lat:number, lon:number}} pickup
 * @param {{lat:number, lon:number}} dropoff
 * @param {Date} now
 * @param {number} [overrideDistanceKm] real road distance in km; falls back to haversine
 */
function computeFaresForRoute(pickup, dropoff, now, overrideDistanceKm, overrideDurationMin) {
  const distanceKm = (typeof overrideDistanceKm === 'number')
    ? overrideDistanceKm
    : haversineDistanceKm(pickup, dropoff);
  const traffic = getTrafficMultiplier(now);
  const etaMin = estimateDurationMin(distanceKm, traffic); // display ETA only
  // Fare time basis mirrors server.js: in production this is OSRM's free-flow
  // base duration (fed here via overrideDurationMin); the distance/22 estimate
  // is only the OSRM-unavailable fallback.
  const durationMin = (typeof overrideDurationMin === 'number')
    ? overrideDurationMin
    : freeFlowDurationMin(distanceKm);
  const categories = calculateFares({ distanceKm, durationMin, now });
  return { distanceKm, durationMin, etaMin, traffic, categories };
}

module.exports = {
  SAME_LOCATION_THRESHOLD,
  isSameLocation,
  haversineDistanceKm,
  getTrafficMultiplier,
  estimateDurationMin,
  freeFlowDurationMin,
  calculateFares,
  computeFaresForRoute,
  CATEGORIES,
  FREE_FLOW_SPEED_KMPH,
};
