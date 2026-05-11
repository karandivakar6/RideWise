import React from 'react';

const LogoIcon = ({ size = 48, darkMode = true }) => {
  return (
    <svg 
      width={size} 
      height={size * 1.3} 
      viewBox="0 0 100 130" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="pinGradientIcon" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5FE9A0" />
          <stop offset="100%" stopColor="#3B9DB8" />
        </linearGradient>
      </defs>
      
      {/* Outer Pin Shape */}
      <path
        d="M50 5C30.67 5 15 20.67 15 40C15 63.75 50 105 50 105C50 105 85 63.75 85 40C85 20.67 69.33 5 50 5Z"
        fill="url(#pinGradientIcon)"
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
        fill="url(#pinGradientIcon)"
      />
    </svg>
  );
};

export default LogoIcon;
