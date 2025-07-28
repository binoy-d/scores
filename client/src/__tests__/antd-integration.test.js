import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Button, Card, Input, Select, message } from 'antd';

// Mock Ant Design message component
jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  message: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock matchMedia for responsive breakpoints
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: query.includes('min-width: 0px'), // Default to mobile breakpoint
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

describe('Ant Design Components Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Button Component', () => {
    it('should render Ant Design button', () => {
      render(<Button type="primary">Test Button</Button>);
      const button = screen.getByRole('button', { name: /test button/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('ant-btn', 'ant-btn-primary');
    });

    it('should handle button click events', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      
      render(<Button onClick={handleClick}>Click Me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      
      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should render disabled button', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button', { name: /disabled button/i });
      expect(button).toBeDisabled();
      // Check for the disabled attribute instead of CSS class
      expect(button).toHaveAttribute('disabled');
    });
  });

  describe('Card Component', () => {
    it('should render Ant Design card with title', () => {
      render(
        <Card title="Test Card">
          <p>Card content</p>
        </Card>
      );

      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('Card content')).toBeInTheDocument();
      expect(document.querySelector('.ant-card')).toBeInTheDocument();
    });

    it('should render card with custom props', () => {
      render(
        <Card 
          title="Player Stats" 
          bordered={false}
          size="small"
          data-testid="stats-card"
        >
          <div>ELO: 1500</div>
          <div>Matches: 10</div>
        </Card>
      );

      expect(screen.getByText('Player Stats')).toBeInTheDocument();
      expect(screen.getByText('ELO: 1500')).toBeInTheDocument();
      expect(screen.getByText('Matches: 10')).toBeInTheDocument();
    });
  });

  describe('Input Component', () => {
    it('should render Ant Design input', () => {
      render(<Input placeholder="Enter username" />);
      const input = screen.getByPlaceholderText('Enter username');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('ant-input');
    });

    it('should handle input changes', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(<Input onChange={handleChange} placeholder="Type here" />);
      const input = screen.getByPlaceholderText('Type here');
      
      await user.type(input, 'test input');
      expect(input).toHaveValue('test input');
      expect(handleChange).toHaveBeenCalled();
    });

    it('should render password input', () => {
      render(<Input.Password placeholder="Enter password" />);
      const input = screen.getByPlaceholderText('Enter password');
      expect(input).toHaveAttribute('type', 'password');
    });
  });

  describe('Select Component', () => {
    const selectOptions = [
      { value: 'admin', label: 'admin' },
      { value: 'alice', label: 'alice' },
      { value: 'bob', label: 'bob' },
    ];

    it('should render Ant Design select', () => {
      render(
        <Select 
          placeholder="Select user"
          options={selectOptions}
          style={{ width: 200 }}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('should open dropdown and show options', async () => {
      const user = userEvent.setup();
      
      render(
        <Select 
          placeholder="Select user"
          options={selectOptions}
          style={{ width: 200 }}
        />
      );

      const select = screen.getByRole('combobox');
      await user.click(select);

      await waitFor(() => {
        // Use getAllByText and check the first occurrence to avoid duplicate element errors
        const adminOptions = screen.getAllByText('admin');
        expect(adminOptions[0]).toBeInTheDocument();
        const aliceOptions = screen.getAllByText('alice');
        expect(aliceOptions[0]).toBeInTheDocument();
        const bobOptions = screen.getAllByText('bob');
        expect(bobOptions[0]).toBeInTheDocument();
      });
    });

    it('should handle selection', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(
        <Select 
          placeholder="Select user"
          options={selectOptions}
          onChange={handleChange}
          style={{ width: 200 }}
          data-testid="user-select"
        />
      );

      const select = screen.getByRole('combobox');
      await user.click(select);

      await waitFor(() => {
        const adminOptions = screen.getAllByText('admin');
        expect(adminOptions[0]).toBeInTheDocument();
      });

      // Use getByTitle which is more reliable for option selection
      const adminOption = screen.getByTitle('admin');
      await user.click(adminOption);
      
      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith('admin', expect.any(Object));
      });
    });

    it('should support multiple selection', async () => {
      const user = userEvent.setup();
      
      render(
        <Select 
          mode="multiple"
          placeholder="Select users"
          options={selectOptions}
          style={{ width: 200 }}
        />
      );

      const select = screen.getByRole('combobox');
      await user.click(select);

      await waitFor(() => {
        const adminOptions = screen.getAllByText('admin');
        expect(adminOptions[0]).toBeInTheDocument();
      });

      // Click on options using role selector
      const adminOption = screen.getByRole('option', { name: 'admin' });
      await user.click(adminOption);
      
      const aliceOption = screen.getByRole('option', { name: 'alice' });
      await user.click(aliceOption);

      // Check that multiple selection container exists
      await waitFor(() => {
        expect(document.querySelector('.ant-select-multiple')).toBeInTheDocument();
      });
    });
  });

  describe('Message Component', () => {
    it('should call success message', () => {
      message.success('Operation successful!');
      expect(message.success).toHaveBeenCalledWith('Operation successful!');
    });

    it('should call error message', () => {
      message.error('Operation failed!');
      expect(message.error).toHaveBeenCalledWith('Operation failed!');
    });

    it('should call warning message', () => {
      message.warning('Please be careful!');
      expect(message.warning).toHaveBeenCalledWith('Please be careful!');
    });
  });

  describe('Form Integration', () => {
    it('should render form with Ant Design components', () => {
      render(
        <div>
          <Card title="User Form">
            <div style={{ marginBottom: 16 }}>
              <Input placeholder="Username" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Input.Password placeholder="Password" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Select 
                placeholder="Select role"
                options={[
                  { value: 'user', label: 'User' },
                  { value: 'admin', label: 'Admin' },
                ]}
                style={{ width: '100%' }}
              />
            </div>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Card>
        </div>
      );

      expect(screen.getByText('User Form')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('should render responsive grid layout', () => {
      // Enhanced matchMedia mock for Ant Design responsive observer
      const mockMatchMedia = (query) => {
        const result = {
          matches: query.includes('(max-width: 768px)') ? false : true,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        };
        return result;
      };

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });

      const mockResizeObserver = {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };

      global.ResizeObserver = jest.fn(() => mockResizeObserver);

      const { Row, Col } = require('antd');
      
      const { container } = render(
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card title="Stat 1">100</Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card title="Stat 2">200</Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card title="Stat 3">300</Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card title="Stat 4">400</Card>
          </Col>
        </Row>
      );

      expect(screen.getByText('Stat 1')).toBeInTheDocument();
      expect(screen.getByText('Stat 2')).toBeInTheDocument();
      expect(screen.getByText('Stat 3')).toBeInTheDocument();
      expect(screen.getByText('Stat 4')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
      expect(screen.getByText('300')).toBeInTheDocument();
      expect(screen.getByText('400')).toBeInTheDocument();
      expect(container.querySelector('.ant-row')).toBeInTheDocument();
    });
  });
});
