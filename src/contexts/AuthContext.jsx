import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { loginUser, updateUserPassword } from '../services/usersService';

const AuthContext = createContext(null);
const USER_STORAGE_KEY = 'event-management-user';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');

  useEffect(() => {
    const persistedUser = window.localStorage.getItem(USER_STORAGE_KEY);
    if (persistedUser) {
      try {
        const user = JSON.parse(persistedUser);
        setCurrentUser(user);
      } catch (error) {
        window.localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    setAuthLoading(false);
  }, []);

  const login = useCallback(async ({ login: username, password }) => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const user = await loginUser({ login: username, password });
      setCurrentUser(user);
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      return user;
    } catch (error) {
      const message = error?.message ?? 'Não foi possível autenticar.';
      setAuthError(message);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(USER_STORAGE_KEY);
    setCurrentUser(null);
  }, []);

  const forcePasswordChange = useCallback(async (userId, newPassword) => {
    setPasswordChangeLoading(true);
    setPasswordChangeError('');
    try {
      await updateUserPassword(userId, newPassword);
      const updatedUser = {
        ...currentUser,
        password_change_required: false,
      };
      setCurrentUser(updatedUser);
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      window.alert('Senha alterada com sucesso!');
      return true;
    } catch (error) {
      const message = error?.message ?? 'Não foi possível alterar a senha.';
      setPasswordChangeError(message);
      throw error;
    } finally {
      setPasswordChangeLoading(false);
    }
  }, [currentUser]);

  const userRole = currentUser?.role ?? 'participant';
  const isAuthenticated = !!currentUser;
  const requiresPasswordChange = currentUser?.password_change_required ?? false;

  const value = {
    currentUser,
    isAuthenticated,
    userRole,
    authLoading,
    authError,
    requiresPasswordChange,
    passwordChangeLoading,
    passwordChangeError,
    login,
    logout,
    forcePasswordChange,
    setCurrentUser, // Allow AppRouter to update currentUser directly
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
