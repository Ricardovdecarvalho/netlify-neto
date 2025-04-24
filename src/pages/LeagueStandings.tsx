import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { Team } from '../types/league';
import { leagueService } from '../services/leagueService';

export default function LeagueStandings() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        if (!leagueId) throw new Error('ID da liga não encontrado');
        const data = await leagueService.getStandings(leagueId);
        setTeams(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar classificação');
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, [leagueId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Classificação</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">P</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">J</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">V</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">E</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">D</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">GP</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">GC</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">SG</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teams.map((team, index) => (
              <tr key={team.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {team.logo && (
                      <img className="h-8 w-8 rounded-full mr-3" src={team.logo} alt={team.name} />
                    )}
                    <div className="text-sm font-medium text-gray-900">{team.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">{team.points}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                  {team.wins + team.draws + team.losses}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">{team.wins}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">{team.draws}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">{team.losses}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">{team.goalsFor}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">{team.goalsAgainst}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                  {team.goalsFor - team.goalsAgainst}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 