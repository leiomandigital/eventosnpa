import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

const LoginView = ({ onLogin, loading = false, errorMessage }) => {
  const [email, setEmail] = useState('admin@eventosnpa.com');
  const [password, setPassword] = useState('123456');

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onLogin?.({ email, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-sky-500 rounded-full mb-4">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-sky-600">EventosNPA</h1>
          <p className="text-gray-600 mt-2">Sistema de Gerenciamento de Eventos</p>
        </div>
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="seu@email.com"
              autoComplete="username"
              disabled={loading}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="********"
              autoComplete="current-password"
              disabled={loading}
              required
            />
          </div>
          
          {errorMessage && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}

          <button 
            type="submit"
            className="w-full bg-sky-500 text-white py-3 rounded-lg font-medium hover:bg-sky-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-gray-500">
          Utilize o usuario administrador padrao: <strong>admin@eventosnpa.com</strong> / <strong>123456</strong>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
