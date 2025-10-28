import supabase from '../lib/supabaseClient';

const EVENT_STATUS = ['aguardando', 'ativo', 'encerrado'];
const QUESTION_TYPES = ['short_text', 'long_text', 'time', 'multiple_choice', 'single_choice'];

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
      )
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
      )
    `)
    .eq('id', eventId)
    .single();

  if (error) {
    throw error;
  }

  return normaliseEvent(data);
}

export async function createEventWithQuestions(eventData, questions, currentUserId) {
  if (!EVENT_STATUS.includes(eventData.status)) {
    throw new Error('Status invalido para o evento.');
  }

  questions.forEach(question => {
    if (!QUESTION_TYPES.includes(question.type)) {
      throw new Error(`Tipo de pergunta invalido: ${question.type}`);
    }
  });

  const payload = {
    title: eventData.title,
    additional_info: eventData.additionalInfo || null,
    event_date: eventData.eventDate,
    start_datetime: eventData.startDateTime,
    end_datetime: eventData.endDateTime,
    status: eventData.status,
    created_by: currentUserId ?? null,
  };

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

  const questionsPayload = questions.map((question, index) => ({
    event_id: createdEvent.id,
    text: question.text,
    type: question.type,
    required: Boolean(question.required),
    options: isChoiceType(question.type) ? question.options ?? [] : [],
    sort_order: index,
  }));

  const { error: questionsError } = await supabase
    .from('event_questions')
    .insert(questionsPayload);

  if (questionsError) {
    await supabase.from('events').delete().eq('id', createdEvent.id);
    throw questionsError;
  }

  return createdEvent.id;
}

export async function deleteEvent(eventId) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);

  if (error) {
    throw error;
  }
}

const isChoiceType = (type) => type === 'multiple_choice' || type === 'single_choice';

export default {
  fetchEvents,
  fetchEventById,
  createEventWithQuestions,
  deleteEvent,
};
