import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import {
  fetchUsers,
  createUser as createUserService,
  updateUser as updateUserService,
  deleteUser as deleteUserService,
} from '../services/usersService';
import { useAuth } from './AuthContext';

const UsersContext = createContext(null);

export const UsersProvider = ({ children }) => {
  const { currentUser, userRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (error) {
      const message = error?.message ?? 'Não foi possível carregar os usuários.';
      window.alert(message);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const createUser = useCallback(async (userData) => {
    try {
      await createUserService(userData);
      await loadUsers();
      window.alert('Usuário criado com sucesso.');
    } catch (error) {
      const message = error?.message ?? 'Não foi possível criar o usuário.';
      window.alert(message);
      throw error;
    }
  }, [loadUsers]);

  const updateUser = useCallback(async (userId, userData) => {
    try {
      await updateUserService(userId, userData);
      await loadUsers();
      window.alert('Usuário atualizado com sucesso.');
    } catch (error) {
      const message = error?.message ?? 'Não foi possível atualizar o usuário.';
      window.alert(message);
      throw error;
    }
  }, [loadUsers]);

  const deleteUser = useCallback(async (userId) => {
    try {
      await deleteUserService(userId);
      await loadUsers();
    } catch (error) {
      const message = error?.message ?? 'Não foi possível excluir o usuário.';
      window.alert(message);
      throw error;
    }
  }, [loadUsers]);

  // Load users if admin and currentView is 'users' - this logic will be moved to AppRouter or specific view
  // For now, let's just load users if the current user is admin.
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadUsers();
    }
  }, [currentUser, loadUsers]);

  const value = {
    users,
    usersLoading,
    loadUsers,
    createUser,
    updateUser,
    deleteUser,
  };

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
};

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
};
