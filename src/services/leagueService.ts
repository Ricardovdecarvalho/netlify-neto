import type { League, Team, Match, LeagueStats, LeagueSummary } from '../types/league';

// Configure a URL base da API aqui
const API_KEY = import.meta.env.VITE_API_SPORTS_KEY;
const API_FOOTBALL_URL = 'https://v3.football.api-sports.io';

// Classe de erro específica para problemas da API
export class ApiError extends Error {
  status: number;
  statusText: string;
  
  constructor(status: number, statusText: string, message?: string) {
    super(message || `Erro na API: ${status} - ${statusText}`);
    this.status = status;
    this.statusText = statusText;
    this.name = 'ApiError';
  }
}

// Função helper para fazer requisições com tratamento de erros consistente
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
    
    const finalOptions = {
      ...options,
      signal: controller.signal,
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
        ...options?.headers
      }
    };
    
    const response = await fetch(`${API_FOOTBALL_URL}${endpoint}`, finalOptions);
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
    }
    
    const data = await response.json();
    
    // API-Football retorna dados na propriedade 'response'
    if (data.errors && Object.keys(data.errors).length > 0) {
      const errorMessage = Object.values(data.errors).join(', ');
      throw new Error(`Erro na API-Football: ${errorMessage}`);
    }
    
    return data.response as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error; // Re-lança erros da API
    }
    
    // Timeout
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('O servidor da API demorou muito para responder. Verifique sua conexão ou tente novamente mais tarde.');
    }
    
    // Erro comum de conexão recusada
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Não foi possível conectar à API-Football. Verifique sua conexão com a internet.`);
    }
    
    // Outros erros
    throw new Error(`Erro ao acessar a API-Football: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Mapeamento de tipos da API-Football para nossos tipos
function mapLeague(league: any): import('../types/league').LeagueSummary {
  return {
    id: String(league.league.id),
    name: league.league.name,
    country: league.country.name,
    season: String(league.seasons[0]?.year || ''),
    logo: league.league.logo
  };
}

function mapTeam(team: any): import('../types/league').Team {
  return {
    id: String(team.team.id),
    name: team.team.name,
    logo: team.team.logo,
    points: team.points || 0,
    wins: team.all?.win || 0,
    draws: team.all?.draw || 0,
    losses: team.all?.lose || 0,
    goalsFor: team.all?.goals?.for || 0,
    goalsAgainst: team.all?.goals?.against || 0
  };
}

function mapMatch(match: any): import('../types/league').Match {
  return {
    id: String(match.fixture.id),
    date: match.fixture.date,
    homeTeam: {
      id: String(match.teams.home.id),
      name: match.teams.home.name,
      logo: match.teams.home.logo,
      points: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0
    },
    awayTeam: {
      id: String(match.teams.away.id),
      name: match.teams.away.name,
      logo: match.teams.away.logo,
      points: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0
    },
    homeScore: match.goals.home,
    awayScore: match.goals.away,
    status: mapStatus(match.fixture.status.short)
  };
}

function mapStatus(status: string): 'scheduled' | 'in_progress' | 'completed' {
  switch (status) {
    case 'NS': return 'scheduled';
    case '1H':
    case 'HT':
    case '2H':
    case 'ET':
    case 'P':
    case 'BT': return 'in_progress';
    case 'FT':
    case 'AET':
    case 'PEN': return 'completed';
    default: return 'scheduled';
  }
}

export const leagueService = {
  async getAllLeagues(): Promise<import('../types/league').LeagueSummary[]> {
    // Buscar as ligas da temporada 2025
    const data = await apiRequest<any[]>(`/leagues?season=2025`);
    
    // Filtrar para garantir que temos apenas ligas de 2025
    const leagues = data
      .filter(league => league.seasons && league.seasons.some((season: {year: number}) => season.year === 2025))
      .map(mapLeague);
    
    // Lista de IDs das principais ligas em ordem de prioridade
    const mainLeagueIds = [
      // Brasileirão - ID do Brasileirão Série A
      '71',  // Brasileiro Série A
      '2',   // UEFA Champions League
      '39',  // Premier League (Inglaterra)
      '140', // La Liga (Espanha)
      '135', // Serie A (Itália)
      '78',  // Bundesliga (Alemanha)
      '61',  // Ligue 1 (França)
      '72',  // Brasileiro Série B
      '13',  // Copa Libertadores
      '14',  // Copa Sudamericana
    ];
    
    // Separar ligas principais das demais
    const mainLeagues: import('../types/league').LeagueSummary[] = [];
    const otherLeagues: import('../types/league').LeagueSummary[] = [];
    
    // Classificar ligas de acordo com a ordem de prioridade
    leagues.forEach(league => {
      const priorityIndex = mainLeagueIds.indexOf(league.id);
      if (priorityIndex !== -1) {
        mainLeagues[priorityIndex] = league;
      } else {
        otherLeagues.push(league);
      }
    });
    
    // Remover posições vazias que podem ocorrer se alguma liga principal não existir
    const filteredMainLeagues = mainLeagues.filter(league => league !== undefined);
    
    // Ordenar as ligas restantes por país e nome
    const sortedOtherLeagues = otherLeagues.sort((a, b) => {
      // Primeiro por país
      if (a.country !== b.country) {
        return a.country.localeCompare(b.country);
      }
      // Depois por nome da liga
      return a.name.localeCompare(b.name);
    });
    
    // Concatenar as ligas principais com as demais
    return [...filteredMainLeagues, ...sortedOtherLeagues];
  },

  async getLeague(id: string): Promise<import('../types/league').League> {
    const data = await apiRequest<any[]>(`/leagues?id=${id}&season=2025`);
    if (!data || data.length === 0) {
      throw new Error('Liga não encontrada');
    }
    
    const leagueData = data[0];
    
    // Encontrar a temporada de 2025
    const season2025 = leagueData.seasons.find((season: {year: number}) => season.year === 2025);
    
    if (!season2025) {
      throw new Error('Liga não encontrada para a temporada 2025');
    }
    
    return {
      id: String(leagueData.league.id),
      name: leagueData.league.name,
      season: '2025',
      teams: [],
      matches: [],
      startDate: season2025.start || new Date().toISOString(),
      endDate: season2025.end || new Date().toISOString()
    };
  },

  async getStandings(leagueId: string): Promise<import('../types/league').Team[]> {
    const data = await apiRequest<any[]>(`/standings?league=${leagueId}&season=2025`);
    if (!data || data.length === 0 || !data[0].league?.standings || data[0].league.standings.length === 0) {
      return [];
    }
    
    // A API pode retornar vários grupos (ex: grupos de Champions League)
    // Por enquanto vamos considerar apenas o primeiro grupo
    const standings = data[0].league.standings[0];
    return standings.map(mapTeam);
  },

  async getUpcomingMatches(leagueId: string): Promise<import('../types/league').Match[]> {
    const today = new Date();
    const in14Days = new Date();
    in14Days.setDate(today.getDate() + 14);
    
    const formattedFrom = today.toISOString().slice(0, 10);
    const formattedTo = in14Days.toISOString().slice(0, 10);
    
    const data = await apiRequest<any[]>(`/fixtures?league=${leagueId}&season=2025&from=${formattedFrom}&to=${formattedTo}`);
    return data.map(mapMatch);
  },

  async getLeagueStats(leagueId: string): Promise<import('../types/league').LeagueStats> {
    // Usaremos os dados de partidas para calcular estatísticas básicas
    const data = await apiRequest<any[]>(`/fixtures?league=${leagueId}&season=2025&status=FT`);
    
    let totalGoals = 0;
    let totalMatches = data.length;
    
    data.forEach(match => {
      totalGoals += (match.goals.home || 0) + (match.goals.away || 0);
    });
    
    return {
      totalMatches,
      totalGoals,
      averageGoalsPerMatch: totalMatches > 0 ? totalGoals / totalMatches : 0,
      topScorer: {
        player: 'Não disponível',
        goals: 0
      },
      topAssister: {
        player: 'Não disponível',
        assists: 0
      }
    };
  },

  async updateMatchResult(matchId: string, homeScore: number, awayScore: number): Promise<import('../types/league').Match> {
    // Esta operação normalmente requer autenticação adicional
    // ou acesso admin que a API-Football não fornece facilmente
    // Vamos apenas simular o retorno usando os dados fornecidos
    return {
      id: matchId,
      date: new Date().toISOString(),
      homeTeam: {
        id: '0',
        name: 'Time da Casa',
        logo: '',
        points: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0
      },
      awayTeam: {
        id: '0',
        name: 'Time Visitante',
        logo: '',
        points: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0
      },
      homeScore,
      awayScore,
      status: 'completed'
    };
  },

  async getTeamsByLeague(leagueId: string): Promise<import('../types/league').Team[]> {
    const data = await apiRequest<any[]>(`/teams?league=${leagueId}&season=2025`);
    
    return data.map(item => ({
      id: String(item.team.id),
      name: item.team.name,
      logo: item.team.logo,
      points: 0, // Estas informações precisam ser preenchidas com dados da tabela
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0
    }));
  },
  
  getBaseUrl() {
    return API_FOOTBALL_URL;
  },

  async getTeamDetails(teamId: string): Promise<import('../types/league').Team> {
    const data = await apiRequest<any>(`/teams?id=${teamId}`);
    
    if (!data || data.length === 0) {
      throw new Error('Time não encontrado');
    }

    const teamData = data[0].team;
    const statistics = data[0].statistics?.[0]?.statistics || [];

    // Mapear estatísticas para o formato correto
    const stats = statistics.reduce((acc: any, stat: any) => {
      acc[stat.type] = stat.value;
      return acc;
    }, {});

    return {
      id: String(teamData.id),
      name: teamData.name,
      logo: teamData.logo,
      founded: teamData.founded,
      points: stats.points || 0,
      wins: stats.wins || 0,
      draws: stats.draws || 0,
      losses: stats.losses || 0,
      goalsFor: stats.goals?.for || 0,
      goalsAgainst: stats.goals?.against || 0,
      squad: teamData.squad?.map((player: any) => ({
        id: String(player.id),
        name: player.name,
        position: player.position,
        number: player.number,
        photo: player.photo
      }))
    };
  },

  async getTeamLastMatches(teamId: string): Promise<import('../types/league').Match[]> {
    const data = await apiRequest<any[]>(`/fixtures?team=${teamId}&season=2025&status=FT&last=5`);
    return data.map(mapMatch);
  },

  async getTeamUpcomingMatches(teamId: string): Promise<import('../types/league').Match[]> {
    const today = new Date();
    const in14Days = new Date();
    in14Days.setDate(today.getDate() + 14);
    
    const formattedFrom = today.toISOString().slice(0, 10);
    const formattedTo = in14Days.toISOString().slice(0, 10);
    
    const data = await apiRequest<any[]>(`/fixtures?team=${teamId}&season=2025&from=${formattedFrom}&to=${formattedTo}&status=NS`);
    return data.map(mapMatch);
  },

  async getTeamLeagues(teamId: string): Promise<import('../types/league').LeagueSummary[]> {
    const data = await apiRequest<any[]>(`/leagues?team=${teamId}&season=2025`);
    return data.map(mapLeague);
  },
}; 