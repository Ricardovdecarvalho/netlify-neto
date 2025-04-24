import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Match } from '../types/api';
import { Calendar, Clock, Timer, Tv } from 'lucide-react';
import { Link } from 'react-router-dom';
import format from 'date-fns/format';
import CachedImage from './CachedImage';
// import { broadcastService } from '../services/matchBroadcastService'; // Comentado
import { matchUrlService } from '../services/matchUrlService';
import { parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MatchCardProps {
  match: Match;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  // const [broadcast, setBroadcast] = React.useState<string | null>(null); // Comentado
  const [currentMatch, setCurrentMatch] = React.useState(match);
  const navigate = useNavigate();
  const [elapsed, setElapsed] = React.useState<number>(currentMatch.fixture.status?.elapsed || 0);
  const [localElapsed, setLocalElapsed] = React.useState<number>(currentMatch.fixture.status?.elapsed || 0);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | undefined>();
  const lastUpdateRef = React.useRef<number>(Date.now());
  const matchDate = parseISO(match.fixture.date);
  const formattedTime = format(matchDate, 'HH:mm');
  const formattedDate = format(matchDate, 'dd/MM/yyyy');
  const matchStatus = match.fixture.status.short;
  const liveStatus = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'];
  const finishedStatus = ['FT', 'AET', 'PEN'];
  const isLive = liveStatus.includes(matchStatus);
  const isFinished = finishedStatus.includes(matchStatus);
  const notStarted = matchStatus === 'NS';

  const homeTeam = match.teams.home;
  const awayTeam = match.teams.away;

  const updateMatchData = React.useCallback(async () => {
    // Atualiza apenas se passaram 5 minutos desde a última atualização
    const now = Date.now();
    if (now - lastUpdateRef.current < 5 * 60 * 1000) {
      return;
    }
    
    lastUpdateRef.current = now;
    
    try {
      const url = new URL('https://v3.football.api-sports.io/fixtures');
      url.searchParams.append('id', currentMatch.fixture.id.toString());
      url.searchParams.append('timezone', 'America/Sao_Paulo');

      const response = await fetch(
        url.toString(),
        {
          method: 'GET',
          headers: {
            'x-apisports-key': import.meta.env.VITE_API_SPORTS_KEY,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.response?.[0]) {
        setCurrentMatch(data.response[0]);
        const newElapsed = data.response[0].fixture.status?.elapsed || elapsed;
        setElapsed(newElapsed);
        setLocalElapsed(newElapsed);
      }
    } catch (error) {
      console.error('Error updating match data:', error instanceof Error ? error.message : 'Unknown error');
    }
  }, [currentMatch.fixture.id, elapsed]);

  // Update elapsed time locally
  React.useEffect(() => {
    if (isLive && currentMatch.fixture.status.short !== 'HT') {
      // Limpa o timer anterior se existir
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Atualiza o tempo a cada minuto
      timerRef.current = setInterval(() => {
        setLocalElapsed(prev => (prev || 0) + 1);
      }, 60000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isLive, currentMatch.fixture.status.short]);

  // Fetch match data from API periodically
  React.useEffect(() => {
    let dataInterval: ReturnType<typeof setInterval> | undefined;

    if (isLive) {
      // Atualização inicial
      updateMatchData();
      
      // Configura intervalo para verificar atualizações a cada minuto
      // O updateMatchData só fará a requisição se passaram 5 minutos
      dataInterval = setInterval(updateMatchData, 60000);
    }

    return () => {
      if (dataInterval) {
        clearInterval(dataInterval);
      }
    };
  }, [isLive, updateMatchData]);

  // React.useEffect(() => { // Comentado
  //   if (match.fixture.id) {
  //     const fetchBroadcast = async () => {
  //       const info = await broadcastService.findBroadcastInfo(
  //         homeTeam.name,
  //         awayTeam.name,
  //         match.fixture.venue.name ?? ''
  //       );
  //       setBroadcast(info);
  //     };
  //     fetchBroadcast();
  //   }
  // }, [match.fixture.id, homeTeam.name, awayTeam.name, match.fixture.venue.name]); // Comentado

  const renderMatchTime = () => {
    if (!isLive) return null;
    if (currentMatch.fixture.status.short === 'HT') return 'Intervalo';
    return 'Ao Vivo';
  };

  const generateMatchUrl = () => {
    const date = format(matchDate, 'dd-MM-yyyy');
    return matchUrlService.generateMatchUrl(
      currentMatch.league.name,
      currentMatch.teams.home.name,
      currentMatch.teams.away.name,
      date,
      currentMatch.fixture.id
    );
  };

  return (
    <Link 
      to={generateMatchUrl()}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
            {format(matchDate, 'dd MMM yyyy')}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {isLive ? (
            <div className="flex items-center space-x-2 text-red-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                {renderMatchTime()}
              </span>
            </div>
          ) : (
            <>
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                {format(matchDate, 'HH:mm')}
              </span>
            </>
          )}
        </div>
      </div>
      {/* Broadcast Info - Comentado */}
      {/* {broadcast && (
        <div className="flex items-center justify-center gap-2 mb-3">
          <Tv className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
            {broadcast}
          </span>
        </div>
      )} */}

      <div className="grid grid-cols-[1fr,auto,1fr] gap-3">
        <div className="flex items-center gap-3">
          <div
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/team/${currentMatch.teams.home.id}`);
            }}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <CachedImage 
              src={currentMatch.teams.home.logo} 
              alt={currentMatch.teams.home.name} 
              className="w-6 h-6 sm:w-8 sm:h-8 object-contain bg-transparent" 
              fallbackSize="sm"
            />
          </div>
          <span 
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/team/${currentMatch.teams.home.id}`);
            }}
            className="text-sm sm:text-base font-medium dark:text-white line-clamp-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {currentMatch.teams.home.name}
          </span>
        </div>
        <div className="flex flex-col items-center self-center mt-3">
          <div className="text-lg sm:text-xl font-bold dark:text-white">
            <span className="inline-block min-w-[10px] text-center">{currentMatch.goals.home ?? '-'}</span>
            <span className="mx-1">-</span>
            <span className="inline-block min-w-[10px] text-center">{currentMatch.goals.away ?? '-'}</span>
          </div>
          {isLive && currentMatch.fixture.status.short !== 'HT' && (
            <div className="text-xs text-red-500 whitespace-nowrap mt-0.5">
              <Timer className="w-3 h-3 inline-block mr-1" />
              <span>{localElapsed}'</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3">
          <span 
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/team/${currentMatch.teams.away.id}`);
            }}
            className="text-sm sm:text-base font-medium dark:text-white text-right line-clamp-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {currentMatch.teams.away.name}
          </span>
          <div
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/team/${currentMatch.teams.away.id}`);
            }}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <CachedImage 
              src={currentMatch.teams.away.logo} 
              alt={currentMatch.teams.away.name} 
              className="w-6 h-6 sm:w-8 sm:h-8 object-contain bg-transparent" 
              fallbackSize="sm"
            />
          </div>
        </div>
      </div>

      <div className="mt-3 sm:mt-4 flex items-center justify-center">
        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center line-clamp-1">
          {currentMatch.league.name} • {currentMatch.fixture.venue.name}
        </span>
      </div>
    </Link>
  );
};