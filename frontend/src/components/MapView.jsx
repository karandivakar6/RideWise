import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getTranslation } from '../utils/translations';

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
function MapBounds({ pickup, dropoff, routeCoords, mapPickMode }) {
  const map = useMap();
  
  useEffect(() => {
    // When in pick mode, center on existing location or default
    if (mapPickMode === 'dropoff' && pickup) {
      // Picking dropoff, center on pickup
      map.setView([pickup.lat, pickup.lon], 13);
    } else if (mapPickMode === 'pickup') {
      // Picking pickup, center on Bangalore
      map.setView([12.9716, 77.5946], 12);
    } else if (routeCoords && routeCoords.length > 0) {
      // Normal mode with route
      const bounds = L.latLngBounds(routeCoords);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (pickup && dropoff) {
      // Normal mode with both locations
      const bounds = L.latLngBounds([
        [pickup.lat, pickup.lon],
        [dropoff.lat, dropoff.lon]
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, pickup, dropoff, routeCoords, mapPickMode]);
  
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

export default function MapView({ pickup, dropoff, onMapClick, mapPickMode, language = 'en' }) {
  const [routeCoords, setRouteCoords] = useState([]);
  const t = (key) => getTranslation(key, language);

  useEffect(() => {
    // Clear route when in map pick mode
    if (mapPickMode) {
      setRouteCoords([]);
      return;
    }
    
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
    } else {
      // Clear route if either location is missing
      setRouteCoords([]);
    }
  }, [pickup, dropoff, mapPickMode]);

  const center = pickup ? [pickup.lat, pickup.lon] : [12.9716, 77.5946];

  return (
    <div className="rounded-[32px] overflow-hidden border-2 border-slate-800 shadow-2xl relative">
      {mapPickMode && (
        <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-center py-2 px-4 z-[1000] font-bold text-sm shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 justify-center">
            <span className="animate-pulse">🎯</span>
            <span>{t('clickToSelect')} {mapPickMode} {t('location')}</span>
          </div>
        </div>
      )}
      
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ width: '100%', height: '350px', cursor: mapPickMode ? 'crosshair' : 'grab' }}
        zoomControl={true}
        dragging={true}
        touchZoom={true}
        doubleClickZoom={true}
        scrollWheelZoom={true}
        boxZoom={false}
        keyboard={true}
        tap={true}
      >
        {/* Dark Mode OpenStreetMap Tiles - 100% FREE! */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Map click handler */}
        <MapClickHandler onMapClick={onMapClick} mapPickMode={mapPickMode} />

        {/* Draw route polyline - only when NOT in pick mode */}
        {routeCoords.length > 0 && !mapPickMode && (
          <Polyline 
            positions={routeCoords} 
            color="#3b82f6" 
            weight={5}
            opacity={0.8}
          />
        )}

        {/* Pickup marker - only show when NOT in pick mode or when picking dropoff */}
        {pickup && (!mapPickMode || mapPickMode === 'dropoff') && (
          <Marker position={[pickup.lat, pickup.lon]} icon={pickupIcon}>
            <Popup>{pickup.name || t('pickupLocation')}</Popup>
          </Marker>
        )}

        {/* Dropoff marker - only show when NOT in pick mode or when picking pickup */}
        {dropoff && (!mapPickMode || mapPickMode === 'pickup') && (
          <Marker position={[dropoff.lat, dropoff.lon]} icon={dropoffIcon}>
            <Popup>{dropoff.name || t('dropoffLocation')}</Popup>
          </Marker>
        )}

        {/* Auto-fit bounds */}
        <MapBounds pickup={pickup} dropoff={dropoff} routeCoords={routeCoords} mapPickMode={mapPickMode} />
      </MapContainer>
      
      <div className="absolute top-4 left-4 bg-[#0b1120]/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700 z-[1000]">
        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Free OpenStreetMap Route</p>
      </div>
    </div>
  );
}