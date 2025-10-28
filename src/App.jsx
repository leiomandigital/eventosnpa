import React, { useCallback, useEffect, useMemo, useState } from 'react';
import LoginView from './components/auth/LoginView';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import DashboardView from './components/dashboard/DashboardView';
import EventsListView from './components/events/EventsListView';
import CreateEventView from './components/events/CreateEventView';
import RespondEventView from './components/events/RespondEventView';
import EventResponsesView from './components/events/EventResponsesView';
import UsersView from './components/admin/UsersView';
import {
  fetchEvents,
  createEventWithQuestions,
  updateEventWithQuestions,
  deleteEvent,
  fetchEventResponses,
  deleteEventResponses,
} from './services/eventsService';
import {
  loginUser,
  fetchUsers,
  createUser,
  deleteUser,
} from './services/usersService';

const VIEWS_REQUIRING_EVENTS = new Set(['dashboard', 'events', 'preview-event', 'event-responses']);
const VIEWS_KEEPING_SELECTED_EVENT = new Set(['respond-event', 'preview-event', 'event-responses']);

const EventManagementSystem = () => {
  const [currentView, setCurrentView] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventResponses, setEventResponses] = useState([]);
  const [eventResponsesLoading, setEventResponsesLoading] = useState(false);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const userRole = currentUser?.role ?? 'participant';

  const handleChangeView = (view) => {
    if (!VIEWS_KEEPING_SELECTED_EVENT.has(view)) {
      setSelectedEvent(null);
      setEventResponses([]);
    }
    if (view !== 'create-event') {
      setEditingEvent(null);
    }
    setCurrentView(view);
  };

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const data = await fetchEvents();
      setEvents(data);
    } catch (error) {
      const message = error?.message ?? 'Nao foi possivel carregar os eventos.';
      window.alert(message);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (error) {
      const message = error?.message ?? 'Nao foi possivel carregar os usuarios.';
      window.alert(message);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    if (VIEWS_REQUIRING_EVENTS.has(currentView) && events.length === 0) {
      loadEvents();
    }
  }, [currentUser, currentView, events.length, loadEvents]);

  useEffect(() => {
    if (currentUser?.role === 'admin' && currentView === 'users') {
      loadUsers();
    }
  }, [currentUser, currentView, loadUsers]);

  const handleLogin = async ({ login, password }) => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const user = await loginUser({ login, password });
      setCurrentUser(user);
      setCurrentView('dashboard');
      await loadEvents();
    } catch (error) {
      const message = error?.message ?? 'Nao foi possivel autenticar.';
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setSelectedEvent(null);
    setEvents([]);
    setUsers([]);
    setCurrentUser(null);
    setCurrentView('login');
    setEditingEvent(null);
    setEventResponses([]);
  };

  const handleCreateEventClick = () => {
    setEditingEvent(null);
    setSelectedEvent(null);
    setCurrentView('create-event');
  };

  const handleSaveEvent = async (eventData, questions, eventId) => {
    if (!currentUser) {
      window.alert('E necessario estar autenticado para criar eventos.');
      return;
    }

    const payload = {
      ...eventData,
      status: eventData.status ?? 'aguardando',
    };

    try {
      if (eventId) {
        await updateEventWithQuestions(eventId, payload, questions);
        window.alert('Evento atualizado com sucesso.');
      } else {
        await createEventWithQuestions(payload, questions, currentUser.id);
        window.alert('Evento salvo com sucesso.');
      }
      await loadEvents();
      setCurrentView('events');
      setEditingEvent(null);
    } catch (error) {
      const message = error?.message ?? 'Nao foi possivel salvar o evento.';
      window.alert(message);
    }
  };

  const handlePreviewEvent = (eventToPreview) => {
    if (!eventToPreview) {
      return;
    }
    setSelectedEvent(eventToPreview);
    setCurrentView('preview-event');
  };

  const handleDeleteEvent = async (eventId) => {
    const confirmation = window.confirm('Deseja realmente remover este evento?');
    if (!confirmation) {
      return;
    }

    try {
      await deleteEvent(eventId);
      await loadEvents();
    } catch (error) {
      const message = error?.message ?? 'Nao foi possivel remover o evento.';
      window.alert(message);
    }
  };

  const loadEventResponses = useCallback(async (eventId) => {
    setEventResponsesLoading(true);
    try {
      const data = await fetchEventResponses(eventId);
      setEventResponses(data);
    } catch (error) {
      const message = error?.message ?? 'Nao foi possivel carregar as respostas do evento.';
      window.alert(message);
      setEventResponses([]);
    } finally {
      setEventResponsesLoading(false);
    }
  }, []);

  const handleViewEventResponses = async (eventToView) => {
    if (!eventToView?.id) {
      return;
    }
    setSelectedEvent(eventToView);
    setCurrentView('event-responses');
    await loadEventResponses(eventToView.id);
  };

  const handleDeleteResponses = async (responseIds) => {
    if (!selectedEvent?.id || !Array.isArray(responseIds) || responseIds.length === 0) {
      return;
    }
    setEventResponsesLoading(true);
    try {
      await deleteEventResponses(responseIds);
      await loadEventResponses(selectedEvent.id);
      await loadEvents();
      window.alert('Respostas excluidas com sucesso.');
    } catch (error) {
      const message = error?.message ?? 'Nao foi possivel excluir as respostas selecionadas.';
      window.alert(message);
    } finally {
      setEventResponsesLoading(false);
    }
  };

  const handleShareEvent = (eventToShare) => {
    const shareLink = `${window.location.origin}/eventos/${eventToShare.id}`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(shareLink).then(() => {
        window.alert('Link de compartilhamento copiado para a area de transferencia.');
      }).catch(() => {
        window.alert(`Copie o link para compartilhar: ${shareLink}`);
      });
    } else {
      window.prompt('Copie o link para compartilhar:', shareLink);
    }
  };

  const handleRespondEvent = (eventId) => {
    const event = events.find(item => item.id === eventId);
    if (!event) {
      window.alert('Evento nao encontrado.');
      return;
    }
    setSelectedEvent(event);
    setCurrentView('respond-event');
  };

  const handleEditEvent = (eventToEdit) => {
    setEditingEvent(eventToEdit);
    setSelectedEvent(null);
    setCurrentView('create-event');
  };

  const handleCreateUser = async (userData) => {
    try {
      await createUser(userData);
      await loadUsers();
      window.alert('Usuario criado com sucesso.');
    } catch (error) {
      const message = error?.message ?? 'Nao foi possivel criar o usuario.';
      window.alert(message);
      throw error;
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId);
      await loadUsers();
    } catch (error) {
      const message = error?.message ?? 'Nao foi possivel excluir o usuario.';
      window.alert(message);
      throw error;
    }
  };

  const visibleEvents = useMemo(() => {
    if (userRole === 'participant') {
      return events.filter(event => event.status === 'ativo');
    }
    return events;
  }, [events, userRole]);

  if (currentView === 'login') {
    return (
      <LoginView 
        onLogin={handleLogin}
        loading={authLoading}
        errorMessage={authError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        userRole={userRole}
        onLogout={handleLogout}
        userName={currentUser?.name}
        userEmail={currentUser?.email}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          currentView={currentView}
          userRole={userRole}
          onChangeView={handleChangeView}
        />
        <main className="flex-1 overflow-y-auto">
          {currentView === 'dashboard' && (
            <DashboardView 
              userRole={userRole}
              events={events}
              onNavigate={handleChangeView}
            />
          )}

          {currentView === 'events' && (
            <EventsListView 
              userRole={userRole}
              events={visibleEvents}
              loading={eventsLoading}
              onCreateEvent={handleCreateEventClick}
              onRespond={(event) => handleRespondEvent(event.id)}
              onPreview={handlePreviewEvent}
              onViewResponses={handleViewEventResponses}
              onShare={handleShareEvent}
              onEdit={handleEditEvent}
              onDelete={(eventId) => handleDeleteEvent(eventId)}
            />
          )}

          {currentView === 'preview-event' && selectedEvent && (
            <RespondEventView 
              event={selectedEvent}
              readOnly
              onShare={handleShareEvent}
            />
          )}

          {currentView === 'create-event' && (
            <CreateEventView 
              editingEvent={editingEvent}
              availableEvents={events}
              onCancel={() => handleChangeView('events')}
              onSave={handleSaveEvent}
            />
          )}

          {currentView === 'respond-event' && selectedEvent && (
            <RespondEventView 
              event={selectedEvent}
              onBack={() => handleChangeView('events')}
            />
          )}

          {currentView === 'event-responses' && selectedEvent && (
            <EventResponsesView 
              event={selectedEvent}
              responses={eventResponses}
              loading={eventResponsesLoading}
              onDeleteResponses={handleDeleteResponses}
            />
          )}

          {currentView === 'users' && userRole === 'admin' && (
            <UsersView 
              users={users}
              loading={usersLoading}
              onCreateUser={handleCreateUser}
              onDeleteUser={handleDeleteUser}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default EventManagementSystem;



