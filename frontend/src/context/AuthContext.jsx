import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [authState, setAuthState] = useState('loading'); // 'loading', 'authenticated', 'unauthenticated', 'error'

  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
        const res = await api.get('/auth/me');
        if (mounted) {
          setUser(res.data.data.user);
          setWallet(res.data.data.user.wallet);
          setAuthState('authenticated');
        }
      } catch (error) {
        // Safe unauthenticated state on startup
        if (mounted) {
          setUser(null);
          setWallet(null);
          setAuthState(error.response?.status === 401 ? 'unauthenticated' : 'error');
        }
      }
    };

    initAuth();

    const handleTokenRefresh = (e) => setToken(e.detail);
    const handleLogout = () => {
      setUser(null);
      setWallet(null);
      setToken(null);
      setAuthState('unauthenticated');
    };

    window.addEventListener('tokenRefreshed', handleTokenRefresh);
    window.addEventListener('logout', handleLogout);

    return () => {
      mounted = false;
      window.removeEventListener('tokenRefreshed', handleTokenRefresh);
      window.removeEventListener('logout', handleLogout);
    };
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: userData, access_token } = res.data.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    setUser(userData);
    
    try {
      const walletRes = await api.get('/wallet', { headers: { Authorization: `Bearer ${access_token}` } });
      setWallet(walletRes.data.data.wallet);
    } catch (e) {
      console.error('Failed to load wallet on login', e);
    }
    
    setAuthState('authenticated');
    return userData;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    const { user: userData, wallet: walletData, access_token } = res.data.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    setUser(userData);
    setWallet(walletData);
    setAuthState('authenticated');
    return userData;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error(e);
    } finally {
      setUser(null);
      setWallet(null);
      setToken(null);
      setAuthState('unauthenticated');
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data.user);
      setWallet(res.data.data.user.wallet);
    } catch (e) {
      console.error('Failed to refresh user', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, wallet, token, login, register, logout, refreshUser, authState }}>
      {children}
    </AuthContext.Provider>
  );
};
