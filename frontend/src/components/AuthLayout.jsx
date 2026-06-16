import React from 'react';
import { Outlet } from 'react-router-dom';
import CloudsBackground from './CloudsBackground';
import Navbar from './Navbar';

export default function AuthLayout() {
  return (
    <CloudsBackground>
      <Navbar />
      <div className="flex-1 flex justify-center items-center w-full min-h-screen pt-24">
        <Outlet />
      </div>
    </CloudsBackground>
  );
}
