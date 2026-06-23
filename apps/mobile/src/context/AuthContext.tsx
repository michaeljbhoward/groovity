import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';

interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadToken();
  }, []);

  async function loadToken() {
    try {
      const stored = await SecureStore.getItemAsync('auth_token');
      if (stored) {
        api.setToken(stored);
        const me = await api.getMe();
        setToken(stored);
        setUser(me);
      }
    } catch {
      await SecureStore.deleteItemAsync('auth_token');
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const res = await api.login(email, password);
    await SecureStore.setItemAsync('auth_token', res.token);
    api.setToken(res.token);
    setToken(res.token);
    setUser(res.user);
  }

  async function register(email: string, password: string, displayName: string) {
    const res = await api.register(email, password, displayName);
    await SecureStore.setItemAsync('auth_token', res.token);
    api.setToken(res.token);
    setToken(res.token);
    setUser(res.user);
  }

  async function logout() {
    await SecureStore.deleteItemAsync('auth_token');
    api.setToken(null);
    setToken(null);
    setUser(null);
  }

  function updateUser(data: Partial<User>) {
    if (user) setUser({ ...user, ...data });
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
