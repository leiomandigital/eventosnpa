import React, { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const roleLabels = {
  admin: 'Administrador',
  organizer: 'Organizador',
  participant: 'Participante',
};

const statusLabels = {
  ativo: { label: 'Ativo', className: 'bg-sky-100 text-sky-700' },
  inativo: { label: 'Inativo', className: 'bg-gray-200 text-gray-700' },
};

const initialFormState = {
  name: '',
  email: '',
  phone: '+55',
  password: '',
  role: 'organizer',
  status: 'ativo',
};

const UsersView = ({
  users = [],
  loading = false,
  onCreateUser,
  onDeleteUser,
}) => {
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const hasUsers = useMemo(() => users.length > 0, [users.length]);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handlePhoneChange = (event) => {
    const raw = event.target.value.replace(/[^\d+]/g, '');
    const normalized = raw.startsWith('+') ? raw : `+${raw}`;
    setFormData(prev => ({ ...prev, phone: normalized }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Informe o nome completo.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Informe o email.';
    }

    if (!formData.phone.trim() || !/^\+\d{11,15}$/.test(formData.phone)) {
      newErrors.phone = 'Informe um telefone no formato +5527999509227.';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Informe uma senha para o usuario.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddUser = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      await onCreateUser?.(formData);
      setFormData(initialFormState);
      setErrors({});
    } catch (error) {
      const message = error?.message ?? 'Nao foi possivel criar o usuario.';
      window.alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    const confirmation = window.confirm('Deseja realmente remover este usuario?');
    if (!confirmation) {
      return;
    }

    try {
      await onDeleteUser?.(userId);
    } catch (error) {
      const message = error?.message ?? 'Nao foi possivel remover o usuario.';
      window.alert(message);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <header className="space-y-2">
        <h2 className="text-2xl font-bold text-sky-600">Gerenciar Usuarios</h2>
        <p className="text-sm text-gray-600">Somente administradores podem acessar esta area.</p>
      </header>

      <form 
        onSubmit={handleAddUser}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome completo</label>
            <input
              type="text"
              value={formData.name}
              onChange={handleInputChange('name')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="Ex: Ana Souza"
              required
              disabled={submitting}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="email@empresa.com"
              required
              disabled={submitting}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={handlePhoneChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="+5527999509227"
              required
              disabled={submitting}
            />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
            <input
              type="password"
              value={formData.password}
              onChange={handleInputChange('password')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="********"
              required
              disabled={submitting}
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Papel</label>
            <select
              value={formData.role}
              onChange={handleInputChange('role')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              disabled={submitting}
            >
              <option value="admin">Administrador</option>
              <option value="organizer">Organizador</option>
              <option value="participant">Participante</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={handleInputChange('status')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              disabled={submitting}
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Usuarios inativos nao conseguem acessar o sistema.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center space-x-2 bg-sky-600 text-white px-5 py-2.5 rounded-lg hover:bg-sky-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={submitting}
          >
            <Plus className="w-4 h-4" />
            <span>{submitting ? 'Salvando...' : 'Adicionar usuario'}</span>
          </button>
        </div>
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Papel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading && (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center text-sm text-gray-500">
                  Carregando usuarios...
                </td>
              </tr>
            )}

            {!loading && !hasUsers && (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center text-sm text-gray-500">
                  Nenhum usuario cadastrado ate o momento.
                </td>
              </tr>
            )}

            {!loading && users.map(user => {
              const statusInfo = statusLabels[user.status] ?? statusLabels.ativo;
              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.phone}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                      {roleLabels[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Excluir usuario"
                      type="button"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersView;
