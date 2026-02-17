import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { getApiUrl, apiRequest } from '@/lib/query-client';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  birthDate: string | null;
  gender: string | null;
  photoUrl: string | null;
  personalInviteCode: string | null;
  pairedCogenitore: string | null;
  pairedCogenitori: string | null;
  isProfileComplete: boolean | null;
  isPremium: boolean | null;
  createdAt: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  completeProfile: (data: { name: string; birthDate: string; gender: string; photoUrl?: string }) => Promise<{ success: boolean; message?: string }>;
  refreshUser: () => Promise<void>;
  updatePremium: (isPremium: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await apiRequest('GET', '/api/auth/me');
      const data = await res.json();
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await apiRequest('POST', '/api/auth/login', { email, password });
      const data = await res.json();
      setUser(data);
      return { success: true };
    } catch (error: any) {
      const msg = error?.message || 'Errore nel login';
      const cleanMsg = msg.replace(/^\d+:\s*/, '');
      return { success: false, message: cleanMsg };
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const res = await apiRequest('POST', '/api/auth/register', { email, password });
      const data = await res.json();
      setUser(data);
      return { success: true };
    } catch (error: any) {
      const msg = error?.message || 'Errore nella registrazione';
      const cleanMsg = msg.replace(/^\d+:\s*/, '');
      return { success: false, message: cleanMsg };
    }
  };

  const logout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
    } catch {}
    setUser(null);
  };

  const completeProfile = async (data: { name: string; birthDate: string; gender: string; photoUrl?: string }) => {
    try {
      const res = await apiRequest('PUT', '/api/auth/profile', data);
      const updated = await res.json();
      setUser(updated);
      return { success: true };
    } catch (error: any) {
      const msg = error?.message || 'Errore nel completamento profilo';
      const cleanMsg = msg.replace(/^\d+:\s*/, '');
      return { success: false, message: cleanMsg };
    }
  };

  const refreshUser = async () => {
    try {
      const res = await apiRequest('GET', '/api/auth/me');
      const data = await res.json();
      setUser(data);
    } catch {}
  };

  const updatePremium = async (isPremium: boolean) => {
    try {
      const res = await apiRequest('PUT', '/api/auth/premium', { isPremium });
      const data = await res.json();
      setUser(data);
    } catch {}
  };

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    completeProfile,
    refreshUser,
    updatePremium,
  }), [user, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
