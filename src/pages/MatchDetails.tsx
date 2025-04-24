import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMatchDetails } from '../services/api';
import { MatchDetails } from '../types/api';
import { Trophy, Users, Activity, Clock, Tv, Loader2 } from 'lucide-react';
import format from 'date-fns/format';
import { parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { translateMatchStatus } from '../utils/translations';
import CachedImage from '../components/CachedImage';
import { guiaJogosService } from '../services/guiaJogosService';
import { matchUrlService } from '../services/matchUrlService';
import { MatchScore } from '../components/MatchScore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { MatchLineups } from '../components/MatchLineups';
import { MatchEvents } from '../components/MatchEvents';
import { MatchStats } from '../components/MatchStats';

export const MatchDetailsPage: React.FC = () => {
  const { league, match: matchParam } = useParams<{ league: string; match: string }>();
  const [matchDetails, setMatchDetails] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [broadcastInfo, setBroadcastInfo] = useState<string | null>(null);
  const [loadingBroadcast, setLoadingBroadcast] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatchDetails = async () => {
      if (!league || !matchParam) return;
      
      const urlKey = `${league}/${matchParam}`;
      const matchId = matchUrlService.getMatchId(urlKey);
      
      if (!matchId) {
        setError('Partida não encontrada');
        setLoading(false);
        return;
      }
      
      try {
        setError(null);
        const data = await getMatchDetails(matchId);
        setMatchDetails(data);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erro ao carregar os detalhes da partida';
        setError(errorMsg);
        console.error('Erro ao buscar detalhes da partida:', errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchDetails();
  }, [league, matchParam]);

  useEffect(() => {
    const fetchBroadcastInfo = async () => {
      if (!matchDetails) return;
      
      try {
        // Busca os jogos do scraping
        const guiaMatches = await guiaJogosService.getMatches();
        
        // Procura o jogo correspondente
        const match = guiaMatches.find(m => 
          m.matchId === matchDetails.fixture.id || // Primeiro tenta pelo ID
          ( // Depois tenta pelos nomes dos times
            (m.time_casa.toLowerCase().includes(matchDetails.teams.home.name.toLowerCase()) ||
             matchDetails.teams.home.name.toLowerCase().includes(m.time_casa.toLowerCase())) &&
            (m.time_visitante.toLowerCase().includes(matchDetails.teams.away.name.toLowerCase()) ||
             matchDetails.teams.away.name.toLowerCase().includes(m.time_visitante.toLowerCase()))
          )
        );

        // Se encontrou o jogo, usa a transmissão dele
        if (match?.transmissao) {
          setBroadcastInfo(match.transmissao);
        } else {
          setBroadcastInfo(null);
        }
      } catch (error) {
        console.error('Erro ao buscar informações de transmissão:', error);
        setBroadcastInfo(null);
      } finally {
        setLoadingBroadcast(false);
      }
    };

    fetchBroadcastInfo();
  }, [matchDetails]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen dark:bg-gray-900">
        <div className="w-8 h-8 animate-spin text-blue-500">
          <svg className="w-full h-full" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-12 py-4 sm:py-8 max-w-5xl">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }
  if (!matchDetails) {
    return (
      <div className="container mx-auto px-4 sm:px-12 py-4 sm:py-8 max-w-5xl">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
          <p className="text-yellow-600 dark:text-yellow-400">
            Partida não encontrada
          </p>
        </div>
      </div>
    );
  }

  const formatMatchDate = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, "EEEE, d 'de' MMMM 'de' yyyy • HH:mm", { locale: ptBR });
  };

  const isLiveMatch = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(matchDetails.fixture.status.short);

  const renderMatchTime = () => {
    if (!isLiveMatch) return null;

    return (
      <div className="text-lg font-semibold text-red-500 mb-2 flex items-center justify-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
        {matchDetails.fixture.status?.elapsed}'
      </div>
    );
  };

  const renderOdds = () => {
    if (!matchDetails.odds?.bookmakers?.length) return null;

    const desiredBookmakers = ['Bet365', 'Betfair', '1xBet'];

    const matchWinnerOdds = matchDetails.odds.bookmakers
      .filter(bookmaker => desiredBookmakers.includes(bookmaker.name))
      .map(bookmaker => {
        const matchWinnerBet = bookmaker.bets.find(bet => bet.name === "Match Winner");
        if (!matchWinnerBet) return null;

        return {
          bookmaker: bookmaker.name,
          odds: matchWinnerBet.values.reduce((acc, value) => {
            if (value.value === "Home") acc.home = value.odd;
            if (value.value === "Draw") acc.draw = value.odd;
            if (value.value === "Away") acc.away = value.odd;
            return acc;
          }, { home: "", draw: "", away: "" })
        };
      })
      .filter(Boolean);

    if (matchWinnerOdds.length === 0) return null;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-xl font-bold mb-4 dark:text-white">Odds</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm sm:text-base">
            <thead>
              <tr className="text-sm text-gray-600 dark:text-gray-300 border-b dark:border-gray-700">
                <th className="text-left py-2 px-4">CASA DE APOSTAS</th>
                <th className="text-center py-2 px-4">1</th>
                <th className="text-center py-2 px-4">X</th>
                <th className="text-center py-2 px-4">2</th>
              </tr>
            </thead>
            <tbody>
              {matchWinnerOdds.map((item, index) => (
                <tr key={index} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <span className="font-medium dark:text-white">{item.bookmaker}</span>
                    </div>
                  </td>
                  <td className="text-center py-4 px-4">
                    <div className="flex items-center justify-center space-x-1">
                      <span className="text-red-500">↓</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">{parseFloat(item.odds.home).toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="text-center py-4 px-4">
                    <div className="flex items-center justify-center space-x-1">
                      <span className="text-red-500">↓</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">{parseFloat(item.odds.draw).toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="text-center py-4 px-4">
                    <div className="flex items-center justify-center space-x-1">
                      <span className="text-green-500">↑</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">{parseFloat(item.odds.away).toFixed(2)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          * Odds atualizadas em tempo real. Valores sujeitos a alterações.
        </div>
      </div>
    );
  };

  const renderPredictions = () => {
    if (!matchDetails.predictions?.predictions) return null;

    const { predictions } = matchDetails.predictions;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
          <span className="text-xl">🎯</span>
          Probabilidades
        </h3>
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <h4 className="text-sm sm:text-base font-semibold mb-3 dark:text-white">Probabilidades de Resultado</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm sm:text-base dark:text-gray-300">
                <span>Vitória {matchDetails.teams.home.name}</span>
                <span className="font-medium">{predictions.percent.home}</span>
              </div>
              <div className="flex justify-between dark:text-gray-300">
                <span>Empate</span>
                <span className="font-medium">{predictions.percent.draw}</span>
              </div>
              <div className="flex justify-between dark:text-gray-300">
                <span>Vitória {matchDetails.teams.away.name}</span>
                <span className="font-medium">{predictions.percent.away}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3 dark:text-white">Previsões</h4>
            <div className="space-y-2">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Vencedor Previsto:</span>
                <span className="font-medium ml-2 dark:text-white">{predictions.winner.name}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Gols Previstos:</span>
                <span className="font-medium ml-2 dark:text-white">
                  {predictions.goals.home} - {predictions.goals.away}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Mais/Menos:</span>
                <span className="font-medium ml-2 dark:text-white">{predictions.under_over}</span>
              </div>
            </div>
          </div>
          <div className="md:col-span-2">
            <h4 className="font-semibold mb-2 dark:text-white">Análise</h4>
            <p className="text-gray-700 dark:text-gray-300">{predictions.advice}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderStatistics = () => {
    if (!matchDetails.statistics?.length) return null;

    const homeStats = matchDetails.statistics[0]?.statistics || [];
    const awayStats = matchDetails.statistics[1]?.statistics || [];

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
          <Activity className="w-5 h-5" />
          Estatísticas da Partida
        </h3>
        <div className="space-y-4">
          {homeStats.map((stat, index) => (
            <div key={index} className="grid grid-cols-3 items-center text-sm sm:text-base">
              <div className="text-right font-medium dark:text-white">{stat.value || '0'}</div>
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">{stat.type}</div>
              <div className="text-left font-medium dark:text-white">{awayStats[index]?.value || '0'}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLineups = () => {
    const lineups = matchDetails.lineups;
    if (!lineups || !Array.isArray(lineups) || lineups.length === 0) return null;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
          <Users className="w-5 h-5" />
          Escalações
        </h3>
        <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
          {lineups.map((lineup, index) => (
            <div key={index}>
              <div className="mb-4">
                <h4 className="font-bold text-base sm:text-lg dark:text-white">{lineup.team.name}</h4>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Formação: {lineup.formation}</p>
                {lineup.coach && (
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Treinador: {lineup.coach.name}</p>
                )}
              </div>
              <div className="mb-4">
                <h5 className="text-sm sm:text-base font-semibold mb-2 dark:text-white">Titulares</h5>
                <div className="space-y-2">
                  {lineup.startXI?.map(({ player }, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm sm:text-base">
                      <span className="w-6 text-center text-sm text-gray-600 dark:text-gray-400">{player.number}</span>
                      <span className="dark:text-white">{player.name}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">({player.pos})</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h5 className="font-semibold mb-2 dark:text-white">Reservas</h5>
                <div className="space-y-2">
                  {lineup.substitutes?.map(({ player }, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-6 text-center text-sm text-gray-600 dark:text-gray-400">{player.number}</span>
                      <span className="dark:text-white">{player.name}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">({player.pos})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEvents = () => {
    if (!matchDetails.events?.length) return null;

    const getEventIcon = (type: string) => {
      switch (type.toLowerCase()) {
        case 'goal':
          return '⚽';
        case 'card':
          return '🟨';
        case 'subst':
          return '🔄';
        default:
          return '•';
      }
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
          <Clock className="w-5 h-5" />
          Eventos da Partida
        </h3>
        <div className="space-y-3">
          {matchDetails.events.map((event, index) => (
            <div key={index} className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
              <span className="text-gray-600 dark:text-gray-400 w-16">
                {event.time.elapsed}'
                {event.time.extra && `+${event.time.extra}`}
              </span>
              <span>{getEventIcon(event.type)}</span>
              <div className="flex-1">
                <span className="font-medium dark:text-white">{event.team.name}</span>
                <span className="mx-2 dark:text-gray-300">-</span>
                <span className="dark:text-white">{event.player.name}</span>
                {event.assist && (
                  <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    {' '}
                    (Assistência: {event.assist.name})
                  </span>
                )}
                <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm ml-2">
                  {event.detail}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 sm:px-12 py-4 sm:py-8 max-w-5xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="text-center mb-4">
          <h2 className="text-xl sm:text-2xl font-bold flex items-center justify-center gap-2 mb-2 dark:text-white">
            <Trophy className="w-6 h-6 text-yellow-500" />
            {matchDetails.league.name}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {formatMatchDate(matchDetails.fixture.date)}
          </p>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{matchDetails.fixture.venue.name}, {matchDetails.fixture.venue.city}</p>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <div
              onClick={() => navigate(`/team/${matchDetails.teams.home.id}`)}
              className="cursor-pointer hover:opacity-80 transition-opacity mx-auto"
            >
              <CachedImage 
                src={matchDetails.teams.home.logo} 
                alt={matchDetails.teams.home.name} 
                className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-2 sm:mb-4 bg-transparent" 
                fallbackSize="lg"
              />
            </div>
            <h2 
              onClick={() => navigate(`/team/${matchDetails.teams.home.id}`)}
              className="text-base sm:text-xl font-bold dark:text-white line-clamp-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {matchDetails.teams.home.name}
            </h2>
          </div>
          <div className="text-center px-8">
            {renderMatchTime()}
            <div className="text-3xl sm:text-4xl font-bold mb-2 dark:text-white">
              {matchDetails.goals.home ?? 0} - {matchDetails.goals.away ?? 0}
            </div>
            <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{translateMatchStatus(matchDetails.fixture.status.long)}</div>
          </div>
          <div className="text-center flex-1">
            <div
              onClick={() => navigate(`/team/${matchDetails.teams.away.id}`)}
              className="cursor-pointer hover:opacity-80 transition-opacity mx-auto"
            >
              <CachedImage 
                src={matchDetails.teams.away.logo} 
                alt={matchDetails.teams.away.name} 
                className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-2 sm:mb-4 bg-transparent" 
                fallbackSize="lg"
              />
            </div>
            <h2 
              onClick={() => navigate(`/team/${matchDetails.teams.away.id}`)}
              className="text-base sm:text-xl font-bold dark:text-white line-clamp-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {matchDetails.teams.away.name}
            </h2>
          </div>
        </div>
      </div>

      {/* Seção de Transmissões - Comentada completamente */}
      {/* 
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
          <Tv className="w-5 h-5" />
          Transmissões
        </h3>
        {loadingBroadcast ? (
          <div className="flex flex-col items-center justify-center py-4 space-y-2">
            <div className="w-8 h-8 animate-spin text-blue-500">
              <Loader2 className="w-full h-full" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Procurando informações de transmissão...
            </p>
          </div>
        ) : broadcastInfo ? (
          <div className="text-gray-700 dark:text-gray-300 text-center py-4">
            <p className="font-medium">{broadcastInfo}</p>
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 text-center py-4">
            Não temos informação de transmissão para esse jogo. Tente mais próximo do horário do jogo.
          </p>
        )}
      </div>
      */}

      {renderOdds()}
      {renderPredictions()}
      {renderStatistics()}
      {renderLineups()}
      {renderEvents()}
    </div>
  );
};