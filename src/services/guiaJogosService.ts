import axios from 'axios';
import * as cheerio from 'cheerio';
import { getMatchesByDate, getTomorrowMatches } from './api';
import { Match } from '../types/api';
import { matchUrlService } from './matchUrlService';
import format from 'date-fns/format';

export interface GuiaJogosMatch {
  id: string;
  campeonato: string;
  time_casa: string;
  time_visitante: string;
  logo_time_casa: string;
  logo_time_visitante: string;
  placar_casa: string;
  placar_visitante: string;
  status: string;
  ao_vivo: boolean;
  tempo_jogo: string;
  estadio: string;
  transmissao: string;
  data: string;
  eventos: Array<{
    tempo: string;
    tipo: string;
    jogador: string;
    logo_time: string;
  }>;
  matchId?: number;
  matchUrl?: string;
}

class GuiaJogosService {
  private static instance: GuiaJogosService;
  private readonly baseUrl = 'https://guiadejogos.com';
  private cache: {
    lastUpdate: number;
    data: GuiaJogosMatch[];
  } | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  private constructor() {}

  public static getInstance(): GuiaJogosService {
    if (!GuiaJogosService.instance) {
      GuiaJogosService.instance = new GuiaJogosService();
    }
    return GuiaJogosService.instance;
  }

  private normalizeStadiumName(name: string): string {
    if (!name) return '';
    
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .replace(/estadio|arena|stadium|estádio/g, '')
      .trim();
  }

  private normalizeName(name: string): string {
    if (!name) return '';

    // Remove caracteres especiais e converte para minúsculas
    let normalized = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim();

    // Mapeamento de variações de nomes de times
    const teamVariations: { [key: string]: string[] } = {
      'vasco': ['vasco', 'vascodagama', 'vascao'],
      'flamengo': ['flamengo', 'mengao', 'fla'],
      'fluminense': ['fluminense', 'flu', 'fluzao'],
      'botafogo': ['botafogo', 'fogao', 'bota'],
      'palmeiras': ['palmeiras', 'palestra', 'verdao'],
      'corinthians': ['corinthians', 'timao', 'coringao'],
      'saopaulo': ['saopaulo', 'tricolor', 'spfc'],
      'santos': ['santos', 'peixe'],
      'internacional': ['internacional', 'inter'],
      'gremio': ['gremio', 'imortal'],
      'cruzeiro': ['cruzeiro', 'cru', 'raposa'],
      'atleticomg': ['atleticomg', 'galo', 'atleticomineiro'],
      'atleticopr': ['atleticopr', 'furacao', 'cap'],
      'bahia': ['bahia', 'tricolordaco'],
      'vitoria': ['vitoria', 'leaodabarra'],
      'sport': ['sport', 'leaodailha'],
      'fortaleza': ['fortaleza', 'leaodopici'],
      'ceara': ['ceara', 'vozao'],
      'juventude': ['juventude', 'juve'],
      'goias': ['goias', 'verdao'],
      'coritiba': ['coritiba', 'coxa'],
      'americamg': ['americamg', 'coelho'],
      'realmadrid': ['real', 'realmadrid'],
      'barcelona': ['barcelona', 'barca'],
      'atleticomadrid': ['atletico', 'atleticomadrid'],
      'liverpool': ['liverpool', 'reds'],
      'manchestercity': ['city', 'manchestercity'],
      'manchesterunited': ['united', 'manchesterunited'],
      'chelsea': ['chelsea', 'blues'],
      'arsenal': ['arsenal', 'gunners'],
      'tottenham': ['tottenham', 'spurs'],
      'juventus': ['juventus', 'juve'],
      'milan': ['milan', 'acmilan'],
      'inter': ['inter', 'intermilao'],
      'roma': ['roma', 'asroma'],
      'napoli': ['napoli', 'naples'],
      'benfica': ['benfica', 'slbenfica'],
      'porto': ['porto', 'fcporto'],
      'sporting': ['sporting', 'sportingcp'],
      'psg': ['psg', 'parissaintgermain'],
      'lyon': ['lyon', 'olympiquelyon'],
      'marseille': ['marseille', 'olympiquemarseille']
    };

    // Procura por variações conhecidas
    for (const [standardName, variations] of Object.entries(teamVariations)) {
      if (variations.some(v => normalized.includes(v))) {
        return standardName;
      }
    }

    // Se não encontrou nas variações, retorna o nome normalizado
    return normalized;
  }

  private async correlateWithApiMatches(guiaMatches: GuiaJogosMatch[]): Promise<GuiaJogosMatch[]> {
    try {
      if (!Array.isArray(guiaMatches)) {
        console.error('guiaMatches não é um array:', guiaMatches);
        return [];
      }

      // Busca jogos de hoje e amanhã da API
      const [todayMatches, tomorrowMatches] = await Promise.all([
        getMatchesByDate(new Date()),
        getTomorrowMatches()
      ]);

      // Combina os jogos de hoje e amanhã
      const allApiMatches = [...todayMatches, ...tomorrowMatches];
      
      return guiaMatches.map(guiaMatch => {
        try {
          // Primeiro tenta correlacionar pelo estádio se houver
          if (guiaMatch.estadio) {
            const stadiumMatch = allApiMatches.find(match => {
              if (!match.fixture?.venue?.name) return false;
              
              const guiaStadium = this.normalizeStadiumName(guiaMatch.estadio);
              const apiStadium = this.normalizeStadiumName(match.fixture.venue.name);
              
              return guiaStadium === apiStadium || 
                     guiaStadium.includes(apiStadium) || 
                     apiStadium.includes(guiaStadium);
            });

            if (stadiumMatch) {
              const matchUrl = matchUrlService.generateMatchUrl(
                stadiumMatch.league.name,
                stadiumMatch.teams.home.name,
                stadiumMatch.teams.away.name,
                format(new Date(stadiumMatch.fixture.date), 'dd-MM-yyyy'),
                stadiumMatch.fixture.id
              );

              return {
                ...guiaMatch,
                matchId: stadiumMatch.fixture.id,
                matchUrl
              };
            }
          }

          // Se não encontrou pelo estádio, tenta pelos nomes dos times
          const normalizedHomeTeam = this.normalizeName(guiaMatch.time_casa);
          const normalizedAwayTeam = this.normalizeName(guiaMatch.time_visitante);
          
          const teamMatch = allApiMatches.find(match => {
            if (!match.teams?.home?.name || !match.teams?.away?.name) return false;
            
            const apiHomeTeam = this.normalizeName(match.teams.home.name);
            const apiAwayTeam = this.normalizeName(match.teams.away.name);
            
            // Verifica correspondência exata ou parcial
            return (
              // Correspondência exata
              (normalizedHomeTeam === apiHomeTeam && normalizedAwayTeam === apiAwayTeam) ||
              (normalizedHomeTeam === apiAwayTeam && normalizedAwayTeam === apiHomeTeam) ||
              // Correspondência parcial
              ((normalizedHomeTeam.includes(apiHomeTeam) || apiHomeTeam.includes(normalizedHomeTeam)) &&
               (normalizedAwayTeam.includes(apiAwayTeam) || apiAwayTeam.includes(normalizedAwayTeam)))
            );
          });

          if (teamMatch) {
            const matchUrl = matchUrlService.generateMatchUrl(
              teamMatch.league.name,
              teamMatch.teams.home.name,
              teamMatch.teams.away.name,
              format(new Date(teamMatch.fixture.date), 'dd-MM-yyyy'),
              teamMatch.fixture.id
            );

            return {
              ...guiaMatch,
              matchId: teamMatch.fixture.id,
              matchUrl
            };
          }

          return guiaMatch;
        } catch (error) {
          console.error('Erro ao correlacionar partida específica:', error);
          return guiaMatch;
        }
      });
    } catch (error) {
      console.error('Erro ao correlacionar partidas:', error);
      return guiaMatches;
    }
  }

  private async getPageContent(): Promise<string | null> {
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(this.baseUrl)}`;
      const response = await axios.get(proxyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao acessar o site:', error);
      return null;
    }
  }

  private buildImageUrl(src: string | undefined): string {
    if (!src) return '';
    
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }

    const cleanSrc = src.startsWith('/') ? src.slice(1) : src;
    return `${this.baseUrl}/${cleanSrc}`;
  }

  private parseCard($: cheerio.CheerioAPI, card: cheerio.Element): GuiaJogosMatch {
    const $card = $(card);
    const cardId = $card.attr('id')?.replace('partida-', '') || '';
    
    const championship = $card.find('h3.championship-name').text().trim();
    
    const teamA = $card.find('.team-a');
    const teamB = $card.find('.team-b');
    
    const logoHomeSrc = teamA.find('img.team-logo').attr('src');
    const logoAwaySrc = teamB.find('img.team-logo').attr('src');

    const match: GuiaJogosMatch = {
      id: cardId,
      campeonato: championship,
      time_casa: teamA.find('.team-name').text().trim(),
      time_visitante: teamB.find('.team-name').text().trim(),
      logo_time_casa: this.buildImageUrl(logoHomeSrc),
      logo_time_visitante: this.buildImageUrl(logoAwaySrc),
      placar_casa: teamA.find('.score').text().trim(),
      placar_visitante: teamB.find('.score').text().trim(),
      status: '',
      ao_vivo: false,
      tempo_jogo: '',
      estadio: '',
      transmissao: '',
      data: '',
      eventos: []
    };

    const gameTime = $card.find('.game-time span').text().trim();
    match.status = gameTime;
    match.ao_vivo = gameTime.toUpperCase().includes('AO VIVO');
    match.tempo_jogo = match.ao_vivo ? gameTime.replace('AO VIVO', '').trim() : '';

    const stadium = $card.find('p').filter((_, el) => $(el).text().includes('Estádio:')).text();
    match.estadio = stadium.replace('Estádio:', '').trim();

    const detailsId = `details-${cardId}`;
    const transmission = $card.find(`#${detailsId} p`).text();
    match.transmissao = transmission.replace('Transmissão:', '').trim();

    const eventos = $card.find('.eventos .evento-partida').map((_, evento) => {
      const $evento = $(evento);
      const logoSrc = $evento.find('img.logo-time').attr('src');
      return {
        tempo: $evento.find('.texto-evento strong').text().trim(),
        tipo: $evento.find('.icone-evento').text().trim(),
        jogador: $evento.find('.nome-jogador').text().trim(),
        logo_time: this.buildImageUrl(logoSrc)
      };
    }).get();

    match.eventos = eventos;

    return match;
  }

  private async scrapeMatches(): Promise<GuiaJogosMatch[]> {
    const content = await this.getPageContent();
    if (!content) return [];

    const $ = cheerio.load(content);
    const matches: GuiaJogosMatch[] = [];

    $('h2').each((_, heading) => {
      const headingText = $(heading).text().trim();
      const parts = headingText.split(' - ');
      const date = parts[1]?.trim() || headingText;

      let sibling = heading.next;
      while (sibling && sibling.tagName !== 'h2') {
        if (sibling.tagName === 'div' && $(sibling).hasClass('card')) {
          const match = this.parseCard($, sibling);
          match.data = date;
          matches.push(match);
        }
        sibling = sibling.next;
      }
    });

    return matches;
  }

  public async getMatches(): Promise<GuiaJogosMatch[]> {
    // Retorna imediatamente um array vazio para desabilitar a funcionalidade de transmissão
    return [];

    /* Código original comentado:
    const now = Date.now();

    // Verifica o cache
    if (this.cache && now - this.cache.lastUpdate < this.CACHE_DURATION) {
      console.log('Retornando dados de transmissão do cache (GuiaJogos)');
      return this.cache.data;
    }

    try {
      console.log('Buscando dados de transmissão (GuiaJogos) - scraping...');
      const scrapedMatches = await this.scrapeMatches();
      console.log(`Scraping encontrou ${scrapedMatches.length} jogos.`);

      // Correlaciona com a API e atualiza o cache
      const correlatedMatches = await this.correlateWithApiMatches(scrapedMatches);
      console.log(`Correlação resultou em ${correlatedMatches.length} jogos com ID/URL.`);
      
      this.cache = {
        lastUpdate: now,
        data: correlatedMatches,
      };
      return correlatedMatches;
    } catch (error) {
      console.error('Erro ao buscar ou processar jogos do Guia de Jogos:', error);
      // Em caso de erro, retorna o cache antigo se existir, ou vazio
      return this.cache ? this.cache.data : [];
    }
    */
  }
}

export const guiaJogosService = GuiaJogosService.getInstance();