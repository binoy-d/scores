import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { playersAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Switch, 
  Typography, 
  Space, 
  Popconfirm,
  Tag,
  message
} from 'antd';
import { UserAddOutlined, DeleteOutlined, TeamOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const UsersPage = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form] = Form.useForm();

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery(
    'players',
    () => playersAPI.getAll({ limit: 100 })
  );

  const createUserMutation = useMutation(playersAPI.create, {
    onSuccess: (response) => {
      queryClient.invalidateQueries('players');
      const defaultPassword = response.data?.defaultPassword || 'password123';
      message.success(`User created successfully! Default password: ${defaultPassword}`);
      setShowCreateForm(false);
      form.resetFields();
    },
    onError: (error) => {
      message.error(error.response?.data?.error || 'Failed to create user');
    }
  });

  const deleteUserMutation = useMutation(playersAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('players');
      message.success('User deleted successfully');
    },
    onError: (error) => {
      message.error(error.response?.data?.error || 'Failed to delete user');
    }
  });

  const handleSubmit = async (values) => {
    createUserMutation.mutate({
      username: values.username,
      isAdmin: values.isAdmin || false
    });
  };

  const handleDelete = (userId) => {
    deleteUserMutation.mutate(userId);
  };

  const players = data?.data?.players || [];

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
          <Text style={{ color: '#ef4444' }}>Failed to load users</Text>
        </Card>
      </div>
    );
  }

  const columns = [
    {
      title: 'Username',
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
        <Text style={{ color: '#9ca3af' }}>{matches || 0}</Text>
      ),
    },
    {
      title: 'Win Rate',
      dataIndex: 'winRate',
      key: 'winRate',
      align: 'center',
      render: (winRate) => {
        const rate = winRate || 0;
        const color = rate >= 70 ? '#10b981' : rate >= 50 ? '#3b82f6' : '#ef4444';
        return (
          <Tag color={color} style={{ fontWeight: 'bold' }}>
            {rate}%
          </Tag>
        );
      },
    },
    {
      title: 'Role',
      dataIndex: 'is_admin',
      key: 'is_admin',
      align: 'center',
      render: (isAdmin) => (
        <Tag color={isAdmin ? '#9333ea' : '#6b7280'}>
          {isAdmin ? 'Admin' : 'User'}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => (
        <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
          {new Date(date).toLocaleDateString()}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Popconfirm
          title="Delete User"
          description={`Are you sure you want to delete "${record.username}"?`}
          onConfirm={() => handleDelete(record.id)}
          okText="Yes"
          cancelText="No"
          okButtonProps={{ danger: true }}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            loading={deleteUserMutation.isLoading}
            style={{
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '32px' 
      }}>
        <div>
          <Title style={{ marginBottom: '8px', color: '#fff' }}>
            User Management
          </Title>
          <Text style={{ color: '#9ca3af' }}>
            Create and manage user accounts
          </Text>
        </div>
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          size="large"
          onClick={() => setShowCreateForm(true)}
          style={{
            backgroundColor: '#3b82f6',
            borderColor: '#3b82f6',
            borderRadius: '12px',
            height: '48px',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          Create User
        </Button>
      </div>

      {/* Create User Modal */}
      <Modal
        title={
          <Space style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>
            <UserAddOutlined />
            Create New User
          </Space>
        }
        open={showCreateForm}
        onCancel={() => {
          setShowCreateForm(false);
          form.resetFields();
        }}
        footer={null}
        width={520}
        style={{ top: 20 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: '24px' }}
        >
          <Form.Item
            name="username"
            label={
              <Text strong style={{ fontSize: '14px' }}>
                Username *
              </Text>
            }
            rules={[{ required: true, message: 'Please enter a username!' }]}
            style={{ marginBottom: '24px' }}
          >
            <Input
              placeholder="Enter username"
              size="large"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#1f2937', borderRadius: '8px', border: '1px solid #374151' }}>
            <Text strong style={{ fontSize: '14px', color: '#3b82f6' }}>
              Default Password
            </Text>
            <br />
            <Text style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px', display: 'block' }}>
              New users will be created with the password: <Text code style={{ backgroundColor: '#374151', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>password123</Text>
            </Text>
            <Text style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px', display: 'block' }}>
              Users can change this password after their first login
            </Text>
          </div>

          <Form.Item
            name="isAdmin"
            valuePropName="checked"
            style={{ marginBottom: '32px' }}
          >
            <Space align="center">
              <Switch />
              <Text style={{ fontSize: '14px' }}>
                Grant admin privileges
              </Text>
            </Space>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }} size="middle">
              <Button
                size="large"
                onClick={() => {
                  setShowCreateForm(false);
                  form.resetFields();
                }}
                style={{ borderRadius: '8px' }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={createUserMutation.isLoading}
                style={{
                  backgroundColor: '#3b82f6',
                  borderColor: '#3b82f6',
                  borderRadius: '8px'
                }}
              >
                Create User
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Users Table */}
      <Card
        style={{
          backgroundColor: '#161616',
          borderColor: '#262626',
          borderRadius: '12px'
        }}
      >
        <Table
          columns={columns}
          dataSource={players}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} users`,
          }}
          locale={{
            emptyText: (
              <div style={{ padding: '48px 0', textAlign: 'center' }}>
                <TeamOutlined style={{ fontSize: '48px', color: '#4b5563', marginBottom: '16px' }} />
                <Title level={4} style={{ color: '#9ca3af', marginBottom: '8px' }}>
                  No users found
                </Title>
                <Text style={{ color: '#6b7280' }}>
                  Create your first user to get started
                </Text>
              </div>
            )
          }}
          style={{ backgroundColor: 'transparent' }}
        />
      </Card>
    </div>
  );
};

export default UsersPage;
