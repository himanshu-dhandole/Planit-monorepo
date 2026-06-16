import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import apiClient from '../lib/apiClient';

export default function Protected({ children, authentication = true }) {
  const navigate = useNavigate();
  const [loader, setLoader] = useState(true);

  const refreshAccessToken = async () => {
    try {
      const response = await apiClient.post('/auth/refresh');
      const newAccessToken = response.data?.accessToken;
      if (newAccessToken) {
        localStorage.setItem('accessToken', newAccessToken);
        return true;
      }
      return false;
    } catch (error) {
      localStorage.removeItem('accessToken');
      return false;
    }
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('accessToken');

      if (!token || token === 'undefined') {
        setLoader(false);
        if (authentication) {
          navigate('/signin');
        }
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
          const refreshed = await refreshAccessToken();
          if (!refreshed) {
            navigate('/signin');
            setLoader(false);
            return;
          }
        }

        if (!authentication) {
          navigate('/');
        }
      } catch (error) {
        localStorage.removeItem('accessToken');
        if (authentication) {
          navigate('/signin');
        }
      }

      setLoader(false);
    };

    checkAuthStatus();
  }, [navigate, authentication]);

  if (loader) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB]">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
