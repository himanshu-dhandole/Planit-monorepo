import React from 'react';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <div className="font-sans flex flex-col min-h-screen bg-[#FDFCFB]">
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <Footer />
    </div>
  );
}
