import React from 'react';

const questionTypes = {
  short_text: 'Texto curto',
  long_text: 'Texto longo',
  time: 'Hora',
  multiple_choice: 'Multipla escolha',
  single_choice: 'Escolha unica',
};

const RespondEventView = ({ event, onBack }) => {
  const questions = event?.questions ?? [];

  const renderInput = (question) => {
    switch (question.type) {
      case 'long_text':
        return (
          <textarea
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            placeholder="Digite sua resposta..."
          />
        );
      case 'time':
        return (
          <input
            type="time"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        );
      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {(question.options ?? []).map((option, index) => (
              <label key={index} className="flex items-center space-x-2 text-sm text-gray-700">
                <input type="checkbox" className="text-sky-600 focus:ring-sky-500" />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );
      case 'single_choice':
        return (
          <div className="space-y-2">
            {(question.options ?? []).map((option, index) => (
              <label key={index} className="flex items-center space-x-2 text-sm text-gray-700">
                <input name={`respond-${question.id ?? index}`} type="radio" className="text-sky-600 focus:ring-sky-500" />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );
      default:
        return (
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            placeholder="Digite sua resposta..."
          />
        );
    }
  };

  return (
    <div className="p-6">
      <button 
        onClick={onBack}
        className="mb-6 text-sky-600 hover:text-sky-700 font-medium"
      >
        {'<<'} Voltar
      </button>
      
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="mb-8 space-y-2">
            <h2 className="text-3xl font-bold text-sky-600">{event?.title}</h2>
            {event?.additionalInfo && (
              <p className="text-gray-600">{event.additionalInfo}</p>
            )}
            {event?.eventDate && (
              <p className="text-sm text-gray-500">
                Data do evento: {new Date(event.eventDate).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
          
          <div className="space-y-6">
            {questions.length === 0 && (
              <p className="text-sm text-gray-500">Este evento ainda nao possui perguntas configuradas.</p>
            )}

            {questions.map((question, index) => (
              <div key={question.id ?? index}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {index + 1}. {question.text}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <p className="text-xs text-gray-500 mb-2">{questionTypes[question.type] ?? 'Pergunta'}</p>
                {renderInput(question)}
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button className="w-full bg-sky-600 text-white py-3 rounded-lg font-medium hover:bg-sky-700 transition">
              Enviar Respostas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RespondEventView;
