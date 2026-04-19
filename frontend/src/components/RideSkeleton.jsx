import React from 'react';

function RideSkeleton() {
  return (
    <div className="bg-slate-900/50 border border-slate-800/50 p-5 rounded-2xl flex items-center justify-between animate-pulse">
      <div className="flex items-center gap-4 w-full">
        {/* Skeleton Icon */}
        <div className="w-12 h-12 bg-slate-800 rounded-xl"></div>
        
        <div className="space-y-2 flex-1">
          {/* Skeleton Title */}
          <div className="h-4 bg-slate-800 rounded w-24"></div>
          {/* Skeleton Subtitle */}
          <div className="h-3 bg-slate-800 rounded w-40"></div>
        </div>
        
        {/* Skeleton Price */}
        <div className="h-8 bg-slate-800 rounded w-16"></div>
      </div>
    </div>
  );
}

export default RideSkeleton;
