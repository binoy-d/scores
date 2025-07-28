import React from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { publicAPI, matchesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
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
  Spin,
  message
} from 'antd';
import { 
  TrophyOutlined,
  UserOutlined,
  PlayCircleOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

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
      await matchesAPI.confirm(matchId, action);
      
      if (action === 'approve') {
        message.success('Match approved successfully! ELO ratings have been updated.');
      } else {
        message.success('Match denied.');
      }
      
      // Refresh both pending requests and leaderboard
      queryClient.invalidateQueries('pending-requests');
      queryClient.invalidateQueries('public-leaderboard');
      
    } catch (error) {
      console.error('Failed to process match action:', error);
      message.error(`Failed to ${action} match. Please try again.`);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <Title level={1} style={{ 
          marginBottom: 8,
          background: 'linear-gradient(135deg, #ffffff, #3b82f6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: '2.5rem',
          fontWeight: 800
        }}>
          {isAuthenticated() ? `Welcome back, ${user?.username}!` : 'SVIC Ping Pong League'}
        </Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          {isAuthenticated() 
            ? 'Check your pending matches and see how you rank against your colleagues'
            : 'See the current rankings and join the competition'
          }
        </Text>
      </div>

      {/* Pending Matches Section - Only for logged in users */}
      {isAuthenticated() && (
        <div style={{ marginBottom: 40 }}>
          <Title level={3} style={{ 
            color: '#3b82f6', 
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ClockCircleOutlined />
            Pending Match Approvals
          </Title>
          
          {pendingLoading ? (
            <Card style={{ textAlign: 'center', padding: '32px 0' }}>
              <Spin size="large" />
            </Card>
          ) : pendingRequests.length > 0 ? (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {pendingRequests.map((request, index) => (
                <Card key={request.id} hoverable style={{ borderRadius: '12px' }}>
                  <Row justify="space-between" align="middle">
                    <Col flex="auto">
                      <Space size="middle">
                        <Avatar 
                          style={{ 
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            fontSize: '16px',
                            fontWeight: 'bold'
                          }}
                          size={48}
                        >
                          {request.requesting_username.charAt(0).toUpperCase()}
                        </Avatar>
                        <div>
                          <Title level={5} style={{ margin: 0, color: '#3b82f6' }}>
                            {request.requesting_username}
                          </Title>
                          <Text type="secondary">reported a match against you</Text>
                          <div style={{ marginTop: 8 }}>
                            <Space>
                              <Tag color="blue" style={{ borderRadius: '8px' }}>
                                Score: {request.player1_score} - {request.player2_score}
                              </Tag>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                              </Text>
                            </Space>
                          </div>
                        </div>
                      </Space>
                    </Col>
                    <Col>
                      <Space size="middle">
                        <Button
                          type="primary"
                          icon={<CheckCircleOutlined />}
                          onClick={() => handleMatchAction(request.match_id, 'approve')}
                          style={{ 
                            background: '#10b981', 
                            borderColor: '#10b981',
                            borderRadius: '8px'
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          danger
                          icon={<CloseCircleOutlined />}
                          onClick={() => handleMatchAction(request.match_id, 'deny')}
                          style={{ borderRadius: '8px' }}
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
            <Card style={{ textAlign: 'center', padding: '40px 20px', borderRadius: '12px' }}>
              <Empty
                image={<ClockCircleOutlined style={{ fontSize: 48, color: '#6b7280' }} />}
                description={
                  <div>
                    <Text>No pending match approvals</Text>
                    <br />
                    <Text type="secondary">All caught up! 🎉</Text>
                  </div>
                }
              />
            </Card>
          )}
        </div>
      )}

      {/* Leaderboard Section */}
      <div>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={2} style={{ margin: 0, color: '#3b82f6' }}>
              Leaderboard
            </Title>
            <Text type="secondary">
              Minimum 3 matches required • Updated in real-time
            </Text>
          </Col>
          <Col>
            <Card size="small" style={{ borderColor: '#3b82f6', borderRadius: '8px' }}>
              <Space>
                <Text type="secondary">Total Players:</Text>
                <Text strong style={{ color: '#3b82f6' }}>
                  {stats.totalActivePlayers || 0}
                </Text>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Stats Overview */}
        <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
          <Col xs={24} sm={12} md={6}>
            <Card hoverable style={{ borderRadius: '12px', textAlign: 'center' }}>
              <Statistic
                title="Players"
                value={stats.total_players || 0}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#3b82f6' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card hoverable style={{ borderRadius: '12px', textAlign: 'center' }}>
              <Statistic
                title="Matches"
                value={stats.total_matches || 0}
                prefix={<PlayCircleOutlined />}
                valueStyle={{ color: '#10b981' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card hoverable style={{ borderRadius: '12px', textAlign: 'center' }}>
              <Statistic
                title="Highest ELO"
                value={stats.highest_elo || 1200}
                prefix={<CrownOutlined />}
                valueStyle={{ color: '#f59e0b' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card hoverable style={{ borderRadius: '12px', textAlign: 'center' }}>
              <Statistic
                title="Average ELO"
                value={stats.average_elo || 1200}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#8b5cf6' }}
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
              <Row gutter={[20, 20]}>
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
                          borderRadius: '16px',
                          borderColor: isAuthenticated() && player.id === user?.id ? '#3b82f6' : undefined,
                          boxShadow: isAuthenticated() && player.id === user?.id ? '0 0 20px rgba(59, 130, 246, 0.3)' : undefined
                        }}
                      >
                        <div style={{ textAlign: 'center' }}>
                          {/* Player Avatar */}
                          <Avatar 
                            size={64} 
                            style={{ 
                              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                              marginBottom: 16,
                              fontSize: '24px',
                              fontWeight: 'bold'
                            }}
                          >
                            {player.username.charAt(0).toUpperCase()}
                          </Avatar>
                          
                          {/* Player Name */}
                          <Title level={4} style={{ margin: '8px 0', color: '#3b82f6' }}>
                            {player.username}
                            {user?.id === player.id && (
                              <Tag color="blue" style={{ marginLeft: 8, borderRadius: '6px' }}>You</Tag>
                            )}
                          </Title>

                          {/* ELO Rating */}
                          <div style={{ marginBottom: 16 }}>
                            <Statistic
                              value={player.elo_rating}
                              suffix="ELO"
                              valueStyle={{ 
                                color: '#3b82f6', 
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
                            style={{ 
                              fontSize: '14px', 
                              padding: '4px 12px',
                              borderRadius: '8px'
                            }}
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
              <Card style={{ textAlign: 'center', padding: '40px 20px', borderRadius: '12px' }}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div>
                      <Text>No players on the leaderboard yet</Text>
                      <br />
                      <Text type="secondary">Players need at least 3 confirmed matches to appear here</Text>
                    </div>
                  }
                />
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;
