import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple test component
const TestComponent = ({ message = 'Hello World' }) => (
  <div data-testid="test-component">{message}</div>
);

describe('Basic Test Setup', () => {
  it('should render a simple component', () => {
    render(<TestComponent />);
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should render with custom message', () => {
    render(<TestComponent message="Custom Message" />);
    expect(screen.getByText('Custom Message')).toBeInTheDocument();
  });

  it('should have working Jest matchers', () => {
    expect(true).toBe(true);
    expect('test').toMatch('test');
    expect([1, 2, 3]).toHaveLength(3);
  });
});
