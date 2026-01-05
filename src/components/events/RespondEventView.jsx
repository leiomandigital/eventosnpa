import React, { useEffect, useMemo, useState } from 'react';
import { Share2 } from 'lucide-react';

const TextListInput = ({ value, onChange, disabled, onBlur }) => {
  const currentTags = value ? String(value).split(',').map(t => t.trim()).filter(Boolean) : [];
  const [inputValue, setInputValue] = useState('');

  const addTag = (tag) => {
     const cleaned = tag.trim().replace(/,/g, '');
     if(!cleaned) return;
     const newTags = [...currentTags, cleaned];
     onChange(newTags.join(', '));
     setInputValue('');
  };

  const removeTag = (indexToRemove) => {
     const newTags = currentTags.filter((_, index) => index !== indexToRemove);
     onChange(newTags.join(', '));
  };

  const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          addTag(inputValue);
      }
  };
  
  const handleBlur = () => {
      if (inputValue) {
          addTag(inputValue);
      }
      if (onBlur) onBlur();
  };

  return (
    <div className={`w-full px-2 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-sky-500 focus-within:border-transparent ${disabled ? 'bg-gray-100' : 'bg-white'}`}>
       <div className="flex flex-wrap gap-2">
          {currentTags.map((tag, idx) => (
             <span key={idx} className="flex items-center bg-sky-100 text-sky-800 text-sm px-3 py-1 rounded-full">
                {tag}
                {!disabled && (
                  <button 
                    type="button" 
                    onClick={() => removeTag(idx)}
                    className="ml-2 text-sky-600 hover:text-sky-900 font-bold focus:outline-none"
                  >
                    ×
                  </button>
                )}
             </span>
          ))}
          <input
            type="text"
            className="flex-grow outline-none bg-transparent min-w-[120px] py-1"
            placeholder={currentTags.length === 0 ? "Digite e tecle Enter ou Vírgula..." : ""}
            disabled={disabled}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
          />
       </div>
    </div>
  );
};

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
  const [errors, setErrors] = useState({});

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

  const getFieldError = (question, value) => {
    const isText = question.type === 'short_text' || question.type === 'long_text';
    if (!isText) return null;

    if (question.required && !value) return 'Este campo é obrigatório.';
    if (!value) return null;

    const text = String(value).trim();
    if (text.length < 3) return 'A resposta deve ter no mínimo 3 caracteres.';

    const hasValidContent = /[a-zA-Z0-9\u00C0-\u00FF]/.test(text);
    if (!hasValidContent) return 'A resposta deve conter letras ou números.';

    // Heuristica para campos de Nome: Exigir letras para bloquear numeros como "111"
    if (question.text.toLowerCase().includes('nome')) {
       const hasLetters = /[a-zA-Z\u00C0-\u00FF]/.test(text);
       if (!hasLetters) return 'Por favor, insira um nome válido (use letras).';
    }

    return null;
  };

  const validateField = (questionId, value, questionType) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return true;

    const error = getFieldError(question, value);
    setErrors(prev => ({ ...prev, [questionId]: error }));

    return !error;
  };

  const handleSubmit = (eventSubmit) => {
    eventSubmit.preventDefault();
    
    // Valida todos os campos antes de enviar
    const newErrors = {};
    let isValid = true;

    questions.forEach(question => {
      const value = answers[question.id];
      const error = getFieldError(question, value);
      
      if (error) {
        newErrors[question.id] = error;
        isValid = false;
      }
    });

    if (!isValid) {
      setErrors(newErrors);
      // Foca no primeiro erro se possível
      const firstErrorId = Object.keys(newErrors)[0];
      const element = document.getElementById(`question-${firstErrorId}`);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (readOnly || typeof onSubmit !== 'function') {
      return;
    }
    onSubmit(event, answers);
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
            onBlur={() => validateField(questionId, answers[questionId], question.type)}
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
      case 'text_list':
        return (
          <TextListInput
            value={answers[questionId]}
            onChange={(val) => handleTextChange(questionId, val)}
            disabled={isDisabled}
            onBlur={() => validateField(questionId, answers[questionId], question.type)}
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
            onBlur={() => validateField(questionId, answers[questionId], question.type)}
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
                        <div id={`question-${question.id}`}>
                          {renderInput(question)}
                          {errors[question.id] && (
                            <p className="text-red-500 text-sm mt-1 animate-pulse">
                              {errors[question.id]}
                            </p>
                          )}
                        </div>
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
