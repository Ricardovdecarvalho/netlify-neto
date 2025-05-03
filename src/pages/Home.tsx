import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMatchesByDate, getLiveMatches, getTomorrowMatches } from '../services/api';
import { Match } from '../types/api';
import { Loader2 } from 'lucide-react';
import subHours from 'date-fns/subHours';
import MatchGrid from '../components/MatchGrid';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container px-4 py-4 md:px-6 lg:px-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center dark:text-white">
        {getPageTitle()}
      </h1>
      {matches.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          Nenhuma partida encontrada
        </div>
      ) : (
        <MatchGrid matches={matches} />
      )}
    </div>
  );
};
