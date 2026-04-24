import React, { useState, useEffect } from 'react';
import { Search, MapPin, Navigation, ArrowDownUp, Building2, Locate, Map } from 'lucide-react';
import { soundManager } from '../utils/soundEffects';
import { getTranslation } from '../utils/translations';

export default function SearchForm({ onSearch, mapPickMode, setMapPickMode, darkMode, language = 'en' }) {
  const t = (key) => getTranslation(key, language);
  const [pQuery, setPQuery] = useState('');
  const [dQuery, setDQuery] = useState('');
  const [pResults, setPResults] = useState([]);
  const [dResults, setDResults] = useState([]);
  const [focusedInput, setFocusedInput] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Bengaluru Bounding Box for Photon
  const BBOX = "77.4601,12.8340,77.8170,13.1437";

  // Update input when location is picked from map
  useEffect(() => {
    console.log('mapPickMode changed:', mapPickMode);
    console.log('tempPickup:', window.tempPickup, 'lastPickup:', window.lastPickup);
    console.log('tempDropoff:', window.tempDropoff, 'lastDropoff:', window.lastDropoff);
    
    if (mapPickMode === null && window.tempPickup && window.tempPickup !== window.lastPickup) {
      console.log('Updating pickup query to:', window.tempPickup.name);
      setPQuery(window.tempPickup.name);
      window.lastPickup = window.tempPickup;
    }
    if (mapPickMode === null && window.tempDropoff && window.tempDropoff !== window.lastDropoff) {
      console.log('Updating dropoff query to:', window.tempDropoff.name);
      setDQuery(window.tempDropoff.name);
      window.lastDropoff = window.tempDropoff;
    }
    
    // Scroll to map when pick mode is activated
    if (mapPickMode !== null) {
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  }, [mapPickMode]);

  // Try to get current location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      setLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
          setLoadingLocation(false);
        },
        (error) => {
          console.log('Location permission denied or unavailable');
          setLoadingLocation(false);
        },
        { timeout: 5000 }
      );
    }
  }, []);

  const fetchSuggestions = async (query, type) => {
    if (query.length < 2) {
      if (type === 'p') setPResults([]);
      else setDResults([]);
      return;
    }
    try {
      const encodedQuery = encodeURIComponent(query);
      
      // Photon API - CORS-enabled, free geocoding
      const photonUrl = `https://photon.komoot.io/api/?q=${encodedQuery}&limit=8&bbox=${BBOX}&lang=en`;
      const photonRes = await fetch(photonUrl);
      const photonData = await photonRes.json();
      
      const features = photonData.features || [];
      
      if (type === 'p') setPResults(features);
      else setDResults(features);
      
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  const handleSelect = (feature, type) => {
    const [lon, lat] = feature.geometry.coordinates;
    const props = feature.properties;
    
    // Build clear, readable name
    let name = props.name || '';
    
    // Add area context if available
    if (props.suburb && name !== props.suburb) {
      name = name ? `${name}, ${props.suburb}` : props.suburb;
    } else if (props.district && name !== props.district) {
      name = name ? `${name}, ${props.district}` : props.district;
    }
    
    // If still no name, use street
    if (!name && props.street) {
      name = props.street;
    }
    
    // Fallback
    if (!name) {
      name = 'Selected Location';
    }
    
    const coords = { lat, lon, name };
    
    if (type === 'p') {
      setPQuery(name); 
      setPResults([]); 
      window.tempPickup = coords;
      setFocusedInput(null);
    } else {
      setDQuery(name); 
      setDResults([]); 
      window.tempDropoff = coords;
      setFocusedInput(null);
    }
  };

  const handleSwap = () => {
    const tempQuery = pQuery;
    const tempCoords = window.tempPickup;
    
    setPQuery(dQuery);
    setDQuery(tempQuery);
    window.tempPickup = window.tempDropoff;
    window.tempDropoff = tempCoords;
  };

  const useCurrentLocation = () => {
    // Check if location sharing is enabled
    const locationSharingEnabled = JSON.parse(localStorage.getItem('settings_locationSharing') || 'true');
    if (!locationSharingEnabled) {
      alert(t('locationDisabled'));
      return;
    }
    
    if (currentLocation) {
      // Use already fetched location
      const coords = {
        lat: currentLocation.lat,
        lon: currentLocation.lon,
        name: 'Current Location'
      };
      setPQuery('Current Location');
      window.tempPickup = coords;
      setPResults([]);
      setFocusedInput(null);
    } else if (navigator.geolocation) {
      // Fetch location now
      setLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            name: 'Current Location'
          };
          setCurrentLocation({ lat: coords.lat, lon: coords.lon });
          setPQuery('Current Location');
          window.tempPickup = coords;
          setPResults([]);
          setFocusedInput(null);
          setLoadingLocation(false);
        },
        (error) => {
          alert(t('unableToGetLocation'));
          setLoadingLocation(false);
        }
      );
    } else {
      alert(t('geoNotSupported'));
    }
  };

  const getLocationIcon = (feature) => {
    const type = feature.properties.type || feature.properties.osm_value;
    const props = feature.properties;
    
    // Check for residential/house addresses
    if (props.housenumber || type === 'house' || type === 'residential' || type === 'building') {
      return <Building2 size={16} className="text-blue-400" />;
    }
    if (type === 'station' || type === 'bus_stop' || type === 'subway' || type === 'railway') {
      return <MapPin size={16} className="text-purple-400" />;
    }
    if (props.street || type === 'street' || type === 'road') {
      return <MapPin size={16} className="text-emerald-400" />;
    }
    return <MapPin size={16} className="text-slate-400" />;
  };

  const formatSuggestion = (feature) => {
    const props = feature.properties;
    
    // Primary line - most specific identifier
    let mainText = '';
    
    if (props.name) {
      mainText = props.name;
    } else if (props.housenumber && props.street) {
      mainText = `${props.housenumber}, ${props.street}`;
    } else if (props.street) {
      mainText = props.street;
    } else {
      mainText = 'Location';
    }
    
    // Secondary line - area/district info
    const subParts = [];
    
    if (props.suburb) {
      subParts.push(props.suburb);
    } else if (props.district) {
      subParts.push(props.district);
    }
    
    if (props.postcode) {
      subParts.push(props.postcode);
    }
    
    // Add city
    const city = props.city || 'Bangalore';
    if (city !== mainText && !subParts.includes(city)) {
      subParts.push(city);
    }
    
    if (!subParts.includes('Karnataka')) {
      subParts.push('Karnataka');
    }
    
    const subText = subParts.filter(Boolean).join(', ') || 'Bangalore, Karnataka';
    
    return { mainText, subText };
  };

  return (
    <div className="relative">
      {/* Map Pick Mode Overlay - Cancel Button */}
      {mapPickMode && (
        <div className="fixed top-4 right-4 z-[10001] animate-in fade-in slide-in-from-top-5 duration-300">
          <button
            onClick={() => {
              console.log('Canceling map pick mode');
              setMapPickMode(null);
              soundManager.playClick();
            }}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl shadow-2xl flex items-center gap-2 transition-all uppercase"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            {t('cancelMapSelection')}
          </button>
        </div>
      )}
      
      {/* Connection Line between dots */}
      <div className="absolute left-[23px] top-[56px] w-[2px] h-[22px] bg-gradient-to-b from-emerald-500 via-slate-700 to-rose-500"></div>
      
      {/* Swap Button */}
      <button 
        onClick={handleSwap}
        className={`absolute right-3 top-[52px] z-10 p-2 rounded-full transition-all hover:scale-110 ${
          darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-200 hover:bg-slate-300'
        }`}
        title={t('swapLocations')}
      >
        <ArrowDownUp size={16} className={darkMode ? 'text-slate-300' : 'text-slate-700'} />
      </button>

      <div className="space-y-0">
        {/* Pickup Input */}
        <div className="relative">
          <div className={`absolute left-[17px] top-[20px] w-3 h-3 bg-emerald-500 rounded-full border-2 z-10 ${
            darkMode ? 'border-[#161e2d]' : 'border-white'
          } ${mapPickMode === 'pickup' ? 'animate-pulse ring-4 ring-emerald-500/50' : ''}`}></div>
          <input 
            value={pQuery} 
            onChange={(e) => { 
              setPQuery(e.target.value); 
              fetchSuggestions(e.target.value, 'p'); 
            }}
            onFocus={() => !mapPickMode && setFocusedInput('pickup')}
            placeholder={t('searchPickup')} 
            className={`w-full border-2 p-4 pl-12 pr-16 rounded-t-2xl outline-none text-sm transition-all ${
              mapPickMode === 'pickup' 
                ? 'ring-4 ring-emerald-500/30 border-emerald-500' 
                : darkMode 
                  ? 'bg-[#0e1623] border-slate-800/50 text-white placeholder-slate-600 focus:border-emerald-500/50' 
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
            }`} 
          />
          
          {/* Pickup Suggestions */}
          {focusedInput === 'pickup' && !mapPickMode && (
            <div className={`absolute z-[9999] w-full border-2 mt-[-2px] rounded-b-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${
              darkMode 
                ? 'bg-[#0e1623] border-emerald-500/30' 
                : 'bg-white border-emerald-500'
            }`}>
              {/* Current Location Option - Always First */}
              <div 
                onClick={useCurrentLocation} 
                className="p-4 hover:bg-emerald-900/30 cursor-pointer flex items-center gap-3 border-b border-slate-800/50 transition-colors group bg-gradient-to-r from-emerald-500/5 to-transparent"
              >
                <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  {loadingLocation ? (
                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Navigation size={18} className="text-emerald-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {loadingLocation ? t('getCurrentLocation') : t('currentLocation')}
                  </p>
                  <p className="text-xs text-slate-500">
                    {currentLocation ? t('useCurrentLoc') : t('enableGPS')}
                  </p>
                </div>
                {currentLocation && (
                  <Locate size={16} className="text-emerald-500 animate-pulse" />
                )}
              </div>

              {/* Set on Map Option */}
              <div 
                onClick={() => {
                  console.log('Set pickup on map clicked');
                  setFocusedInput(null);
                  setPResults([]);
                  setMapPickMode('pickup');
                }}
                className="p-4 hover:bg-slate-800/60 cursor-pointer flex items-center gap-3 border-b border-slate-800/30 transition-colors group"
              >
                <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Map size={18} className="text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {t('setLocationOnMap')}
                  </p>
                  <p className="text-xs text-slate-500">
                    {t('choosePrecisePickup')}
                  </p>
                </div>
              </div>

              {/* Search Results */}
              {pResults.length > 0 && (
                <>
                  {pQuery.length >= 2 && (
                    <div className="px-4 py-2 bg-slate-900/50">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-600">{t('searchResults')}</p>
                    </div>
                  )}
                  {pResults.map((s, i) => {
                    const { mainText, subText } = formatSuggestion(s);
                    return (
                      <div 
                        key={i} 
                        onClick={() => handleSelect(s, 'p')} 
                        className="p-4 hover:bg-slate-800/60 cursor-pointer flex items-start gap-3 border-b border-slate-800/30 last:border-0 transition-colors group"
                      >
                        <div className="mt-1">{getLocationIcon(s)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                            {mainText}
                          </p>
                          {subText && (
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {subText}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
              
              {/* No results message */}
              {pQuery.length >= 2 && pResults.length === 0 && (
                <div className="p-6 text-center">
                  <MapPin size={32} className="text-slate-700 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">{t('noLocationsFound')} "{pQuery}"</p>
                  <p className="text-xs text-slate-600 mt-1">{t('trySearching')}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dropoff Input */}
        <div className="relative">
          <div className={`absolute left-[17px] top-[20px] w-3 h-3 bg-rose-500 rounded-full border-2 z-10 ${
            darkMode ? 'border-[#161e2d]' : 'border-white'
          } ${mapPickMode === 'dropoff' ? 'animate-pulse ring-4 ring-rose-500/50' : ''}`}></div>
          <input 
            value={dQuery} 
            onChange={(e) => { 
              setDQuery(e.target.value); 
              fetchSuggestions(e.target.value, 'd'); 
            }}
            onFocus={() => !mapPickMode && setFocusedInput('dropoff')}
            placeholder={t('searchDropoff')} 
            className={`w-full border-2 border-t-0 p-4 pl-12 pr-16 rounded-b-2xl outline-none text-sm transition-all ${
              mapPickMode === 'dropoff' 
                ? 'ring-4 ring-rose-500/30 border-rose-500 border-t-2' 
                : darkMode 
                  ? 'bg-[#0e1623] border-slate-800/50 text-white placeholder-slate-600 focus:border-rose-500/50' 
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-rose-500'
            }`} 
          />
          
          {/* Dropoff Suggestions */}
          {focusedInput === 'dropoff' && !mapPickMode && (
            <div className={`absolute z-[9999] w-full border-2 mt-[-2px] rounded-b-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${
              darkMode 
                ? 'bg-[#0e1623] border-rose-500/30' 
                : 'bg-white border-rose-500'
            }`}>
              {/* Set on Map Option */}
              <div 
                onClick={() => {
                  console.log('Set dropoff on map clicked');
                  setFocusedInput(null);
                  setDResults([]);
                  setMapPickMode('dropoff');
                }}
                className="p-4 hover:bg-slate-800/60 cursor-pointer flex items-center gap-3 border-b border-slate-800/30 transition-colors group"
              >
                <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Map size={18} className="text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {t('setLocationOnMap')}
                  </p>
                  <p className="text-xs text-slate-500">
                    {t('choosePreciseDropoff')}
                  </p>
                </div>
              </div>

              {/* Search Results */}
              {dResults.length > 0 && (
                <>
                  {dQuery.length >= 2 && (
                    <div className="px-4 py-2 bg-slate-900/50">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-600">{t('searchResults')}</p>
                    </div>
                  )}
                  {dResults.map((s, i) => {
                    const { mainText, subText } = formatSuggestion(s);
                    return (
                      <div 
                        key={i} 
                        onClick={() => handleSelect(s, 'd')} 
                        className="p-4 hover:bg-slate-800/60 cursor-pointer flex items-start gap-3 border-b border-slate-800/30 last:border-0 transition-colors group"
                      >
                        <div className="mt-1">{getLocationIcon(s)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate group-hover:text-rose-400 transition-colors">
                            {mainText}
                          </p>
                          {subText && (
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {subText}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* No results message */}
              {dQuery.length >= 2 && dResults.length === 0 && (
                <div className="p-6 text-center">
                  <MapPin size={32} className="text-slate-700 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">{t('noLocationsFound')} "{dQuery}"</p>
                  <p className="text-xs text-slate-600 mt-1">{t('trySearching')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search Button */}
      <button 
        onClick={() => onSearch(window.tempPickup, window.tempDropoff)} 
        disabled={!pQuery || !dQuery}
        className={`w-full font-bold py-4 rounded-2xl mt-4 transition-all shadow-lg text-sm flex items-center justify-center gap-2 ${
          (!pQuery || !dQuery)
            ? (darkMode ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed')
            : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-blue-600/20'
        }`}
      >
        <Search size={18} /> 
        {pQuery && dQuery ? t('findRides') : t('enterLocations')}
      </button>
    </div>
  );
}
