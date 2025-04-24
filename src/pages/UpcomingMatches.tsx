import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { Match } from '../types/league';
import { leagueService } from '../services/leagueService';

export default function UpcomingMatches() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        if (!leagueId) throw new Error('ID da liga não encontrado');
        const data = await leagueService.getUpcomingMatches(leagueId);
        setMatches(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar próximos jogos');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
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
      <h1 className="text-3xl font-bold mb-8">Próximos Jogos</h1>
      
      <div className="grid gap-6">
        {matches.map((match) => (
          <div key={match.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {match.homeTeam.logo && (
                  <img className="h-12 w-12 rounded-full" src={match.homeTeam.logo} alt={match.homeTeam.name} />
                )}
                <span className="text-lg font-semibold">{match.homeTeam.name}</span>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-1">
                  {new Date(match.date).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className="text-2xl font-bold">
                  {match.homeScore !== undefined ? `${match.homeScore} x ${match.awayScore}` : 'vs'}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-lg font-semibold">{match.awayTeam.name}</span>
                {match.awayTeam.logo && (
                  <img className="h-12 w-12 rounded-full" src={match.awayTeam.logo} alt={match.awayTeam.name} />
                )}
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                match.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                match.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {match.status === 'scheduled' ? 'Agendado' :
                 match.status === 'in_progress' ? 'Em Andamento' :
                 'Finalizado'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 