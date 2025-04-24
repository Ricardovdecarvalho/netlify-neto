import axios from 'axios';
import * as cheerio from 'cheerio';

interface BroadcastMatch {
  timeA: string;
  timeB: string;
  transmissao: string;
  horario: string;
}

interface BroadcastCache {
  lastUpdate: number;
  data: BroadcastMatch[];
}

class MatchBroadcastService {
  private static instance: MatchBroadcastService;
  private cache: BroadcastCache | null = null;
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutos em milissegundos
  private readonly axiosInstance;

  private constructor() {
    this.axiosInstance = axios.create({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });
  }

  public static getInstance(): MatchBroadcastService {
    if (!MatchBroadcastService.instance) {
      MatchBroadcastService.instance = new MatchBroadcastService();
    }
    return MatchBroadcastService.instance;
  }

  private normalizeName(name: string): string {
    // Primeiro, faz a normalização básica
    let normalized = name
      .replace(/\s+de\s+/g, '') // Remove "de" between words
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

    // Mapeamento de variações comuns de nomes de times
    const teamVariations: { [key: string]: string[] } = {
      // Times espanhóis
      'realmadrid': ['realmadrid', 'real'],
      'barcelona': ['barcelona', 'fcbarcelona', 'barca'],
      'atleticomadrid': ['atleticomadrid', 'atletico', 'atleti'],
      'celtavigo': ['celtavigo', 'celta'],
      'sevilla': ['sevilla', 'sevillafc'],
      'valencia': ['valencia', 'valenciacf'],
      'villarreal': ['villarreal', 'villarrealcf'],
      'athletic': ['athletic', 'athleticbilbao', 'bilbao'],
      'realsociedad': ['realsociedad', 'sociedad'],
      'betis': ['betis', 'realbetis'],
      'espanyol': ['espanyol', 'rcdeespanyol'],
      'getafe': ['getafe', 'getafecf'],
      'osasuna': ['osasuna', 'atleticoosasuna'],
      'mallorca': ['mallorca', 'realmallorca'],
      'girona': ['girona', 'gironafc'],
      'almeria': ['almeria', 'udalmeria'],
      'cadiz': ['cadiz', 'cadizcf'],
      'granada': ['granada', 'granadacf'],
      'laspalmas': ['laspalmas', 'udlaspalmas'],
      'alaves': ['alaves', 'deportivoalaves'],
      // Times brasileiros
      'vasco': ['vascodagama', 'vascodarama', 'vasco'],
      'palmeiras': ['sepalmeiras', 'palmeiras'],
      'corinthians': ['corinthians', 'sccp', 'timao'],
      'saopaulo': ['saopaulo', 'spfc', 'tricolor'],
      'flamengo': ['flamengo', 'mengao', 'crf'],
      'fluminense': ['fluminense', 'flu', 'tricolordaslaranjeiras'],
      'botafogo': ['botafogo', 'botafogorj', 'fogao'],
      'santos': ['santos', 'santosfc'],
      'internacional': ['internacional', 'inter'],
      'gremio': ['gremio', 'gremiopaf'],
      'cruzeiro': ['cruzeiro', 'cru'],
      'atleticomg': ['atleticomg', 'atleticomineiro', 'galo'],
      'atleticopr': ['atleticopr', 'athleticopr', 'furacao'],
      'bahia': ['bahia', 'esquadrao'],
      'vitoria': ['vitoria', 'ecvitoria'],
      'sport': ['sport', 'sportrecife'],
      'fortaleza': ['fortaleza', 'fortaleazec'],
      'ceara': ['ceara', 'cearasc'],
      'juventude': ['juventude', 'juve'],
      'goias': ['goias', 'goiasec'],
      'coritiba': ['coritiba', 'coxa'],
      'americamg': ['americamg', 'americamineiro', 'coelho'],
      'bangu': ['bangu', 'banguac'],
      'volta': ['voltaredonda', 'volta'],
      'madureira': ['madureira', 'madureiraec'],
      'portuguesa': ['portuguesa', 'portuguesarj'],
      'boavista': ['boavista', 'boavistarj'],
      'nova': ['noviguacu', 'nova']
    };

    // Procura por variações conhecidas
    for (const [standardName, variations] of Object.entries(teamVariations)) {
      if (variations.includes(normalized)) {
        return standardName;
      }
    }

    return normalized;
  }

  private cleanTeamName(name: string): string {
    return name
      .replace(/\s+de\s+/g, ' ') // Preserva espaços para legibilidade no log
      .replace(/\s*[Ff]utebol\s*[Cc]lube\b/, '')
      .replace(/\s*[Ee]sporte\s*[Cc]lube\b/, '')
      .replace(/\s*[Ss]port\s*[Cc]lub\b/, '')
      .replace(/\s*[Aa]tlético\s*[Cc]lube\b/, '')
      .replace(/\s*[Aa]ssociação\s*[Dd]esportiva\b/, '')
      .replace(/\s*[Cc]lub\s*[Ff]útbol\b/, '')
      .replace(/\s*[Cc]lub\s*[Dd]eportivo\b/, '')
      .replace(/\s*[Rr]eal\s*[Cc]lub\b/, '')
      .replace(/\s*[Ff]útbol\s*[Cc]lub\b/, '')
      .trim();
  }

  private async scrapePartidas(url: string): Promise<BroadcastMatch[]> {
    try {
      console.log('🔍 Iniciando scraping da URL:', url);
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      
      // Add timeout and retry logic
      const MAX_RETRIES = 3;
      const RETRY_DELAY = 1000;
      
      let lastError;
      for (let i = 0; i < MAX_RETRIES; i++) {
        try {
          const response = await this.axiosInstance.get(proxyUrl, {
            timeout: 5000, // 5 seconds timeout
            headers: {
              // Additional headers to help with CORS
              'Origin': 'null',
              'Referer': 'null'
            }
          });
          
          if (response.data) {
            const html = response.data;
            console.log('📄 HTML recebido:', html.substring(0, 500) + '...');
            const $ = cheerio.load(html);
            const partidas: BroadcastMatch[] = [];

            $('.card').each((i, cardElement) => {
              // Extract team names
              const timeA = this.cleanTeamName($(cardElement).find('.team-a .team-name').text().trim());
              const timeB = this.cleanTeamName($(cardElement).find('.team-b .team-name').text().trim());
              
              // Extract broadcast information
              const detailsDiv = $(cardElement).find('.card-body .details').filter((i, el) => {
                return $(el).find('p').text().includes('Transmissão:');
              });
              
              let transmissao = "Não informado";
              if (detailsDiv.length > 0) {
                const transmissaoText = detailsDiv.find('p').text().trim();
                transmissao = transmissaoText.replace('Transmissão:', '').trim();
              }

              // Extract game time
              let horario = "Não informado";
              const gameTimeElement = $(cardElement).find('.game-time span');
              if (gameTimeElement.length > 0) {
                horario = gameTimeElement.text().trim().replace('(Horário Local)', '').trim();
              }

              if (timeA && timeB) {
                partidas.push({ timeA, timeB, transmissao, horario });
              }
            });

            console.log('📊 Partidas encontradas:', JSON.stringify(partidas, null, 2));
            return partidas;
          }
        } catch (error) {
          lastError = error;
          console.log(`Tentativa ${i + 1} falhou, tentando novamente em ${RETRY_DELAY}ms...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }
      
      throw lastError;
    } catch (error) {
      console.error('❌ Erro durante o scraping:', {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      });
      return [];
    }
  }

  private async updateCache(): Promise<void> {
    try {
      const url = 'https://guiadejogos.com/';
      console.log('🔄 Atualizando cache de transmissões...');
      const partidas = await this.scrapePartidas(url);
      
      this.cache = {
        lastUpdate: Date.now(),
        data: partidas
      };
      console.log('✅ Cache atualizado com sucesso:', {
        lastUpdate: new Date(this.cache.lastUpdate).toLocaleString(),
        totalPartidas: this.cache.data.length
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar cache:', {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  private isCacheValid(): boolean {
    if (!this.cache) return false;
    const now = Date.now();
    return (now - this.cache.lastUpdate) < this.CACHE_DURATION;
  }

  public async findBroadcastInfo(homeTeam: string, awayTeam: string): Promise<string | null> {
    try {
      if (!this.isCacheValid()) {
        await this.updateCache();
      }

      if (!this.cache?.data) return null;

      homeTeam = this.cleanTeamName(homeTeam);
      awayTeam = this.cleanTeamName(awayTeam);

      const normalizedHomeTeam = this.normalizeName(homeTeam);
      const normalizedAwayTeam = this.normalizeName(awayTeam);

      console.log('🔍 Procurando por:', {
        original: { home: homeTeam, away: awayTeam },
        normalized: { home: normalizedHomeTeam, away: normalizedAwayTeam }
      });

      const match = this.cache.data.find(partida => {
        const normalizedTimeA = this.normalizeName(partida.timeA);
        const normalizedTimeB = this.normalizeName(partida.timeB);

        console.log('📊 Comparando com:', {
          timeA: { original: partida.timeA, normalized: normalizedTimeA },
          timeB: { original: partida.timeB, normalized: normalizedTimeB }
        });

        return (
          (normalizedTimeA === normalizedHomeTeam && normalizedTimeB === normalizedAwayTeam) ||
          (normalizedTimeA === normalizedAwayTeam && normalizedTimeB === normalizedHomeTeam)
        );
      });

      if (match) {
        console.log('✅ Match encontrado:', match);
      } else {
        console.log('❌ Nenhum match encontrado para os times');
      }

      return match?.transmissao || null;
    } catch (error) {
      console.error('Erro ao buscar informações de transmissão:', error instanceof Error ? error.message : 'Erro desconhecido');
      return null;
    }
  }
}

export const broadcastService = MatchBroadcastService.getInstance();