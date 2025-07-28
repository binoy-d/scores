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
    <FloatButton
      icon={<PlusOutlined />}
      type="primary"
      onClick={onClick}
      tooltip="Add Match"
      style={{
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
      }}
    />
  );
};

export default FloatingAddButton;
