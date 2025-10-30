import React, { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';

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

const EventResponsesView = ({
  event,
  responses,
  loading = false,
  onDeleteResponses,
}) => {
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    setSelectedIds([]);
  }, [responses]);

  const orderedQuestions = useMemo(() => {
    if (!event?.questions?.length) {
      return [];
    }
    return [...event.questions]
      .filter(question => question?.id)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map(question => ({
        id: question.id,
        text: question.text,
      }));
  }, [event]);

  const toggleResponse = (responseId) => {
    setSelectedIds(prev => (
      prev.includes(responseId)
        ? prev.filter(id => id !== responseId)
        : [...prev, responseId]
    ));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === responses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(responses.map(r => r.id));
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedIds.length || typeof onDeleteResponses !== 'function') {
      return;
    }
    const confirmation = window.confirm('Deseja realmente excluir as respostas selecionadas?');
    if (!confirmation) {
      return;
    }
    onDeleteResponses(selectedIds);
  };
  
  const totalResponses = responses?.length ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {totalResponses} {totalResponses === 1 ? 'resposta' : 'respostas'} no total
        </p>
        <button
          onClick={handleDeleteSelected}
          className="inline-flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          type="button"
          disabled={!selectedIds.length || loading}
        >
          <Trash2 className="w-4 h-4" />
          <span>Excluir selecionadas</span>
        </button>
      </div>

      <header className="space-y-1">
        <h2 className="text-2xl font-bold text-sky-600">Respostas do {event?.title}</h2>
      </header>

      {loading ? (
        <p className="text-sm text-gray-500">Carregando respostas...</p>
      ) : responses.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhuma resposta registrada para este evento.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <input
                    type="checkbox"
                    className="text-sky-600 focus:ring-sky-500"
                    checked={selectedIds.length === responses.length && responses.length > 0}
                    onChange={handleSelectAll}
                    disabled={loading}
                  />
                </th>                
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Enviado em</th>
                {orderedQuestions.map(question => (
                  <th
                    key={question.id}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    {question.text}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {responses.map(response => {
                const answersMap = new Map(
                  (response.answers ?? []).map(answer => [answer.questionId, answer.value])
                );
                return (
                  <tr key={response.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 align-top">
                      <input
                        type="checkbox"
                        className="text-sky-600 focus:ring-sky-500"
                        checked={selectedIds.includes(response.id)}
                        onChange={() => toggleResponse(response.id)}
                        disabled={loading}
                      />
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-gray-500 whitespace-nowrap">
                      {formatDateTime(response.submittedAt)}
                    </td>
                    {orderedQuestions.map(question => {
                      const value = answersMap.get(question.id);
                      const display = value && value.trim() ? value : '-';
                      return (
                        <td
                          key={question.id}
                          className="px-4 py-3 align-top text-sm text-gray-700 whitespace-pre-line"
                        >
                          {display}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EventResponsesView;
