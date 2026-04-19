import React from 'react';

export default function RideCard({ service, price, time, type, color }) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between hover:border-blue-500/50 transition-all group shadow-lg">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center font-black text-[10px] shadow-inner`}>
          {service.toUpperCase()}
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