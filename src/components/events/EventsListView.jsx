import React, { useState, useRef, useEffect } from 'react';
import { Eye, Trash2, Edit2, Share2, Plus, MoreVertical, CheckSquare, ClipboardList } from 'lucide-react';

const statusLabels = {
  aguardando: { label: 'Aguardando', className: 'bg-gray-100 text-gray-700' },
  ativo: { label: 'Ativo', className: 'bg-sky-100 text-sky-700' },
  encerrado: { label: 'Encerrado', className: 'bg-red-100 text-red-700' },
};

const formatDate = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatDateTime = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleString('pt-BR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ActionsDropdown = ({ event, onRespond, onPreview, onViewResponses, onShare, onEdit, onDelete, canManage, responsesCount, editDisabled, deleteDisabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (action, value) => {
    if (action) action(value);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
        <MoreVertical className="w-5 h-5" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border rounded-md shadow-lg z-[9999]">
          <button 
            onClick={() => event.status === 'ativo' && handleAction(onRespond, event)} 
            disabled={event.status !== 'ativo'}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
            <CheckSquare className="w-4 h-4 mr-2" /> Responder Formulário
          </button>
          {canManage && (
            <>
              {responsesCount > 0 && (
                <button onClick={() => handleAction(onViewResponses, event)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                  <ClipboardList className="w-4 h-4 mr-2" /> Ver Respostas
                </button>
              )}
              <button onClick={() => handleAction(onPreview, event)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                <Eye className="w-4 h-4 mr-2" /> Pré-visualizar Formulário
              </button>
              <button onClick={() => event.status === 'ativo' && handleAction(onShare, event)} disabled={event.status !== 'ativo'} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
                <Share2 className="w-4 h-4 mr-2" /> Compartilhar Formulário
              </button>
              <button onClick={() => !editDisabled && handleAction(onEdit, event)} disabled={editDisabled} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
                <Edit2 className="w-4 h-4 mr-2" /> Editar Evento
              </button>
              <button onClick={() => !deleteDisabled && handleAction(onDelete, event.id)} disabled={deleteDisabled} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
                <Trash2 className="w-4 h-4 mr-2" /> Excluir Evento
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const EventsListView = ({ userRole, events, loading = false, onCreateEvent, onRespond, onPreview, onViewResponses, onShare, onEdit, onDelete }) => (
  <div className="p-6">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-sky-600">Gerenciar Eventos</h2>
        <p className="text-sm text-gray-500">Visualize e gerencie todos os seus eventos.</p>
      </div>
      {(userRole === 'admin' || userRole === 'organizer') && (
        <button 
          onClick={onCreateEvent}
          className="flex items-center space-x-2 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition"
          type="button"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Evento</span>
        </button>
      )}
    </div>
    
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-visible">
      <div className="overflow-visible">
        <table className="table-fixed w-full min-w-max">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Evento</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Início</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Fim</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 overflow-visible">
            {loading && (
              <tr><td colSpan={6} className="px-6 py-6 text-center text-sm text-gray-500">Carregando eventos...</td></tr>
            )}

            {!loading && events.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-6 text-center text-sm text-gray-500">Nenhum evento cadastrado até o momento.</td></tr>
            )}

            {!loading && events.map(event => {
              const statusInfo = statusLabels[event.status] ?? statusLabels.aguardando;
              const responsesCount = Number(event.responsesCount ?? 0);
              const canManage = userRole === 'admin' || userRole === 'organizer';
              const deleteDisabled = responsesCount > 0;
              const editDisabled = responsesCount > 0;
              return (
                <tr key={event.id} className="hover:bg-gray-50 overflow-visible">
                  <td className="px-6 py-4 align-top">
                    <div className="font-medium text-gray-900 text-sm line-clamp-1 break-words overflow-hidden text-ellipsis">{event.title}</div>
                    {event.additionalInfo && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 break-words overflow-hidden text-ellipsis">{event.additionalInfo}</p>
                    )}
                    <div className="text-sm text-gray-500 md:hidden mt-2">
                      {formatDate(event.eventDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell align-top whitespace-nowrap">{formatDate(event.eventDate)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell align-top whitespace-nowrap">{formatDateTime(event.startDateTime)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell align-top whitespace-nowrap">{formatDateTime(event.endDateTime)}</td>
                  <td className="px-6 py-4 align-top whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>{statusInfo.label}</span>
                  </td>
                  <td className="px-6 py-4 text-right align-top overflow-visible relative">
                    <div className="hidden md:flex items-center justify-end space-x-1">
                      <button 
                        onClick={() => onRespond(event)} 
                        disabled={event.status !== 'ativo'}
                        className={`p-2 rounded-lg transition ${event.status !== 'ativo' ? 'text-gray-300 cursor-not-allowed' : 'text-sky-600 hover:bg-sky-50'}`} 
                        title="Responder formulário" 
                        type="button"
                       >
                        <CheckSquare className="w-4 h-4" />
                       </button>
                      {canManage && (
                        <>
                          {responsesCount > 0 && (<button onClick={() => onViewResponses?.(event)} className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition" title="Visualizar respostas" type="button"><ClipboardList className="w-4 h-4" /></button>)}
                          <button onClick={() => onPreview?.(event)} className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition" title="Pre-visualizar formulario" type="button"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => onShare(event)} disabled={event.status !== 'ativo'} className={`p-2 rounded-lg transition ${event.status !== 'ativo' ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'}`} title="Compartilhar formulario" type="button"><Share2 className="w-4 h-4" /></button>
                          <button onClick={() => !editDisabled && onEdit?.(event)} disabled={editDisabled} className={`p-2 rounded-lg transition ${editDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'}`} title="Editar evento" type="button"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => !deleteDisabled && onDelete?.(event.id)} disabled={deleteDisabled} className={`p-2 rounded-lg transition ${deleteDisabled ? 'text-red-400 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`} title="Excluir" type="button"><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                    <div className="md:hidden">
                      <ActionsDropdown {...{ event, onRespond, onPreview, onViewResponses, onShare, onEdit, onDelete, canManage, responsesCount, editDisabled, deleteDisabled }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default EventsListView;
