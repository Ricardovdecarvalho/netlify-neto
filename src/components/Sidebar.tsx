import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { leagueService } from '../services/leagueService';
import type { LeagueSummary } from '../types/league';
import { Loader2 } from 'lucide-react';

export default function Sidebar() {
  const [leagues, setLeagues] = useState<LeagueSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const location = useLocation();

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        setLoading(true);
        const leaguesData = await leagueService.getAllLeagues();
        setLeagues(leaguesData);
      } catch (err) {
        console.error('Erro ao carregar ligas:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchLeagues();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 dark:text-red-400">
        <p>Erro ao carregar ligas</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  // Função para verificar se um link está ativo
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Separar as ligas em categorias
  const mainLeaguesIds = [
    '2',   // UEFA Champions League
    '39',  // Premier League (Inglaterra)
    '140', // La Liga (Espanha)
    '135', // Serie A (Itália)
    '78',  // Bundesliga (Alemanha)
    '61',  // Ligue 1 (França)
    '3',   // UEFA Europa League
    '13',  // Copa Libertadores
    '14',  // Copa Sudamericana
    '1',   // Copa do Mundo
  ];

  // Separar as ligas em categorias
  const mainLeagues: LeagueSummary[] = [];
  const brazilianLeagues: LeagueSummary[] = [];
  const otherLeagues: LeagueSummary[] = [];

  leagues.forEach(league => {
    const leagueId = league.id;
    
    // Verificar se é uma liga principal
    if (mainLeaguesIds.includes(leagueId)) {
      // Manter a ordem das ligas principais conforme definida
      const index = mainLeaguesIds.indexOf(leagueId);
      mainLeagues[index] = league;
    } 
    // Verificar se é liga brasileira
    else if (league.country.toLowerCase() === 'brazil') {
      brazilianLeagues.push(league);
    } 
    // Outras ligas
    else {
      otherLeagues.push(league);
    }
  });

  // Filtrar posições vazias no array de ligas principais
  const filteredMainLeagues = mainLeagues.filter(Boolean);
  
  // Ordenar ligas brasileiras por nome
  brazilianLeagues.sort((a, b) => a.name.localeCompare(b.name));
  
  // Ordenar outras ligas por país e depois por nome
  otherLeagues.sort((a, b) => {
    if (a.country !== b.country) {
      return a.country.localeCompare(b.country);
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <aside className="bg-white dark:bg-gray-800 w-64 h-[calc(100vh-64px)] overflow-y-auto shadow-md sticky top-16">
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Jogos</h2>
        <nav className="space-y-1">
          <Link
            to="/"
            className={`flex items-center px-4 py-2 text-sm rounded-md ${
              isActive('/') 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Todos os Jogos
          </Link>
          <Link
            to="/jogos-ao-vivo"
            className={`flex items-center px-4 py-2 text-sm rounded-md ${
              isActive('/jogos-ao-vivo') 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Ao Vivo
          </Link>
          <Link
            to="/resultados-hoje"
            className={`flex items-center px-4 py-2 text-sm rounded-md ${
              isActive('/resultados-hoje') 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Resultados de Hoje
          </Link>
          <Link
            to="/jogos-amanha"
            className={`flex items-center px-4 py-2 text-sm rounded-md ${
              isActive('/jogos-amanha') 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Jogos de Amanhã
          </Link>
        </nav>
      </div>

      {filteredMainLeagues.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Principais Ligas
          </h3>
          <nav className="space-y-1 mb-4">
            {filteredMainLeagues.map((league) => (
              <Link
                key={league.id}
                to={`/leagues/${league.id}/teams`}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 rounded-md"
              >
                {league.logo && (
                  <img src={league.logo} alt={league.name} className="w-5 h-5 mr-3" />
                )}
                <span className="truncate">{league.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}

      {brazilianLeagues.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Ligas Brasileiras
          </h3>
          <nav className="space-y-1 mb-4">
            {brazilianLeagues.map((league) => (
              <Link
                key={league.id}
                to={`/leagues/${league.id}/teams`}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 rounded-md"
              >
                {league.logo && (
                  <img src={league.logo} alt={league.name} className="w-5 h-5 mr-3" />
                )}
                <span className="truncate">{league.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}

      {otherLeagues.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Outras Ligas
          </h3>
          <nav className="space-y-1 pb-6">
            {otherLeagues.map((league) => (
              <Link
                key={league.id}
                to={`/leagues/${league.id}/teams`}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 rounded-md"
              >
                {league.logo && (
                  <img src={league.logo} alt={league.name} className="w-5 h-5 mr-3" />
                )}
                <span className="truncate">{league.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </aside>
  );
} 