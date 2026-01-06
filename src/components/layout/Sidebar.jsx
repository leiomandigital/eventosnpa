import { Calendar, FileText, Users, X, BarChart3 } from 'lucide-react';

const Sidebar = ({ currentView, userRole, onChangeView, isOpen, onClose }) => {
  // Classes base para a barra lateral, sempre aplicadas
  const baseClasses = "fixed inset-y-0 left-0 bg-white border-r border-gray-200 z-30 transition-transform duration-300 ease-in-out";
  
  // Classes para telas médias e superiores (sempre visível e estático)
  const desktopClasses = "md:relative md:translate-x-0 md:w-64";

  // Classes para celular (transformação condicional)
  const mobileClasses = isOpen ? 'translate-x-0 w-64' : '-translate-x-full';
  
  return (
    <>
      {/* Overlay para celular, aparece quando a barra lateral está aberta */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={onClose}
        ></div>
      )}

      <aside className={`${baseClasses} ${desktopClasses} ${mobileClasses}`}>
        {/* Cabeçalho com botão de fechar, apenas no celular */}
        <div className="flex justify-between items-center p-4 border-b md:hidden">
          <span className="text-lg font-bold text-sky-600">Menu</span>
          <button onClick={onClose} className="text-gray-600 hover:text-sky-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
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
          
          {(userRole === 'admin' || userRole === 'organizer') && (
            <button
              onClick={() => onChangeView('reports')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                currentView === 'reports' ? 'bg-sky-50 text-sky-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Relatórios</span>
            </button>
          )}
          
          {userRole === 'admin' && (
            <button
              onClick={() => onChangeView('users')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                currentView === 'users' ? 'bg-sky-50 text-sky-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Usuários</span>
            </button>
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
