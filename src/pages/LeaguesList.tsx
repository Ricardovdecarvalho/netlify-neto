import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { LeagueSummary } from '../types/league';
import { leagueService } from '../services/leagueService';
import ApiErrorPage from './ApiErrorPage';

export default function LeaguesList() {
  const [leagues, setLeagues] = useState<LeagueSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const fetchLeagues = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await leagueService.getAllLeagues();
      setLeagues(data);
    } catch (err) {
      console.error('Erro ao buscar ligas:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeagues();
  }, []);

  // Se temos um erro, mostramos a página de erro da API
  if (error) {
    return <ApiErrorPage error={error} resetError={fetchLeagues} />;
  }

  // Obtém lista de países únicos das ligas
  const countries = Array.from(new Set(leagues.map(league => league.country)));

  const filteredLeagues = leagues.filter((league) => {
    const matchesSearch = league.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      league.country.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || league.country === filter;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3">Carregando ligas da API...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Ligas Disponíveis</h1>
      
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Buscar liga por nome ou país..."
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
        
        <div className="min-w-[200px]">
          <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white appearance-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Todos os países</option>
            {countries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>
      </div>
      
      {leagues.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">Nenhuma liga disponível no momento.</p>
          <button
            onClick={fetchLeagues}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredLeagues.map((league) => (
            <Link 
              key={league.id} 
              to={`/leagues/${league.id}/teams`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 p-6 flex flex-col items-center"
            >
              <div className="w-24 h-24 mb-4 flex items-center justify-center">
                {league.logo ? (
                  <img 
                    src={league.logo} 
                    alt={league.name} 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-400 dark:text-gray-500">
                      {league.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <h2 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-1">{league.name}</h2>
              <div className="flex items-center justify-center mb-4">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                  {league.country}
                </span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <span>Temporada {league.season}</span>
              </div>
              <div className="mt-4">
                <span className="inline-flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium">
                  Ver Times
                  <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
      
      {filteredLeagues.length === 0 && leagues.length > 0 && (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          Nenhuma liga encontrada com os critérios de busca. Tente uma busca diferente ou limpe os filtros.
        </div>
      )}
    </div>
  );
} 