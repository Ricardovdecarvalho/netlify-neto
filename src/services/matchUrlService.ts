interface MatchUrlCache {
  [key: string]: number;
}

class MatchUrlService {
  private static instance: MatchUrlService;
  private cache: MatchUrlCache = {};

  private constructor() {}

  public static getInstance(): MatchUrlService {
    if (!MatchUrlService.instance) {
      MatchUrlService.instance = new MatchUrlService();
    }
    return MatchUrlService.instance;
  }

  public generateMatchUrl(league: string, homeTeam: string, awayTeam: string, date: string, matchId: number): string {
    const urlKey = this.generateUrlKey(league, homeTeam, awayTeam, date);
    this.cache[urlKey] = matchId;
    return `/jogo/${urlKey}`;
  }

  public getMatchId(urlKey: string): number | null {
    return this.cache[urlKey] || null;
  }

  private generateUrlKey(league: string, homeTeam: string, awayTeam: string, date: string): string {
    const sanitize = (text: string) => text.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `${sanitize(league)}/${sanitize(homeTeam)}-vs-${sanitize(awayTeam)}-${date}`;
  }
}

export const matchUrlService = MatchUrlService.getInstance();