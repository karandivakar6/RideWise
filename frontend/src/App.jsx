import React, { useState, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import SearchForm from './components/SearchForm';
import MapView from './components/MapView';
import Auth from './components/Auth';
import { Car, Settings, ShoppingBag, Info, Clock, Route } from 'lucide-react';

// ✅ Define libraries outside the component to prevent the reload warning!
const libraries = ["places"];

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyAzZvAsNNCTMML9DFYtbzVShPyYB-Nbzps",
    libraries: libraries, // ✅ Fixed: Referencing the static constant above
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleSearch = async (p, d) => {
    setLoading(true);
    setPickup(p); 
    setDropoff(d);
    
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
      } else {
          alert(`Backend Error: ${data.msg || "Something went wrong"}`);
          setResults(null); // Clear broken results
      }
    } catch (e) { 
      alert("Backend server not responding!"); 
      setResults(null);
    }
    setLoading(false);
  };

  if (loadError) return <div className="text-red-500 p-10 text-center font-black">MAP ERROR: CHECK GOOGLE CONSOLE</div>;

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 pb-32 selection:bg-blue-500/30">
      {!user ? (
        <div className="flex items-center justify-center min-h-screen px-4">
          <Auth onLoginSuccess={setUser} />
        </div>
      ) : (
        <>
          <header className="px-6 pt-10 pb-4 max-w-xl mx-auto">
            <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">RideWise Pro</h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Aggregator</p>
          </header>

          <main className="max-w-xl mx-auto px-4 space-y-6">
            <div className="bg-orange-500/5 border border-orange-500/20 p-4 rounded-2xl flex items-center gap-4">
              <div className="bg-orange-500 p-1 rounded-full"><Info size={10} color="white" /></div>
              <p className="text-orange-400 text-[9px] font-black uppercase tracking-widest flex-1">Bengaluru traffic surge may apply</p>
            </div>

            <div className="bg-[#161e2d] rounded-[32px] p-6 border border-slate-800/50 shadow-2xl relative z-20">
              <h3 className="text-[10px] font-black uppercase text-slate-600 tracking-[0.3em] mb-4 ml-1">Set Journey</h3>
              {isLoaded ? <SearchForm onSearch={handleSearch} /> : <div className="h-40 bg-slate-800/10 animate-pulse rounded-2xl" />}
            </div>

            {loading && (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {results && !loading && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                
                {/* Distance Matrix Info Header */}
                <div className="flex justify-between items-center bg-[#161e2d] px-6 py-4 rounded-2xl border border-slate-800 shadow-md">
                   <div className="flex items-center gap-2 text-slate-300">
                      <Route size={16} className="text-blue-500" />
                      <span className="font-bold text-sm">{results.distance} km</span>
                   </div>
                   <div className="flex items-center gap-2 text-slate-300">
                      <Clock size={16} className="text-emerald-500" />
                      <span className="font-bold text-sm">{results.duration || "~ ETA"}</span>
                   </div>
                </div>

                <MapView pickup={pickup} dropoff={dropoff} />
                
                {results.categories.map((cat, i) => (
                  <div key={i} className="bg-slate-900/40 border border-slate-800/80 rounded-[32px] overflow-hidden shadow-xl">
                    <div className="px-6 py-4 flex items-center gap-3 bg-slate-800/20 border-b border-slate-800/50">
                      <span className="text-lg">{cat.icon}</span>
                      <h4 className="font-black text-white uppercase tracking-tight text-sm">{cat.category}</h4>
                      <span className="text-[9px] text-green-500 font-bold ml-auto uppercase tracking-tighter">Verified Prices</span>
                    </div>
                    <div className="p-3 space-y-1">
                      {cat.services.map((s, idx) => (
                        <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl transition-all ${idx === 0 ? 'bg-green-500/5' : 'hover:bg-slate-800/40'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-9 h-9 ${s.brand} rounded-xl flex items-center justify-center font-black text-[10px] text-white shadow-lg`}>{s.name[0]}</div>
                            <div>
                              <p className="font-bold text-sm text-white">{s.name}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase">{s.type}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-lg text-white">₹{s.price}</p>
                            <p className="text-[9px] text-slate-700 font-bold uppercase">Booking available</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>

          {/* Bottom Nav */}
          <nav className="fixed bottom-0 left-0 right-0 bg-[#0b1120]/95 backdrop-blur-xl border-t border-slate-800/50 px-10 py-5 flex justify-between items-center z-[9999]">
            <button className="text-slate-700 hover:text-slate-400 transition-colors"><ShoppingBag size={20} /></button>
            <button className="text-blue-500"><Car size={20} /></button>
            <button className="text-slate-700 hover:text-slate-400 transition-colors"><Settings size={20} /></button>
          </nav>
        </>
      )}
    </div>
  );
}

export default App;