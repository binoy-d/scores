import React from 'react';
import { FloatButton } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const FloatingAddButton = ({ onClick }) => {
  const { isAuthenticated } = useAuth();

  // Only show for authenticated users
  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1000,
      }}
    >
      <FloatButton
        icon={<PlusOutlined style={{ fontSize: '24px' }} />}
        type="primary"
        onClick={onClick}
        tooltip="Add Match"
        size="large"
        style={{
          width: '64px',
          height: '64px',
          backgroundColor: '#3b82f6',
          borderColor: '#3b82f6',
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.6), 0 8px 32px rgba(59, 130, 246, 0.3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          animation: 'pulse-glow 2s infinite',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        className="floating-add-button"
      />
      
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.6), 0 8px 32px rgba(59, 130, 246, 0.3);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.8), 0 12px 40px rgba(59, 130, 246, 0.5);
            transform: scale(1.05);
          }
        }
        
        .floating-add-button:hover {
          transform: scale(1.1) !important;
          box-shadow: 0 0 40px rgba(59, 130, 246, 0.9), 0 16px 48px rgba(59, 130, 246, 0.6) !important;
          animation: none !important;
        }
        
        .floating-add-button:active {
          transform: scale(0.95) !important;
        }
        
        .floating-add-button .ant-float-btn-body {
          background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
          border: none !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        
        .floating-add-button .ant-float-btn-icon {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 100% !important;
          height: 100% !important;
        }
        
        .floating-add-button .anticon {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
      `}</style>
    </div>
  );
};

export default FloatingAddButton;
