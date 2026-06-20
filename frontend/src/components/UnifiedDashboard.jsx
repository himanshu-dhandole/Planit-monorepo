import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import MyEventsPage from './MyEventsPage';
import VendorDashboard from './VendorDashboard';
import AdminDashboard from './AdminDashboard';
import { Crown, Sparkles, Bell } from 'lucide-react';
import apiClient from '../lib/apiClient';

export default function UnifiedDashboard() {
  const { user } = useContext(AuthContext);
  const [activeRole, setActiveRole] = useState(null);
  const [urgentCount, setUrgentCount] = useState(0);

  // Auto-detect role or default to customer
  useEffect(() => {
    if (user) {
      if (user.roles?.includes('ROLE_ADMIN') || user.role === 'ADMIN') {
        setActiveRole('ADMIN');
      } else if (user.roles?.includes('ROLE_VENDOR') || user.role === 'VENDOR') {
        setActiveRole('VENDOR');
      } else {
        setActiveRole('CUSTOMER');
      }
    }
  }, [user]);

  // Fetch urgent tasks count
  useEffect(() => {
    if (user && activeRole && activeRole !== 'ADMIN') {
      apiClient.get('/api/tasks/urgent-count')
        .then(res => setUrgentCount(res.data?.count || 0))
        .catch(() => setUrgentCount(0));
    }
  }, [user, activeRole]);

  if (!user || !activeRole) return null;

  // Check if user has multiple roles (Customer + Vendor)
  const isVendorUser = user.roles?.includes('ROLE_VENDOR') || user.role === 'VENDOR';
  const isCustomerUser = user.roles?.includes('ROLE_CUSTOMER') || user.role === 'CUSTOMER' || user.role === 'USER';
  const hasMultipleRoles = isVendorUser && isCustomerUser;

  return (
    <div className="min-h-screen bg-[#FAF9F8] pt-28 pb-12 px-4 sm:px-6 lg:px-8 font-sans w-full relative">
      {/* Header & Controls Section */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Console Workspace</h1>
          <p className="text-xs text-slate-500 font-bold mt-1">Unified control center for all of your operations.</p>
        </div>
        
        <div className="flex items-center gap-3 self-end">
          {urgentCount > 0 && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-pulse">
              <Bell size={14} className="text-rose-500" />
              {urgentCount} urgent tasks due soon!
            </div>
          )}

          {hasMultipleRoles && (
            <div className="bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm flex items-center gap-1">
              <button
                onClick={() => setActiveRole('CUSTOMER')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeRole === 'CUSTOMER' 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles size={14} /> Client Planner
              </button>
              <button
                onClick={() => setActiveRole('VENDOR')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeRole === 'VENDOR' 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Crown size={14} /> Vendor Dashboard
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic mounting */}
      {activeRole === 'CUSTOMER' && <MyEventsPage />}
      {activeRole === 'VENDOR' && <VendorDashboard />}
      {activeRole === 'ADMIN' && <AdminDashboard />}
    </div>
  );
}
