import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
import { useAuth } from './contexts/AuthContext';

// Components
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';
import AddMatchModal from './components/AddMatchModal';
import FloatingAddButton from './components/FloatingAddButton';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Route Guards
import ProtectedRoute from './components/ProtectedRoute';

const { Header, Content } = Layout;

const App: React.FC = () => {
  const { loading } = useAuth();
  const [isAddMatchModalOpen, setIsAddMatchModalOpen] = useState<boolean>(false);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a'
      }}>
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <Header style={{ 
        padding: 0, 
        background: '#161616',
        borderBottom: '1px solid #27272a',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
      }}>
        <Navbar />
      </Header>
      
      <Content style={{ 
        padding: '24px',
        background: '#0a0a0a',
        minHeight: 'calc(100vh - 64px)'
      }}>
        <Routes>
          {/* Public/Main Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Routes */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          
          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Content>
      
      {/* Floating Action Button */}
      <FloatingAddButton onClick={() => setIsAddMatchModalOpen(true)} />
      
      {/* Global Modal */}
      <AddMatchModal 
        isOpen={isAddMatchModalOpen} 
        onClose={() => setIsAddMatchModalOpen(false)} 
      />
    </Layout>
  );
}

export default App;
