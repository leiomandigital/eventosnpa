import React, { createContext, useState, useContext, useCallback, useEffect, useMemo } from 'react';
import {
  fetchEvents,
  createEventWithQuestions,
  updateEventWithQuestions,
  deleteEvent,
  fetchEventResponses,
  deleteEventResponses,
  submitEventResponse,
  fetchEventById,
} from '../services/eventsService';
import { useAuth } from './AuthContext';

const EventsContext = createContext(null);

export const EventsProvider = ({ children }) => {
  const { currentUser, userRole } = useAuth();
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventResponses, setEventResponses] = useState([]);
  const [eventResponsesLoading, setEventResponsesLoading] = useState(false);
  const [responseSubmitting, setResponseSubmitting] = useState(false);
  const [responseSubmitted, setResponseSubmitted] = useState(false);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const data = await fetchEvents();
      setEvents(data);
    } catch (error) {
      const message = error?.message ?? 'Não foi possível carregar os eventos.';
      window.alert(message);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const loadEventResponses = useCallback(async (eventId) => {
    setEventResponsesLoading(true);
    try {
      const data = await fetchEventResponses(eventId);
      setEventResponses(data);
      return data;
    } catch (error) {
      const message = error?.message ?? 'Não foi possível carregar as respostas do evento.';
      window.alert(message);
      setEventResponses([]);
      throw error;
    } finally {
      setEventResponsesLoading(false);
    }
  }, []);

  const createEvent = useCallback(async (eventData, questions) => {
    if (!currentUser) {
      window.alert('É necessário estar autenticado para criar eventos.');
      return;
    }
    const payload = {
      ...eventData,
      status: eventData.status ?? 'aguardando',
    };
    try {
      await createEventWithQuestions(payload, questions, currentUser.id);
      window.alert('Evento salvo com sucesso.');
      await loadEvents();
    } catch (error) {
      const message = error?.message ?? 'Não foi possível salvar o evento.';
      window.alert(message);
      throw error;
    }
  }, [currentUser, loadEvents]);

  const updateEvent = useCallback(async (eventId, eventData, questions) => {
    if (!currentUser) {
      window.alert('É necessário estar autenticado para atualizar eventos.');
      return;
    }
    const payload = {
      ...eventData,
      status: eventData.status ?? 'aguardando',
    };
    try {
      await updateEventWithQuestions(eventId, payload, questions);
      window.alert('Evento atualizado com sucesso.');
      await loadEvents();
    } catch (error) {
      const message = error?.message ?? 'Não foi possível atualizar o evento.';
      window.alert(message);
      throw error;
    }
  }, [currentUser, loadEvents]);

  const deleteEventById = useCallback(async (eventId) => {
    const confirmation = window.confirm('Deseja realmente remover este evento?');
    if (!confirmation) {
      return;
    }
    try {
      await deleteEvent(eventId);
      await loadEvents();
    } catch (error) {
      const message = error?.message ?? 'Não foi possível remover o evento.';
      window.alert(message);
      throw error;
    }
  }, [loadEvents]);

  const deleteResponses = useCallback(async (responseIds) => {
    if (!selectedEvent?.id || !Array.isArray(responseIds) || responseIds.length === 0) {
      return;
    }
    setEventResponsesLoading(true);
    try {
      await deleteEventResponses(responseIds);
      await loadEventResponses(selectedEvent.id);
      await loadEvents();
      window.alert('Respostas excluídas com sucesso.');
    } catch (error) {
      const message = error?.message ?? 'Não foi possível excluir as respostas selecionadas.';
      window.alert(message);
      throw error;
    } finally {
      setEventResponsesLoading(false);
    }
  }, [selectedEvent, loadEventResponses, loadEvents]);

  const submitResponse = useCallback(async (eventId, answers, userId) => {
    setResponseSubmitting(true);
    try {
      await submitEventResponse(eventId, answers, userId);
      setResponseSubmitted(true);
      await loadEvents();
    } catch (error) {
      const message = error?.message ?? 'Não foi possível enviar sua resposta.';
      window.alert(message);
      throw error;
    } finally {
      setResponseSubmitting(false);
    }
  }, [loadEvents]);

  const fetchEventForPublicView = useCallback(async (eventId) => {
    try {
      const event = await fetchEventById(eventId);
      return event;
    } catch (error) {
      window.alert(error?.message ?? 'Não foi possível carregar o evento.');
      throw error;
    }
  }, []);

  const visibleEvents = useMemo(() => {
    if (userRole === 'participant') {
      return events.filter(event => event.status === 'ativo');
    }
    return events;
  }, [events, userRole]);

  const value = {
    events,
    visibleEvents,
    eventsLoading,
    selectedEvent,
    setSelectedEvent,
    editingEvent,
    setEditingEvent,
    eventResponses,
    eventResponsesLoading,
    responseSubmitting,
    responseSubmitted,
    setResponseSubmitted,
    loadEvents,
    loadEventResponses,
    createEvent,
    updateEvent,
    deleteEventById,
    deleteResponses,
    submitResponse,
    fetchEventForPublicView,
  };

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
};

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
};
