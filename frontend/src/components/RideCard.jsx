import React from 'react';

const ProviderLogo = ({ service }) => {
  const serviceLower = service.toLowerCase();
  
  if (serviceLower === 'rapido') {
    return (
      <svg width="48" height="48" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#FFC107" rx="20"/>
        <text x="100" y="120" fontFamily="Arial, sans-serif" fontSize="60" fontWeight="bold" fill="#000" textAnchor="middle">R</text>
        <text x="100" y="160" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" fill="#000" textAnchor="middle">RAPIDO</text>
      </svg>
    );
  }
  
  if (serviceLower === 'namma yatri') {
    return (
      <svg width="48" height="48" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#7C3AED" rx="20"/>
        <text x="100" y="115" fontFamily="Arial, sans-serif" fontSize="50" fontWeight="bold" fill="#FFF" textAnchor="middle">NY</text>
        <text x="100" y="155" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#FFF" textAnchor="middle">NAMMA YATRI</text>
      </svg>
    );
  }
  
  if (serviceLower === 'uber') {
    return (
      <svg width="48" height="48" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#000000" rx="20"/>
        <text x="100" y="120" fontFamily="Arial, sans-serif" fontSize="60" fontWeight="bold" fill="#FFF" textAnchor="middle">U</text>
        <text x="100" y="160" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" fill="#FFF" textAnchor="middle">UBER</text>
      </svg>
    );
  }
  
  return null;
};

export default function RideCard({ service, price, time, type, color }) {
  const hasLogo = ['rapido', 'namma yatri', 'uber'].includes(service.toLowerCase());
  
  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between hover:border-blue-500/50 transition-all group shadow-lg">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner overflow-hidden bg-white">
          {hasLogo ? (
            <ProviderLogo service={service} />
          ) : (
            <div className={`w-full h-full ${color} flex items-center justify-center font-black text-[10px]`}>
              {service.toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <h3 className="font-black text-lg flex items-center gap-2">
            {service} 
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-tighter">
              {type}
            </span>
          </h3>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
            {time} mins away • Instant Booking
          </p>
        </div>
      </div>
      
      <div className="text-right">
        <p className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors">
          ₹{price}
        </p>
        <p className="text-[10px] text-slate-600 font-bold uppercase">Best Value</p>
      </div>
    </div>
  );
}