import React from 'react';
import { Link } from 'react-router-dom';
import CloudsBackground from './CloudsBackground';

export default function NotFound() {
  return (
    <CloudsBackground>
      <div className="relative z-10 text-center px-4 flex flex-col items-center pt-24 justify-center flex-1">
        <h1 className="font-serif text-5xl md:text-[4rem] text-[#111111] tracking-tight mb-6">
          Page Not Found | 404
        </h1>
        <p className="text-gray-600 text-sm md:text-base mb-6 font-medium">
          Pages are kind of our thing, but this one doesn't seem to exist.
        </p>
        <p className="text-gray-500 text-xs md:text-sm mb-6">
          Expected to find something here?
        </p>
        <Link 
          to="/"
          className="inline-block bg-white/90 backdrop-blur-md hover:bg-white text-black font-semibold text-sm px-6 py-2.5 rounded-full shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] transition-transform hover:scale-105 border border-white/50 mt-2"
        >
          Let us know
        </Link>
      </div>
    </CloudsBackground>
  );
}
