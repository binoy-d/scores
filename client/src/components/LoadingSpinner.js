import React from 'react';
import { Spin } from 'antd';

const LoadingSpinner = ({ size = 'default', className = '' }) => {
  return (
    <div className={className} style={{ textAlign: 'center', padding: '20px' }}>
      <Spin size={size} />
    </div>
  );
};

export default LoadingSpinner;
