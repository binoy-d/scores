import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Users, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-card border-b border-primary backdrop-filter backdrop-blur-xl sticky top-0 z-40 shadow-lg">
      <div className="container">
        <div className="flex justify-between items-center h-20 px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-4 group">
            <div className="p-3 bg-gradient-to-br from-accent-primary to-accent-hover rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-text-primary to-accent-primary bg-clip-text text-transparent">
                SVIC Scores
              </span>
              <p className="text-xs text-muted">Ping Pong League</p>
            </div>
          </Link>

          {/* Navigation */}
          <div className="flex items-center space-x-8">
            {isAuthenticated() ? (
              <>
                <Link 
                  to="/" 
                  className="nav-link group"
                >
                  <span>Leaderboard</span>
                  <span className="nav-underline"></span>
                </Link>
                
                {isAdmin() && (
                  <Link 
                    to="/users" 
                    className="nav-link group"
                  >
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Users</span>
                    </div>
                    <span className="nav-underline"></span>
                  </Link>
                )}
                
                <div className="flex items-center space-x-6 pl-8 border-l border-primary">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-accent-primary to-accent-hover rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user?.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-primary">{user?.username}</div>
                      <div className="text-xs text-muted">Welcome back!</div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-3 text-muted hover:text-danger hover:bg-hover rounded-xl transition-all duration-200 group"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link 
                  to="/" 
                  className="nav-link group"
                >
                  <span>Leaderboard</span>
                  <span className="nav-underline"></span>
                </Link>
                <Link to="/login" className="btn btn-primary px-6 py-3 text-base font-semibold">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
