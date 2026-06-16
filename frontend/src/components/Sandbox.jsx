import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../lib/apiClient';

export default function Sandbox() {
  const { user, loading: authLoading } = useContext(AuthContext);
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
      
      <div className="mb-8">
        <h2 className="text-lg font-bold bg-blue-200 p-2">Current AuthContext User</h2>
        <pre className="bg-white p-4 shadow">{JSON.stringify(user, null, 2)}</pre>
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
