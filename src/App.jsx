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
  submitEventResponse,
  fetchEventById,
} from './services/eventsService';
import {
  loginUser,
  fetchUsers,
  createUser,
  updateUser, 
  deleteUser,
} from './services/usersService';

const VIEWS_REQUIRING_EVENTS = new Set(['dashboard', 'events', 'preview-event', 'event-responses']);
const VIEWS_KEEPING_SELECTED_EVENT = new Set(['respond-event', 'preview-event', 'event-responses']);
const USER_STORAGE_KEY = 'event-management-user';

const EventManagementSystem = () => {
  const [currentView, setCurrentView] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventResponses, setEventResponses] = useState([]);
  const [eventResponsesLoading, setEventResponsesLoading] = useState(false);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [responseSubmitting, setResponseSubmitting] = useState(false);
  const [responseSubmitted, setResponseSubmitted] = useState(false);
  
  const [publicView, setPublicView] = useState({ event: null, mode: null });
  const [publicViewLoading, setPublicViewLoading] = useState(true);

  const userRole = currentUser?.role ?? 'participant';

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };
  
  useEffect(() => {
    const persistedUser = window.localStorage.getItem(USER_STORAGE_KEY);
    if (persistedUser) {
      try {
        const user = JSON.parse(persistedUser);
        setCurrentUser(user);
        setCurrentView('dashboard');
      } catch (error) {
        window.localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    setAuthLoading(false);
  }, []);

  const handleChangeView = (view) => {
    if (window.location.pathname.startsWith('/visualizar/evento/') || window.location.pathname.startsWith('/responder/evento/')) {
      window.history.pushState({}, '', '/');
    }
    
    if (!VIEWS_KEEPING_SELECTED_EVENT.has(view)) {
      setSelectedEvent(null);
      setEventResponses([]);
    }
    if (view !== 'create-event') {
      setEditingEvent(null);
    }
    setResponseSubmitted(false);
    setCurrentView(view);
    setSidebarOpen(false);
  };
  
  const handlePublicUrl = useCallback(async () => {
    setPublicViewLoading(true);
    const path = window.location.pathname;
    const previewMatch = path.match(/\/visualizar\/evento\/(.*?)$/);
    const responseMatch = path.match(/\/responder\/evento\/(.*?)$/);

    const match = previewMatch || responseMatch;
    if (match) {
      const eventId = match[1];
      const mode = previewMatch ? 'preview' : 'response';
      if (eventId) {
        try {
          const event = await fetchEventById(eventId);
          setPublicView({ event, mode });
        } catch (error) {
          window.alert(error?.message ?? 'Nao foi possivel carregar o evento.');
        }
      }
    }
    setPublicViewLoading(false);
  }, []);
  
  useEffect(() => {
    handlePublicUrl();
  }, [handlePublicUrl]);


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
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
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
    window.localStorage.removeItem(USER_STORAGE_KEY);
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
  
  const handleSharePreviewLink = (eventToShare) => {
    const shareLink = `${window.location.origin}/visualizar/evento/${eventToShare.id}`;

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

  const handleShareResponseLink = (eventToShare) => {
    const shareLink = `${window.location.origin}/responder/evento/${eventToShare.id}`;

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
  
  const handleSubmitPublicResponse = async (answers) => {
    if (!publicView.event) {
      window.alert('Evento nao encontrado.');
      return;
    }

    setResponseSubmitting(true);
    try {
      await submitEventResponse(publicView.event.id, answers, undefined);
      setResponseSubmitted(true);
    } catch (error) {
      const message = error?.message ?? 'Nao foi possivel enviar sua resposta.';
      window.alert(message);
    } finally {
      setResponseSubmitting(false);
    }
  };

  const handleSubmitResponse = async (answers) => {
    if (!selectedEvent) {
      window.alert('Evento nao encontrado.');
      return;
    }

    setResponseSubmitting(true);
    try {
      await submitEventResponse(selectedEvent.id, answers, currentUser?.id);
      setResponseSubmitted(true);
      await loadEvents();

      if (currentUser) {
        setTimeout(() => {
          handleChangeView('events');
        }, 5000);
      }
    } catch (error) {
      const message = error?.message ?? 'Nao foi possivel enviar sua resposta.';
      window.alert(message);
    } finally {
      setResponseSubmitting(false);
    }
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
  
  const handleUpdateUser = async (userId, userData) => {
    try {
      await updateUser(userId, userData);
      await loadUsers();
      window.alert('Usuario atualizado com sucesso.');
    } catch (error) {
      const message = error?.message ?? 'Nao foi possivel atualizar o usuario.';
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
  
  if (publicViewLoading || (authLoading && !currentUser)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  if (publicView.event) {
    if (publicView.mode === 'preview') {
      return (
        <RespondEventView
          event={publicView.event}
          readOnly
        />
      );
    }
    if (publicView.mode === 'response') {
      return (
        <RespondEventView
          event={publicView.event}
          publicResponse
          onSubmit={handleSubmitPublicResponse}
          submitting={responseSubmitting}
          submitted={responseSubmitted}
        />
      );
    }
  }

  if (!currentUser) {
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
        onToggleSidebar={toggleSidebar}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentView={currentView}
          userRole={userRole}
          onChangeView={handleChangeView}
          isOpen={isSidebarOpen}
          onClose={toggleSidebar}
        />
        <main className="flex-1 overflow-y-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              userRole={userRole}
              events={events}
              onNavigate={handleChangeView}
              onRespond={(event) => handleRespondEvent(event.id)}
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
              onShare={handleShareResponseLink}
              onEdit={handleEditEvent}
              onDelete={(eventId) => handleDeleteEvent(eventId)}
            />
          )}

          {currentView === 'preview-event' && selectedEvent && (
            <RespondEventView
              event={selectedEvent}
              readOnly
              onShare={handleSharePreviewLink}
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
              onSubmit={handleSubmitResponse}
              submitting={responseSubmitting}
              submitted={responseSubmitted}
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
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default EventManagementSystem;
