import React from 'react';
import { useQuery } from 'react-query';
import { publicAPI, matchesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Button, 
  Badge, 
  Avatar, 
  Typography, 
  Space, 
  Tag,
  Empty,
  Spin
} from 'antd';
import { 
  TrophyOutlined,
  UserOutlined,
  PlayCircleOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();

  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery(
    'public-leaderboard',
    () => publicAPI.getLeaderboard({ limit: 50, min_matches: 3 }),
    { enabled: true }
  );

  const { data: pendingRequestsData, isLoading: pendingLoading } = useQuery(
    'pending-requests',
    () => matchesAPI.getPendingRequests(),
    { enabled: isAuthenticated() }
  );

  const leaderboard = leaderboardData?.data?.leaderboard || [];
  const stats = leaderboardData?.data?.stats || {};
  const pendingRequests = pendingRequestsData?.data?.pendingRequests || [];

  const handleMatchAction = async (matchId, action) => {
    try {
      // This will be implemented when we add the match confirmation functionality
      console.log(`${action} match ${matchId}`);
    } catch (error) {
      console.error('Failed to process match action:', error);
    }
  };

  return (
    <div className="min-h-screen bg-primary">
      <div className="container py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-extrabold text-primary mb-3 bg-gradient-to-r from-text-primary via-accent-primary to-text-primary bg-clip-text text-transparent">
            {isAuthenticated() ? `Welcome back, ${user?.username}!` : 'SVIC Ping Pong League'}
          </h1>
          <p className="text-lg text-secondary">
            {isAuthenticated() 
              ? 'Check your pending matches and see how you rank against your colleagues'
              : 'See the current rankings and join the competition'
            }
          </p>
        </div>

        {/* Pending Matches Section - Only for logged in users */}
        {isAuthenticated() && (
          <div style={{ marginBottom: 32 }}>
            <Title level={3} style={{ color: '#9333ea', marginBottom: 16 }}>
              <ClockCircleOutlined style={{ marginRight: 8 }} />
              Pending Match Approvals
            </Title>
            
            {pendingLoading ? (
              <Card>
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <Spin />
                </div>
              </Card>
            ) : pendingRequests.length > 0 ? (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {pendingRequests.map((request, index) => (
                  <Card key={request.id} hoverable>
                    <Row justify="space-between" align="middle">
                      <Col flex="auto">
                        <Space>
                          <Avatar 
                            style={{ backgroundColor: '#9333ea' }}
                            size="large"
                          >
                            {request.requesting_username.charAt(0).toUpperCase()}
                          </Avatar>
                          <div>
                            <Title level={5} style={{ margin: 0, color: '#9333ea' }}>
                              {request.requesting_username}
                            </Title>
                            <Text type="secondary">reported a match against you</Text>
                          </div>
                        </Space>
                        <div style={{ marginTop: 12 }}>
                          <Space>
                            <Tag color="blue">
                              Score: {request.player1_score} - {request.player2_score}
                            </Tag>
                            <Text type="secondary">
                              {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                            </Text>
                          </Space>
                        </div>
                      </Col>
                      <Col>
                        <Space>
                          <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={() => handleMatchAction(request.match_id, 'approve')}
                            style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                          >
                            Approve
                          </Button>
                          <Button
                            danger
                            icon={<CloseCircleOutlined />}
                            onClick={() => handleMatchAction(request.match_id, 'deny')}
                          >
                            Deny
                          </Button>
                        </Space>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </Space>
            ) : (
              <Card>
                <Empty
                  image={<ClockCircleOutlined style={{ fontSize: 48, color: '#d1d5db' }} />}
                  description={
                    <span>
                      No pending match approvals
                      <br />
                      <Text type="secondary">All caught up! 🎉</Text>
                    </span>
                  }
                />
              </Card>
            )}
          </div>
        )}

        {/* Leaderboard Section */}
        <div className="animate-fade-in">
          <Row justify="space-between" align="middle" style={{ marginBottom: 32 }}>
            <Col>
              <Title level={2} style={{ margin: 0, color: '#9333ea' }}>
                Leaderboard
              </Title>
              <Text type="secondary">
                Minimum 3 matches required • Updated in real-time
              </Text>
            </Col>
            <Col>
              <Card size="small" style={{ borderColor: '#9333ea' }}>
                <Space>
                  <Text type="secondary">Total Players:</Text>
                  <Text strong style={{ color: '#9333ea' }}>
                    {stats.totalActivePlayers || 0}
                  </Text>
                </Space>
              </Card>
            </Col>
          </Row>

          {/* Stats Overview */}
          <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable>
                <Statistic
                  title="Players"
                  value={stats.total_players || 0}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#9333ea' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable>
                <Statistic
                  title="Matches"
                  value={stats.total_matches || 0}
                  prefix={<PlayCircleOutlined />}
                  valueStyle={{ color: '#10b981' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable>
                <Statistic
                  title="Highest ELO"
                  value={stats.highest_elo || 1200}
                  prefix={<CrownOutlined />}
                  valueStyle={{ color: '#f59e0b' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable>
                <Statistic
                  title="Average ELO"
                  value={stats.average_elo || 1200}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#6366f1' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Leaderboard Cards */}
          {leaderboardLoading ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <Spin size="large" />
            </div>
          ) : (
            <>
              {leaderboard.length > 0 ? (
                <Row gutter={[16, 16]}>
                  {leaderboard.map((player, index) => (
                    <Col xs={24} sm={12} lg={8} xl={6} key={player.id}>
                      <Badge.Ribbon 
                        text={`#${player.rank}`} 
                        color={player.rank === 1 ? 'gold' : player.rank === 2 ? 'silver' : player.rank === 3 ? '#cd7f32' : 'blue'}
                      >
                        <Card 
                          hoverable
                          style={{
                            height: '100%',
                            borderColor: isAuthenticated() && player.id === user?.id ? '#9333ea' : undefined,
                            boxShadow: isAuthenticated() && player.id === user?.id ? '0 0 20px rgba(147, 51, 234, 0.3)' : undefined
                          }}
                        >
                          <div style={{ textAlign: 'center' }}>
                            {/* Player Avatar */}
                            <Avatar 
                              size={64} 
                              style={{ 
                                backgroundColor: '#9333ea',
                                marginBottom: 16,
                                fontSize: '24px',
                                fontWeight: 'bold'
                              }}
                            >
                              {player.username.charAt(0).toUpperCase()}
                            </Avatar>
                            
                            {/* Player Name */}
                            <Title level={4} style={{ margin: '8px 0', color: '#9333ea' }}>
                              {player.username}
                              {user?.id === player.id && (
                                <Tag color="purple" style={{ marginLeft: 8 }}>You</Tag>
                              )}
                            </Title>

                            {/* ELO Rating */}
                            <div style={{ marginBottom: 16 }}>
                              <Statistic
                                value={player.elo_rating}
                                suffix="ELO"
                                valueStyle={{ 
                                  color: '#9333ea', 
                                  fontSize: '28px',
                                  fontWeight: 'bold'
                                }}
                              />
                            </div>

                            {/* Stats */}
                            <Row gutter={16} style={{ marginBottom: 16 }}>
                              <Col span={12}>
                                <Statistic
                                  title="Matches"
                                  value={player.total_matches}
                                  valueStyle={{ fontSize: '18px' }}
                                />
                              </Col>
                              <Col span={12}>
                                <Statistic
                                  title="Wins"
                                  value={player.wins}
                                  valueStyle={{ fontSize: '18px' }}
                                />
                              </Col>
                            </Row>

                            {/* Win Rate */}
                            <Tag 
                              color={
                                player.win_rate >= 70 ? 'green' :
                                player.win_rate >= 50 ? 'blue' : 'red'
                              }
                              style={{ fontSize: '14px', padding: '4px 12px' }}
                            >
                              {player.win_rate}% Win Rate
                            </Tag>

                            {/* Last Match */}
                            <div style={{ marginTop: 12 }}>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                Last: {player.last_match_date ? 
                                  formatDistanceToNow(new Date(player.last_match_date), { addSuffix: true }) : 
                                  'Never'
                                }
                              </Text>
                            </div>
                          </div>
                        </Card>
                      </Badge.Ribbon>
                    </Col>
                  ))}
                </Row>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span>
                      No players on the leaderboard yet
                      <br />
                      <Text type="secondary">Players need at least 3 confirmed matches to appear here</Text>
                    </span>
                  }
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
