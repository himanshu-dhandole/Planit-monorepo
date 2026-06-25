import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../lib/apiClient';
import { User, Star, Briefcase, Shield, Layers, Grid } from 'lucide-react';
import UnifiedDashboard from './UnifiedDashboard';

export default function Sandbox() {
  const { user, loading: authLoading, refreshUser } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showcaseMode, setShowcaseMode] = useState('all'); // 'all', 'client', 'vendor', 'admin'

  useEffect(() => {
    if (!authLoading) {
      if (user?.id) {
        fetchData();
      } else {
        setError("User is not logged in or user.id is undefined");
        setLoading(false);
      }
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    try {
      const url = `/api/customer/user/${user.id}`;
      setData({ fetchUrl: url, message: "Fetching..." });
      const res = await apiClient.get(url);
      setData({
        fetchUrl: url,
        status: res.status,
        data: res.data
      });
    } catch (err) {
      setError({
        message: err.message,
        responseStatus: err.response?.status,
        responseData: err.response?.data
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen text-slate-100 flex items-center justify-center text-xl font-bold font-sans">
        Loading Sandbox Showcase...
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-slate-900 min-h-screen text-slate-100 font-sans">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 mb-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold rounded-full uppercase tracking-wider">
              Quality Assurance & Testing
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mt-3">
              Role-Based Workspace Sandbox
            </h1>
            <p className="text-slate-400 text-sm mt-2 max-w-2xl">
              Preview and interact with all three workspace variants simultaneously. Test flows, verify layouts, and inspect state transitions with live simulated dummy data.
            </p>
          </div>
          
          {/* Mode Switchers */}
          <div className="flex flex-wrap bg-slate-950 p-1 rounded-xl border border-slate-800 self-start md:self-center">
            <button
              onClick={() => setShowcaseMode('all')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                showcaseMode === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-905/50'
              }`}
            >
              <Grid size={14} /> Display All
            </button>
            <button
              onClick={() => setShowcaseMode('client')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                showcaseMode === 'client'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-905/50'
              }`}
            >
              <User size={14} /> Client Space
            </button>
            <button
              onClick={() => setShowcaseMode('vendor')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                showcaseMode === 'vendor'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-905/50'
              }`}
            >
              <Briefcase size={14} /> Vendor Space
            </button>
            <button
              onClick={() => setShowcaseMode('admin')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                showcaseMode === 'admin'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-905/50'
              }`}
            >
              <Shield size={14} /> Admin Space
            </button>
          </div>
        </div>
      </div>

      {/* Main Showcase Grid / Stack */}
      <div className="space-y-12">
        {/* Client Space Preview */}
        {(showcaseMode === 'all' || showcaseMode === 'client') && (
          <div className="relative border border-slate-800 rounded-3xl bg-slate-950 p-1 md:p-6 shadow-2xl overflow-hidden">
            <div className="absolute top-6 left-12 flex items-center gap-2 pointer-events-none">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">🔑 Client Space Workspace (Demo Mode)</span>
            </div>
            <div className="pt-8">
              <UnifiedDashboard isDemoMode={true} demoRole="client" />
            </div>
          </div>
        )}

        {/* Vendor Space Preview */}
        {(showcaseMode === 'all' || showcaseMode === 'vendor') && (
          <div className="relative border border-slate-800 rounded-3xl bg-slate-950 p-1 md:p-6 shadow-2xl overflow-hidden">
            <div className="absolute top-6 left-12 flex items-center gap-2 pointer-events-none">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">💼 Vendor Space Workspace (Demo Mode)</span>
            </div>
            <div className="pt-8">
              <UnifiedDashboard isDemoMode={true} demoRole="vendor" />
            </div>
          </div>
        )}

        {/* Admin Space Preview */}
        {(showcaseMode === 'all' || showcaseMode === 'admin') && (
          <div className="relative border border-slate-800 rounded-3xl bg-slate-950 p-1 md:p-6 shadow-2xl overflow-hidden">
            <div className="absolute top-6 left-12 flex items-center gap-2 pointer-events-none">
              <span className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">🛡️ Admin Space Workspace (Demo Mode)</span>
            </div>
            <div className="pt-8">
              <UnifiedDashboard isDemoMode={true} demoRole="admin" />
            </div>
          </div>
        )}
      </div>

      {/* Debug Footer Section */}
      <div className="mt-16 pt-8 border-t border-slate-800 grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs text-slate-400 font-mono">
        <div>
          <h2 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2"><Layers size={16} /> Platforms Trust Badges Check</h2>
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Radiant */}
            <div className="flex flex-col items-center text-center space-y-3 bg-slate-900/50 p-4 border border-slate-800 rounded-xl">
              <span className="px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[9px] font-bold rounded-full">RADIANT TRUSTED</span>
              <div className="relative">
                <div className="rounded-full bg-gradient-to-tr from-purple-500 via-pink-400 to-indigo-500 p-0.5 shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center border-2 border-slate-950">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=128&auto=format&fit=crop" alt="Radiant" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            </div>
            {/* Luminous */}
            <div className="flex flex-col items-center text-center space-y-3 bg-slate-900/50 p-4 border border-slate-800 rounded-xl">
              <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[9px] font-bold rounded-full">LUMINOUS TRUSTED</span>
              <div className="relative">
                <div className="rounded-full bg-gradient-to-tr from-cyan-400 via-teal-350 to-blue-400 p-0.5 shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center border-2 border-slate-950">
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=128&auto=format&fit=crop" alt="Luminous" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            </div>
            {/* Faint */}
            <div className="flex flex-col items-center text-center space-y-3 bg-slate-900/50 p-4 border border-slate-800 rounded-xl">
              <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 text-[9px] font-bold rounded-full">FAINT TRUSTED</span>
              <div className="relative">
                <div className="rounded-full border border-slate-700 bg-slate-800 p-0.5 shadow-sm">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center border-2 border-slate-950">
                    <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=128&auto=format&fit=crop" alt="Faint" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2"><User size={16} /> Authenticated Session State</h2>
          <div className="bg-slate-955 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-500 block">Logged In User ID:</span>
                <strong className="text-blue-400">#{user?.id || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">User Email Address:</span>
                <strong className="text-blue-400">{user?.email || 'N/A'}</strong>
              </div>
            </div>
            <div>
              <span className="text-slate-500 block">Assigned Auth Roles:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {user?.roles?.length ? (
                  (Array.isArray(user.roles) ? user.roles : [user.roles]).map((r, i) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded text-[10px] font-bold uppercase">{r}</span>
                  ))
                ) : (
                  <span className="text-slate-600 italic">No role privileges</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
