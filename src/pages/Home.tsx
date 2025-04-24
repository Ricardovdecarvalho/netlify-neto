import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMatchesByDate, getLiveMatches, getTomorrowMatches } from '../services/api';
import { Match } from '../types/api';
import { MatchCard } from '../components/MatchCard';
import { Loader2 } from 'lucide-react';
import subHours from 'date-fns/subHours';

export const Home: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const fetchMatches = async () => {
    setLoading(true);
    try {
      let data: Match[] = [];
      
      switch (location.pathname) {
        case '/':
        case '/jogos-hoje':
          const todayGames = await getMatchesByDate(new Date());
          const now = new Date();
          
          data = todayGames.filter(match => {
            const status = match.fixture.status.short;
            const matchDate = new Date(match.fixture.date);
            const isLive = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(status);
            const isScheduled = ['NS', 'TBD'].includes(status);
            const isPST = ['PST'].includes(status);

            return !isPST && (isLive || (isScheduled && matchDate >= now));
          });

          data.sort((a, b) => {
            const statusA = a.fixture.status.short;
            const statusB = b.fixture.status.short;
            const isLiveA = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(statusA);
            const isLiveB = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(statusB);

            if (isLiveA && !isLiveB) return -1;
            if (!isLiveA && isLiveB) return 1;
            
            return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
          });
          setMatches(data);
          break;
        case '/resultados-hoje':
          const todayMatches = await getMatchesByDate(new Date());
          data = todayMatches.filter(match => {
            const status = match.fixture.status.short;
            return ['FT', 'AET', 'PEN', 'FT_PEN'].includes(status);
          });
          data.sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime());
          setMatches(data);
          break;
        case '/jogos-ao-vivo':
          data = await getLiveMatches();
          setMatches(data);
          break;
        case '/jogos-amanha':
          data = await getTomorrowMatches();
          setMatches(data);
          break;
        default:
          const allMatches = await getMatchesByDate(new Date());
          const currentTime = new Date();
          const oneHourAgo = subHours(currentTime, 1);

          const filteredMatches = allMatches.filter(match => {
            const status = match.fixture.status.short;
            const matchDate = new Date(match.fixture.date);
            const isFinished = ['FT', 'AET', 'PEN', 'FT_PEN'].includes(status);
            const isLive = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(status);
            const isScheduled = ['NS', 'TBD'].includes(status);
            const isPST = ['PST'].includes(status);

            return (
              !isPST && (
                isLive ||
                (isScheduled && matchDate >= currentTime) ||
                (isFinished && matchDate >= oneHourAgo)
              )
            );
          });

          data = filteredMatches.sort((a, b) => {
            const statusA = a.fixture.status.short;
            const statusB = b.fixture.status.short;
            const isLiveA = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(statusA);
            const isLiveB = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(statusB);

            if (isLiveA && !isLiveB) return -1;
            if (!isLiveA && isLiveB) return 1;
            
            return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
          });
          setMatches(data);
      }
    } catch (error) {
      console.error('Erro ao buscar partidas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [location.pathname]);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Jogos de Hoje';
      case '/jogos-hoje':
        return 'Jogos de Hoje';
      case '/resultados-hoje':
        return 'Resultados de Hoje';
      case '/jogos-ao-vivo':
        return 'Partidas Ao Vivo';
      case '/jogos-amanha':
        return 'Jogos de Amanhã';
      default:
        return 'Jogos de Hoje';
    }
  };

  // Função para agrupar os jogos por liga
  const groupMatchesByLeague = (matches: Match[]) => {
    const mainLeaguesIds = [
      2,    // UEFA Champions League
      39,   // Premier League (Inglaterra)
      140,  // La Liga (Espanha)
      135,  // Serie A (Itália)
      78,   // Bundesliga (Alemanha)
      61,   // Ligue 1 (França)
      3,    // UEFA Europa League
      13,   // Copa Libertadores
      14,   // Copa Sudamericana
      1,    // Copa do Mundo
    ];

    const grouped: Record<string, { name: string, logo: string, matches: Match[], order: number }> = {};
    
    matches.forEach(match => {
      const leagueName = match.league.name;
      const key = leagueName;
      
      if (!grouped[key]) {
        // Define a ordem de prioridade da liga
        let order = 3; // Padrão para outras ligas
        
        // Verifica se é uma liga principal
        // @ts-ignore - Verificamos apenas pelo nome da liga, pois o id pode não existir na interface
        const leagueId = match.league.id;
        if (leagueId && mainLeaguesIds.includes(leagueId)) {
          order = 1; // Ligas principais têm prioridade 1
        } 
        // Verifica se é uma liga brasileira
        else if (match.league.country.toLowerCase() === 'brazil') {
          order = 2; // Ligas brasileiras têm prioridade 2
        }
        
        grouped[key] = {
          name: leagueName,
          logo: match.league.logo,
          matches: [],
          order: order
        };
      }
      
      grouped[key].matches.push(match);
    });
    
    // Converte para um array e ordena primeiro por ordem (principais, brasileiras, outras)
    // e depois por nome da liga dentro de cada categoria
    return Object.entries(grouped)
      .map(([_, leagueData]) => leagueData)
      .sort((a, b) => {
        if (a.order !== b.order) {
          return a.order - b.order;
        }
        return a.name.localeCompare(b.name);
      });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const groupedMatches = groupMatchesByLeague(matches);

  return (
    <div className="container px-4 py-4 md:px-6 lg:px-8 lg:pr-12 md:ml-0">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center dark:text-white">
        {getPageTitle()}
      </h1>
      {matches.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          Nenhuma partida encontrada
        </div>
      ) : (
        <div className="space-y-6">
          {groupedMatches.map((league) => (
            <div key={league.name} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex items-center">
                {league.logo && (
                  <img src={league.logo} alt={league.name} className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                )}
                <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">{league.name}</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4">
                {league.matches.map((match) => (
                  <MatchCard key={match.fixture.id} match={match} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};