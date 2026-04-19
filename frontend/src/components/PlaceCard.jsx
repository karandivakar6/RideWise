import React from 'react';

function PlaceCard({ name, description, rating, onSelect }) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between hover:border-blue-500/50 transition-all group shadow-lg min-w-[240px]">
      <div>
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">{name}</h4>
          <span className="text-xs font-bold text-yellow-500">★ {rating}</span>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{description}</p>
      </div>
      
      <button 
        onClick={() => onSelect(name)}
        className="mt-4 w-full py-2 bg-slate-800 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors"
      >
        Ride There
      </button>
    </div>
  );
}

export default PlaceCard;