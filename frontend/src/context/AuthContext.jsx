import React, { createContext, useContext, useEffect, useState } from 'react';
import { loginApi, getMeApi, seedUsersApi } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('mf_token'));
  const [loading, setLoading] = useState(true);

  // Initialize Auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const userData = await getMeApi();
          setUser(userData);
        } catch (error) {
          console.error('Failed to restore session:', error);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (identifier, password, role = null) => {
    try {
      const data = await loginApi(identifier, password, role);
      localStorage.setItem('mf_token', data.token);
      setToken(data.token);
      setUser({
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status,
        avatar: data.avatar,
      });
      return { success: true, data };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Login failed. Please check credentials.';
      return { success: false, message };
    }
  };

  const quickDemoLogin = async (role) => {
    // Ensure demo accounts are seeded first
    try {
      await seedUsersApi();
    } catch (e) {
      // Ignore if already seeded
    }

    const demoCredentials = {
      Admin: { email: 'admin@microfinance.com', password: 'password123' },
      Agent: { email: 'agent@microfinance.com', password: 'password123' },
      Customer: { email: 'customer@microfinance.com', password: 'password123' },
    };

    const creds = demoCredentials[role] || { email: '', password: '' };
    return await login(creds.email, creds.password, role);
  };

  const logout = () => {
    localStorage.removeItem('mf_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        quickDemoLogin,
        isAuthenticated: !!user,
        role: user?.role || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
