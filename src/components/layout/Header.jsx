import React from 'react';
import { Calendar, LogOut } from 'lucide-react';

const roleLabels = {
  admin: 'Administrador',
  organizer: 'Organizador',
  participant: 'Participante',
};

const Header = ({ userRole, onLogout, userName, userEmail }) => (
  <header className="bg-white border-b border-gray-200 px-6 py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-sky-600">EventosNPA</h1>
          <p className="text-xs text-gray-500">{roleLabels[userRole] || 'Usuario'}</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-900">{userName || 'Usuario autenticado'}</p>
          <p className="text-xs text-gray-500">{userEmail || ''}</p>
        </div>
        <button 
          onClick={onLogout}
          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  </header>
);

export default Header;
