import React, { useState, useEffect } from 'react';
import { X, Bell, MapPin, CreditCard, Shield, Globe, Volume2, Moon } from 'lucide-react';
import { soundManager } from '../utils/soundEffects';

export default function SettingsModal({ onClose, darkMode, onToggleTheme }) {
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('settings_notifications');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [locationSharing, setLocationSharing] = useState(() => {
    const saved = localStorage.getItem('settings_locationSharing');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [soundEffects, setSoundEffects] = useState(() => {
    const saved = localStorage.getItem('settings_soundEffects');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [autoSave, setAutoSave] = useState(() => {
    const saved = localStorage.getItem('settings_autoSave');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('settings_language') || 'en';
  });
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('settings_currency') || 'INR';
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('settings_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('settings_locationSharing', JSON.stringify(locationSharing));
  }, [locationSharing]);

  useEffect(() => {
    localStorage.setItem('settings_soundEffects', JSON.stringify(soundEffects));
  }, [soundEffects]);

  useEffect(() => {
    localStorage.setItem('settings_autoSave', JSON.stringify(autoSave));
  }, [autoSave]);

  useEffect(() => {
    localStorage.setItem('settings_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('settings_currency', currency);
  }, [currency]);

  const handleLogout = () => {
    soundManager.playClick();
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.reload();
  };

  const Toggle = ({ enabled, onChange }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? 'bg-blue-600' : darkMode ? 'bg-slate-700' : 'bg-slate-300'
      }`}
    >
      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
        enabled ? 'translate-x-6' : 'translate-x-0'
      }`} />
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
      <div className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden ${
        darkMode ? 'bg-[#161e2d]' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100 border-slate-200'
        }`}>
          <h2 className={`text-xl font-black uppercase ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Settings
          </h2>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-200'
            }`}
          >
            <X size={20} className={darkMode ? 'text-slate-400' : 'text-slate-600'} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {/* Appearance */}
          <div>
            <h3 className={`text-sm font-black uppercase mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Appearance
            </h3>
            <div className={`flex items-center justify-between p-4 rounded-xl ${
              darkMode ? 'bg-slate-800' : 'bg-slate-100'
            }`}>
              <div className="flex items-center gap-3">
                <Moon size={20} className={darkMode ? 'text-blue-400' : 'text-slate-600'} />
                <div>
                  <p className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Dark Mode</p>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Toggle dark/light theme
                  </p>
                </div>
              </div>
              <Toggle enabled={darkMode} onChange={onToggleTheme} />
            </div>
          </div>

          {/* Notifications */}
          <div>
            <h3 className={`text-sm font-black uppercase mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Notifications
            </h3>
            <div className={`space-y-3 p-4 rounded-xl ${
              darkMode ? 'bg-slate-800' : 'bg-slate-100'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell size={20} className={darkMode ? 'text-blue-400' : 'text-slate-600'} />
                  <div>
                    <p className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Push Notifications</p>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Get updates about rides
                    </p>
                  </div>
                </div>
                <Toggle enabled={notifications} onChange={setNotifications} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Volume2 size={20} className={darkMode ? 'text-blue-400' : 'text-slate-600'} />
                  <div>
                    <p className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Sound Effects</p>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Play sounds for alerts
                    </p>
                  </div>
                </div>
                <Toggle enabled={soundEffects} onChange={setSoundEffects} />
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div>
            <h3 className={`text-sm font-black uppercase mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Privacy & Location
            </h3>
            <div className={`space-y-3 p-4 rounded-xl ${
              darkMode ? 'bg-slate-800' : 'bg-slate-100'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin size={20} className={darkMode ? 'text-blue-400' : 'text-slate-600'} />
                  <div>
                    <p className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Location Sharing</p>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Share location for rides
                    </p>
                  </div>
                </div>
                <Toggle enabled={locationSharing} onChange={setLocationSharing} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield size={20} className={darkMode ? 'text-blue-400' : 'text-slate-600'} />
                  <div>
                    <p className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Auto-save Searches</p>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Save recent locations
                    </p>
                  </div>
                </div>
                <Toggle enabled={autoSave} onChange={setAutoSave} />
              </div>
            </div>
          </div>

          {/* Language & Region */}
          <div>
            <h3 className={`text-sm font-black uppercase mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Language & Region
            </h3>
            <div className={`space-y-3 p-4 rounded-xl ${
              darkMode ? 'bg-slate-800' : 'bg-slate-100'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe size={20} className={darkMode ? 'text-blue-400' : 'text-slate-600'} />
                  <p className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Language</p>
                </div>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={`px-4 py-2 rounded-lg font-bold ${
                    darkMode 
                      ? 'bg-slate-700 text-white border-slate-600' 
                      : 'bg-white text-slate-900 border-slate-300'
                  } border`}
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="kn">ಕನ್ನಡ (Kannada)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard size={20} className={darkMode ? 'text-blue-400' : 'text-slate-600'} />
                  <p className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Currency</p>
                </div>
                <select 
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={`px-4 py-2 rounded-lg font-bold ${
                    darkMode 
                      ? 'bg-slate-700 text-white border-slate-600' 
                      : 'bg-white text-slate-900 border-slate-300'
                  } border`}
                >
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                </select>
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl transition-colors uppercase"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
