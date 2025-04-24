export interface Player {
  id: string;
  name: string;
  position: string;
  number: number;
  photo: string;
}

export interface Team {
  id: string;
  name: string;
  logo?: string;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  founded?: string;
  squad?: Player[];
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  homeScore?: number;
  awayScore?: number;
  status: 'scheduled' | 'in_progress' | 'completed';
}

export interface LeagueSummary {
  id: string;
  name: string;
  country: string;
  logo?: string;
  season: string;
}

export interface League {
  id: string;
  name: string;
  season: string;
  teams: Team[];
  matches: Match[];
  startDate: string;
  endDate: string;
}

export interface LeagueStats {
  totalMatches: number;
  totalGoals: number;
  averageGoalsPerMatch: number;
  topScorer: {
    player: string;
    goals: number;
  };
  topAssister: {
    player: string;
    assists: number;
  };
} 