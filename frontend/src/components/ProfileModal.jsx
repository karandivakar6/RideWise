import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Camera, TrendingUp, MapPin, DollarSign, Award } from 'lucide-react';
import { soundManager } from '../utils/soundEffects';

export default function ProfileModal({ user, onClose, darkMode }) {
  const [editMode, setEditMode] = useState(false);
  const [stats, setStats] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    photo: user?.photo || ''
  });

  useEffect(() => {
    // Fetch user statistics
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/${user.id}/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleSave = async () => {
    try {
      // Validate inputs
      if (!formData.name || !formData.email) {
        alert('Name and email are required!');
        return;
      }

      console.log('Saving profile for user ID:', user.id);
      console.log('Form data:', { ...formData, photo: formData.photo ? 'base64 image' : 'none' });

      const res = await fetch(`http://localhost:5000/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);
      
      if (res.ok) {
        soundManager.playSuccess();
        
        // Send profile update notification email (if notifications enabled)
        const notificationsEnabled = JSON.parse(localStorage.getItem('settings_notifications') || 'true');
        if (notificationsEnabled) {
          try {
            await fetch('http://localhost:5000/api/notifications/profile-update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userEmail: data.email,
                userName: data.name
              })
            });
          } catch (emailErr) {
            console.log('Failed to send notification email:', emailErr);
          }
        }
        
        // Update both localStorage and parent component
        localStorage.setItem('user', JSON.stringify(data));
        setEditMode(false);
        
        // Show success message
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[10001] animate-in fade-in slide-in-from-top-2';
        successDiv.textContent = '✅ Profile updated successfully!';
        document.body.appendChild(successDiv);
        setTimeout(() => {
          successDiv.remove();
          window.location.reload();
        }, 1500);
      } else {
        soundManager.playError();
        console.error('Update failed:', data);
        alert(`Failed to update: ${data.msg || data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Update error:', err);
      alert('Failed to update profile. Is the backend server running?');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

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
            Profile
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
          {/* Profile Photo & Basic Info */}
          <div className="flex items-center gap-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black ${
              darkMode ? 'bg-blue-500' : 'bg-blue-600'
            } text-white relative`}>
              {formData.photo ? (
                <img src={formData.photo} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                user?.name?.[0]?.toUpperCase() || 'U'
              )}
              {editMode && (
                <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-slate-100 transition-colors">
                  <Camera size={16} className="text-slate-700" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <div className="flex-1">
              {editMode ? (
                <div className="space-y-3">
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full Name"
                    className={`w-full px-4 py-2 rounded-xl border ${
                      darkMode 
                        ? 'bg-slate-800 border-slate-700 text-white' 
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <input
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Email"
                    type="email"
                    className={`w-full px-4 py-2 rounded-xl border ${
                      darkMode 
                        ? 'bg-slate-800 border-slate-700 text-white' 
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone Number"
                    className={`w-full px-4 py-2 rounded-xl border ${
                      darkMode 
                        ? 'bg-slate-800 border-slate-700 text-white' 
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              ) : (
                <>
                  <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {user?.name}
                  </h3>
                  <p className={`text-sm flex items-center gap-2 mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    <Mail size={14} /> {user?.email}
                  </p>
                  {user?.phone && (
                    <p className={`text-sm flex items-center gap-2 mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      <Phone size={14} /> {user?.phone}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-3">
              {editMode && (
                <button
                  onClick={() => {
                    setEditMode(false);
                    setFormData({
                      name: user?.name || '',
                      email: user?.email || '',
                      phone: user?.phone || '',
                      photo: user?.photo || ''
                    });
                  }}
                  className={`px-6 py-2 font-bold rounded-xl transition-colors ${
                    darkMode 
                      ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
                  }`}
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => editMode ? handleSave() : setEditMode(true)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors"
              >
                {editMode ? 'Save' : 'Edit'}
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div className={`border-t pt-6 ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
            <h3 className={`text-lg font-black uppercase mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Ride Statistics
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl ${
                darkMode ? 'bg-slate-800' : 'bg-slate-100'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={18} className="text-blue-500" />
                  <p className={`text-xs font-bold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Total Rides
                  </p>
                </div>
                <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {stats?.totalRides || 0}
                </p>
              </div>

              <div className={`p-4 rounded-2xl ${
                darkMode ? 'bg-slate-800' : 'bg-slate-100'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={18} className="text-emerald-500" />
                  <p className={`text-xs font-bold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Total Distance
                  </p>
                </div>
                <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {stats?.totalDistance?.toFixed(1) || 0} km
                </p>
              </div>

              <div className={`p-4 rounded-2xl ${
                darkMode ? 'bg-slate-800' : 'bg-slate-100'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={18} className="text-yellow-500" />
                  <p className={`text-xs font-bold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Avg Cost/Ride
                  </p>
                </div>
                <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  ₹{stats?.avgCost?.toFixed(0) || 0}
                </p>
              </div>

              <div className={`p-4 rounded-2xl ${
                darkMode ? 'bg-slate-800' : 'bg-slate-100'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Award size={18} className="text-purple-500" />
                  <p className={`text-xs font-bold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Most Used
                  </p>
                </div>
                <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {stats?.mostUsedProvider || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
