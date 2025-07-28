import React from 'react';
import { useQuery } from 'react-query';
import { publicAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Card, Typography, Table, Statistic, Row, Col, Tag } from 'antd';
import { TrophyOutlined, MedalOutlined, CrownOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const LeaderboardPage = () => {
  const { data, isLoading, error } = useQuery(
    'leaderboard',
    () => publicAPI.getLeaderboard({ limit: 50, min_matches: 3 })
  );

  const leaderboard = data?.data?.leaderboard || [];
  const stats = data?.data?.stats || {};

  if (isLoading) {
    return (
      <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        <Card
          style={{
            backgroundColor: '#161616',
            borderColor: '#262626',
            borderRadius: '12px',
            textAlign: 'center'
          }}
        >
          <Text style={{ color: '#ef4444' }}>Failed to load leaderboard</Text>
        </Card>
      </div>
    );
  }

  const getRankIcon = (rank) => {
    if (rank === 1) return <TrophyOutlined style={{ color: '#fbbf24' }} />;
    if (rank === 2) return <MedalOutlined style={{ color: '#9ca3af' }} />;
    if (rank === 3) return <CrownOutlined style={{ color: '#fb923c' }} />;
    return <Text strong style={{ color: '#6b7280' }}>#{rank}</Text>;
  };

  const getWinRateColor = (winRate) => {
    if (winRate >= 70) return '#10b981';
    if (winRate >= 50) return '#3b82f6';
    return '#ef4444';
  };

  const columns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank) => getRankIcon(rank),
    },
    {
      title: 'Player',
      dataIndex: 'username',
      key: 'username',
      render: (username) => (
        <Text strong style={{ color: '#fff' }}>{username}</Text>
      ),
    },
    {
      title: 'ELO Rating',
      dataIndex: 'elo_rating',
      key: 'elo_rating',
      align: 'center',
      render: (rating) => (
        <Text strong style={{ fontSize: '16px', color: '#3b82f6' }}>{rating}</Text>
      ),
    },
    {
      title: 'Matches',
      dataIndex: 'total_matches',
      key: 'total_matches',
      align: 'center',
      render: (matches) => (
        <Text style={{ color: '#9ca3af' }}>{matches}</Text>
      ),
    },
    {
      title: 'Wins',
      dataIndex: 'wins',
      key: 'wins',
      align: 'center',
      render: (wins) => (
        <Text style={{ color: '#9ca3af' }}>{wins}</Text>
      ),
    },
    {
      title: 'Win Rate',
      dataIndex: 'win_rate',
      key: 'win_rate',
      align: 'center',
      render: (winRate) => (
        <Tag color={getWinRateColor(winRate)} style={{ fontWeight: 'bold' }}>
          {winRate}%
        </Tag>
      ),
    },
    {
      title: 'Last Match',
      dataIndex: 'last_match_date',
      key: 'last_match_date',
      render: (date) => (
        <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
          {date ? new Date(date).toLocaleDateString() : 'Never'}
        </Text>
      ),
    },
  ];

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <Title style={{ marginBottom: '16px', color: '#fff' }}>
          Leaderboard
        </Title>
        <Text style={{ color: '#9ca3af' }}>
          Rankings based on ELO rating. Minimum 3 matches required to appear on leaderboard.
        </Text>
      </div>

      {/* Stats Overview */}
      <Row gutter={[20, 20]} style={{ marginBottom: '32px' }}>
        <Col xs={12} md={6}>
          <Card
            style={{
              backgroundColor: '#161616',
              borderColor: '#262626',
              borderRadius: '12px',
              textAlign: 'center'
            }}
          >
            <Statistic
              title={<Text style={{ color: '#9ca3af' }}>Total Players</Text>}
              value={stats.total_players || 0}
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card
            style={{
              backgroundColor: '#161616',
              borderColor: '#262626',
              borderRadius: '12px',
              textAlign: 'center'
            }}
          >
            <Statistic
              title={<Text style={{ color: '#9ca3af' }}>Total Matches</Text>}
              value={stats.total_matches || 0}
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card
            style={{
              backgroundColor: '#161616',
              borderColor: '#262626',
              borderRadius: '12px',
              textAlign: 'center'
            }}
          >
            <Statistic
              title={<Text style={{ color: '#9ca3af' }}>Highest ELO</Text>}
              value={stats.highest_elo || 1200}
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card
            style={{
              backgroundColor: '#161616',
              borderColor: '#262626',
              borderRadius: '12px',
              textAlign: 'center'
            }}
          >
            <Statistic
              title={<Text style={{ color: '#9ca3af' }}>Average ELO</Text>}
              value={stats.average_elo || 1200}
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Leaderboard */}
      <Card
        style={{
          backgroundColor: '#161616',
          borderColor: '#262626',
          borderRadius: '12px'
        }}
      >
        <Table
          columns={columns}
          dataSource={leaderboard}
          rowKey="id"
          pagination={false}
          locale={{
            emptyText: (
              <Text style={{ color: '#9ca3af' }}>
                No players meet the minimum requirements yet.
              </Text>
            )
          }}
          style={{
            backgroundColor: 'transparent'
          }}
        />
      </Card>
    </div>
  );
};

export default LeaderboardPage;
