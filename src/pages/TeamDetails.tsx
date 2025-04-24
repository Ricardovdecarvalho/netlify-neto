import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { leagueService } from '../services/leagueService';
import { Team } from '../types/league';
import { Match } from '../types/league';
import { LeagueSummary } from '../types/league';
import format from 'date-fns/format';
import { ptBR } from 'date-fns/locale';
import ApiErrorPage from './ApiErrorPage';

// Componente que obtém o ID do time diretamente dos parâmetros da URL
export default function TeamDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [lastMatches, setLastMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [leagues, setLeagues] = useState<LeagueSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTeamData = async () => {
    if (!id) {
      setError(new Error('ID do time não encontrado'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Buscar detalhes do time
      const teamData = await leagueService.getTeamDetails(id);
      setTeam(teamData);

      // Buscar últimos jogos
      const lastMatchesData = await leagueService.getTeamLastMatches(id);
      setLastMatches(lastMatchesData);

      // Buscar próximos jogos
      const upcomingMatchesData = await leagueService.getTeamUpcomingMatches(id);
      setUpcomingMatches(upcomingMatchesData);

      // Buscar ligas do time
      const leaguesData = await leagueService.getTeamLeagues(id);
      setLeagues(leaguesData);
    } catch (err) {
      console.error('Erro ao buscar dados do time:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, [id]);

  if (error) {
    return <ApiErrorPage error={error} resetError={fetchTeamData} />;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3">Carregando dados do time...</span>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600 mb-4">Time não encontrado</div>
        <button 
          onClick={() => navigate(-1)} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Cabeçalho do Time */}
      <div className="flex items-center space-x-4 mb-8">
        <img 
          src={team.logo} 
          alt={team.name} 
          className="w-24 h-24 object-contain"
        />
        <div>
          <h1 className="text-3xl font-bold">{team.name}</h1>
          {team.founded && <p className="text-gray-600">Fundado em {team.founded}</p>}
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Vitórias</h3>
          <p className="text-2xl text-green-600">{team.wins}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Empates</h3>
          <p className="text-2xl text-yellow-600">{team.draws}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Derrotas</h3>
          <p className="text-2xl text-red-600">{team.losses}</p>
        </div>
      </div>

      {/* Campeonatos Participantes */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Campeonatos Participantes</h2>
        {leagues.length === 0 ? (
          <p className="text-gray-500">Não há campeonatos disponíveis para este time na temporada atual.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leagues.map(league => (
              <div 
                key={league.id} 
                onClick={() => navigate(`/leagues/${league.id}/standings`)}
                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
              >
                <img 
                  src={league.logo} 
                  alt={league.name} 
                  className="w-16 h-16 object-contain mx-auto mb-2"
                />
                <h3 className="text-lg font-semibold text-center hover:text-blue-600 transition-colors">{league.name}</h3>
                <p className="text-gray-600 text-center">{league.country}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Últimos Jogos */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Últimos Jogos</h2>
        {lastMatches.length === 0 ? (
          <p className="text-gray-500">Não há jogos anteriores disponíveis para este time.</p>
        ) : (
          <div className="space-y-4">
            {lastMatches.map(match => (
              <div key={match.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={match.homeTeam.logo} 
                      alt={match.homeTeam.name} 
                      className="w-12 h-12 object-contain"
                    />
                    <span className="font-semibold">{match.homeTeam.name}</span>
                  </div>
                  <div className="text-xl font-bold">
                    {match.homeScore !== undefined ? match.homeScore : '-'} - {match.awayScore !== undefined ? match.awayScore : '-'}
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-semibold">{match.awayTeam.name}</span>
                    <img 
                      src={match.awayTeam.logo} 
                      alt={match.awayTeam.name} 
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                </div>
                <div className="text-center text-gray-600 mt-2">
                  {format(new Date(match.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Próximos Jogos */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Próximos Jogos</h2>
        {upcomingMatches.length === 0 ? (
          <p className="text-gray-500">Não há próximos jogos agendados para este time.</p>
        ) : (
          <div className="space-y-4">
            {upcomingMatches.map(match => (
              <div key={match.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={match.homeTeam.logo} 
                      alt={match.homeTeam.name} 
                      className="w-12 h-12 object-contain"
                    />
                    <span className="font-semibold">{match.homeTeam.name}</span>
                  </div>
                  <div className="text-xl font-bold">
                    vs
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-semibold">{match.awayTeam.name}</span>
                    <img 
                      src={match.awayTeam.logo} 
                      alt={match.awayTeam.name} 
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                </div>
                <div className="text-center text-gray-600 mt-2">
                  {format(new Date(match.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Escalação */}
      {team.squad && team.squad.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Escalação</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {team.squad.map(player => (
              <div key={player.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center space-x-4">
                  <img 
                    src={player.photo} 
                    alt={player.name} 
                    className="w-16 h-16 object-cover rounded-full"
                  />
                  <div>
                    <h3 className="font-semibold">{player.name}</h3>
                    <p className="text-gray-600">{player.position}</p>
                    <p className="text-sm text-gray-500">Número: {player.number}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 