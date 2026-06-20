import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../lib/apiClient';
import { User, Star } from 'lucide-react';

export default function Sandbox() {
  const { user, loading: authLoading, refreshUser } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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
      setData({ ...data, fetchUrl: url, message: "Fetching..." });
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
    return <div className="p-8 text-xl font-bold">Loading Sandbox...</div>;
  }

  return (
    <div className="p-8 font-mono bg-gray-100 min-h-screen text-sm text-gray-800">
      <h1 className="text-2xl font-bold mb-4">Sandbox Debug Page</h1>

      {/* Badge Showcase Section */}
      <div className="mb-8 font-sans">
        <h2 className="text-xl font-bold bg-indigo-600 text-white p-4 rounded-t-2xl flex items-center gap-2">
          <Star className="animate-pulse text-yellow-300" size={20} fill="currentColor" />
          LinkedIn-Style Trust Badge Showcase (Testing)
        </h2>
        
        <div className="bg-white p-8 rounded-b-2xl border border-slate-200 shadow-sm space-y-6">
          <p className="text-sm text-gray-600 font-medium">
            Below is a live preview of how trust badges and avatar frames render depending on user Aura scores:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
            
            {/* Radiant Trusted Showcase */}
            <div className="flex flex-col items-center p-6 bg-purple-50/30 border border-purple-100 rounded-3xl text-center space-y-4">
              <span className="text-xs font-bold text-purple-700 uppercase tracking-widest bg-purple-100 px-3 py-1 rounded-full">
                Radiant (Aura &gt;= 800.0)
              </span>
              
              <div className="relative">
                <div className="rounded-full bg-gradient-to-tr from-purple-500 via-pink-400 to-indigo-500 p-1 shadow-[0_0_20px_rgba(168,85,247,0.6)] animate-pulse">
                  <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-4 border-white">
                    <img 
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop" 
                      alt="Radiant Avatar Preview" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                </div>
                
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 px-3 py-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[9px] font-black tracking-wider uppercase border border-white rounded-full shadow flex items-center gap-0.5 whitespace-nowrap">
                  <Star size={8} fill="currentColor" />
                  RADIANT TRUSTED
                </div>
              </div>

              <div className="pt-2 text-xs text-gray-500 font-semibold">
                Aura score range: 800.0 - 1000.0
              </div>
            </div>

            {/* Luminous Trusted Showcase */}
            <div className="flex flex-col items-center p-6 bg-cyan-50/30 border border-cyan-100 rounded-3xl text-center space-y-4">
              <span className="text-xs font-bold text-cyan-700 uppercase tracking-widest bg-cyan-100 px-3 py-1 rounded-full">
                Luminous (Aura 500.0 - 799.9)
              </span>
              
              <div className="relative">
                <div className="rounded-full bg-gradient-to-tr from-cyan-400 via-teal-350 to-blue-400 p-1 shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                  <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-4 border-white">
                    <img 
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop" 
                      alt="Luminous Avatar Preview" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                </div>
                
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 px-3 py-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[9px] font-black tracking-wider uppercase border border-white rounded-full shadow flex items-center gap-0.5 whitespace-nowrap">
                  <Star size={8} fill="currentColor" />
                  LUMINOUS TRUSTED
                </div>
              </div>

              <div className="pt-2 text-xs text-gray-500 font-semibold">
                Aura score range: 500.0 - 799.9
              </div>
            </div>

            {/* Faint Showcase */}
            <div className="flex flex-col items-center p-6 bg-gray-50/50 border border-gray-100 rounded-3xl text-center space-y-4">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">
                Faint (Aura &lt; 500.0)
              </span>
              
              <div className="relative">
                <div className="rounded-full border-4 border-white shadow-lg bg-gray-100 p-0.5">
                  <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                    <img 
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&auto=format&fit=crop" 
                      alt="Faint Avatar Preview" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 text-xs text-gray-500 font-semibold">
                Aura score range: 0.0 - 499.9
              </div>
            </div>

          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-lg font-bold bg-blue-200 p-2">Current AuthContext User</h2>
        <div className="bg-white p-4 shadow mb-2">
          <p><strong>ID:</strong> {user?.id}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Roles:</strong> {user?.roles?.length ? (
            <span className="flex gap-2 mt-1">
              {(Array.isArray(user.roles) ? user.roles : [user.roles]).map((r, i) => (
                <span key={i} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold">{r}</span>
              ))}
            </span>
          ) : 'None'}</p>
          <button 
            onClick={async () => {
              setLoading(true);
              await refreshUser();
              setLoading(false);
            }}
            className="mt-4 bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition"
          >
            Refresh Auth Context
          </button>
        </div>
        <pre className="bg-white p-4 shadow text-xs overflow-auto">{JSON.stringify(user, null, 2)}</pre>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold bg-green-200 p-2">Successful Fetch Result</h2>
        {data ? (
          <pre className="bg-white p-4 shadow">{JSON.stringify(data, null, 2)}</pre>
        ) : (
          <div className="bg-white p-4 shadow italic text-gray-500">No successful data</div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold bg-red-200 p-2">Error Fetch Result</h2>
        {error ? (
          <pre className="bg-white p-4 shadow text-red-600">{JSON.stringify(error, null, 2)}</pre>
        ) : (
          <div className="bg-white p-4 shadow italic text-gray-500">No errors occurred</div>
        )}
      </div>
      
      <button 
        onClick={() => { setLoading(true); setError(null); setData(null); fetchData(); }}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Retry Fetch
      </button>
    </div>
  );
}
