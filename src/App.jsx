import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from './api';
import { I18nProvider } from './contexts/I18nContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import AcceptInvitePage from './pages/AcceptInvitePage';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ItemsPage from './pages/ItemsPage';
import NewItemPage from './pages/NewItemPage';
import ItemDetailPage from './pages/ItemDetailPage';
import MatchesPage from './pages/MatchesPage';
import ItemMatchesPage from './pages/ItemMatchesPage';
import TeamPage from './pages/TeamPage';
import SubscriptionPage from './pages/SubscriptionPage';
import SettingsPage from './pages/SettingsPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import EventFormPage from './pages/EventFormPage';
import ConfirmPickupPage from './pages/ConfirmPickupPage';

function ProtectedRoute({ children, auth }) {
  if (!auth) return <Navigate to="/login" replace />;
  return children;
}

function AppShell({ auth, onLogout, children }) {
  return (
    <Layout auth={auth} onLogout={onLogout}>
      {children}
    </Layout>
  );
}

export default function App() {
  const [auth, setAuth] = useState(null);   // { user, organization, org_role }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/business/auth/me')
      .then(res => setAuth(res.data))
      .catch(() => setAuth(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-6 h-6 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const handleLogin = (data) => {
    setAuth(data);
    window.location.href = '/';
  };

  const handleLogout = () => {
    setAuth(null);
    window.location.href = '/login';
  };

  return (
    <I18nProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          auth ? <Navigate to="/" replace /> : <LoginPage onLogin={handleLogin} />
        } />

        <Route path="/accept-invite" element={
          <AcceptInvitePage onLogin={handleLogin} />
        } />

        <Route path="/" element={
          <ProtectedRoute auth={auth}>
            <AppShell auth={auth} onLogout={handleLogout}>
              <HomePage auth={auth} />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute auth={auth}>
            <AppShell auth={auth} onLogout={handleLogout}>
              <DashboardPage auth={auth} />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/items" element={
          <ProtectedRoute auth={auth}>
            <AppShell auth={auth} onLogout={handleLogout}>
              <ItemsPage auth={auth} />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/items/new" element={
          <ProtectedRoute auth={auth}>
            <AppShell auth={auth} onLogout={handleLogout}>
              <NewItemPage auth={auth} />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/items/:itemId/edit" element={
          <ProtectedRoute auth={auth}>
            <AppShell auth={auth} onLogout={handleLogout}>
              <NewItemPage auth={auth} />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/items/:itemId" element={
          <ProtectedRoute auth={auth}>
            <AppShell auth={auth} onLogout={handleLogout}>
              <ItemDetailPage auth={auth} />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/matches" element={
          <ProtectedRoute auth={auth}>
            <AppShell auth={auth} onLogout={handleLogout}>
              <MatchesPage auth={auth} />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/matches/:itemId" element={
          <ProtectedRoute auth={auth}>
            <AppShell auth={auth} onLogout={handleLogout}>
              <ItemMatchesPage auth={auth} />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/team" element={
          <ProtectedRoute auth={auth}>
            <AppShell auth={auth} onLogout={handleLogout}>
              <TeamPage auth={auth} />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/subscription" element={
          <ProtectedRoute auth={auth}>
            <AppShell auth={auth} onLogout={handleLogout}>
              <SubscriptionPage auth={auth} />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/events" element={
          <ProtectedRoute auth={auth}>
            <AppShell auth={auth} onLogout={handleLogout}>
              <EventsPage auth={auth} />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/events/new" element={
          <ProtectedRoute auth={auth}>
            <AppShell auth={auth} onLogout={handleLogout}>
              <EventFormPage auth={auth} />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/events/:eventId/edit" element={
          <ProtectedRoute auth={auth}>
            <AppShell auth={auth} onLogout={handleLogout}>
              <EventFormPage auth={auth} />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/events/:eventId" element={
          <ProtectedRoute auth={auth}>
            <AppShell auth={auth} onLogout={handleLogout}>
              <EventDetailPage auth={auth} />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/pickups" element={
          <ProtectedRoute auth={auth}>
            <AppShell auth={auth} onLogout={handleLogout}>
              <ConfirmPickupPage auth={auth} />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute auth={auth}>
            <AppShell auth={auth} onLogout={handleLogout}>
              <SettingsPage auth={auth} />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </I18nProvider>
  );
}
