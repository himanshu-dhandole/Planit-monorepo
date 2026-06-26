import React from 'react';
import { useLocation } from 'react-router-dom';
import Footer from './Footer';

export default function Layout({ children }) {
  const location = useLocation();
  const isDashboardRoute = [
    '/dashboard',
    '/vendor-dashboard',
    '/wallet',
    '/my-events',
    '/my-bookings',
    '/vendor-bookings',
    '/disputes',
    '/admin'
  ].includes(location.pathname);

  return (
    <div className="font-sans flex flex-col min-h-screen bg-[#FDFCFB]">
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      {!isDashboardRoute && <Footer />}
    </div>
  );
}
