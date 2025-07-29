import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Typography, Button } from 'antd';
import type { MenuProps } from 'antd';
import { 
  TrophyOutlined, 
  LogoutOutlined, 
  TeamOutlined,
  LoginOutlined,
  SettingOutlined 
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Text } = Typography;

type MenuItem = Required<MenuProps>['items'][number];

const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    try {
      logout();
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 0);
    } catch (error) {
      console.error('Error during logout:', error);
      navigate('/', { replace: true });
    }
  };

  const userMenuItems: MenuItem[] = [
    {
      key: 'username',
      label: (
        <div style={{ padding: '8px 0' }}>
          <Text strong>{user?.username}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {isAdmin() ? 'Administrator' : 'Player'}
          </Text>
        </div>
      ),
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'profile',
      label: <Link to="/profile" style={{ color: 'inherit', textDecoration: 'none' }}>Settings</Link>,
      icon: <SettingOutlined />,
    },
    {
      key: 'logout',
      label: 'Sign Out',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
      danger: true,
    },
  ];

  const menuItems: MenuItem[] = [];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '64px',
      padding: '0 24px',
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%'
    }}>
      {/* Logo */}
      <Link 
        to="/" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          textDecoration: 'none',
          gap: '12px'
        }}
      >
        <div style={{
          width: '40px',
          height: '40px',
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
        }}>
          <TrophyOutlined style={{ fontSize: '20px', color: 'white' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <Text strong style={{ fontSize: '18px', color: '#ffffff', margin: 0 }}>
            SVIC Scores
          </Text>
          <Text type="secondary" style={{ fontSize: '12px', margin: 0, marginTop: '2px' }}>
            Ping Pong League
          </Text>
        </div>
      </Link>

      {/* Navigation and User Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {/* Menu Items */}
        {menuItems.length > 0 && (
          <Menu
            theme="dark"
            mode="horizontal"
            items={menuItems}
            style={{
              background: 'transparent',
              border: 'none',
              gap: '16px'
            }}
          />
        )}

        {/* User Section */}
        {isAuthenticated() ? (
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            arrow
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: '12px',
              transition: 'all 0.2s',
              border: '1px solid transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1a1a1a';
              e.currentTarget.style.borderColor = '#3f3f46';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
            >
              <Avatar 
                style={{ 
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
                size={36}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Text strong style={{ fontSize: '14px', lineHeight: 1 }}>
                  {user?.username}
                </Text>
                <Text type="secondary" style={{ fontSize: '12px', lineHeight: 1 }}>
                  Welcome back!
                </Text>
              </div>
            </div>
          </Dropdown>
        ) : (
          <Button 
            type="primary"
            icon={<LoginOutlined />}
            size="large"
            style={{
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
          >
            <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>
              Sign In
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
