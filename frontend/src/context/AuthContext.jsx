import React, { createContext, useState, useEffect } from 'react';
import apiClient from '../lib/apiClient';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          setUser({ id: decoded.sub, email: decoded.email || 'User', roles: decoded.role || [] });
        } catch (error) {
          console.error("Token decoding failed", error);
          localStorage.removeItem('accessToken');
          setUser(null);
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
      setUser({ id: decoded.sub, email: decoded.email || email, roles: decoded.role || [] });
      return response;
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

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
