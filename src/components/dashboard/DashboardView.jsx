import React, { useMemo } from 'react';
import { Calendar, FileText } from 'lucide-react';

const formatDate = (value) => {
  if (!value) {
    return '--';
  }
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const DashboardView = ({ userRole, events, onNavigate, onRespond }) => {
  const sortedEvents = useMemo(() => {
    if (!Array.isArray(events)) {
      return [];
    }
    return [...events].sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
  }, [events]);

  const activeEvents = useMemo(
    () => sortedEvents.filter(event => event.status === 'ativo'),
    [sortedEvents]
  );

  const nextEvent = activeEvents.length > 0 ? activeEvents[0] : null;
  const totalEvents = sortedEvents.length;

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-2xl font-bold text-sky-600 mb-6">Dashboard</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <button
          onClick={() => onNavigate?.('events')}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition text-left"
          type="button"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-sky-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {totalEvents}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Total de eventos</h3>
        </button>

        <button 
          onClick={() => onNavigate?.('events')}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition text-left"
          type="button"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-sky-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {activeEvents.length}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Eventos ativos</h3>
        </button>
        
        {nextEvent ? (
          <button
            onClick={() => onRespond?.(nextEvent)}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition text-left"
            type="button"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Proximo evento</h3>
            <p className="font-bold text-gray-900 text-sm sm:text-base">{nextEvent.title}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {formatDate(nextEvent.startDateTime)}
            </p>
          </button>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-gray-400" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Proximo evento</h3>
            <p className="text-sm text-gray-400 mt-2">Nenhum evento ativo</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardView;
