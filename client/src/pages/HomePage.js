import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { publicAPI, matchesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import LoadingSpinner from '../components/LoadingSpinner';
import PlayerProfileModal from '../components/PlayerProfileModal';
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
  message,
  Table
} from 'antd';
import { 
  TrophyOutlined,
  UserOutlined,
  PlayCircleOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  StarOutlined,
  AimOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

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

  const { data: matchHistoryData, isLoading: matchHistoryLoading } = useQuery(
    'match-history',
    () => publicAPI.getRecentMatches({ limit: 50 }),
    { enabled: true }
  );

  const leaderboard = leaderboardData?.data?.leaderboard || [];
  const stats = leaderboardData?.data?.stats || {};
  const pendingRequests = pendingRequestsData?.data?.pendingRequests || [];
  const matchHistory = matchHistoryData?.data?.recent_matches || [];

  const handlePlayerClick = (username) => {
    console.log('Player clicked:', username);
    setSelectedPlayer(username);
    setProfileModalVisible(true);
  };

  const handleCloseModal = () => {
    setProfileModalVisible(false);
    setSelectedPlayer(null);
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <TrophyOutlined style={{ color: '#fbbf24' }} />;
    if (rank === 2) return <StarOutlined style={{ color: '#9ca3af' }} />;
    if (rank === 3) return <CrownOutlined style={{ color: '#fb923c' }} />;
    return <Text strong style={{ color: '#6b7280' }}>#{rank}</Text>;
  };

  const getWinRateColor = (winRate) => {
    if (winRate >= 70) return '#10b981';
    if (winRate >= 50) return '#3b82f6';
    return '#ef4444';
  };

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
      {isAuthenticated() && pendingRequests.length > 0 && (
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
          ) : (
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
          )}
        </div>
      )}

      {/* Leaderboard Section */}
      <div>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={2} style={{ margin: 0, color: '#fff' }}>
              Leaderboard
            </Title>
            <Text style={{ color: '#9ca3af' }}>
              Rankings based on ELO rating. Minimum 3 matches required to appear on leaderboard.
            </Text>
          </Col>
        </Row>

        {/* Stats Overview */}
        <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
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

        {leaderboardLoading ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Spin size="large" />
          </div>
        ) : leaderboard.length > 0 ? (
          <>
            {/* Top 3 Players - Flashy Cards */}
            {leaderboard.slice(0, 3).length > 0 && (
              <div style={{ marginBottom: 48 }}>
                <Title level={3} style={{ marginBottom: 24, color: '#fff', textAlign: 'center' }}>
                  🏆 Top Champions
                </Title>
                <Row gutter={[24, 24]} justify="center">
                  {leaderboard.slice(0, 3).map((player, index) => {
                    const getRankStyle = (rank) => {
                      switch (rank) {
                        case 1:
                          return {
                            background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)',
                            borderColor: '#fbbf24',
                            boxShadow: '0 8px 32px rgba(251, 191, 36, 0.4)',
                            transform: 'scale(1.05)',
                          };
                        case 2:
                          return {
                            background: 'linear-gradient(135deg, #e5e7eb, #9ca3af, #6b7280)',
                            borderColor: '#9ca3af',
                            boxShadow: '0 8px 32px rgba(156, 163, 175, 0.4)',
                          };
                        case 3:
                          return {
                            background: 'linear-gradient(135deg, #fb923c, #ea580c, #c2410c)',
                            borderColor: '#fb923c',
                            boxShadow: '0 8px 32px rgba(251, 146, 60, 0.4)',
                          };
                        default:
                          return {};
                      }
                    };

                    const getRankIcon = (rank) => {
                      switch (rank) {
                        case 1:
                          return <TrophyOutlined style={{ fontSize: '32px', color: '#fff' }} />;
                        case 2:
                          return <StarOutlined style={{ fontSize: '28px', color: '#fff' }} />;
                        case 3:
                          return <CrownOutlined style={{ fontSize: '28px', color: '#fff' }} />;
                        default:
                          return null;
                      }
                    };

                    return (
                      <Col xs={24} sm={12} lg={8} key={player.id}>
                        <Card
                          hoverable
                          onClick={() => handlePlayerClick(player.username)}
                          style={{
                            ...getRankStyle(player.rank),
                            borderRadius: '20px',
                            border: '2px solid',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                          bodyStyle={{
                            padding: '32px 24px',
                            textAlign: 'center',
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(10px)',
                          }}
                        >
                          {/* Rank Badge */}
                          <div style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            borderRadius: '50%',
                            width: '48px',
                            height: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(10px)',
                          }}>
                            {getRankIcon(player.rank)}
                          </div>

                          {/* Player Avatar */}
                          <Avatar
                            size={80}
                            style={{
                              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                              fontSize: '32px',
                              fontWeight: 'bold',
                              marginBottom: '16px',
                              border: '3px solid rgba(255, 255, 255, 0.3)',
                            }}
                          >
                            {player.username.charAt(0).toUpperCase()}
                          </Avatar>

                          {/* Player Name */}
                          <Title level={3} style={{ 
                            margin: '16px 0 8px 0', 
                            color: '#fff',
                            textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)'
                          }}>
                            {player.username}
                            {user?.id === player.id && (
                              <Tag color="blue" style={{ marginLeft: 8, borderRadius: '6px' }}>You</Tag>
                            )}
                          </Title>

                          {/* ELO Rating */}
                          <div style={{ marginBottom: '20px' }}>
                            <Text style={{ 
                              fontSize: '32px', 
                              fontWeight: 'bold', 
                              color: '#fff',
                              textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)'
                            }}>
                              {player.elo_rating}
                            </Text>
                            <br />
                            <Text style={{ 
                              fontSize: '14px', 
                              color: 'rgba(255, 255, 255, 0.8)',
                              textTransform: 'uppercase',
                              letterSpacing: '1px'
                            }}>
                              ELO Rating
                            </Text>
                          </div>

                          {/* Stats Row */}
                          <Row gutter={16} style={{ marginBottom: '16px' }}>
                            <Col span={8}>
                              <div style={{ textAlign: 'center' }}>
                                <Text style={{ 
                                  fontSize: '18px', 
                                  fontWeight: 'bold', 
                                  color: '#fff',
                                  display: 'block'
                                }}>
                                  {player.total_matches}
                                </Text>
                                <Text style={{ 
                                  fontSize: '12px', 
                                  color: 'rgba(255, 255, 255, 0.7)',
                                  textTransform: 'uppercase'
                                }}>
                                  Matches
                                </Text>
                              </div>
                            </Col>
                            <Col span={8}>
                              <div style={{ textAlign: 'center' }}>
                                <Text style={{ 
                                  fontSize: '18px', 
                                  fontWeight: 'bold', 
                                  color: '#fff',
                                  display: 'block'
                                }}>
                                  {player.wins}
                                </Text>
                                <Text style={{ 
                                  fontSize: '12px', 
                                  color: 'rgba(255, 255, 255, 0.7)',
                                  textTransform: 'uppercase'
                                }}>
                                  Wins
                                </Text>
                              </div>
                            </Col>
                            <Col span={8}>
                              <div style={{ textAlign: 'center' }}>
                                <Text style={{ 
                                  fontSize: '18px', 
                                  fontWeight: 'bold', 
                                  color: '#fff',
                                  display: 'block'
                                }}>
                                  {player.win_rate}%
                                </Text>
                                <Text style={{ 
                                  fontSize: '12px', 
                                  color: 'rgba(255, 255, 255, 0.7)',
                                  textTransform: 'uppercase'
                                }}>
                                  Win Rate
                                </Text>
                              </div>
                            </Col>
                          </Row>

                          {/* Rank Position */}
                          <div style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            padding: '8px 16px',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                          }}>
                            <Text style={{ 
                              color: '#fff', 
                              fontWeight: 'bold',
                              fontSize: '14px',
                              textTransform: 'uppercase',
                              letterSpacing: '1px'
                            }}>
                              {player.rank === 1 ? '🥇 Champion' : 
                               player.rank === 2 ? '🥈 Runner-up' : 
                               '🥉 Third Place'}
                            </Text>
                          </div>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              </div>
            )}

            {/* Rest of Players - Table */}
            {leaderboard.length > 3 && (
              <div>
                <Title level={3} style={{ marginBottom: 24, color: '#fff' }}>
                  All Rankings
                </Title>
                <Card
                  style={{
                    backgroundColor: '#161616',
                    borderColor: '#262626',
                    borderRadius: '12px'
                  }}
                >
                  <Table
                    columns={[
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
                          <Button 
                            type="link"
                            onClick={() => handlePlayerClick(username)}
                            style={{ 
                              padding: '4px 8px', 
                              height: 'auto',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: '#3b82f6'
                            }}
                            icon={<UserOutlined style={{ marginRight: '4px' }} />}
                          >
                            {username}
                          </Button>
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
                    ]}
                    dataSource={leaderboard.slice(3)}
                    rowKey="id"
                    pagination={false}
                    locale={{
                      emptyText: (
                        <Text style={{ color: '#9ca3af' }}>
                          No additional players to display.
                        </Text>
                      )
                    }}
                    style={{
                      backgroundColor: 'transparent'
                    }}
                  />
                </Card>
              </div>
            )}
          </>
        ) : (
          <Card style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            borderRadius: '12px',
            backgroundColor: '#161616',
            borderColor: '#262626'
          }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Text style={{ color: '#9ca3af' }}>No players on the leaderboard yet</Text>
                  <br />
                  <Text style={{ color: '#6b7280' }}>Players need at least 3 confirmed matches to appear here</Text>
                </div>
              }
            />
          </Card>
        )}
      </div>

      {/* Match History Section */}
      <div style={{ marginTop: 48 }}>
        <Title level={2} style={{ margin: '0 0 24px 0', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HistoryOutlined />
          Recent Match History
        </Title>
        
        {matchHistoryLoading ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Spin size="large" />
          </div>
        ) : matchHistory.length > 0 ? (
          <Card style={{ borderRadius: '12px' }}>
            <Table
              dataSource={matchHistory}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} matches`
              }}
              scroll={{ x: 600 }}
              columns={[
                {
                  title: 'Match',
                  key: 'match',
                  render: (_, record) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Avatar size="small" style={{ background: '#3b82f6', fontSize: '12px' }}>
                        {record.player1_username.charAt(0).toUpperCase()}
                      </Avatar>
                      <Text strong style={{ color: record.winner_username === record.player1_username ? '#10b981' : '#6b7280' }}>
                        {record.player1_username}
                      </Text>
                      <Text type="secondary">vs</Text>
                      <Avatar size="small" style={{ background: '#3b82f6', fontSize: '12px' }}>
                        {record.player2_username.charAt(0).toUpperCase()}
                      </Avatar>
                      <Text strong style={{ color: record.winner_username === record.player2_username ? '#10b981' : '#6b7280' }}>
                        {record.player2_username}
                      </Text>
                    </div>
                  ),
                  width: 280
                },
                {
                  title: 'Score',
                  key: 'score',
                  render: (_, record) => (
                    <Tag color="blue" style={{ fontSize: '14px', padding: '4px 8px', borderRadius: '6px' }}>
                      {record.player1_score} - {record.player2_score}
                    </Tag>
                  ),
                  width: 100,
                  align: 'center'
                },
                {
                  title: 'Winner',
                  key: 'winner',
                  render: (_, record) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <TrophyOutlined style={{ color: '#f59e0b' }} />
                      <Text strong style={{ color: '#10b981' }}>
                        {record.winner_username}
                      </Text>
                    </div>
                  ),
                  width: 150
                },
                {
                  title: 'Date',
                  key: 'date',
                  render: (_, record) => (
                    <Text type="secondary">
                      {formatDistanceToNow(new Date(record.confirmed_at), { addSuffix: true })}
                    </Text>
                  ),
                  width: 120
                }
              ]}
            />
          </Card>
        ) : (
          <Card style={{ textAlign: 'center', padding: '40px 20px', borderRadius: '12px' }}>
            <Empty
              image={<HistoryOutlined style={{ fontSize: 48, color: '#6b7280' }} />}
              description={
                <div>
                  <Text>No match history yet</Text>
                  <br />
                  <Text type="secondary">Matches will appear here once they're recorded</Text>
                </div>
              }
            />
          </Card>
        )}
      </div>

      {/* Player Profile Modal */}
      <PlayerProfileModal
        visible={profileModalVisible}
        onClose={handleCloseModal}
        username={selectedPlayer}
      />
    </div>
  );
};

export default HomePage;
