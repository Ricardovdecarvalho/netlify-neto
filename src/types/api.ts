export interface Match {
  fixture: {
    id: number;
    date: string;
    status: {
      long: string;
      short: string;
    };
    venue: {
      name: string;
      city: string;
    };
  };
  teams: {
    home: Team;
    away: Team;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  league: {
    name: string;
    country: string;
    logo: string;
  };
}

export interface Team {
  id: number;
  name: string;
  logo: string;
}

export interface Player {
  id: number;
  name: string;
  number: number;
  pos: string;
  grid: string;
}

export interface Coach {
  id: number;
  name: string;
  photo: string;
}

export interface Lineup {
  team: Team;
  formation: string;
  startXI: { player: Player }[];
  substitutes: { player: Player }[];
  coach: Coach;
}

export interface Statistic {
  team: Team;
  statistics: {
    type: string;
    value: number | string | null;
  }[];
}

export interface Event {
  time: {
    elapsed: number;
    extra?: number | null;
  };
  team: Team;
  player: {
    id: number;
    name: string;
  };
  assist?: {
    id: number;
    name: string;
  };
  type: string;
  detail: string;
}

export interface Predictions {
  predictions: {
    winner: {
      id: number;
      name: string;
      comment: string;
    };
    win_or_draw: boolean;
    under_over: string;
    goals: {
      home: number;
      away: number;
    };
    advice: string;
    percent: {
      home: string;
      draw: string;
      away: string;
    };
  };
}

export interface BetValue {
  value: string;
  odd: string;
  handicap?: string;
  main: boolean;
  suspended: boolean;
}

export interface Bet {
  id: number;
  name: string;
  values: BetValue[];
}

export interface Bookmaker {
  id: number;
  name: string;
  bets: Bet[];
}

export interface Odds {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
  };
  fixture: {
    id: number;
    timezone: string;
    date: string;
    timestamp: number;
  };
  update: string;
  bookmakers: Bookmaker[];
}

export interface MatchDetails extends Match {
  lineups: Lineup[];
  statistics: Statistic[];
  events: Event[];
  predictions: Predictions;
  odds: Odds;
}