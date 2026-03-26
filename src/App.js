import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GameProvider } from './context/GameContext';
import Login from './pages/Login';
import Host from './pages/Host';
import Play from './pages/Play';

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== role) return <Navigate to={user.role === 'host' ? '/host' : '/play'} replace />;
  return children;
}

function LoginRoute() {
  const { user } = useAuth();
  if (user) return <Navigate to={user.role === 'host' ? '/host' : '/play'} replace />;
  return <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginRoute />} />
            <Route path="/host" element={
              <ProtectedRoute role="host"><Host /></ProtectedRoute>
            } />
            <Route path="/play" element={
              <ProtectedRoute role="player"><Play /></ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </GameProvider>
    </AuthProvider>
  );
}
