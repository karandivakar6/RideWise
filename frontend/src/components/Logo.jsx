import React from 'react';

const Logo = ({ darkMode = true, size = 'large', showTagline = true }) => {
  const sizes = {
    small: { container: 'w-32', pin: 40, text: 'text-xl', tagline: 'text-[6px]' },
    medium: { container: 'w-48', pin: 60, text: 'text-3xl', tagline: 'text-[8px]' },
    large: { container: 'w-64', pin: 80, text: 'text-4xl', tagline: 'text-[10px]' },
    xlarge: { container: 'w-80', pin: 100, text: 'text-5xl', tagline: 'text-xs' }
  };

  const currentSize = sizes[size] || sizes.large;

  return (
    <div className={`${currentSize.container} flex flex-col items-center justify-center`}>
      {/* Location Pin with Gradient */}
      <svg 
        width={currentSize.pin} 
        height={currentSize.pin * 1.3} 
        viewBox="0 0 100 130" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="mb-3"
      >
        <defs>
          <linearGradient id="pinGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5FE9A0" />
            <stop offset="100%" stopColor="#3B9DB8" />
          </linearGradient>
        </defs>
        
        {/* Outer Pin Shape */}
        <path
          d="M50 5C30.67 5 15 20.67 15 40C15 63.75 50 105 50 105C50 105 85 63.75 85 40C85 20.67 69.33 5 50 5Z"
          fill="url(#pinGradient)"
        />
        
        {/* Inner Circle Cutout */}
        <circle
          cx="50"
          cy="40"
          r="18"
          fill={darkMode ? '#0b1120' : '#ffffff'}
        />
        
        {/* Inner Pin Shape */}
        <path
          d="M50 20C41.72 20 35 26.72 35 35C35 46.25 50 65 50 65C50 65 65 46.25 65 35C65 26.72 58.28 20 50 20Z"
          fill="url(#pinGradient)"
        />
      </svg>

      {/* RIDEWISE Text */}
      <h1 className={`${currentSize.text} font-black tracking-[0.2em] ${
        darkMode ? 'text-white' : 'text-slate-900'
      }`}>
        RIDEWISE
      </h1>

      {/* Tagline */}
      {showTagline && (
        <p className={`${currentSize.tagline} font-bold tracking-[0.5em] mt-1 ${
          darkMode ? 'text-slate-400' : 'text-slate-600'
        }`}>
          COMPARE. SAVE. RIDE.
        </p>
      )}
    </div>
  );
};

export default Logo;
