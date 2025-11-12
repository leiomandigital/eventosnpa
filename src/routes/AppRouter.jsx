import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { EventsProvider } from '../contexts/EventsContext';
import { UsersProvider } from '../contexts/UsersContext';

import LoginView from '../components/auth/LoginView';
import ForcePasswordChangeView from '../components/auth/ForcePasswordChangeView';
import DashboardView from '../components/dashboard/DashboardView';
import EventsListView from '../components/events/EventsListView';
import CreateEventView from '../components/events/CreateEventView';
import RespondEventView from '../components/events/RespondEventView';
import EventResponsesView from '../components/events/EventResponsesView';
import UsersView from '../components/admin/UsersView';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { useState } from 'react';
import { useEffect } from 'react';
import { useCallback } from 'react';
import { useEvents } from '../contexts/EventsContext';

const VIEWS_REQUIRING_EVENTS = new Set(['dashboard', 'events', 'preview-event', 'event-responses']);
const VIEWS_KEEPING_SELECTED_EVENT = new Set(['respond-event', 'preview-event', 'event-responses']);

const PrivateRoute = ({ children, roles }) => {
  const { isAuthenticated, userRole, authLoading, requiresPasswordChange } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiresPasswordChange) {
    return <Navigate to="/force-password-change" replace />;
  }

  if (roles && !roles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const PublicEventRoute = ({ children }) => {
  const { fetchEventForPublicView } = useEvents();
  const [publicView, setPublicView] = useState({ event: null, mode: null });
  const [publicViewLoading, setPublicViewLoading] = useState(true);

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
          const event = await fetchEventForPublicView(eventId);
          setPublicView({ event, mode });
        } catch (error) {
          // Erro já alertado em fetchEventForPublicView
        }
      }
    }
    setPublicViewLoading(false);
  }, [fetchEventForPublicView]);

  useEffect(() => {
    handlePublicUrl();
  }, [handlePublicUrl]);

  if (publicViewLoading) {
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
      return React.cloneElement(children, { event: publicView.event, publicResponse: true });
    }
  }
  return <Navigate to="/login" replace />;
};

const AppRouter = () => {
  const { isAuthenticated, userRole, logout, currentUser, requiresPasswordChange, authLoading, login, authError, forcePasswordChange, passwordChangeLoading, passwordChangeError, setCurrentUser } = useAuth();
  const { events, visibleEvents, eventsLoading, selectedEvent, setSelectedEvent, editingEvent, setEditingEvent, eventResponses, eventResponsesLoading, responseSubmitting, responseSubmitted, setResponseSubmitted, loadEvents, loadEventResponses, createEvent, updateEvent, deleteEventById, deleteResponses, submitResponse } = useEvents();

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // Padrão para usuários autenticados

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const handleChangeView = (view) => {
    if (window.location.pathname.startsWith('/visualizar/evento/') || window.location.pathname.startsWith('/responder/evento/')) {
      window.history.pushState({}, '', '/');
    }

    if (!VIEWS_KEEPING_SELECTED_EVENT.has(view)) {
      setSelectedEvent(null);
      // setEventResponses([]); // Gerenciado por EventsContext
    }
    if (view !== 'create-event') {
      setEditingEvent(null);
    }
    setResponseSubmitted(false);
    setCurrentView(view);
    setSidebarOpen(false);
  };

  useEffect(() => {
    if (isAuthenticated && !requiresPasswordChange) {
      // Carregar eventos se a visualização atual exigir e eles ainda não tiverem sido carregados
      if (VIEWS_REQUIRING_EVENTS.has(currentView) && events.length === 0) {
        loadEvents();
      }
    }
  }, [isAuthenticated, requiresPasswordChange, currentView, events.length, loadEvents]);

  // Lógica de URL pública para carregamento inicial
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/visualizar/evento/') || path.startsWith('/responder/evento/')) {
      // Isso será tratado por PublicEventRoute
    } else if (isAuthenticated && !requiresPasswordChange) {
      setCurrentView('dashboard');
    } else if (requiresPasswordChange) {
      setCurrentView('force-password-change');
    } else {
      setCurrentView('login');
    }
  }, [isAuthenticated, requiresPasswordChange]);

  const handleLogin = async (credentials) => {
    try {
      const user = await login(credentials);
      if (user.password_change_required) {
        setCurrentView('force-password-change');
      } else {
        setCurrentView('dashboard');
        await loadEvents();
      }
      return true;
    } catch (error) {
      // Erro já tratado por AuthContext
      return false;
    }
  };

  const handleForcePasswordChange = async (newPassword) => {
    if (!currentUser) return;
    try {
      await forcePasswordChange(currentUser.id, newPassword);
      setCurrentView('dashboard');
      await loadEvents();
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleLogout = () => {
    logout();
    setSelectedEvent(null);
    setEditingEvent(null);
    setResponseSubmitted(false);
    setCurrentView('login');
  };

  const handleCreateEventClick = () => {
    setEditingEvent(null);
    setSelectedEvent(null);
    handleChangeView('create-event');
  };

  const handleSaveEvent = async (eventData, questions, eventId) => {
    try {
      if (eventId) {
        await updateEvent(eventId, eventData, questions);
      } else {
        await createEvent(eventData, questions);
      }
      handleChangeView('events');
      return true;
    } catch (error) {
      return false;
    }
  };

  const handlePreviewEvent = (eventToPreview) => {
    if (!eventToPreview) return;
    setSelectedEvent(eventToPreview);
    handleChangeView('preview-event');
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await deleteEventById(eventId);
      return true;
    }  catch (error) {
      // Erro já tratado por EventsContext
      return false;
    }
  };

  const handleViewEventResponses = async (eventToView) => {
    if (!eventToView?.id) return;
    setSelectedEvent(eventToView);
    handleChangeView('event-responses');
    await loadEventResponses(eventToView.id);
  };

  const handleDeleteResponses = async (responseIds) => {
    try {
      await deleteResponses(responseIds);
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleSharePreviewLink = (eventToShare) => {
    const shareLink = `${window.location.origin}/visualizar/evento/${eventToShare.id}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(shareLink).then(() => {
        window.alert('Link de compartilhamento copiado para a área de transferência.');
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
        window.alert('Link de compartilhamento copiado para a área de transferência.');
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
      window.alert('Evento não encontrado.');
      return;
    }
    setSelectedEvent(event);
    handleChangeView('respond-event');
  };

  const handleSubmitPublicResponse = async (event, answers) => {
    if (!event) {
      window.alert('Evento não encontrado.');
      return;
    }
    try {
      await submitResponse(event.id, answers, undefined);
      // setResponseSubmitted(true); // Gerenciado por EventsContext
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleSubmitResponse = async (answers) => {
    if (!selectedEvent) {
      window.alert('Evento não encontrado.');
      return;
    }
    try {
      await submitResponse(selectedEvent.id, answers, currentUser?.id);
      if (currentUser) {
        setTimeout(() => {
          handleChangeView('events');
        }, 5000);
      }
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleEditEvent = (eventToEdit) => {
    setEditingEvent(eventToEdit);
    setSelectedEvent(null);
    handleChangeView('create-event');
  };


  if (authLoading && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }



  return (
    <Router>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginView onLogin={handleLogin} loading={authLoading} errorMessage={authError} />} />
        <Route path="/force-password-change" element={requiresPasswordChange ? <ForcePasswordChangeView userName={currentUser?.name} userLogin={currentUser?.login} loading={passwordChangeLoading} errorMessage={passwordChangeError} onSubmit={handleForcePasswordChange} /> : <Navigate to="/dashboard" />} />
        <Route path="/visualizar/evento/:eventId" element={<PublicEventRoute><RespondEventView readOnly /></PublicEventRoute>} />
        <Route path="/responder/evento/:eventId" element={<PublicEventRoute><RespondEventView onSubmit={handleSubmitPublicResponse} submitting={responseSubmitting} submitted={responseSubmitted} /></PublicEventRoute>} />

        <Route
          path="/*"
          element={
            <PrivateRoute>
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
                        events={events} // Considere usar visibleEvents do contexto, se ainda não filtrado
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
                        availableEvents={events} // Ou buscar separadamente, se necessário
                        onCancel={() => handleChangeView('events')}
                        onSave={handleSaveEvent}
                      />
                    )}

                    {currentView === 'respond-event' && selectedEvent && (
                      <RespondEventView
                        event={selectedEvent}
                        onBack={() => handleChangeView('events')}
                        onSubmit={(event, answers) => handleSubmitResponse(answers)}
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
                        // O contexto de Usuários fornecerá usuários e funções relacionadas diretamente
                      />
                    )}
                  </main>
                </div>
              </div>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
};

const App = () => (
  <AuthProvider>
    <EventsProvider>
      <UsersProvider>
        <AppRouter />
      </UsersProvider>
    </EventsProvider>
  </AuthProvider>
);

export default App;
