import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, Trash2 } from 'lucide-react';

const roleLabels = {
  admin: 'Administrador',
  organizer: 'Organizador',
  participant: 'Participante',
};

const statusLabels = {
  ativo: { label: 'Ativo', className: 'bg-sky-100 text-sky-700' },
  inativo: { label: 'Inativo', className: 'bg-gray-200 text-gray-700' },
};

const COUNTRY_MAP = {
  '+55': 'Brasil',
  '+351': 'Portugal',
  '+1': 'Estados Unidos',
  '+44': 'Reino Unido',
  '+34': 'Espanha',
};

const DEFAULT_FORM_STATE = {
  login: '',
  name: '',
  countryCode: '+55',
  ddd: '',
  phoneNumber: '',
  password: '',
  role: 'organizer',
  status: 'ativo',
  passwordChangeRequired: true,
};

const sanitizeDigits = (value = '') => value.replace(/\D/g, '');

const formatPhoneNumber = (countryCode, ddd, number) => {
  const cleanCountry = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
  const digitsDDD = sanitizeDigits(ddd).slice(0, 3);
  const digitsNumber = sanitizeDigits(number).slice(0, 9);

  if (!cleanCountry || !digitsDDD || !digitsNumber) {
    return '';
  }

  const formattedNumber = digitsNumber.length > 5
    ? `${digitsNumber.slice(0, digitsNumber.length - 4)}-${digitsNumber.slice(-4)}`
    : digitsNumber;

  return `${cleanCountry} (${digitsDDD}) ${formattedNumber}`;
};

const decomposePhone = (phone) => {
  if (!phone) {
    return {
      countryCode: DEFAULT_FORM_STATE.countryCode,
      ddd: '',
      phoneNumber: '',
    };
  }

  const digits = sanitizeDigits(phone);

  if (digits.length < 5) {
    return {
      countryCode: DEFAULT_FORM_STATE.countryCode,
      ddd: '',
      phoneNumber: digits,
    };
  }

  const regex = /^(\d{1,3})(\d{2,3})(\d{4,5})(\d{0,4})?$/;
  const match = digits.match(regex);

  if (match) {
    const [, country, area, main, suffix] = match;
    const number = suffix ? `${main}${suffix}` : main;
    return {
      countryCode: `+${country}`,
      ddd: area,
      phoneNumber: number,
    };
  }

  return {
    countryCode: DEFAULT_FORM_STATE.countryCode,
    ddd: digits.slice(0, 3),
    phoneNumber: digits.slice(-9),
  };
};

const UsersView = ({
  users = [],
  loading = false,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  const [formData, setFormData] = useState(DEFAULT_FORM_STATE);
  const [countryName, setCountryName] = useState(COUNTRY_MAP[DEFAULT_FORM_STATE.countryCode] || 'Pais nao identificado');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  const hasUsers = useMemo(() => users.length > 0, [users.length]);

  const maskedPhoneNumber = useMemo(() => {
    const digits = formData.phoneNumber;
    if (!digits) return '';
    if (digits.length <= 4) return digits;
    return `${digits.slice(0, digits.length - 4)}-${digits.slice(-4)}`;
  }, [formData.phoneNumber]);

  useEffect(() => {
    setCountryName(COUNTRY_MAP[formData.countryCode] || 'Pais nao identificado');
  }, [formData.countryCode]);

  const resetForm = () => {
    setFormData(DEFAULT_FORM_STATE);
    setErrors({});
    setSubmitting(false);
    setEditingUserId(null);
  };

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleCountryCodeChange = (event) => {
    let value = event.target.value.trim();
    value = value.startsWith('+') ? value : `+${value}`;
    value = `+${sanitizeDigits(value)}`.slice(0, 5);
    setFormData(prev => ({ ...prev, countryCode: value || '+55' }));
  };

  const handleDDDChange = (event) => {
    const digits = sanitizeDigits(event.target.value).slice(0, 3);
    setFormData(prev => ({ ...prev, ddd: digits }));
  };

  const handlePhoneNumberChange = (event) => {
    const digits = sanitizeDigits(event.target.value).slice(0, 9);
    setFormData(prev => ({ ...prev, phoneNumber: digits }));
  };

  const validateForm = (isEditing = false) => {
    const newErrors = {};

    if (!formData.login.trim()) newErrors.login = 'Informe o login.';
    if (!formData.name.trim()) newErrors.name = 'Informe o nome completo.';
    if (!formData.countryCode.trim()) newErrors.countryCode = 'Informe o codigo do pais.';
    if (!formData.ddd.trim()) newErrors.ddd = 'Informe o DDD.';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Informe o telefone.';
    if (!isEditing && !formData.password.trim()) newErrors.password = 'Informe uma senha inicial.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditUser = (user) => {
    const phoneParts = decomposePhone(user.phone);
    setFormData({
      login: user.login,
      name: user.name,
      countryCode: phoneParts.countryCode || DEFAULT_FORM_STATE.countryCode,
      ddd: phoneParts.ddd,
      phoneNumber: phoneParts.phoneNumber,
      password: '',
      role: user.role,
      status: user.status,
      passwordChangeRequired: Boolean(user.password_change_required),
    });
    setEditingUserId(user.id);
    setErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const isEditing = Boolean(editingUserId);

    if (!validateForm(isEditing)) {
      return;
    }

    const phone = formatPhoneNumber(formData.countryCode, formData.ddd, formData.phoneNumber);
    if (!phone) {
      setErrors(prev => ({ ...prev, phoneNumber: 'Telefone invalido.' }));
      return;
    }

    const payload = {
      login: formData.login.trim(),
      name: formData.name.trim(),
      phone,
      role: formData.role,
      status: formData.status,
      passwordChangeRequired: formData.passwordChangeRequired,
    };

    setSubmitting(true);

    try {
      if (isEditing) {
        await onUpdateUser?.(editingUserId, {
          ...payload,
          password: formData.password.trim() ? formData.password : undefined,
        });
      } else {
        await onCreateUser?.({
          ...payload,
          password: formData.password,
        });
      }
      resetForm();
    } catch (error) {
      const message = error?.message ?? 'Nao foi possivel salvar o usuario.';
      window.alert(message);
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId) => {
    try {
      await onDeleteUser?.(userId);
      if (editingUserId === userId) {
        resetForm();
      }
    } catch (error) {
      const message = error?.message ?? 'Nao foi possivel excluir o usuario.';
      window.alert(message);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <header className="space-y-2">
        <h2 className="text-2xl font-bold text-sky-600">Gerenciar Usuarios</h2>
        <p className="text-sm text-gray-600">Somente administradores podem acessar esta area.</p>
        <p className="text-xs text-gray-500">Todos os campos sao obrigatorios.</p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Login</label>
            <input
              type="text"
              value={formData.login}
              onChange={handleInputChange('login')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="ex: admin.sistema"
              required
              disabled={submitting}
            />
            {errors.login && <p className="text-xs text-red-500 mt-1">{errors.login}</p>}
          </div>

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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Codigo do pais</label>
            <input
              type="text"
              value={formData.countryCode}
              onChange={handleCountryCodeChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="+55"
              required
              disabled={submitting}
            />
            <p className="text-xs text-gray-500 mt-1">{countryName}</p>
            {errors.countryCode && <p className="text-xs text-red-500 mt-1">{errors.countryCode}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">DDD</label>
            <input
              type="text"
              value={formData.ddd}
              onChange={handleDDDChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="27"
              required
              disabled={submitting}
            />
            {errors.ddd && <p className="text-xs text-red-500 mt-1">{errors.ddd}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
            <input
              type="text"
              value={maskedPhoneNumber}
              onChange={handlePhoneNumberChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="99999-9999"
              required
              disabled={submitting}
            />
            {errors.phoneNumber && <p className="text-xs text-red-500 mt-1">{errors.phoneNumber}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
            <input
              type="password"
              value={formData.password}
              onChange={handleInputChange('password')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder={editingUserId ? 'Informe para redefinir (opcional)' : '********'}
              disabled={submitting}
              required={!editingUserId}
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          <div className="flex items-center space-x-2 pt-6 md:pt-8">
            <input
              id="password-change-required"
              type="checkbox"
              checked={formData.passwordChangeRequired}
              onChange={(event) => setFormData(prev => ({ ...prev, passwordChangeRequired: event.target.checked }))}
              className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
              disabled={submitting}
            />
            <label htmlFor="password-change-required" className="text-sm text-gray-700">
              Obrigar usuario a alterar a senha no proximo login
            </label>
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

        <div className="flex justify-end space-x-2">
          {editingUserId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              Cancelar edicao
            </button>
          )}
          <button
            type="submit"
            className="inline-flex items-center space-x-2 bg-sky-600 text-white px-5 py-2.5 rounded-lg hover:bg-sky-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={submitting}
          >
            <Plus className="w-4 h-4" />
            <span>{submitting ? 'Salvando...' : editingUserId ? 'Atualizar usuario' : 'Adicionar usuario'}</span>
          </button>
        </div>
      </form>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Login</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Papel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Troca de senha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading && (
              <tr>
                <td colSpan={7} className="px-6 py-6 text-center text-sm text-gray-500">
                  Carregando usuarios...
                </td>
              </tr>
            )}

            {!loading && !hasUsers && (
              <tr>
                <td colSpan={7} className="px-6 py-6 text-center text-sm text-gray-500">
                  Nenhum usuario cadastrado ate o momento.
                </td>
              </tr>
            )}

            {!loading && users.map(user => {
              const statusInfo = statusLabels[user.status] ?? statusLabels.ativo;
              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.login}</td>
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
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.password_change_required ? 'Sim' : 'Nao'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition"
                        title="Editar usuario"
                        type="button"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Excluir usuario"
                        type="button"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
