import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Automatically routes to /profile if authenticated, or /login if unauthenticated
const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#07030f]">
        <div className="w-10 h-10 rounded-full border-2 border-purple-500/40 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  return user ? <Navigate to="/profile" replace /> : <Navigate to="/login" replace />;
};

const AppContent: React.FC = () => {
  return (
    <Routes>
      {/* Root redirect: directly to /profile or /login */}
      <Route path="/" element={<RootRedirect />} />

      {/* Auth Screens */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Primary Authenticated Profile Settings & App Hub */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Chat routes directly opening Chat tab */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ProfilePage defaultTab="chats" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chats"
        element={<Navigate to="/chat" replace />}
      />

      {/* Alias /dashboard directly to /profile */}
      <Route
        path="/dashboard"
        element={<Navigate to="/profile" replace />}
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
