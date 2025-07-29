import React from 'react';
import { Modal, Typography, Card, Row, Col, Statistic, Table, Spin, Tag } from 'antd';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useQuery } from 'react-query';
import { publicAPI } from '../services/api';
import { TrophyOutlined, AimOutlined } from '@ant-design/icons';

const { Text } = Typography;

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PlayerProfileModalProps {
  visible: boolean;
  onClose: () => void;
  username: string | null;
}

const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({ visible, onClose, username }) => {
  console.log('PlayerProfileModal props:', { visible, username });
  
  // Fetch player profile data
  const { data: profileData, isLoading: profileLoading } = useQuery(
    ['playerProfile', username],
    () => username ? publicAPI.getPlayerProfile(username) : Promise.resolve(null),
    {
      enabled: !!username && visible,
    }
  );

  // Fetch player ELO history
  const { data: eloData, isLoading: eloLoading } = useQuery(
    ['playerEloHistory', username],
    () => username ? publicAPI.getPlayerEloHistory(username) : Promise.resolve(null),
    {
      enabled: !!username && visible,
    }
  );

  const player = profileData?.data?.player;
  const recentMatches = profileData?.data?.recent_matches || [];
  const eloHistory = eloData?.data?.elo_history || [];

  const isLoading = profileLoading || eloLoading;

  // Prepare chart data
  const chartData = {
    labels: eloHistory.map((point: any, index: number) => {
      if (point.isStarting) return 'Start';
      return `Match ${index}`;
    }),
    datasets: [
      {
        label: 'ELO Rating',
        data: eloHistory.map((point: any) => point.elo),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: eloHistory.map((point: any) => {
          if (point.isStarting) return '#6b7280';
          return point.result === 'win' ? '#10b981' : '#ef4444';
        }),
        pointBorderColor: eloHistory.map((point: any) => {
          if (point.isStarting) return '#6b7280';
          return point.result === 'win' ? '#10b981' : '#ef4444';
        }),
        pointRadius: 5,
        pointHoverRadius: 7,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const point = eloHistory[context.dataIndex];
            if (point.isStarting) {
              return `Starting ELO: ${point.elo}`;
            }
            const change = point.eloChange > 0 ? `+${point.eloChange}` : `${point.eloChange}`;
            return [
              `ELO: ${point.elo} (${change})`,
              `vs ${point.opponent}`,
              `Score: ${point.playerScore}-${point.opponentScore}`,
              `Result: ${point.result.toUpperCase()}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: '#374151',
        },
        ticks: {
          color: '#9ca3af',
        }
      },
      y: {
        grid: {
          color: '#374151',
        },
        ticks: {
          color: '#9ca3af',
        }
      }
    }
  };

  // Prepare matches table columns
  const matchColumns = [
    {
      title: 'Opponent',
      dataIndex: 'opponent_username',
      key: 'opponent',
      render: (opponent: string) => (
        <Text style={{ color: '#fff' }}>{opponent}</Text>
      ),
    },
    {
      title: 'Score',
      key: 'score',
      render: (record: any) => (
        <Text style={{ color: '#9ca3af' }}>
          {record.player1_username === username ? 
            `${record.player1_score}-${record.player2_score}` : 
            `${record.player2_score}-${record.player1_score}`}
        </Text>
      ),
    },
    {
      title: 'Result',
      dataIndex: 'result',
      key: 'result',
      render: (result: string) => (
        <Tag color={result === 'win' ? '#10b981' : '#ef4444'}>
          {result.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'confirmed_at',
      key: 'date',
      render: (date: string) => (
        <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
          {new Date(date).toLocaleDateString()}
        </Text>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Text style={{ color: '#fff', fontSize: '18px' }}>
          {username ? `${username}'s Profile` : 'Player Profile'}
        </Text>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      style={{ top: 20 }}
      styles={{
        mask: { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
      }}
      modalRender={(modal) => (
        <div style={{ 
          backgroundColor: '#111827', 
          borderRadius: '12px',
          border: '1px solid #374151'
        }}>
          {modal}
        </div>
      )}
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      ) : player ? (
        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Player Stats */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col span={6}>
              <Card
                style={{
                  backgroundColor: '#1f2937',
                  borderColor: '#374151',
                  textAlign: 'center'
                }}
              >
                <Statistic
                  title={<Text style={{ color: '#9ca3af' }}>Rank</Text>}
                  value={`#${player.rank}`}
                  valueStyle={{ color: '#3b82f6' }}
                  prefix={<TrophyOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card
                style={{
                  backgroundColor: '#1f2937',
                  borderColor: '#374151',
                  textAlign: 'center'
                }}
              >
                <Statistic
                  title={<Text style={{ color: '#9ca3af' }}>ELO Rating</Text>}
                  value={player.elo_rating}
                  valueStyle={{ color: '#10b981' }}
                  prefix={<AimOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card
                style={{
                  backgroundColor: '#1f2937',
                  borderColor: '#374151',
                  textAlign: 'center'
                }}
              >
                <Statistic
                  title={<Text style={{ color: '#9ca3af' }}>Matches</Text>}
                  value={player.total_matches}
                  valueStyle={{ color: '#fff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card
                style={{
                  backgroundColor: '#1f2937',
                  borderColor: '#374151',
                  textAlign: 'center'
                }}
              >
                <Statistic
                  title={<Text style={{ color: '#9ca3af' }}>Win Rate</Text>}
                  value={`${player.win_rate}%`}
                  valueStyle={{ 
                    color: player.win_rate >= 50 ? '#10b981' : '#ef4444' 
                  }}
                />
              </Card>
            </Col>
          </Row>

          {/* ELO History Chart */}
          {eloHistory.length > 0 && (
            <Card
              title={<Text style={{ color: '#fff' }}>ELO History</Text>}
              style={{
                backgroundColor: '#1f2937',
                borderColor: '#374151',
                marginBottom: '24px'
              }}
            >
              <div style={{ height: '300px' }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </Card>
          )}

          {/* Recent Matches */}
          <Card
            title={<Text style={{ color: '#fff' }}>Recent Matches</Text>}
            style={{
              backgroundColor: '#1f2937',
              borderColor: '#374151'
            }}
          >
            <Table
              columns={matchColumns}
              dataSource={recentMatches}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{
                emptyText: (
                  <Text style={{ color: '#9ca3af' }}>
                    No recent matches found
                  </Text>
                )
              }}
              style={{ backgroundColor: 'transparent' }}
            />
          </Card>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Text style={{ color: '#9ca3af' }}>Player not found</Text>
        </div>
      )}
    </Modal>
  );
};

export default PlayerProfileModal;
