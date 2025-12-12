import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

const questionTypeOptions = [
  { value: 'short_text', label: 'Texto curto' },
  { value: 'long_text', label: 'Texto longo' },
  { value: 'time', label: 'Hora' },
  { value: 'multiple_choice', label: 'Multipla escolha' },
  { value: 'single_choice', label: 'Escolha unica' },
];

const initialQuestionState = {
  text: '',
  type: 'short_text',
  required: false,
  options: [''],
};

const isChoiceType = (type) => type === 'multiple_choice' || type === 'single_choice';

const toDateInputValue = (value) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  const tzOffset = date.getTimezoneOffset();
  date.setMinutes(date.getMinutes() - tzOffset);
  return date.toISOString().slice(0, 10);
};

const toDateTimeLocalValue = (value) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  const tzOffset = date.getTimezoneOffset();
  date.setMinutes(date.getMinutes() - tzOffset);
  return date.toISOString().slice(0, 16);
};

const createDefaultFormState = () => {
  const now = new Date();
  const end = new Date(now.getTime() + 60 * 60 * 1000);
  const tzOffsetNow = now.getTimezoneOffset();
  const tzOffsetEnd = end.getTimezoneOffset();
  now.setMinutes(now.getMinutes() - tzOffsetNow);
  end.setMinutes(end.getMinutes() - tzOffsetEnd);
  return {
    title: '',
    additionalInfo: '',
    eventDate: now.toISOString().slice(0, 10),
    startDateTime: now.toISOString().slice(0, 16),
    endDateTime: end.toISOString().slice(0, 16),
    status: 'aguardando',
    isTemplate: false,
  };
};

const mapQuestionsFromEvent = (questions = [], clearIds = false) =>
  [...questions]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map(question => ({
      id: clearIds ? undefined : question.id,
      text: question.text,
      type: question.type,
      required: Boolean(question.required),
      options: Array.isArray(question.options) ? question.options : [],
    }));

const CreateEventView = ({
  editingEvent = null,
  availableEvents = [],
  onCancel,
  onSave,
}) => {
  const isEditing = Boolean(editingEvent);
  const [formData, setFormData] = useState(createDefaultFormState);
  const [questions, setQuestions] = useState([]);
  const [questionForm, setQuestionForm] = useState(initialQuestionState);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [copyQuestionsId, setCopyQuestionsId] = useState('');

  useEffect(() => {
    if (isEditing) {
      setFormData({
        title: editingEvent.title ?? '',
        additionalInfo: editingEvent.additionalInfo ?? '',
        eventDate: toDateInputValue(editingEvent.eventDate),
        startDateTime: toDateTimeLocalValue(editingEvent.startDateTime),
        endDateTime: toDateTimeLocalValue(editingEvent.endDateTime),
        status: editingEvent.status ?? 'aguardando',
        isTemplate: editingEvent.isTemplate ?? false,
      });
      setQuestions(mapQuestionsFromEvent(editingEvent.questions));
    } else {
      setFormData(createDefaultFormState());
      setQuestions([]);
    }
    setSelectedTemplateId('');
    setCopyQuestionsId('');
    setQuestionForm(initialQuestionState);
    setErrors({});
    setSubmitting(false);
  }, [isEditing, editingEvent]);

  // Logica 1: Carregar Modelo Completo (Titulo + Info + Perguntas)
  useEffect(() => {
    if (!selectedTemplateId) return;

    const template = availableEvents.find(event => String(event.id) === String(selectedTemplateId));
    if (template) {
       // Copia info basica
       setFormData(prev => ({
         ...prev,
         title: template.title,
         additionalInfo: template.additionalInfo,
         // Mantem datas e status atuais (REQUISITO: Datas de hoje)
       }));

       // Copia perguntas
       if (template.questions?.length) {
         setQuestions(mapQuestionsFromEvent(template.questions, true));
       }
    }
  }, [selectedTemplateId, availableEvents]);

  // Logica 2: Copiar Apenas Perguntas de outro evento
  useEffect(() => {
    if (!copyQuestionsId) return;

    const source = availableEvents.find(event => String(event.id) === String(copyQuestionsId));
    if (source?.questions?.length) {
      setQuestions(mapQuestionsFromEvent(source.questions, true));
    }
  }, [copyQuestionsId, availableEvents]);

  const hasQuestions = useMemo(() => questions.length > 0, [questions.length]);
  const hasResponses = (editingEvent?.responsesCount ?? 0) > 0;
  const disableActiveStatus = useMemo(() => !hasQuestions, [hasQuestions]);
  
  // Listas filtradas para os dropdowns
  const templateEvents = useMemo(() => {
      if (!Array.isArray(availableEvents)) return [];
      return availableEvents.filter(e => e.isTemplate);
  }, [availableEvents]);

  const allEventsForQuestions = useMemo(() => {
      if (!Array.isArray(availableEvents)) return [];
      return availableEvents
        .filter(event => String(event.id) !== String(editingEvent?.id) && (event.questions ?? []).length > 0);
  }, [availableEvents, editingEvent]);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleQuestionFieldChange = (field) => (event) => {
    const value = field === 'required' ? event.target.checked : event.target.value;
    setQuestionForm(prev => ({
      ...prev,
      [field]: value,
      options: field === 'type' && !isChoiceType(value) ? [''] : prev.options,
    }));
  };

  const handleQuestionOptionChange = (index, value) => {
    setQuestionForm(prev => {
      const updated = [...prev.options];
      updated[index] = value;
      return { ...prev, options: updated };
    });
  };

  const handleAddOptionField = () => {
    setQuestionForm(prev => ({ ...prev, options: [...prev.options, ''] }));
  };

  const handleRemoveOptionField = (index) => {
    setQuestionForm(prev => {
      const updated = prev.options.filter((_, optionIndex) => optionIndex !== index);
      return { ...prev, options: updated.length > 0 ? updated : [''] };
    });
  };

  const resetQuestionForm = () => {
    setQuestionForm(initialQuestionState);
  };

  const validateEvent = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Informe o titulo do evento.';
    if (!formData.eventDate) newErrors.eventDate = 'Informe a data do evento.';
    if (!formData.startDateTime) newErrors.startDateTime = 'Informe a data e hora de inicio.';
    if (!formData.endDateTime) newErrors.endDateTime = 'Informe a data e hora de termino.';

    if (formData.startDateTime && formData.endDateTime) {
      const start = new Date(formData.startDateTime);
      const end = new Date(formData.endDateTime);
      if (start >= end) {
        newErrors.endDateTime = 'A data/hora de termino deve ser posterior ao inicio.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateQuestionForm = () => {
    if (!questionForm.text.trim()) {
      window.alert('Insira o texto da pergunta.');
      return false;
    }

    if (isChoiceType(questionForm.type)) {
      const sanitizedOptions = (questionForm.options ?? [])
        .map(option => option.trim())
        .filter(Boolean);
      if (sanitizedOptions.length < 2) {
        window.alert('Adicione pelo menos duas opcoes para perguntas de multipla escolha ou escolha unica.');
        return false;
      }
    }
    return true;
  };

  const handleAddQuestion = () => {
    if (!validateQuestionForm()) {
      return;
    }
    setQuestions(prev => [...prev, { ...questionForm }]);
    resetQuestionForm();
  };

  const handleRemoveQuestion = (index) => {
    setQuestions(prev => prev.filter((_, questionIndex) => questionIndex !== index));
  };

  const handleMoveQuestion = (index, direction) => {
    setQuestions(prev => {
      const updated = [...prev];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= updated.length) {
        return prev;
      }
      const [moved] = updated.splice(index, 1);
      updated.splice(newIndex, 0, moved);
      return updated;
    });
  };

  const submitEvent = async () => {
    if (!validateEvent() || typeof onSave !== 'function') {
      return;
    }
    setSubmitting(true);
    try {
      await onSave(formData, questions, editingEvent?.id);
      if (!editingEvent) {
        setFormData(createDefaultFormState());
        setQuestions([]);
        resetQuestionForm();
        setQuestions([]);
        resetQuestionForm();
        setSelectedTemplateId('');
        setCopyQuestionsId('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = () => submitEvent();

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-sky-600 mb-6">
        {isEditing ? 'Editar Evento' : 'Criar Novo Evento'}
      </h2>
      
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-8">
        <section className="space-y-6">
          {/* Seletor de Modelo (Topo) */}
          {!isEditing && templateEvents.length > 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 mb-6">
              <label className="block text-sm font-medium text-yellow-800 mb-2">Carregar de um Modelo (Template)</label>
              <select
                 value={selectedTemplateId}
                 onChange={(e) => setSelectedTemplateId(e.target.value)}
                 className="w-full px-4 py-2 border border-yellow-200 rounded-lg focus:ring-2 focus:ring-yellow-500 text-yellow-900 bg-white"
              >
                <option value="">-- Selecione um modelo para carregar --</option>
                {templateEvents.map(template => (
                  <option key={template.id} value={template.id}>⭐ {template.title}</option>
                ))}
              </select>
              <p className="text-xs text-yellow-600 mt-1">Isso preencherá o titulo, a descrição e as perguntas automaticamente.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Titulo do Evento</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={handleInputChange('title')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="Ex: Conferencia Tech 2025"
              required
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Informacoes adicionais</label>
            <textarea 
              rows={4}
              value={formData.additionalInfo}
              onChange={handleInputChange('additionalInfo')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="Descreva o evento..."
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data do evento</label>
              <input 
                type="date" 
                value={formData.eventDate}
                onChange={handleInputChange('eventDate')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
              {errors.eventDate && <p className="text-xs text-red-500 mt-1">{errors.eventDate}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status do evento</label>
              <select
                value={formData.status}
                onChange={handleInputChange('status')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="aguardando">Aguardando</option>
                <option value="ativo" disabled={disableActiveStatus}>Ativo</option>
                <option value="encerrado">Encerrado</option>
              </select>
              {disableActiveStatus && (
                <p className="text-xs text-gray-500 mt-1">
                  Adicione ao menos uma pergunta para ativar o evento.
                </p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data inicial para responder o evento</label>
              <input 
                type="datetime-local" 
                value={formData.startDateTime}
                onChange={handleInputChange('startDateTime')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
              {errors.startDateTime && <p className="text-xs text-red-500 mt-1">{errors.startDateTime}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data final para responder o evento</label>
              <input 
                type="datetime-local" 
                value={formData.endDateTime}
                onChange={handleInputChange('endDateTime')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            {errors.endDateTime && <p className="text-xs text-red-500 mt-1">{errors.endDateTime}</p>}
            </div>

          </div>

          <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <input
              id="is-template"
              type="checkbox"
              checked={formData.isTemplate}
              onChange={(e) => setFormData(prev => ({ ...prev, isTemplate: e.target.checked }))}
              className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
            />
            <div>
              <label htmlFor="is-template" className="text-sm font-medium text-gray-900">Salvar como Modelo de Evento</label>
              <p className="text-xs text-gray-500">Eventos marcados como modelo aparecem com destaque e podem ser usados para criar novos eventos rapidamente.</p>
            </div>
          </div>
        </section>



        <section className="border-t border-gray-200 pt-6 space-y-6">
          {hasResponses && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Este evento ja possui respostas registradas. As perguntas nao podem ser alteradas, adicionadas ou removidas para manter a integridade dos dados. Apenas as configuracoes gerais podem ser editadas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!hasResponses && (
          <div className="p-4 border border-dashed border-gray-300 rounded-lg space-y-4">
             {/* Seletor de Perguntas (Fundo - Lista Todos) */}
            {allEventsForQuestions.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Copiar apenas perguntas de outro evento</label>
                <select
                  value={copyQuestionsId}
                  onChange={(event) => setCopyQuestionsId(event.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 text-gray-900"
                >
                  <option value="">-- Selecione um evento para copiar perguntas --</option>
                  {allEventsForQuestions.map(eventOption => (
                    <option key={eventOption.id} value={eventOption.id}>
                      {eventOption.isTemplate ? '⭐ ' : ''}{eventOption.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Texto da pergunta</label>
              <input
                type="text"
                value={questionForm.text}
                onChange={handleQuestionFieldChange('text')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="Ex: Qual eh o seu cargo?"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo da pergunta</label>
                <select
                  value={questionForm.type}
                  onChange={handleQuestionFieldChange('type')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  {questionTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="question-required"
                  type="checkbox"
                  checked={questionForm.required}
                  onChange={handleQuestionFieldChange('required')}
                  className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                />
                <label htmlFor="question-required" className="text-sm text-gray-700">Resposta obrigatoria</label>
              </div>
            </div>

            {isChoiceType(questionForm.type) && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Opcoes</p>
                {questionForm.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(event) => handleQuestionOptionChange(index, event.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder={`Opcao ${index + 1}`}
                    />
                    <button
                      onClick={() => handleRemoveOptionField(index)}
                      className="p-2 text-red-600 hover:bg-gray-50 rounded transition"
                      title="Remover opcao"
                      type="button"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleAddOptionField}
                  className="flex items-center space-x-2 text-sky-600 hover:text-sky-700 text-sm font-medium"
                  type="button"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar opcao</span>
                </button>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleAddQuestion}
                className="flex items-center space-x-2 text-sky-600 hover:text-sky-700 font-medium"
                type="button"
              >
                <Plus className="w-5 h-5" />
                <span>Adicionar pergunta</span>
              </button>
            </div>
          </div>
          )}

          {questions.length > 0 && (
            <div className="space-y-3">
              {questions.map((question, index) => {
                const hasResponses = (editingEvent?.responsesCount ?? 0) > 0;
                const isExistingQuestion = Boolean(question.id);
                const disableRemove = hasResponses && isExistingQuestion;

                return (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900">
                        {index + 1}. {question.text}
                        {question.required && <span className="ml-1 text-red-500">*</span>}
                      </p>
                      <p className="text-xs text-gray-500">
                        Tipo: {questionTypeOptions.find(option => option.value === question.type)?.label ?? question.type}
                      </p>
                      {isChoiceType(question.type) && (
                        <ul className="text-xs text-gray-500 list-disc list-inside">
                          {(question.options ?? []).map((option, optionIndex) => (
                            <li key={optionIndex}>{option}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {!hasResponses && (
                      <>
                        <button
                          onClick={() => handleMoveQuestion(index, -1)}
                          className="p-2 text-gray-600 hover:bg-white rounded transition"
                          title="Mover para cima"
                          type="button"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveQuestion(index, 1)}
                          className="p-2 text-gray-600 hover:bg-white rounded transition"
                          title="Mover para baixo"
                          type="button"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveQuestion(index)}
                          className="p-2 text-red-600 hover:bg-white rounded transition"
                          title="Remover pergunta"
                          type="button"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                      )}
                      {hasResponses && (
                        <span className="text-xs text-gray-400 italic">Bloqueado</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </section>

        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
          <button 
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
            type="button"
            disabled={submitting}
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
            type="button"
            disabled={submitting || (formData.status === 'ativo' && !hasQuestions)}
          >
            {submitting ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateEventView;
