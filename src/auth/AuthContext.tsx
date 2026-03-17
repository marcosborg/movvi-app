import { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest, ApiError } from '../lib/api';

const TOKEN_KEY = 'movvi.access_token';

type DriverProfile = {
  id: number;
  code: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: {
    id: number;
    name: string;
  } | null;
};

type UserProfile = {
  id: number;
  name: string;
  email: string;
  roles: string[];
};

type MeResponse = {
  user: UserProfile;
  driver: DriverProfile | null;
};

type LoginResponse = {
  access_token: string;
  token_type: string;
  user: UserProfile;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  user: UserProfile | null;
  driver: DriverProfile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    void loadMe(token);
  }, [token]);

  async function loadMe(currentToken: string) {
    try {
      const response = await apiRequest<MeResponse>('/api/v1/mobile/me', {
        method: 'GET',
        token: currentToken,
      });

      setUser(response.user);
      setDriver(response.driver);
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
      setDriver(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const response = await apiRequest<LoginResponse>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem(TOKEN_KEY, response.access_token);
    setToken(response.access_token);
    setUser(response.user);

    try {
      const me = await apiRequest<MeResponse>('/api/v1/mobile/me', {
        method: 'GET',
        token: response.access_token,
      });

      setUser(me.user);
      setDriver(me.driver);
    } catch (error) {
      if (error instanceof ApiError) {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
        setDriver(null);
      }

      throw error;
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setDriver(null);
    setIsLoading(false);
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(token),
        isLoading,
        token,
        user,
        driver,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
