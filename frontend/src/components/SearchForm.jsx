import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';

export default function SearchForm({ onSearch }) {
  const [pQuery, setPQuery] = useState('');
  const [dQuery, setDQuery] = useState('');
  const [pResults, setPResults] = useState([]);
  const [dResults, setDResults] = useState([]);

  // Bengaluru Bounding Box for Photon
  const BBOX = "77.4601,12.8340,77.8170,13.1437";

  const fetchSuggestions = async (query, type) => {
    if (query.length < 3) return;
    try {
      // Photon is a free, open-source search engine. No billing required!
      const res = await fetch(`https://photon.komoot.io/api/?q=${query}&limit=5&bbox=${BBOX}`);
      const data = await res.json();
      if (data.features) {
        if (type === 'p') setPResults(data.features);
        else setDResults(data.features);
      }
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  const handleSelect = (feature, type) => {
    const [lon, lat] = feature.geometry.coordinates;
    const name = feature.properties.name + (feature.properties.street ? `, ${feature.properties.street}` : '');
    const coords = { lat, lon, name };
    
    if (type === 'p') {
      setPQuery(name); setPResults([]); window.tempPickup = coords;
    } else {
      setDQuery(name); setDResults([]); window.tempDropoff = coords;
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-500 rounded-full"></div>
        <input 
          value={pQuery} 
          onChange={(e) => { setPQuery(e.target.value); fetchSuggestions(e.target.value, 'p'); }}
          placeholder="Pickup Location (Bengaluru)" 
          className="w-full bg-[#161e2d] border border-slate-800 p-4 pl-10 rounded-2xl outline-none focus:border-blue-500 text-sm text-white" 
        />
        {pResults.length > 0 && (
          <div className="absolute z-[9999] w-full bg-[#1c263b] border border-slate-700 mt-2 rounded-2xl shadow-2xl overflow-hidden">
            {pResults.map((s, i) => (
              <div key={i} onClick={() => handleSelect(s, 'p')} className="p-4 text-xs text-slate-300 hover:bg-blue-600 cursor-pointer flex items-center gap-3 border-b border-slate-800 last:border-0">
                <MapPin size={12} className="text-slate-500" /> {s.properties.name}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-rose-500 rounded-full"></div>
        <input 
          value={dQuery} 
          onChange={(e) => { setDQuery(e.target.value); fetchSuggestions(e.target.value, 'd'); }}
          placeholder="Drop-off Location" 
          className="w-full bg-[#161e2d] border border-slate-800 p-4 pl-10 rounded-2xl outline-none focus:border-blue-500 text-sm text-white" 
        />
        {dResults.length > 0 && (
          <div className="absolute z-[9999] w-full bg-[#1c263b] border border-slate-700 mt-2 rounded-2xl shadow-2xl overflow-hidden">
            {dResults.map((s, i) => (
              <div key={i} onClick={() => handleSelect(s, 'd')} className="p-4 text-xs text-slate-300 hover:bg-blue-600 cursor-pointer flex items-center gap-3 border-b border-slate-800 last:border-0">
                <MapPin size={12} className="text-slate-500" /> {s.properties.name}
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => onSearch(window.tempPickup, window.tempDropoff)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl transition-all shadow-lg shadow-blue-600/20 uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2">
        <Search size={14} /> Get Fare Estimates
      </button>
    </div>
  );
}