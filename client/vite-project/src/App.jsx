import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage onSwitch={() => window.location.href = '/register'} />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage onSwitch={() => window.location.href = '/login'} />} />
      <Route path="/" element={<ProtectedRoute><ChatPage username={user?.username} /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="bg-red-500 text-white p-4 text-center font-bold">If this is red, Tailwind is working!</div>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App; 