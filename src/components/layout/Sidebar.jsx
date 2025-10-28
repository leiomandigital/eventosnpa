import React from 'react';
import { Calendar, FileText, Settings, Users } from 'lucide-react';

const Sidebar = ({ currentView, userRole, onChangeView }) => (
  <aside className="bg-white border-r border-gray-200 w-64 hidden md:block">
    <nav className="p-4 space-y-2">
      <button
        onClick={() => onChangeView('dashboard')}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
          currentView === 'dashboard' ? 'bg-sky-50 text-sky-600' : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Calendar className="w-5 h-5" />
        <span className="font-medium">Dashboard</span>
      </button>
      
      <button
        onClick={() => onChangeView('events')}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
          currentView === 'events' || currentView === 'create-event' ? 'bg-sky-50 text-sky-600' : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        <FileText className="w-5 h-5" />
        <span className="font-medium">Eventos</span>
      </button>
      
      {userRole === 'admin' && (
        <button
          onClick={() => onChangeView('users')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
            currentView === 'users' ? 'bg-sky-50 text-sky-600' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="font-medium">Usuarios</span>
        </button>
      )}
      
      <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition">
        <Settings className="w-5 h-5" />
        <span className="font-medium">Configuracoes</span>
      </button>
    </nav>
  </aside>
);

export default Sidebar;
