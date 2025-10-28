import React, { useEffect, useMemo, useState } from 'react';

const RespondEventView = ({
  event,
  readOnly = false,
  onShare,
  onSubmit,
  submitting = false,
  submitted = false,
  submissionMessage = '',
  submissionTitle = 'Obrigado!',
}) => {
  const questions = event?.questions ?? [];

  const initialAnswers = useMemo(() => {
    const base = {};
    questions.forEach(question => {
      if (!question?.id) {
        return;
      }
      if (question.type === 'multiple_choice') {
        base[question.id] = [];
      } else {
        base[question.id] = '';
      }
    });
    return base;
  }, [questions]);

  const [answers, setAnswers] = useState(initialAnswers);

  useEffect(() => {
    setAnswers(initialAnswers);
  }, [initialAnswers]);

  const handleTextChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleToggleMultiple = (questionId, option) => {
    setAnswers(prev => {
      const current = prev[questionId] ?? [];
      const exists = current.includes(option);
      const updated = exists ? current.filter(item => item !== option) : [...current, option];
      return { ...prev, [questionId]: updated };
    });
  };

  const handleSingleChoice = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = (eventSubmit) => {
    eventSubmit.preventDefault();
    if (readOnly || typeof onSubmit !== 'function') {
      return;
    }
    onSubmit(answers);
  };

  const renderInput = (question) => {
    const baseClasses = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent';
    const questionId = question.id;
    switch (question.type) {
      case 'long_text':
        return (
          <textarea
            rows={4}
            className={baseClasses}
            placeholder="Digite sua resposta..."
            readOnly={readOnly}
            disabled={readOnly}
            value={String(answers[questionId] ?? '')}
            onChange={(eventChange) => handleTextChange(questionId, eventChange.target.value)}
          />
        );
      case 'time':
        return (
          <input
            type="time"
            className={baseClasses}
            readOnly={readOnly}
            disabled={readOnly}
            value={String(answers[questionId] ?? '')}
            onChange={(eventChange) => handleTextChange(questionId, eventChange.target.value)}
          />
        );
      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {(question.options ?? []).map((option, index) => (
              <label key={index} className="flex items-center space-x-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="text-sky-600 focus:ring-sky-500"
                  disabled={readOnly}
                  checked={(answers[questionId] ?? []).includes(option)}
                  onChange={() => handleToggleMultiple(questionId, option)}
                />
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
                <input
                  name={`respond-${question.id ?? index}`}
                  type="radio"
                  className="text-sky-600 focus:ring-sky-500"
                  disabled={readOnly}
                  checked={answers[questionId] === option}
                  onChange={() => handleSingleChoice(questionId, option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );
      default:
        return (
          <input
            type="text"
            className={baseClasses}
            placeholder="Digite sua resposta..."
            readOnly={readOnly}
            disabled={readOnly}
            value={String(answers[questionId] ?? '')}
            onChange={(eventChange) => handleTextChange(questionId, eventChange.target.value)}
          />
        );
    }
  };

  const showShareButton = readOnly && typeof onShare === 'function';

  return (
    <div className="p-6">
      {showShareButton && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => onShare(event)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-sky-600 rounded-lg shadow-md hover:bg-sky-700 transition"
            type="button"
          >
            Compartilhar pre-visualizacao
          </button>
        </div>
      )}
      
      {submitted ? (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
            <h2 className="text-xl font-semibold text-sky-600 mb-3">{submissionTitle}</h2>
            <p className="text-sm text-gray-600 whitespace-pre-line">{submissionMessage || 'Resposta registrada com sucesso.'}</p>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <div className="mb-8 space-y-2">
              <h2 className="text-3xl font-bold text-sky-600">{event?.title}</h2>
              {event?.additionalInfo && (
              <p className="text-gray-600 whitespace-pre-line">{event.additionalInfo}</p>
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
                {renderInput(question)}
              </div>
            ))}
          </div>
          
          {!readOnly && (
            <form onSubmit={handleSubmit} className="mt-8 pt-6 border-t border-gray-200 space-y-4">
              <button
                type="submit"
                className="w-full bg-sky-600 text-white py-3 rounded-lg font-medium hover:bg-sky-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                {submitting ? 'Enviando...' : 'Enviar respostas'}
              </button>
            </form>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default RespondEventView;






