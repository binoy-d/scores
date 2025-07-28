import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const LoginPage = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(credentials);
      if (result.success) {
        toast.success('Login successful!');
        navigate('/');
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center animate-fade-in">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-accent-primary to-accent-hover rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="text-white text-2xl font-bold">S</span>
            </div>
          </div>
          <h2 className="text-4xl font-extrabold text-primary mb-3 bg-gradient-to-r from-text-primary via-accent-primary to-text-primary bg-clip-text text-transparent">
            Sign in to SVIC Scores
          </h2>
          <p className="text-lg text-secondary">
            Enter your credentials to access your dashboard
          </p>
        </div>
        
        <form className="mt-8 space-y-6 animate-slide-in" onSubmit={handleSubmit}>
          <div className="card space-y-6">
            <div>
              <label htmlFor="username" className="label">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="input"
                placeholder="Enter your username"
                value={credentials.username}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input"
                placeholder="Enter your password"
                value={credentials.password}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary flex justify-center py-4 text-lg font-semibold"
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <LoadingSpinner size="small" />
                  <span>Signing in...</span>
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
          
          <div className="text-center">
            <div className="bg-card border border-primary rounded-lg p-4">
              <p className="text-sm text-secondary mb-2 font-medium">Demo Credentials:</p>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="text-muted">Username:</span> 
                  <span className="font-bold text-accent ml-2">admin</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted">Password:</span> 
                  <span className="font-bold text-accent ml-2">admin123</span>
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
