import React, { useState } from 'react';
import Footer from '../layout/Footer';

const ForcePasswordChangeView = ({
  userName,
  userLogin,
  loading = false,
  errorMessage = '',
  onSubmit,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError('');

    if (newPassword.length < 6) {
      setLocalError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError('As senhas nao conferem.');
      return;
    }

    await onSubmit?.(newPassword);
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md space-y-6">
          <header className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-sky-600">Troca de senha obrigatoria</h1>
            <p className="text-sm text-gray-600">
              Ola, {userName || userLogin}. Por seguranca, defina uma nova senha para continuar.
            </p>
          </header>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nova senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="Digite a nova senha"
                autoComplete="new-password"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirme a nova senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="Repita a nova senha"
                autoComplete="new-password"
                disabled={loading}
                required
              />
            </div>

            {(localError || errorMessage) && (
              <p className="text-sm text-red-600">{localError || errorMessage}</p>
            )}

            <button
              type="submit"
              className="w-full bg-sky-500 text-white py-3 rounded-lg font-medium hover:bg-sky-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ForcePasswordChangeView;
