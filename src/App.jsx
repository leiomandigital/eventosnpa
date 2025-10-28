import React, { useCallback, useEffect, useMemo, useState } from 'react';
import LoginView from './components/auth/LoginView';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import DashboardView from './components/dashboard/DashboardView';
import EventsListView from './components/events/EventsListView';
import CreateEventView from './components/events/CreateEventView';
import RespondEventView from './components/events/RespondEventView';
import UsersView from './components/admin/UsersView';
import {
  fetchEvents,
  createEventWithQuestions,
  deleteEvent,
} from './services/eventsService';
import {
  loginUser,
  fetchUsers,
  createUser,
  deleteUser,
} from './services/usersService';

const VIEWS_REQUIRING_EVENTS = new Set(['dashboard', 'events']);

const EventManagementSystem = () => {
  const [currentView, setCurrentView] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const userRole = currentUser?.role ?? 'participant';

  const handleChangeView = (view) => {
    if (view !== 'respond-event') {
      setSelectedEvent(null);
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

  const handleLogin = async ({ email, password }) => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const user = await loginUser({ email, password });
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
  };

  const handleSubmitEvent = async (eventData, questions, statusOverride) => {
    if (!currentUser) {
      window.alert('E necessario estar autenticado para criar eventos.');
      return;
    }

    const payload = {
      ...eventData,
      status: statusOverride ?? eventData.status ?? 'aguardando',
    };

    try {
      await createEventWithQuestions(payload, questions, currentUser.id);
      await loadEvents();
      setCurrentView('events');
      window.alert('Evento salvo com sucesso.');
    } catch (error) {
      const message = error?.message ?? 'Nao foi possivel salvar o evento.';
      window.alert(message);
    }
  };

  const handleSaveDraft = async (eventData, questions) => {
    await handleSubmitEvent(eventData, questions, 'aguardando');
  };

  const handlePublish = async (eventData, questions) => {
    await handleSubmitEvent(eventData, questions, 'ativo');
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
    window.alert(`Funcionalidade de edicao para "${eventToEdit.title}" ainda sera implementada.`);
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
              onCreateEvent={() => handleChangeView('create-event')}
              onRespond={(event) => handleRespondEvent(event.id)}
              onShare={handleShareEvent}
              onEdit={handleEditEvent}
              onDelete={(eventId) => handleDeleteEvent(eventId)}
            />
          )}

          {currentView === 'create-event' && (
            <CreateEventView 
              onCancel={() => handleChangeView('events')}
              onSaveDraft={handleSaveDraft}
              onPublish={handlePublish}
            />
          )}

          {currentView === 'respond-event' && selectedEvent && (
            <RespondEventView 
              event={selectedEvent}
              onBack={() => handleChangeView('events')}
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
