// =============================================================================
// Approximate Bengaluru coordinates for the test locations.
// -----------------------------------------------------------------------------
// These are best-effort landmark coordinates. The generated fares depend on the
// straight-line (haversine) distance between two points, so if you need exact
// fares, refine these lat/lon values to the precise pickup/drop points you used.
// =============================================================================

module.exports = {
  pyramidTempleBells: { name: 'Pyramid Temple Bells', lat: 12.9350, lon: 77.5230 },
  orionMall: { name: 'Orion Mall (Brigade Gateway)', lat: 13.0108, lon: 77.5550 },

  goldenHeights: { name: 'Golden Heights, Rajajinagar', lat: 12.9970, lon: 77.5535 },
  mantriSquareMall: { name: 'Mantri Square Mall, Malleshwaram', lat: 12.9912, lon: 77.5708 },

  pesUniversity: { name: 'PES University (Ring Road Campus)', lat: 12.9347, lon: 77.5354 },
  rrNagarTemple: { name: 'Shri Rajarajeshwari Nagar Temple', lat: 12.9279, lon: 77.5190 },

  kleUniversityRajajinagar: { name: 'KLE Societys Degree, Rajajinagar', lat: 12.9912, lon: 77.5500 },
  vidyaranyapuraPostOffice: { name: 'Vidyaranyapura Post Office', lat: 13.0760, lon: 77.5560 },

  cubbonPark: { name: 'Cubbon Park', lat: 12.9763, lon: 77.5929 },
  lalbaghGarden: { name: 'Lalbagh Botanical Garden', lat: 12.9507, lon: 77.5848 },
};
