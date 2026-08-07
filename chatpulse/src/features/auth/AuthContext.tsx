import React, { createContext, useContext, useEffect } from 'react';
import { User } from '../../types/types';
import { authService } from './services/auth.service';
import { userService } from '../users/services/user.service';
import { tokenStorage } from '../../lib/api/client';
import { transformUser } from '../../utils/transformers';
import { useAuthState } from './useAuth';

interface AuthContextValue {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updatedData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentUser, setCurrentUser } = useAuthState();

  // Restore session from stored tokens on first load.
  useEffect(() => {
    const token = tokenStorage.getAccessToken();
    if (token && !currentUser) {
      authService
        .getCurrentUser()
        .then((userRes) => setCurrentUser(transformUser(userRes)))
        .catch((err) => console.error('Session restore failed', err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  // Force logout when the refresh token becomes invalid.
  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await authService.login(email, password);
      const userRes = await authService.getCurrentUser();
      setCurrentUser(transformUser(userRes));
      return true;
    } catch (err) {
      console.error('Login failed', err);
      return false;
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      await authService.register(name, email, password);
      return await login(email, password);
    } catch (err) {
      console.error('Signup failed', err);
      return false;
    }
  };

  const updateProfile = async (updatedData: Partial<User>) => {
    try {
      const response = await userService.updateProfile(updatedData);
      setCurrentUser(transformUser(response.user));
    } catch (err) {
      console.error('Error updating profile', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{ currentUser, login, signup, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};