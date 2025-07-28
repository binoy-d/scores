import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Components
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';
import AddMatchModal from './components/AddMatchModal';
import FloatingAddButton from './components/FloatingAddButton';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UsersPage';
import NotFoundPage from './pages/NotFoundPage';

// Route Guards
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  const { loading } = useAuth();
  const [isAddMatchModalOpen, setIsAddMatchModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      <Navbar />
      <main className="pb-8">
        <Routes>
          {/* Public/Main Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Admin Routes */}
          <Route path="/users" element={
            <AdminRoute>
              <UsersPage />
            </AdminRoute>
          } />
          
          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      
      {/* Floating Action Button */}
      <FloatingAddButton onClick={() => setIsAddMatchModalOpen(true)} />
      
      {/* Global Modal */}
      <AddMatchModal 
        isOpen={isAddMatchModalOpen} 
        onClose={() => setIsAddMatchModalOpen(false)} 
      />
    </div>
  );
}

export default App;
