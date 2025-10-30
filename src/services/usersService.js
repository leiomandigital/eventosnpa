import supabase from '../lib/supabaseClient';
import { hashSHA256 } from '../utils/hash';
import { sanitizeInput } from '../utils/sanitize';

const ROLE_OPTIONS = ['admin', 'organizer', 'participant'];
const STATUS_OPTIONS = ['ativo', 'inativo'];

export async function loginUser({ login, password }) {
  const normalizedLogin = sanitizeInput(login).toLowerCase();
  const passwordHash = await hashSHA256(password ?? '');

  const { data: user, error } = await supabase
    .from('users')
    .select('id, login, name, phone, role, status, password_hash, password_change_required')
    .eq('login', normalizedLogin)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!user || user.status !== 'ativo' || user.password_hash !== passwordHash) {
    throw new Error('Credenciais invalidas ou usuario inativo.');
  }

  const { password_hash: _passwordHash, ...rest } = user;
  return rest;
}

export async function fetchUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, login, name, phone, role, status, password_change_required, created_at')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createUser(userData) {
  if (!ROLE_OPTIONS.includes(userData.role)) {
    throw new Error('Papel invalido.');
  }

  if (!STATUS_OPTIONS.includes(userData.status)) {
    throw new Error('Status invalido.');
  }

  const login = sanitizeInput(userData.login).toLowerCase();
  const name = sanitizeInput(userData.name);
  const phone = sanitizeInput(userData.phone);

  if (!login) {
    throw new Error('Login obrigatorio.');
  }

  const passwordHash = await hashSHA256(userData.password);

  const payload = {
    login,
    name,
    phone,
    role: userData.role,
    status: userData.status,
    password_hash: passwordHash,
    password_change_required: Boolean(userData.passwordChangeRequired),
  };

  const { data, error } = await supabase.from('users').insert([payload]).select('id').single();

  if (error) {
    throw error;
  }
}

export async function updateUser(userId, updates) {
  const payload = {};

  if (updates.login !== undefined) {
    payload.login = sanitizeInput(updates.login).toLowerCase();
  }
  if (updates.name !== undefined) {
    payload.name = sanitizeInput(updates.name);
  }
  if (updates.phone !== undefined) {
    payload.phone = sanitizeInput(updates.phone);
  }
  if (updates.role !== undefined) {
    if (!ROLE_OPTIONS.includes(updates.role)) {
      throw new Error('Papel invalido.');
    }
    payload.role = updates.role;
  }
  if (updates.status !== undefined) {
    if (!STATUS_OPTIONS.includes(updates.status)) {
      throw new Error('Status invalido.');
    }
    payload.status = updates.status;
  }
  if (updates.passwordChangeRequired !== undefined) {
    payload.password_change_required = Boolean(updates.passwordChangeRequired);
  }
  if (updates.password) {
    payload.password_hash = await hashSHA256(updates.password);
  }

  if (Object.keys(payload).length === 0) {
    return;
  }

  const { error } = await supabase
    .from('users')
    .update(payload)
    .eq('id', userId);

  if (error) {
    throw error;
  }
}

export async function updateUserPassword(userId, newPassword) {
  const passwordHash = await hashSHA256(newPassword);
  const { error } = await supabase
    .from('users')
    .update({
      password_hash: passwordHash,
      password_change_required: false,
    })
    .eq('id', userId);

  if (error) {
    throw error;
  }
}

export async function deleteUser(userId) {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) {
    throw error;
  }
}

export default {
  loginUser,
  fetchUsers,
  createUser,
  updateUser,
  updateUserPassword,
  deleteUser,
};
