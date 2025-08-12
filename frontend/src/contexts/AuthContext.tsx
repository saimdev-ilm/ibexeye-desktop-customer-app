// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { 
  User, 
  login as authLogin,
  logout as authLogout,
  getUserData,
  isAuthenticated as checkIsAuthenticated
} from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      const authenticated = checkIsAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const userData = getUserData();
        setUser(userData);
      }
      
      setIsLoading(false);
    };
    
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const userData = await authLogin({ email, password });
      setUser(userData);
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    authLogout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};