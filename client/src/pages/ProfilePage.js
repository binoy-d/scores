import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { authAPI, playersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  Card, 
  Typography, 
  Form, 
  Input, 
  Button, 
  Space, 
  Divider,
  message,
  Row,
  Col,
  Avatar,
  Tag,
  Statistic,
  Tabs,
  Table,
  Modal,
  Switch,
  Popconfirm
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  TrophyOutlined,
  CalendarOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  SettingOutlined,
  TeamOutlined,
  UserAddOutlined,
  DeleteOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const ProfilePage = () => {
  const { user } = useAuth();
  const [passwordForm] = Form.useForm();
  const [userForm] = Form.useForm();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  const queryClient = useQueryClient();

  const { data: userDetails, isLoading } = useQuery(
    'current-user',
    () => authAPI.getCurrentUser(),
    { enabled: !!user }
  );

  const { data: playersData, isLoading: playersLoading } = useQuery(
    'players',
    () => playersAPI.getAll({ limit: 100 }),
    { enabled: !!user?.is_admin }
  );

  const changePasswordMutation = useMutation(authAPI.changePassword, {
    onSuccess: () => {
      message.success('Password changed successfully!');
      passwordForm.resetFields();
      setIsChangingPassword(false);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to change password';
      message.error(errorMessage);
    }
  });

  const createUserMutation = useMutation(playersAPI.create, {
    onSuccess: (response) => {
      queryClient.invalidateQueries('players');
      const defaultPassword = response.data?.defaultPassword || 'password123';
      message.success(`User created successfully! Default password: ${defaultPassword}`);
      setShowCreateUserModal(false);
      userForm.resetFields();
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

  const handlePasswordChange = async (values) => {
    const { currentPassword, newPassword } = values;
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const handleCreateUser = async (values) => {
    createUserMutation.mutate({
      username: values.username,
      isAdmin: values.isAdmin || false
    });
  };

  const handleDeleteUser = (userId) => {
    deleteUserMutation.mutate(userId);
  };

  const currentUser = userDetails?.data?.user || user;
  const players = playersData?.data?.players || [];

  if (isLoading) {
    return (
      <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // User management table columns for admin
  const userColumns = [
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
          onConfirm={() => handleDeleteUser(record.id)}
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

  // Personal Settings Tab Content
  const PersonalSettingsContent = () => (
    <>
      {/* User Information Card */}
      <Card 
        style={{ 
          backgroundColor: '#161616', 
          borderColor: '#262626', 
          borderRadius: '12px',
          marginBottom: '24px'
        }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} sm={8} style={{ textAlign: 'center' }}>
            <Avatar 
              size={80} 
              style={{ 
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                fontSize: '32px',
                fontWeight: 'bold'
              }}
            >
              {currentUser?.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Title level={3} style={{ margin: '16px 0 8px 0', color: '#fff' }}>
              {currentUser?.username}
            </Title>
            <Tag color={currentUser?.is_admin ? '#9333ea' : '#6b7280'} style={{ fontSize: '14px', padding: '4px 12px' }}>
              {currentUser?.is_admin ? 'Administrator' : 'Player'}
            </Tag>
          </Col>
          
          <Col xs={24} sm={16}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <Statistic
                  title={<Text style={{ color: '#9ca3af' }}>ELO Rating</Text>}
                  value={currentUser?.elo_rating || 1200}
                  valueStyle={{ color: '#3b82f6', fontSize: '24px', fontWeight: 'bold' }}
                  prefix={<TrophyOutlined />}
                />
              </Col>
              
              <Col xs={12} sm={6}>
                <Statistic
                  title={<Text style={{ color: '#9ca3af' }}>Member Since</Text>}
                  value={currentUser?.created_at ? new Date(currentUser.created_at).getFullYear() : 'N/A'}
                  valueStyle={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold' }}
                  prefix={<CalendarOutlined />}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* Change Password Card */}
      <Card 
        style={{ 
          backgroundColor: '#161616', 
          borderColor: '#262626', 
          borderRadius: '12px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <Title level={4} style={{ margin: 0, color: '#fff' }}>
              <LockOutlined style={{ marginRight: '8px', color: '#3b82f6' }} />
              Change Password
            </Title>
            <Text style={{ color: '#9ca3af' }}>
              Update your account password for security
            </Text>
          </div>
          
          {!isChangingPassword && (
            <Button
              type="primary"
              onClick={() => setIsChangingPassword(true)}
              style={{
                backgroundColor: '#3b82f6',
                borderColor: '#3b82f6',
                borderRadius: '8px'
              }}
            >
              Change Password
            </Button>
          )}
        </div>

        {isChangingPassword && (
          <>
            <Divider style={{ borderColor: '#374151' }} />
            
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handlePasswordChange}
              style={{ maxWidth: '400px' }}
            >
              <Form.Item
                name="currentPassword"
                label={
                  <Text strong style={{ color: '#fff' }}>
                    Current Password
                  </Text>
                }
                rules={[{ required: true, message: 'Please enter your current password!' }]}
                style={{ marginBottom: '20px' }}
              >
                <Input.Password
                  placeholder="Enter current password"
                  size="large"
                  style={{ borderRadius: '8px' }}
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label={
                  <Text strong style={{ color: '#fff' }}>
                    New Password
                  </Text>
                }
                rules={[
                  { required: true, message: 'Please enter your new password!' },
                  { min: 6, message: 'Password must be at least 6 characters long!' }
                ]}
                style={{ marginBottom: '20px' }}
              >
                <Input.Password
                  placeholder="Enter new password"
                  size="large"
                  style={{ borderRadius: '8px' }}
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label={
                  <Text strong style={{ color: '#fff' }}>
                    Confirm New Password
                  </Text>
                }
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Please confirm your new password!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match!'));
                    },
                  }),
                ]}
                style={{ marginBottom: '32px' }}
              >
                <Input.Password
                  placeholder="Confirm new password"
                  size="large"
                  style={{ borderRadius: '8px' }}
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Space>
                  <Button
                    size="large"
                    onClick={() => {
                      setIsChangingPassword(false);
                      passwordForm.resetFields();
                    }}
                    style={{ borderRadius: '8px' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    htmlType="submit"
                    loading={changePasswordMutation.isLoading}
                    style={{
                      backgroundColor: '#10b981',
                      borderColor: '#10b981',
                      borderRadius: '8px'
                    }}
                  >
                    Update Password
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Card>
    </>
  );

  // Admin User Management Tab Content
  const UserManagementContent = () => (
    <>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '24px' 
      }}>
        <div>
          <Title level={4} style={{ margin: 0, color: '#fff' }}>
            <TeamOutlined style={{ marginRight: '8px', color: '#3b82f6' }} />
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
          onClick={() => setShowCreateUserModal(true)}
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

      <Card
        style={{
          backgroundColor: '#161616',
          borderColor: '#262626',
          borderRadius: '12px'
        }}
      >
        <Table
          columns={userColumns}
          dataSource={players}
          rowKey="id"
          loading={playersLoading}
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
    </>
  );

  // Tab items configuration
  const tabItems = [
    {
      key: 'personal',
      label: (
        <Space>
          <SettingOutlined />
          Personal Settings
        </Space>
      ),
      children: <PersonalSettingsContent />
    }
  ];

  // Add admin tab if user is admin
  if (currentUser?.is_admin) {
    tabItems.push({
      key: 'users',
      label: (
        <Space>
          <TeamOutlined />
          User Management
        </Space>
      ),
      children: <UserManagementContent />
    });
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      <Title style={{ marginBottom: '32px', color: '#fff' }}>
        Settings
      </Title>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
        style={{
          '--ant-primary-color': '#3b82f6'
        }}
        tabBarStyle={{
          borderBottom: '1px solid #374151',
          marginBottom: '32px'
        }}
      />

      {/* Create User Modal */}
      <Modal
        title={
          <Space style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>
            <UserAddOutlined />
            Create New User
          </Space>
        }
        open={showCreateUserModal}
        onCancel={() => {
          setShowCreateUserModal(false);
          userForm.resetFields();
        }}
        footer={null}
        width={520}
        style={{ top: 20 }}
      >
        <Form
          form={userForm}
          layout="vertical"
          onFinish={handleCreateUser}
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
                  setShowCreateUserModal(false);
                  userForm.resetFields();
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
    </div>
  );
};

export default ProfilePage;
