import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Match, MatchDetails } from '../types/api';
import CachedImage from './CachedImage';
import { Star } from 'lucide-react';
import { matchUrlService } from '../services/matchUrlService';
import { format, parseISO } from 'date-fns';

interface MatchGridProps {
  matches: Match[];
}

// Mapeamento de países para códigos de 2 letras para bandeiras
const countryCodeMap: Record<string, string> = {
  'Brazil': 'BR',
  'Brasil': 'BR',
  'Argentina': 'AR',
  'England': 'GB',
  'Spain': 'ES',
  'Italy': 'IT',
  'Germany': 'DE',
  'France': 'FR',
  'Portugal': 'PT',
  'Netherlands': 'NL',
  'Belgium': 'BE',
  'Uruguay': 'UY',
  'Paraguay': 'PY',
  'Chile': 'CL',
  'Colombia': 'CO',
  'Ecuador': 'EC',
  'Peru': 'PE',
  'Bolivia': 'BO',
  'Venezuela': 'VE',
  'USA': 'US',
  'Mexico': 'MX',
  'World': 'WW',   // Para competições internacionais
};

// Obter código do país para usar na API de bandeiras
const getCountryCode = (country: string): string => {
  return countryCodeMap[country] || 'WW'; // Padrão para bandeira genérica
};

const MatchGrid: React.FC<MatchGridProps> = ({ matches }) => {
  const navigate = useNavigate();

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

    const grouped: Record<string, { 
      name: string, 
      logo: string, 
      country: string,
      matches: Match[],
      order: number 
    }> = {};
    
    matches.forEach(match => {
      const leagueName = match.league.name;
      const key = `${match.league.country}-${leagueName}`;
      
      if (!grouped[key]) {
        // Define a ordem de prioridade da liga
        let order = 3; // Padrão para outras ligas
        
        // Verifica se é uma liga brasileira
        if (match.league.country.toLowerCase() === 'brazil') {
          order = 1; // Ligas brasileiras têm prioridade 1
        } 
        // Verifica se é uma liga principal
        else if ((match.league as any).id && mainLeaguesIds.includes((match.league as any).id)) {
          order = 2; // Ligas principais têm prioridade 2
        }
        
        grouped[key] = {
          name: leagueName,
          logo: match.league.logo,
          country: match.league.country,
          matches: [],
          order: order
        };
      }
      
      grouped[key].matches.push(match);
    });
    
    // Converter para array e ordenar por prioridade (brasileiras, principais, outras)
    // e depois por nome da liga dentro de cada categoria
    return Object.values(grouped).sort((a, b) => {
      // Primeiro por ordem de prioridade
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      // Depois por país
      if (a.country !== b.country) {
        return a.country.localeCompare(b.country);
      }
      // Por fim, pelo nome da liga
      return a.name.localeCompare(b.name);
    });
  };

  const renderElapsedTime = (match: Match) => {
    const status = match.fixture.status.short;
    
    // Para jogos ao vivo
    if (['1H', '2H', 'ET', 'BT', 'P', 'LIVE'].includes(status)) {
      // Verificar se a propriedade elapsed existe no objeto status
      const elapsed = (match.fixture.status as any).elapsed || 0;
      
      return (
        <span className="text-red-500 font-semibold text-sm whitespace-nowrap">
          {elapsed}'
        </span>
      );
    }
    
    // Para intervalo
    if (status === 'HT') {
      return <span className="text-red-500 font-semibold text-sm whitespace-nowrap">HT</span>;
    }
    
    // Para jogos programados
    if (['NS', 'TBD'].includes(status)) {
      const matchDate = parseISO(match.fixture.date);
      return <span className="text-gray-600 dark:text-gray-400 text-sm whitespace-nowrap">{format(matchDate, 'HH:mm')}</span>;
    }
    
    // Para jogos finalizados
    return <span className="text-gray-600 dark:text-gray-400 text-sm whitespace-nowrap">FT</span>;
  };

  const renderStat = (match: Match) => {
    // Aleatoriamente escolhe entre os formatos disponíveis na imagem para simular
    const stats = ['1-1', '0-1', '5-1', '0-3', '6-0', '20-1', '1-3', '3-3'];
    const randomIndex = Math.floor(Math.random() * stats.length);
    
    return (
      <div className="px-2 flex items-center text-xs whitespace-nowrap">
        {stats[randomIndex]}
      </div>
    );
  };

  const renderOdds = (match: Match) => {
    // Usar odds reais da API se disponíveis
    // Verificar se temos odds disponíveis (o match pode ser um MatchDetails que tem odds)
    const matchWithOdds = match as Partial<MatchDetails>;
    
    // Se não houver odds disponíveis ou não for um MatchDetails, mostramos valores padrão
    if (!matchWithOdds.odds || !matchWithOdds.odds.bookmakers || !matchWithOdds.odds.bookmakers.length) {
      return (
        <div className="flex space-x-2 text-sm">
          <div className="w-10 text-center rounded py-1 bg-gray-100 dark:bg-gray-700">-</div>
          <div className="w-10 text-center rounded py-1 bg-gray-100 dark:bg-gray-700">-</div>
          <div className="w-10 text-center rounded py-1 bg-gray-100 dark:bg-gray-700">-</div>
        </div>
      );
    }
    
    // Tentar encontrar a aposta para o resultado da partida (1X2)
    const bookmaker = matchWithOdds.odds.bookmakers[0]; // Pega o primeiro bookmaker
    const bet = bookmaker.bets.find(bet => bet.name === '1X2' || bet.name === 'Match Winner');
    
    if (!bet || !bet.values || bet.values.length < 3) {
      return (
        <div className="flex space-x-2 text-sm">
          <div className="w-10 text-center rounded py-1 bg-gray-100 dark:bg-gray-700">-</div>
          <div className="w-10 text-center rounded py-1 bg-gray-100 dark:bg-gray-700">-</div>
          <div className="w-10 text-center rounded py-1 bg-gray-100 dark:bg-gray-700">-</div>
        </div>
      );
    }
    
    // Extrai os valores das odds
    const homeOdd = bet.values.find(v => v.value === 'Home')?.odd || "-";
    const drawOdd = bet.values.find(v => v.value === 'Draw')?.odd || "-";
    const awayOdd = bet.values.find(v => v.value === 'Away')?.odd || "-";
    
    return (
      <div className="flex space-x-2 text-sm">
        <div className="w-10 text-center rounded py-1 bg-gray-100 dark:bg-gray-700">
          {homeOdd}
        </div>
        <div className="w-10 text-center rounded py-1 bg-gray-100 dark:bg-gray-700">
          {drawOdd}
        </div>
        <div className="w-10 text-center rounded py-1 bg-gray-100 dark:bg-gray-700">
          {awayOdd}
        </div>
      </div>
    );
  };

  const generateMatchUrl = (match: Match) => {
    const matchDate = parseISO(match.fixture.date);
    const date = format(matchDate, 'dd-MM-yyyy');
    return matchUrlService.generateMatchUrl(
      match.league.name,
      match.teams.home.name,
      match.teams.away.name,
      date,
      match.fixture.id
    );
  };

  const groupedMatches = groupMatchesByLeague(matches);

  return (
    <div className="space-y-4">
      {/* Lista de jogos por liga */}
      {groupedMatches.map((league) => (
        <div key={`${league.country}-${league.name}`} className="rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow">
          {/* Cabeçalho da liga */}
          <div className="flex items-center p-3 bg-blue-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <Star className="w-5 h-5 text-amber-400 mr-2" />
            <div className="flex items-center">
              <img 
                src={`https://flagsapi.com/${getCountryCode(league.country)}/flat/16.png`} 
                alt={league.country} 
                className="w-4 h-4 mr-2"
              />
              <span className="font-medium text-gray-800 dark:text-white">
                {league.country}: {league.name}
              </span>
            </div>
            <div className="ml-auto flex items-center space-x-6">
              <span className="text-orange-500 font-bold">9999</span>
              <span>1</span>
              <span>X</span>
              <span>2</span>
            </div>
          </div>
          
          {/* Lista de jogos */}
          <div>
            {league.matches.map((match) => (
              <div 
                key={match.fixture.id}
                onClick={() => navigate(generateMatchUrl(match))}
                className="grid grid-cols-[auto,auto,1fr,auto,auto,auto] items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 cursor-pointer"
              >
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-gray-300 hover:text-amber-400" />
                </div>
                
                <div className="text-sm text-gray-500 dark:text-gray-400 min-w-[40px] text-center">
                  {renderElapsedTime(match)}
                </div>
                
                <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
                  <div className="flex items-center gap-2 justify-end">
                    <div className="text-right font-medium dark:text-white truncate">{match.teams.home.name}</div>
                    <CachedImage
                      src={match.teams.home.logo}
                      alt={match.teams.home.name}
                      className="w-5 h-5 object-contain"
                      fallbackSize="sm"
                    />
                  </div>
                  
                  <div className="font-bold flex justify-center min-w-[40px]">
                    {match.goals.home ?? '-'} - {match.goals.away ?? '-'}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CachedImage
                      src={match.teams.away.logo}
                      alt={match.teams.away.name}
                      className="w-5 h-5 object-contain"
                      fallbackSize="sm"
                    />
                    <div className="font-medium dark:text-white truncate">{match.teams.away.name}</div>
                  </div>
                </div>
                
                <div className="text-gray-500 dark:text-gray-400 flex items-center">
                  {renderStat(match)}
                </div>
                
                <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                  <span className="text-white text-xs">!</span>
                </div>
                
                {renderOdds(match)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MatchGrid; 