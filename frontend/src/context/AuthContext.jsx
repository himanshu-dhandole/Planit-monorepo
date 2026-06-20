import React, { createContext, useState, useEffect } from 'react';
import apiClient from '../lib/apiClient';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

const parseRoles = (rolesClaim) => {
  if (!rolesClaim) return [];
  if (Array.isArray(rolesClaim)) return rolesClaim;
  if (typeof rolesClaim === 'string') {
    return rolesClaim.replace(/^\[|\]$/g, '').split(',').map(r => r.trim()).filter(Boolean);
  }
  return [];
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          const userData = { id: decoded.sub, email: decoded.email || 'User', name: decoded.name || 'User', roles: parseRoles(decoded.role) };
          setUser(userData);
          
          // Fetch customer profile on load
          try {
            const res = await apiClient.get(`/api/customer/user/${userData.id}`);
            if (res.data) {
              setCustomerProfile(res.data.data || res.data);
            }
          } catch (err) {
            setCustomerProfile(null);
          }

          // Fetch fresh token/role from backend database
          try {
            const response = await apiClient.post('/auth/refresh');
            const freshToken = response.data?.data?.accessToken || response.data?.accessToken;
            if (freshToken) {
              localStorage.setItem('accessToken', freshToken);
              const freshDecoded = jwtDecode(freshToken);
              const freshUserData = { 
                id: freshDecoded.sub, 
                email: freshDecoded.email || freshDecoded.sub, 
                name: freshDecoded.name || freshDecoded.email?.split("@")[0] || 'User',
                roles: parseRoles(freshDecoded.role) 
              };
              setUser(freshUserData);
            }
          } catch (refreshErr) {
            console.error("Background token refresh failed on init", refreshErr);
          }
        } catch (error) {
          console.error("Token decoding failed", error);
          localStorage.removeItem('accessToken');
          setUser(null);
          setCustomerProfile(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const accessToken = response.data?.data?.accessToken || response.data?.accessToken;
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
      const decoded = jwtDecode(accessToken);
      const userData = { id: decoded.sub, email: decoded.email || email, name: decoded.name || decoded.email?.split("@")[0] || email || 'User', roles: parseRoles(decoded.role) };
      setUser(userData);

      // Fetch profile
      let hasProfile = false;
      try {
        const res = await apiClient.get(`/api/customer/user/${userData.id}`);
        if (res.data) {
          setCustomerProfile(res.data.data || res.data);
          hasProfile = true;
        }
      } catch (err) {
        setCustomerProfile(null);
      }
      
      return { response, hasProfile };
    } else {
      throw new Error('Access token missing from response');
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (_) {
      // ignore
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
      window.location.href = '/signin';
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiClient.post('/auth/refresh');
      const token = response.data?.data?.accessToken || response.data?.accessToken;
      if (token) {
        localStorage.setItem('accessToken', token);
        const decoded = jwtDecode(token);
        const userData = { id: decoded.sub, email: decoded.email || decoded.sub, name: decoded.name || decoded.email?.split("@")[0] || 'User', roles: parseRoles(decoded.role) };
        setUser(userData);

        // Fetch fresh customer profile
        try {
          const res = await apiClient.get(`/api/customer/user/${userData.id}`);
          if (res.data) {
            setCustomerProfile(res.data.data || res.data);
          }
        } catch (profileErr) {
          setCustomerProfile(null);
        }
      }
    } catch (error) {
      console.error("Token refresh failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, customerProfile, setCustomerProfile, login, logout, refreshUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
