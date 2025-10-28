import React from 'react';
import { CheckSquare, Edit2, Plus, Share2, Trash2 } from 'lucide-react';

const statusLabels = {
  aguardando: { label: 'Aguardando', className: 'bg-gray-100 text-gray-700' },
  ativo: { label: 'Ativo', className: 'bg-sky-100 text-sky-700' },
  encerrado: { label: 'Encerrado', className: 'bg-red-100 text-red-700' },
};

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

const formatDateTime = (value) => {
  if (!value) {
    return '--';
  }
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const EventsListView = ({
  userRole,
  events,
  loading = false,
  onCreateEvent,
  onRespond,
  onShare,
  onEdit,
  onDelete,
}) => (
  <div className="p-6">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-sky-600">Gerenciar Eventos</h2>
      {(userRole === 'admin' || userRole === 'organizer') && (
        <button 
          onClick={onCreateEvent}
          className="flex items-center space-x-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition"
          type="button"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Evento</span>
        </button>
      )}
    </div>
    
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
      <table className="w-full min-w-max">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Evento</th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inicio</th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fim</th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acoes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {loading && (
            <tr>
              <td colSpan={6} className="px-4 sm:px-6 py-6 text-center text-sm text-gray-500">
                Carregando eventos...
              </td>
            </tr>
          )}

          {!loading && events.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 sm:px-6 py-6 text-center text-sm text-gray-500">
                Nenhum evento cadastrado ate o momento.
              </td>
            </tr>
          )}

          {!loading && events.map(event => {
            const statusInfo = statusLabels[event.status] ?? statusLabels.aguardando;
            return (
              <tr key={event.id} className="hover:bg-gray-50">
                <td className="px-4 sm:px-6 py-4">
                  <div className="font-medium text-gray-900 text-sm sm:text-base">{event.title}</div>
                  {event.additionalInfo && (
                    <p className="text-xs text-gray-500 mt-1">{event.additionalInfo}</p>
                  )}
                </td>
                <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-600">
                  {formatDate(event.eventDate)}
                </td>
                <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-600">
                  {formatDateTime(event.startDateTime)}
                </td>
                <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-600">
                  {formatDateTime(event.endDateTime)}
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => onRespond(event)}
                      className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition"
                      title="Responder formulario"
                      type="button"
                    >
                      <CheckSquare className="w-4 h-4" />
                    </button>

                    {(userRole === 'admin' || userRole === 'organizer') && (
                      <>
                        <button
                          onClick={() => onShare(event)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition"
                          title="Compartilhar formulario"
                          type="button"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit?.(event)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition"
                          title="Editar evento"
                          type="button"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete?.(event.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Excluir"
                          type="button"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
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

export default EventsListView;
