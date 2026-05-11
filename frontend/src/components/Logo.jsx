import React from 'react';

const Logo = ({ darkMode = true, size = 'large', showTagline = true }) => {
  const sizes = {
    small: { container: 'w-32', img: 80, tagline: 'text-[6px]' },
    medium: { container: 'w-48', img: 120, tagline: 'text-[8px]' },
    large: { container: 'w-64', img: 160, tagline: 'text-[10px]' },
    xlarge: { container: 'w-80', img: 200, tagline: 'text-xs' }
  };

  const currentSize = sizes[size] || sizes.large;

  return (
    <div className={`${currentSize.container} flex flex-col items-center justify-center`}>
      {/* Logo SVG */}
      <img 
        src="/logo.svg" 
        alt="RideWise Logo" 
        width={currentSize.img} 
        height={currentSize.img}
        className="mb-2"
      />

      {/* Tagline */}
      {showTagline && (
        <p className={`${currentSize.tagline} font-bold tracking-[0.5em] mt-2 ${
          darkMode ? 'text-slate-400' : 'text-slate-600'
        }`}>
          COMPARE. SAVE. RIDE.
        </p>
      )}
    </div>
  );
};

export default Logo;
