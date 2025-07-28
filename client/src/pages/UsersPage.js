import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { playersAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { Users, Plus, Trash2, Edit3 } from 'lucide-react';

const UsersPage = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    isAdmin: false
  });

  const queryClient = useQueryClient();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showCreateForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCreateForm]);

  const { data, isLoading, error } = useQuery(
    'players',
    () => playersAPI.getAll({ limit: 100 })
  );

  const createUserMutation = useMutation(playersAPI.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('players');
      toast.success('User created successfully');
      setShowCreateForm(false);
      setFormData({ username: '', password: '', isAdmin: false });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create user');
    }
  });

  const deleteUserMutation = useMutation(playersAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('players');
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      toast.error('Please fill in username and password');
      return;
    }
    createUserMutation.mutate(formData);
  };

  const handleDelete = (userId, username) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const players = data?.data?.players || [];

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center min-h-96">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <p className="text-red-600">Failed to load users</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">Create and manage user accounts</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create User</span>
        </button>
      </div>

      {/* Create User Modal */}
      {showCreateForm && (
        <div 
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateForm(false);
            }
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="text-xl font-semibold">Create New User</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="modal-close-btn"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Username *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Enter username"
                  required
                />
              </div>

              <div>
                <label className="label">Password *</label>
                <input
                  type="password"
                  className="input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  User can change this password after first login
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={formData.isAdmin}
                  onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isAdmin" className="text-sm text-gray-700">
                  Grant admin privileges
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isLoading}
                  className="btn btn-primary"
                >
                  {createUserMutation.isLoading ? <LoadingSpinner size="small" /> : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4">Username</th>
                <th className="text-center py-3 px-4">ELO Rating</th>
                <th className="text-center py-3 px-4">Matches</th>
                <th className="text-center py-3 px-4">Win Rate</th>
                <th className="text-center py-3 px-4">Role</th>
                <th className="text-left py-3 px-4">Created</th>
                <th className="text-center py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="font-medium text-gray-900">{player.username}</div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="font-semibold text-gray-900">{player.elo_rating}</span>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-600">
                    {player.total_matches || 0}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`font-medium ${
                      (player.winRate || 0) >= 70 ? 'text-green-600' :
                      (player.winRate || 0) >= 50 ? 'text-blue-600' :
                      'text-red-600'
                    }`}>
                      {player.winRate || '0.0'}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      player.is_admin 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {player.is_admin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-600 text-sm">
                    {new Date(player.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit user"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(player.id, player.username)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete user"
                        disabled={deleteUserMutation.isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {players.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No users found</p>
              <p>Create your first user to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
