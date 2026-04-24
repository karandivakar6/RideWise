import React, { useState, useEffect } from 'react';
import SearchForm from './components/SearchForm';
import MapView from './components/MapView';
import Auth from './components/Auth';
import ProfileModal from './components/ProfileModal';
import SettingsModal from './components/SettingsModal';
import QRModal from './components/QRModal';
import Logo from './components/Logo';
import { Settings, Info, Clock, Route, Moon, Sun, User, Share2 } from 'lucide-react';
import { soundManager } from './utils/soundEffects';
import { getTranslation } from './utils/translations';
import { formatPrice } from './utils/currency';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [mapPickMode, setMapPickMode] = useState(null); // 'pickup' | 'dropoff' | null
  const [darkMode, setDarkMode] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('settings_language') || 'en';
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedTheme = localStorage.getItem('theme');
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedTheme) setDarkMode(savedTheme === 'dark');
  }, []);

  // Listen for language changes
  useEffect(() => {
    const handleStorageChange = () => {
      const newLang = localStorage.getItem('settings_language') || 'en';
      setLanguage(newLang);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const t = (key) => getTranslation(key, language);

  const toggleTheme = () => {
    soundManager.playClick();
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const handleMapClick = async (lat, lon) => {
    if (!mapPickMode) return;
    
    console.log('handleMapClick called', lat, lon, mapPickMode);
    
    // Reverse geocode using Photon (CORS-enabled)
    try {
      const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}&lang=en`);
      const data = await res.json();
      
      console.log('Reverse geocode response:', data);
      
      // Extract location name from Photon response
      const props = data.features?.[0]?.properties || {};
      let name = props.name || props.street || props.suburb || props.district || 'Selected Location';
      
      const coords = { lat, lon, name };
      
      console.log('Setting coords:', coords, 'for', mapPickMode);
      
      if (mapPickMode === 'pickup') {
        window.tempPickup = coords;
      } else if (mapPickMode === 'dropoff') {
        window.tempDropoff = coords;
      }
      
      setMapPickMode(null); // Exit map pick mode
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
      // Fallback: use generic name with coordinates
      const coords = { lat, lon, name: `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})` };
      
      if (mapPickMode === 'pickup') {
        window.tempPickup = coords;
      } else if (mapPickMode === 'dropoff') {
        window.tempDropoff = coords;
      }
      
      setMapPickMode(null);
    }
  };

  const handleSearch = async (p, d) => {
    soundManager.playSearch();
    setLoading(true);
    setPickup(p); 
    setDropoff(d);
    
    // Save to recent searches if auto-save is enabled
    const autoSaveEnabled = JSON.parse(localStorage.getItem('settings_autoSave') || 'true');
    if (autoSaveEnabled) {
      saveToRecentSearches(p, d);
    }
    
    try {
      const res = await fetch('http://localhost:5000/api/fares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickup: p, dropoff: d, userId: user?.id })
      });
      
      const data = await res.json();
      
      // FIX: Only set results if the backend was successful
      if (res.ok && data.categories) {
          setResults(data);
          soundManager.playSuccess();
          
          // Send notification email if enabled
          const notificationsEnabled = localStorage.getItem('settings_notifications');
          if (notificationsEnabled === null || JSON.parse(notificationsEnabled)) {
            sendNotificationEmail(user, p, d, data);
          }
      } else {
          soundManager.playError();
          alert(`Backend Error: ${data.msg || "Something went wrong"}`);
          setResults(null); // Clear broken results
      }
    } catch (e) { 
      soundManager.playError();
      alert("Backend server not responding!"); 
      setResults(null);
    }
    setLoading(false);
  };

  const saveToRecentSearches = (pickup, dropoff) => {
    try {
      const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      const newSearch = {
        pickup: { name: pickup.name, lat: pickup.lat, lon: pickup.lon },
        dropoff: { name: dropoff.name, lat: dropoff.lat, lon: dropoff.lon },
        timestamp: new Date().toISOString()
      };
      
      // Add to beginning and keep only last 10 searches
      const updated = [newSearch, ...recentSearches.filter(s => 
        s.pickup.name !== pickup.name || s.dropoff.name !== dropoff.name
      )].slice(0, 10);
      
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch (err) {
      console.log('Failed to save recent search:', err);
    }
  };

  const sendNotificationEmail = async (user, pickup, dropoff, results) => {
    // Check if notifications are enabled
    const notificationsEnabled = JSON.parse(localStorage.getItem('settings_notifications') || 'true');
    if (!notificationsEnabled) {
      console.log('Notifications disabled - skipping email');
      return;
    }
    
    try {
      await fetch('http://localhost:5000/api/notifications/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user.email,
          userName: user.name,
          pickup: pickup.name,
          dropoff: dropoff.name,
          distance: results.distance,
          duration: results.duration
        })
      });
    } catch (err) {
      console.log('Failed to send notification email:', err);
    }
  };

  const handleServiceClick = (service) => {
    soundManager.playClick();
    setSelectedService(service);
    setShowQR(true);
  };

  const handleShareLocation = async () => {
    // Check if location sharing is enabled
    const locationSharingEnabled = JSON.parse(localStorage.getItem('settings_locationSharing') || 'true');
    if (!locationSharingEnabled) {
      alert(t('locationDisabled'));
      return;
    }

    soundManager.playClick();

    if (!pickup) {
      alert('No location to share');
      return;
    }

    const shareText = `📍 My Current Location\n\n${pickup.name}\n\nPickup: ${pickup.lat}, ${pickup.lon}\n${dropoff ? `Destination: ${dropoff.name}\n${dropoff.lat}, ${dropoff.lon}\n` : ''}\n🗺️ Google Maps: https://www.google.com/maps?q=${pickup.lat},${pickup.lon}`;
    
    const shareData = {
      title: 'My Location - RideWise',
      text: shareText,
    };

    // Try Web Share API first (works on mobile)
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        soundManager.playSuccess();
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.log('Share failed:', err);
          // Fallback to manual sharing
          showShareOptions(shareText);
        }
      }
    } else {
      // Fallback for desktop - show share options
      showShareOptions(shareText);
    }
  };

  const showShareOptions = (text) => {
    const encodedText = encodeURIComponent(text);
    const shareUrl = `https://www.google.com/maps?q=${pickup.lat},${pickup.lon}`;
    const encodedUrl = encodeURIComponent(shareUrl);

    const options = `
Share via:

WhatsApp: https://wa.me/?text=${encodedText}
Email: mailto:?subject=My Location - RideWise&body=${encodedText}
Twitter: https://twitter.com/intent/tweet?text=${encodedText}

Or copy this text:
${text}
    `;

    // Try to copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert('✅ Location copied to clipboard!\n\nYou can now paste it in WhatsApp, Instagram DM, or any app.\n\nGoogle Maps link: ' + shareUrl);
        soundManager.playSuccess();
      }).catch(() => {
        alert(options);
      });
    } else {
      alert(options);
    }
  };

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-300 ${
      darkMode 
        ? 'bg-[#0b1120] text-slate-100 selection:bg-blue-500/30' 
        : 'bg-slate-50 text-slate-900 selection:bg-blue-200'
    }`}>
      {!user ? (
        <div className="flex items-center justify-center min-h-screen px-4">
          <Auth onLoginSuccess={setUser} />
        </div>
      ) : (
        <>
          <header className="px-6 pt-10 pb-4 max-w-3xl mx-auto relative">
            {/* Theme Toggle - Top Left */}
            <button 
              onClick={toggleTheme}
              className={`absolute left-6 top-10 p-2 rounded-full transition-all ${
                darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-100 shadow-md'
              }`}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-700" />}
            </button>

            {/* Profile Button - Top Right */}
            <button 
              onClick={() => setShowProfile(true)}
              className={`absolute right-6 top-10 p-2 rounded-full transition-all flex items-center gap-2 ${
                darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-100 shadow-md'
              }`}
              title="View Profile"
            >
              {user?.photo ? (
                <img 
                  src={user.photo} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white ${
                  darkMode ? 'bg-blue-500' : 'bg-blue-600'
                }`}>
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {user?.name?.split(' ')[0] || 'Profile'}
              </span>
            </button>

            <div className="flex justify-center">
              <Logo darkMode={darkMode} size="medium" showTagline={true} />
            </div>
          </header>

          <main className="max-w-3xl mx-auto px-4 space-y-6">
            <div className={`border p-4 rounded-2xl flex items-center gap-4 ${
              darkMode 
                ? 'bg-orange-500/5 border-orange-500/20' 
                : 'bg-orange-50 border-orange-300'
            }`}>
              <div className="bg-orange-500 p-1 rounded-full"><Info size={10} color="white" /></div>
              <p className="text-orange-400 text-[9px] font-black uppercase tracking-widest flex-1">{t('trafficSurge')}</p>
            </div>

            <div className={`rounded-[32px] p-6 border shadow-2xl relative z-20 ${
              darkMode 
                ? 'bg-[#161e2d] border-slate-800/50' 
                : 'bg-white border-slate-200'
            }`}>
              <h3 className="text-[10px] font-black uppercase text-slate-600 tracking-[0.3em] mb-4 ml-1">{t('setJourney')}</h3>
              <SearchForm 
                onSearch={handleSearch} 
                mapPickMode={mapPickMode}
                setMapPickMode={setMapPickMode}
                darkMode={darkMode}
                language={language}
              />
            </div>

            {loading && (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {/* Show map when: 1) picking location on map, OR 2) showing results */}
            {(mapPickMode || (results && !loading)) && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
                
                {/* Distance Matrix Info Header - only show with results */}
                {results && (
                  <div className={`flex justify-between items-center px-6 py-4 rounded-2xl border shadow-md ${
                    darkMode 
                      ? 'bg-[#161e2d] border-slate-800' 
                      : 'bg-white border-slate-200'
                  }`}>
                     <div className={`flex items-center gap-2 ${
                       darkMode ? 'text-slate-300' : 'text-slate-700'
                     }`}>
                        <Route size={16} className="text-blue-500" />
                        <span className="font-bold text-sm">{results.distance} {t('km')}</span>
                     </div>
                     <div className={`flex items-center gap-2 ${
                       darkMode ? 'text-slate-300' : 'text-slate-700'
                     }`}>
                        <Clock size={16} className="text-emerald-500" />
                        <span className="font-bold text-sm">{results.duration || `~ ${t('eta')}`}</span>
                     </div>
                     {/* Share Location Button */}
                     {JSON.parse(localStorage.getItem('settings_locationSharing') || 'true') && (
                       <button
                         onClick={handleShareLocation}
                         className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                           darkMode 
                             ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                             : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200'
                         }`}
                         title="Share my location"
                       >
                         <Share2 size={16} />
                         <span className="hidden sm:inline">Share</span>
                       </button>
                     )}
                  </div>
                )}

                <MapView 
                  pickup={pickup} 
                  dropoff={dropoff}
                  onMapClick={handleMapClick}
                  mapPickMode={mapPickMode}
                  language={language}
                />
                
                {/* Services Grid - only show with results */}
                {results && (
                  <div className="grid grid-cols-1 gap-4">
                {results.categories.map((cat, i) => (
                  <div key={i} className={`rounded-[32px] overflow-hidden shadow-xl ${
                    darkMode 
                      ? 'bg-slate-900/40 border border-slate-800/80' 
                      : 'bg-white border border-slate-200'
                  }`}>
                    <div className={`px-6 py-4 flex items-center gap-3 border-b ${
                      darkMode 
                        ? 'bg-slate-800/20 border-slate-800/50' 
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className="text-lg">{cat.icon}</span>
                      <h4 className={`font-black uppercase tracking-tight text-sm ${
                        darkMode ? 'text-white' : 'text-slate-900'
                      }`}>{cat.category}</h4>
                      <span className="text-[9px] text-green-500 font-bold ml-auto uppercase tracking-tighter">{t('verifiedPrices')}</span>
                    </div>
                    <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                      {cat.services.map((s, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => handleServiceClick(s)}
                          className={`flex flex-col p-4 rounded-2xl transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                            idx === 0 
                              ? 'bg-green-500/5 border border-green-500/20 hover:bg-green-500/10' 
                              : darkMode
                                ? 'hover:bg-slate-800/40 border border-transparent hover:border-blue-500/30'
                                : 'hover:bg-slate-50 border border-transparent hover:border-blue-500/30'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <div className={`w-9 h-9 ${s.brand} rounded-xl flex items-center justify-center font-black text-xs text-white shadow-lg shrink-0`}>{s.name[0]}</div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className={`font-bold text-sm truncate ${
                                darkMode ? 'text-white' : 'text-slate-900'
                              }`}>{s.name}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase truncate">{s.type}</p>
                            </div>
                          </div>
                          <div className="flex items-end justify-between mt-auto">
                            <div className="flex flex-col items-start">
                              <p className={`font-black text-lg ${
                                darkMode ? 'text-white' : 'text-slate-900'
                              }`}>{formatPrice(s.price)}</p>
                              {s.estimatedTime && (
                                <div className="flex items-center gap-1">
                                  <Clock size={10} className="text-slate-600" />
                                  <p className="text-[9px] text-slate-600 font-semibold">{s.estimatedTime}</p>
                                </div>
                              )}
                            </div>
                            {idx === 0 && (
                              <p className="text-[9px] text-green-500 font-bold uppercase">{t('best')}</p>
                            )}
                          </div>
                          <p className="text-[8px] text-blue-400 font-bold uppercase tracking-wider mt-2 text-center">
                            {t('tapForQR')}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                </div>
                )}
              </div>
            )}
          </main>

          {/* Bottom Nav */}
          <nav className={`fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t px-10 py-5 flex justify-center items-center z-[9999] ${
            darkMode ? 'bg-[#0b1120]/95 border-slate-800/50' : 'bg-white/95 border-slate-200'
          }`}>
            <button 
              onClick={() => setShowSettings(true)}
              className={`transition-colors ${
                darkMode ? 'text-slate-700 hover:text-slate-400' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <Settings size={20} />
            </button>
          </nav>

          {/* Modals */}
          {showProfile && (
            <ProfileModal 
              user={user} 
              onClose={() => setShowProfile(false)} 
              darkMode={darkMode}
            />
          )}
          {showSettings && (
            <SettingsModal 
              onClose={() => setShowSettings(false)} 
              darkMode={darkMode}
              onToggleTheme={toggleTheme}
              language={language}
              onLanguageChange={setLanguage}
            />
          )}
          
          {/* QR Code Modal */}
          {showQR && selectedService && pickup && dropoff && (
            <QRModal 
              service={selectedService}
              pickup={pickup}
              dropoff={dropoff}
              darkMode={darkMode}
              onClose={() => setShowQR(false)}
              language={language}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;