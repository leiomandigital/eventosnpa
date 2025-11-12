import supabase from '../lib/supabaseClient';
import { sanitizeInput, sanitizeStringArray, sanitizePreserveFormatting } from '../utils/sanitize';

const EVENT_STATUS = ['aguardando', 'ativo', 'encerrado'];
const QUESTION_TYPES = ['short_text', 'long_text', 'time', 'multiple_choice', 'single_choice'];

const isChoiceType = (type) => type === 'multiple_choice' || type === 'single_choice';

const normaliseEvent = (record) => ({
  id: record.id,
  title: record.title,
  additionalInfo: record.additional_info ?? '',
  eventDate: record.event_date,
  startDateTime: record.start_datetime,
  endDateTime: record.end_datetime,
  status: record.status,
  createdBy: record.created_by,
  createdAt: record.created_at,
  questions: (record.event_questions ?? [])
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(question => ({
      id: question.id,
      text: question.text,
      type: question.type,
      required: question.required,
      options: Array.isArray(question.options) ? question.options : [],
      sortOrder: question.sort_order ?? 0,
    })),
  responsesCount: Array.isArray(record.event_responses) && record.event_responses[0]?.count
    ? Number(record.event_responses[0].count)
    : 0,
});

export async function fetchEvents() {
  const { data, error } = await supabase
    .from('events')
    .select(`
      id,
      title,
      additional_info,
      event_date,
      start_datetime,
      end_datetime,
      status,
      created_by,
      created_at,
      event_questions (
        id,
        text,
        type,
        required,
        options,
        sort_order
      ),
      event_responses ( count )
    `)
    .order('start_datetime', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(normaliseEvent);
}

export async function fetchEventById(eventId) {
  const { data, error } = await supabase
    .from('events')
    .select(`
      id,
      title,
      additional_info,
      event_date,
      start_datetime,
      end_datetime,
      status,
      created_by,
      created_at,
      event_questions (
        id,
        text,
        type,
        required,
        options,
        sort_order
      ),
      event_responses ( count )
    `)
    .eq('id', eventId)
    .single();

  if (error) {
    throw error;
  }

  return normaliseEvent(data);
}

const buildEventPayload = (eventData, currentUserId) => ({
  title: sanitizeInput(eventData.title),
  additional_info: sanitizePreserveFormatting(eventData.additionalInfo) || null,
  event_date: eventData.eventDate,
  start_datetime: eventData.startDateTime,
  end_datetime: eventData.endDateTime,
  status: eventData.status,
  created_by: currentUserId ?? null,
});

const buildQuestionPayload = (eventId, questions) =>
  questions.map((question, index) => ({
    event_id: eventId,
    text: sanitizeInput(question.text),
    type: question.type,
    required: Boolean(question.required),
    options: isChoiceType(question.type) ? sanitizeStringArray(question.options ?? []) : [],
    sort_order: index,
  }));

const validateEventInput = (eventData, questions) => {
  if (!EVENT_STATUS.includes(eventData.status)) {
    throw new Error('Status invalido para o evento.');
  }
  questions.forEach(question => {
    if (!QUESTION_TYPES.includes(question.type)) {
      throw new Error(`Tipo de pergunta invalido: ${question.type}`);
    }
  });
};

export async function createEventWithQuestions(eventData, questions, currentUserId) {
  validateEventInput(eventData, questions);

  const payload = buildEventPayload(eventData, currentUserId);

  const { data: createdEvent, error: createError } = await supabase
    .from('events')
    .insert(payload)
    .select('id')
    .single();

  if (createError) {
    throw createError;
  }

  if (questions.length === 0) {
    return createdEvent.id;
  }

  const questionsPayload = buildQuestionPayload(createdEvent.id, questions);

  const { error: questionsError } = await supabase
    .from('event_questions')
    .insert(questionsPayload);

  if (questionsError) {
    await supabase.from('events').delete().eq('id', createdEvent.id);
    throw questionsError;
  }

  return createdEvent.id;
}

export async function updateEventWithQuestions(eventId, eventData, questions) {
  validateEventInput(eventData, questions);

  const payload = {
    title: sanitizeInput(eventData.title),
    additional_info: sanitizePreserveFormatting(eventData.additionalInfo) || null,
    event_date: eventData.eventDate,
    start_datetime: eventData.startDateTime,
    end_datetime: eventData.endDateTime,
    status: eventData.status,
  };

  const { error: updateError } = await supabase
    .from('events')
    .update(payload)
    .eq('id', eventId);

  if (updateError) {
    throw updateError;
  }

  const { error: deleteError } = await supabase
    .from('event_questions')
    .delete()
    .eq('event_id', eventId);

  if (deleteError) {
    throw deleteError;
  }

  if (questions.length === 0) {
    return eventId;
  }

  const questionsPayload = buildQuestionPayload(eventId, questions);

  const { error: insertError } = await supabase
    .from('event_questions')
    .insert(questionsPayload);

  if (insertError) {
    throw insertError;
  }

  return eventId;
}

export async function submitEventResponse(eventId, answers = {}, userId = null) {
  if (!eventId) {
    throw new Error('ID do evento é obrigatório para submeter uma resposta.');
  }

  // Primeiro, cria um registro "pai" para agrupar todas as respostas
  const { data: createdResponse, error: responseError } = await supabase
    .from('event_responses')
    .insert({
      event_id: eventId,
      submitted_by: userId || null, // Usa null se o userId não for fornecido
    })
    .select('id')
    .single();

  if (responseError) {
    console.error('Erro ao criar o registro da resposta:', responseError);
    throw new Error('Não foi possível registrar a sua submissão.');
  }

  const responseId = createdResponse.id;

  // Se não houver respostas, já terminamos
  const entries = Object.entries(answers ?? {});
  if (entries.length === 0) {
    return responseId;
  }

  // Prepara as respostas individuais para inserção
  const answersPayload = entries
    .map(([questionId, value]) => {
      // Filtra respostas vazias
      if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
        return null;
      }

      // **AQUI ESTÁ A CORREÇÃO PRINCIPAL**
      // Formata o valor de forma limpa antes de salvar
      const formattedValue = Array.isArray(value)
        ? value.join(', ') // Transforma arrays em texto, ex: "Opção 1, Opção 2"
        : String(value);   // Garante que todos os outros valores sejam texto simples

      return {
        response_id: responseId,
        question_id: questionId,
        value: formattedValue,
      };
    })
    .filter(Boolean); // Remove os nulos do array

  if (answersPayload.length === 0) {
    return responseId;
  }

  // Insere todas as respostas de uma vez
  const { error: answersError } = await supabase
    .from('event_answers')
    .insert(answersPayload);

  // Se a inserção das respostas falhar, desfaz a criação do registro "pai"
  if (answersError) {
    console.error('Erro ao inserir as respostas:', answersError);
    await supabase.from('event_responses').delete().eq('id', responseId);
    throw new Error('Falha ao salvar as respostas individuais.');
  }

  return responseId;
}


export async function deleteEvent(eventId) {
  const { count, error: countError } = await supabase
    .from('event_responses')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId);

  if (countError) {
    throw countError;
  }

  if ((count ?? 0) > 0) {
    throw new Error('Nao e possivel excluir eventos que possuem respostas registradas.');
  }

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);

  if (error) {
    throw error;
  }
}

export async function fetchEventResponses(eventId) {
  const { data, error } = await supabase
    .from('event_responses')
    .select(`
      id,
      event_id,
      submitted_at,
      submitted_by,
      users:submitted_by (
        name,
        login
      ),
      event_answers (
        id,
        question_id,
        value,
        created_at
      )
    `)
    .eq('event_id', eventId)
    .order('submitted_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(response => ({
    id: response.id,
    eventId: response.event_id,
    submittedAt: response.submitted_at,
    submittedBy: response.submitted_by,
    user: response.users ? { ...response.users } : null,
    answers: (response.event_answers ?? []).map(answer => ({
      id: answer.id,
      questionId: answer.question_id,
      value: answer.value ?? '',
      createdAt: answer.created_at,
    })),
  }));
}

export async function deleteEventResponses(responseIds = []) {
  if (!Array.isArray(responseIds) || responseIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from('event_responses')
    .delete()
    .in('id', responseIds);

  if (error) {
    throw error;
  }
}

export default {
  fetchEvents,
  fetchEventById,
  createEventWithQuestions,
  updateEventWithQuestions,
  deleteEvent,
  submitEventResponse,
  fetchEventResponses,
  deleteEventResponses,
};
