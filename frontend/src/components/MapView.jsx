import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon issue with Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const pickupIcon = new L.DivIcon({
  html: '<div style="background-color: #10b981; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white;"></div>',
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const dropoffIcon = new L.DivIcon({
  html: '<div style="background-color: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white;"></div>',
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// Component to auto-fit map bounds
function MapBounds({ pickup, dropoff, routeCoords }) {
  const map = useMap();
  
  useEffect(() => {
    if (routeCoords && routeCoords.length > 0) {
      const bounds = L.latLngBounds(routeCoords);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (pickup && dropoff) {
      const bounds = L.latLngBounds([
        [pickup.lat, pickup.lon],
        [dropoff.lat, dropoff.lon]
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, pickup, dropoff, routeCoords]);
  
  return null;
}

// Component to handle map clicks
function MapClickHandler({ onMapClick, mapPickMode }) {
  useMapEvents({
    click(e) {
      if (mapPickMode && onMapClick) {
        console.log('Map clicked:', e.latlng.lat, e.latlng.lng, 'Mode:', mapPickMode);
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
}

export default function MapView({ pickup, dropoff, onMapClick, mapPickMode }) {
  const [routeCoords, setRouteCoords] = useState([]);

  useEffect(() => {
    if (pickup && dropoff) {
      // Fetch route from OSRM (Open Source Routing Machine) - 100% FREE!
      const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lon},${pickup.lat};${dropoff.lon},${dropoff.lat}?overview=full&geometries=geojson`;
      
      fetch(url)
        .then(res => res.json())
        .then(data => {
          if (data.routes && data.routes[0]) {
            // Convert OSRM coordinates to Leaflet format [lat, lon]
            const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            setRouteCoords(coords);
            console.log('✅ OSRM Route loaded (FREE alternative to Google Directions!)');
          }
        })
        .catch(err => console.error('OSRM Route Error:', err));
    }
  }, [pickup, dropoff]);

  const center = pickup ? [pickup.lat, pickup.lon] : [12.9716, 77.5946];

  return (
    <div className="rounded-[32px] overflow-hidden border-2 border-slate-800 shadow-2xl relative">
      {mapPickMode && (
        <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-center py-3 z-[1000] font-bold text-sm shadow-lg animate-pulse flex items-center justify-center gap-2">
          <span>🎯 Click anywhere on the map to select {mapPickMode} location</span>
        </div>
      )}
      
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ width: '100%', height: '350px', cursor: mapPickMode ? 'crosshair' : 'grab' }}
        zoomControl={true}
        dragging={mapPickMode ? true : false}
        touchZoom={true}
        doubleClickZoom={true}
        scrollWheelZoom={true}
        boxZoom={false}
        keyboard={mapPickMode ? true : false}
        tap={mapPickMode ? true : false}
      >
        {/* Dark Mode OpenStreetMap Tiles - 100% FREE! */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Map click handler */}
        <MapClickHandler onMapClick={onMapClick} mapPickMode={mapPickMode} />

        {/* Draw route polyline */}
        {routeCoords.length > 0 && (
          <Polyline 
            positions={routeCoords} 
            color="#3b82f6" 
            weight={5}
            opacity={0.8}
          />
        )}

        {/* Pickup marker */}
        {pickup && (
          <Marker position={[pickup.lat, pickup.lon]} icon={pickupIcon}>
            <Popup>{pickup.name || 'Pickup Location'}</Popup>
          </Marker>
        )}

        {/* Dropoff marker */}
        {dropoff && (
          <Marker position={[dropoff.lat, dropoff.lon]} icon={dropoffIcon}>
            <Popup>{dropoff.name || 'Drop-off Location'}</Popup>
          </Marker>
        )}

        {/* Auto-fit bounds */}
        <MapBounds pickup={pickup} dropoff={dropoff} routeCoords={routeCoords} />
      </MapContainer>
      
      <div className="absolute top-4 left-4 bg-[#0b1120]/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700 z-[1000]">
        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Free OpenStreetMap Route</p>
      </div>
    </div>
  );
}