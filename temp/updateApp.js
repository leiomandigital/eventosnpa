const fs = require('fs');

const content = `import React, { useCallback, useEffect, useMemo, useState } from 'react';
import LoginView from './components/auth/LoginView';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import Modal from './components/common/Modal';
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

const createModalState = (overrides = {}) => ({
  open: false,
  title: '',
  message: '',
  confirmLabel: 'OK',
  cancelLabel: null,
  onConfirm: null,
  onCancel: null,
  ...overrides,
});

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

  const [modalState, setModalState] = useState(createModalState());

  const showMessage = useCallback((message, title = 'Aviso', confirmLabel = 'OK') => {
    setModalState(createModalState({ open: true, title, message, confirmLabel }));
  }, []);

  const requestConfirm = useCallback(
    (message, title = 'Confirmar ação', confirmLabel = 'Confirmar', cancelLabel = 'Cancelar') =>
      new Promise((resolve) => {
        setModalState(
          createModalState({
            open: true,
            title,
            message,
            confirmLabel,
            cancelLabel,
            onConfirm: () => resolve(true),
            onCancel: () => resolve(false),
          }),
        );
      }),
    [],
  );

  const handleModalConfirm = useCallback(() => {
    const handler = modalState.onConfirm;
    setModalState(createModalState());
    if (handler) {
      handler();
    }
  }, [modalState]);

  const handleModalCancel = useCallback(() => {
    const handler = modalState.onCancel;
    setModalState(createModalState());
    if (handler) {
      handler();
    }
  }, [modalState]);

  const handleChangeView = useCallback((view) => {
    if (view !== 'respond-event') {
      setSelectedEvent(null);
    }
    setCurrentView(view);
  }, []);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const data = await fetchEvents();
      setEvents(data);
    } catch (error) {
      const message = error?.message ?? 'Não foi possível carregar os eventos.';
      showMessage(message, 'Erro');
    } finally {
      setEventsLoading(false);
    }
  }, [showMessage]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (error) {
      const message = error?.message ?? 'Não foi possível carregar os usuários.';
      showMessage(message, 'Erro');
    } finally {
      setUsersLoading(false);
    }
  }, [showMessage]);

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
      const message = error?.message ?? 'Não foi possível autenticar.';
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
      showMessage('É necessário estar autenticado para criar eventos.', 'Aviso');
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
      showMessage('Evento salvo com sucesso.', 'Sucesso');
    } catch (error) {
      const message = error?.message ?? 'Não foi possível salvar o evento.';
      showMessage(message, 'Erro');
    }
  };

  const handleSaveDraft = async (eventData, questions) => {
    await handleSubmitEvent(eventData, questions, 'aguardando');
  };

  const handlePublish = async (eventData, questions) => {
    await handleSubmitEvent(eventData, questions, 'ativo');
  };

  const handleDeleteEvent = async (eventId) => {
    const confirmed = await requestConfirm('Deseja realmente remover este evento?', 'Confirmar ação');
    if (!confirmed) {
      return;
    }

    try {
      await deleteEvent(eventId);
      await loadEvents();
    } catch (error) {
      const message = error?.message ?? 'Não foi possível remover o evento.';
      showMessage(message, 'Erro');
    }
  };

  const handleShareEvent = (eventToShare) => {
    const shareLink = `${window.location.origin}/eventos/${eventToShare.id}`;
    const copyMessage = `Copie o link para compartilhar:\n${shareLink}`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(shareLink)
        .then(() => {
          showMessage('Link de compartilhamento copiado para a área de transferência.', 'Compartilhar evento', 'Entendi');
        })
        .catch(() => {
          showMessage(copyMessage, 'Compartilhar evento', 'Fechar');
        });
    } else {
      showMessage(copyMessage, 'Compartilhar evento', 'Fechar');
    }
  };

  const handleRespondEvent = (eventId) => {
    const event = events.find((item) => item.id === eventId);
    if (!event) {
      showMessage('Evento não encontrado.', 'Aviso');
      return;
    }
    setSelectedEvent(event);
    setCurrentView('respond-event');
  };

  const handleEditEvent = (eventToEdit) => {
    showMessage(`Funcionalidade de edição para "${eventToEdit.title}" ainda será implementada.`, 'Aviso');
  };

  const handleCreateUser = async (userData) => {
    try {
      await createUser(userData);
      await loadUsers();
      showMessage('Usuário criado com sucesso.', 'Sucesso');
    } catch (error) {
      const message = error?.message ?? 'Não foi possível criar o usuário.';
      showMessage(message, 'Erro');
      throw error;
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId);
      await loadUsers();
    } catch (error) {
      const message = error?.message ?? 'Não foi possível excluir o usuário.';
      showMessage(message, 'Erro');
      throw error;
    }
  };

  const visibleEvents = useMemo(() => {
    if (userRole === 'participant') {
      return events.filter((event) => event.status === 'ativo');
    }
    return events;
  }, [events, userRole]);

  if (currentView === 'login') {
    return (
      <>
        <LoginView
          onLogin={handleLogin}
          loading={authLoading}
          errorMessage={authError}
        />
        <Modal
          isOpen={modalState.open}
          title={modalState.title}
          message={modalState.message}
          confirmLabel={modalState.confirmLabel}
          cancelLabel={modalState.cancelLabel}
          onConfirm={handleModalConfirm}
          onCancel={modalState.cancelLabel ? handleModalCancel : undefined}
        />
      </>
    );
  }

  return (
    <>
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
                onRespond={handleRespondEvent}
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
                onShowMessage={showMessage}
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
                onShowMessage={showMessage}
              />
            )}
          </main>
        </div>
        <Footer />
      </div>
      <Modal
        isOpen={modalState.open}
        title={modalState.title}
        message={modalState.message}
        confirmLabel={modalState.confirmLabel}
        cancelLabel={modalState.cancelLabel}
        onConfirm={handleModalConfirm}
        onCancel={modalState.cancelLabel ? handleModalCancel : undefined}
      />
    </>
  );
};

export default EventManagementSystem;
`;

fs.writeFileSync('src/App.jsx', content, 'utf8');
