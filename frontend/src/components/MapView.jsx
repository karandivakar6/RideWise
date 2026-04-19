import React, { useEffect, useState } from 'react';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';

const mapContainerStyle = { width: '100%', height: '350px' };
const mapStyles = [
  { "elementType": "geometry", "stylers": [{ "color": "#1d2c4d" }] },
  { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#304a7d" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0e1626" }] }
];

export default function MapView({ pickup, dropoff }) {
  const [map, setMap] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);

  useEffect(() => {
    if (pickup && dropoff && window.google) {
      const directionsService = new window.google.maps.DirectionsService();
      
      directionsService.route(
        {
          origin: new window.google.maps.LatLng(pickup.lat, pickup.lon),
          destination: new window.google.maps.LatLng(dropoff.lat, dropoff.lon),
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirectionsResponse(result);
          } else {
            console.error(`Error fetching directions: ${status}`);
          }
        }
      );
    }
  }, [pickup, dropoff]);

  const center = pickup ? { lat: pickup.lat, lng: pickup.lon } : { lat: 12.9716, lng: 77.5946 };

  return (
    <div className="rounded-[32px] overflow-hidden border-2 border-slate-800 shadow-2xl relative">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={13}
        onLoad={m => setMap(m)}
        options={{ styles: mapStyles, disableDefaultUI: true }}
      >
        {/* Draw actual road route if available */}
        {directionsResponse && (
          <DirectionsRenderer 
            directions={directionsResponse} 
            options={{
              polylineOptions: { strokeColor: '#3b82f6', strokeWeight: 5 },
              suppressMarkers: true // We use our own custom markers below
            }}
          />
        )}

        {/* Custom Markers */}
        {pickup && <Marker position={{ lat: pickup.lat, lng: pickup.lon }} icon={{ path: window.google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: "#10b981", fillOpacity: 1, strokeWeight: 2, strokeColor: "#ffffff" }} />}
        {dropoff && <Marker position={{ lat: dropoff.lat, lng: dropoff.lon }} icon={{ path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW, scale: 5, fillColor: "#ef4444", fillOpacity: 1, strokeWeight: 2, strokeColor: "#ffffff" }} />}
      </GoogleMap>
      
      <div className="absolute top-4 left-4 bg-[#0b1120]/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700">
        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Live Traffic Route</p>
      </div>
    </div>
  );
}