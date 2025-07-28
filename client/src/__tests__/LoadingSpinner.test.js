import React from 'react';
import { render, container } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoadingSpinner from '../components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render with default props', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('.spinner');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('spinner', 'w-6', 'h-6');
  });

  it('should render with small size', () => {
    const { container } = render(<LoadingSpinner size="small" />);
    const spinner = container.querySelector('.spinner');
    expect(spinner).toHaveClass('w-4', 'h-4');
  });

  it('should render with large size', () => {
    const { container } = render(<LoadingSpinner size="large" />);
    const spinner = container.querySelector('.spinner');
    expect(spinner).toHaveClass('w-8', 'h-8');
  });

  it('should accept custom className', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />);
    const spinner = container.querySelector('.spinner');
    expect(spinner).toHaveClass('custom-class');
  });
});
