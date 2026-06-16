import React from 'react';

export default function CloudsBackground({ children }) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#CBE4F9] to-[#E3F2FC] relative overflow-hidden font-sans flex flex-col m-0 p-0">
      {/* Noise Overlay */}
      <div className="absolute inset-0 bg-noise pointer-events-none z-0 opacity-40"></div>

      {/* Cloud SVGs with Halftone Textures */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        
        {/* Top Right Cloud */}
        <svg className="absolute top-10 -right-10 md:top-20 md:right-10 w-96 h-64 opacity-90" viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="blur-cloud1" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
            <pattern id="dots1" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" opacity="0.6"/>
            </pattern>
            {/* Cloud Path */}
            <path id="cloud1" d="M 120 130 C 120 80, 180 70, 210 100 C 240 50, 330 60, 330 120 C 380 120, 380 180, 330 180 L 120 180 C 60 180, 60 130, 120 130 Z" />
          </defs>
          <g filter="url(#blur-cloud1)">
            <use href="#cloud1" fill="white" />
          </g>
          <use href="#cloud1" fill="url(#dots1)" opacity="0.8" />
        </svg>

        {/* Bottom Left Cloud */}
        <svg className="absolute bottom-10 -left-10 md:bottom-16 md:left-10 w-[28rem] h-72 opacity-95" viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="blur-cloud2" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" />
            </filter>
            <pattern id="dots2" x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1" fill="white" opacity="0.8"/>
            </pattern>
            <path id="cloud2" d="M 140 150 C 140 100, 200 90, 230 120 C 260 70, 350 80, 350 140 C 400 140, 400 200, 350 200 L 140 200 C 80 200, 80 150, 140 150 Z" />
          </defs>
          <g filter="url(#blur-cloud2)">
            <use href="#cloud2" fill="white" />
          </g>
          <use href="#cloud2" fill="url(#dots2)" opacity="0.7" />
        </svg>
      </div>

      <div className="relative z-10 w-full flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
