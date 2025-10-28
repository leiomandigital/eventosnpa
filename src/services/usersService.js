import supabase from '../lib/supabaseClient';
import { hashSHA256 } from '../utils/hash';

const ROLE_OPTIONS = ['admin', 'organizer', 'participant'];
const STATUS_OPTIONS = ['ativo', 'inativo'];

export async function loginUser({ email, password }) {
  const normalizedEmail = (email ?? '').trim().toLowerCase();
  const passwordHash = await hashSHA256(password ?? '');

  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, phone, role, status, password_hash')
    .eq('email', normalizedEmail)
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
    .select('id, name, email, phone, role, status, created_at')
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

  const passwordHash = await hashSHA256(userData.password);

  const payload = {
    name: userData.name,
    email: (userData.email ?? '').trim().toLowerCase(),
    phone: userData.phone,
    role: userData.role,
    status: userData.status,
    password_hash: passwordHash,
  };

  const { error } = await supabase.from('users').insert(payload);

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
  deleteUser,
};
