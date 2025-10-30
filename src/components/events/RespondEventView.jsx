import React, { useEffect, useMemo, useState } from 'react';
import { Share2 } from 'lucide-react';

const RespondEventView = ({
  event,
  readOnly = false,
  onShare,
  onSubmit,
  submitting = false,
  submitted = false,
  publicResponse = false,
}) => {
  const questions = useMemo(() => event?.questions ?? [], [event]);

  const initialAnswers = useMemo(() => {
    const base = {};
    questions.forEach(question => {
      if (!question?.id) return;
      base[question.id] = question.type === 'multiple_choice' ? [] : '';
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
    const baseClasses = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent disabled:bg-gray-100';
    const questionId = question.id;
    const isDisabled = readOnly || submitting;

    switch (question.type) {
      case 'long_text':
        return (
          <textarea
            rows={4}
            className={baseClasses}
            placeholder="Digite sua resposta..."
            disabled={isDisabled}
            value={String(answers[questionId] ?? '')}
            onChange={(e) => handleTextChange(questionId, e.target.value)}
            required={question.required}
          />
        );
      case 'time':
        return (
          <input
            type="time"
            className={baseClasses}
            disabled={isDisabled}
            value={String(answers[questionId] ?? '')}
            onChange={(e) => handleTextChange(questionId, e.target.value)}
            required={question.required}
          />
        );
      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {(question.options ?? []).map((option, index) => (
              <label key={index} className="flex items-center space-x-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="text-sky-600 focus:ring-sky-500 rounded"
                  disabled={isDisabled}
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
                  disabled={isDisabled}
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
            disabled={isDisabled}
            value={String(answers[questionId] ?? '')}
            onChange={(e) => handleTextChange(questionId, e.target.value)}
            required={question.required}
          />
        );
    }
  };

  const showShareButton = readOnly && typeof onShare === 'function';
  const eventDate = event?.eventDate ? new Date(event.eventDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : null;

  if (submitted) {
    return (
        <div className="bg-white shadow-lg rounded-xl max-w-2xl mx-auto my-8 p-8">
            <div className="text-center py-12">
                <h3 className="text-2xl font-bold text-sky-600 mb-4">Obrigado por sua resposta!</h3>
                <p className="text-gray-600">Sua resposta foi enviada com sucesso.</p>
            </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-xl max-w-2xl mx-auto my-8 border">
        <div className="p-8">
            <header className="flex items-start justify-between mb-8">
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-sky-600">{event?.title}</h2>
                    {eventDate && (
                        <p className="text-sm text-gray-500">Data do evento: {eventDate}</p>
                    )}
                    {event?.additionalInfo && (
                        <p className="text-gray-600 whitespace-pre-line pt-4">{event.additionalInfo}</p>
                    )}
                </div>
                {showShareButton && (
                    <button
                        onClick={() => onShare(event)}
                        className="flex items-center space-x-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                        title="Compartilhar Pré-visualização"
                    >
                        <Share2 className="w-4 h-4" />
                        <span>Compartilhar</span>
                    </button>
                )}
            </header>
          
            <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                    {questions.length === 0 && (
                        <p className="text-sm text-gray-500">Este evento ainda não possui perguntas configuradas.</p>
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
                    <div className="mt-8 pt-6 border-t border-gray-200">
                    <button
                        type="submit"
                        className="w-full bg-sky-600 text-white py-3 rounded-lg font-medium hover:bg-sky-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={submitting}
                    >
                        {submitting ? 'Enviando...' : 'Enviar respostas'}
                    </button>
                    </div>
                )}
            </form>
        </div>
    </div>
  );
};

export default RespondEventView;
