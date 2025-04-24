import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Team, LeagueSummary } from '../types/league';
import { leagueService } from '../services/leagueService';
import ApiErrorPage from './ApiErrorPage';

const LeagueTeams: React.FC = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const [teams, setTeams] = useState<Team[]>([]);
  const [league, setLeague] = useState<LeagueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!leagueId) throw new Error('ID da liga não encontrado');
      
      // Buscar informações da liga
      const leagueData = await leagueService.getLeague(leagueId);
      setLeague({ 
        id: leagueData.id, 
        name: leagueData.name, 
        country: '', // A API deve fornecer este campo
        season: leagueData.season,
        logo: '' // A API deve fornecer este campo
      });
      
      // Buscar times da liga
      const teamsData = await leagueService.getTeamsByLeague(leagueId);
      setTeams(teamsData);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [leagueId]);

  // Se temos um erro, mostramos a página de erro da API
  if (error) {
    return <ApiErrorPage error={error} resetError={fetchData} />;
  }

  const filteredTeams = teams.filter((team) => 
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3">Carregando times da API...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">
        {league?.name && `Times - ${league.name}`}
        {league?.season && <span className="text-lg text-gray-500 ml-2">Temporada {league.season}</span>}
      </h1>
      
      <div className="mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar time..."
            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg 
            className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 dark:text-gray-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      
      {teams.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">Nenhum time disponível para esta liga.</p>
          <div className="mt-4 flex justify-center space-x-4">
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Tentar novamente
            </button>
            <Link 
              to="/leagues" 
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Voltar para Ligas
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTeams.map((team) => (
            <Link 
              to={`/team/${team.id}`} 
              key={team.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 flex flex-col items-center"
            >
              <div className="w-24 h-24 mb-4 flex items-center justify-center">
                {team.logo ? (
                  <img 
                    src={team.logo} 
                    alt={team.name} 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-400 dark:text-gray-500">
                      {team.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <h2 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-3">{team.name}</h2>
              
              <div className="w-full grid grid-cols-3 gap-2 text-center mt-4">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded">
                  <div className="text-sm text-gray-500 dark:text-gray-400">P</div>
                  <div className="font-bold text-blue-600 dark:text-blue-400">{team.points}</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 p-2 rounded">
                  <div className="text-sm text-gray-500 dark:text-gray-400">V</div>
                  <div className="font-bold text-green-600 dark:text-green-400">{team.wins}</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/30 p-2 rounded">
                  <div className="text-sm text-gray-500 dark:text-gray-400">D</div>
                  <div className="font-bold text-red-600 dark:text-red-400">{team.losses}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      
      {filteredTeams.length === 0 && teams.length > 0 && (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          Nenhum time encontrado para "{searchTerm}". Tente uma busca diferente.
        </div>
      )}
    </div>
  );
};

export default LeagueTeams; 