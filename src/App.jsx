import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from './api';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import AcceptInvitePage from './pages/AcceptInvitePage';
import DashboardPage from './pages/DashboardPage';
import ItemsPage from './pages/ItemsPage';
import MatchesPage from './pages/MatchesPage';
import TeamPage from './pages/TeamPage';
import SubscriptionPage from './pages/SubscriptionPage';

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
      <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
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

        <Route path="/matches" element={
          <ProtectedRoute auth={auth}>
            <AppShell auth={auth} onLogout={handleLogout}>
              <MatchesPage auth={auth} />
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
