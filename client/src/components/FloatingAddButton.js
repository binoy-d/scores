import React from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const FloatingAddButton = ({ onClick }) => {
  const { isAuthenticated } = useAuth();

  // Only show for authenticated users
  if (!isAuthenticated()) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className="fab group"
      title="Add Match"
    >
      <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
    </button>
  );
};

export default FloatingAddButton;
