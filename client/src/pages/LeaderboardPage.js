import React from 'react';
import { useQuery } from 'react-query';
import { publicAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Trophy, Medal, Award } from 'lucide-react';

const LeaderboardPage = () => {
  const { data, isLoading, error } = useQuery(
    'leaderboard',
    () => publicAPI.getLeaderboard({ limit: 50, min_matches: 3 })
  );

  const leaderboard = data?.data?.leaderboard || [];
  const stats = data?.data?.stats || {};

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
          <p className="text-red-600">Failed to load leaderboard</p>
        </div>
      </div>
    );
  }

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-orange-500" />;
    return <span className="text-sm font-bold text-gray-600">#{rank}</span>;
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Leaderboard</h1>
        <p className="text-gray-600">
          Rankings based on ELO rating. Minimum 3 matches required to appear on leaderboard.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total_players || 0}</div>
          <div className="text-gray-600">Total Players</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total_matches || 0}</div>
          <div className="text-gray-600">Total Matches</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.highest_elo || 1200}</div>
          <div className="text-gray-600">Highest ELO</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.average_elo || 1200}</div>
          <div className="text-gray-600">Average ELO</div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4">Rank</th>
                <th className="text-left py-3 px-4">Player</th>
                <th className="text-center py-3 px-4">ELO Rating</th>
                <th className="text-center py-3 px-4">Matches</th>
                <th className="text-center py-3 px-4">Wins</th>
                <th className="text-center py-3 px-4">Win Rate</th>
                <th className="text-left py-3 px-4">Last Match</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((player) => (
                <tr key={player.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      {getRankIcon(player.rank)}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-medium text-gray-900">{player.username}</div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-lg font-bold text-gray-900">{player.elo_rating}</span>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-600">
                    {player.total_matches}
                  </td>
                  <td className="py-4 px-4 text-center text-gray-600">
                    {player.wins}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`font-medium ${
                      player.win_rate >= 70 ? 'text-green-600' :
                      player.win_rate >= 50 ? 'text-blue-600' :
                      'text-red-600'
                    }`}>
                      {player.win_rate}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-600 text-sm">
                    {player.last_match_date ? 
                      new Date(player.last_match_date).toLocaleDateString() : 
                      'Never'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {leaderboard.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No players meet the minimum requirements yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
