import React from 'react';
import { Card, Typography } from 'antd';

const { Title, Text } = Typography;

const MatchesPage = () => {
  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title style={{ marginBottom: '32px', color: '#fff' }}>
        Matches
      </Title>
      <Card
        style={{
          backgroundColor: '#161616',
          borderColor: '#262626',
          borderRadius: '12px',
          textAlign: 'center',
          padding: '40px'
        }}
      >
        <Text style={{ color: '#9ca3af', fontSize: '16px' }}>
          Matches page coming soon...
        </Text>
      </Card>
    </div>
  );
};

export default MatchesPage;
