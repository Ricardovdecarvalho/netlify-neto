import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { LeagueStats } from '../types/league';
import { leagueService } from '../services/leagueService';

export default function LeagueStats() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const [stats, setStats] = useState<LeagueStats>({
    totalMatches: 0,
    totalGoals: 0,
    averageGoalsPerMatch: 0,
    topScorer: {
      player: '',
      goals: 0
    },
    topAssister: {
      player: '',
      assists: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!leagueId) throw new Error('ID da liga não encontrado');
        const data = await leagueService.getLeagueStats(leagueId);
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
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
      <h1 className="text-3xl font-bold mb-8">Estatísticas da Liga</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total de Partidas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total de Partidas</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalMatches}</p>
        </div>

        {/* Total de Gols */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total de Gols</h3>
          <p className="text-3xl font-bold text-green-600">{stats.totalGoals}</p>
        </div>

        {/* Média de Gols por Partida */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Média de Gols por Partida</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.averageGoalsPerMatch.toFixed(2)}</p>
        </div>

        {/* Artilheiro */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Artilheiro</h3>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-red-600">{stats.topScorer.goals}</span>
            <span className="text-gray-600">gols</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{stats.topScorer.player}</p>
        </div>

        {/* Maior Assistente */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Maior Assistente</h3>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-blue-600">{stats.topAssister.assists}</span>
            <span className="text-gray-600">assistências</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{stats.topAssister.player}</p>
        </div>
      </div>
    </div>
  );
} 