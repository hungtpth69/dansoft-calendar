import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import CalendarBoard from './pages/CalendarBoard';
import { useAuth } from './hooks/useAuth';

// Route bọc ngoài kiểm tra Auth
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen w-screen animate-pulse bg-slate-50"/>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/" 
          element={
            <AuthRoute>
              <CalendarBoard />
            </AuthRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
