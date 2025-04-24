import axios from 'axios';
import type { Match, MatchDetails } from '../types/api';
import addDays from 'date-fns/addDays';
import format from 'date-fns/format';
import { utcToZonedTime } from 'date-fns-tz';

const api = axios.create({
  baseURL: 'https://v3.football.api-sports.io',
  headers: {
    'x-apisports-key': import.meta.env.VITE_API_SPORTS_KEY,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  timeout: 10000, // 10 second timeout
  validateStatus: status => status >= 200 && status < 300
});

const cleanData = <T>(data: T): T => {
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error('Erro ao limpar dados:', error instanceof Error ? error.message : 'Erro desconhecido');
    return data;
  }
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second initial delay
const RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504];
const NETWORK_ERROR_CODES = ['ECONNABORTED', 'ETIMEDOUT', 'ERR_NETWORK'];

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryApiCall = async <T>(
  apiCall: Promise<any>,
  retries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T[]> => {
  try {
    const response = await apiCall;
    return response?.data?.response || [];
  } catch (error) {
    if (retries > 0 && axios.isAxiosError(error) && (
        !error.response || 
        RETRY_STATUS_CODES.includes(error.response.status) ||
        NETWORK_ERROR_CODES.includes(error.code || '')
    )) {
      console.log(`Tentativa ${MAX_RETRIES - retries + 1} de ${MAX_RETRIES}...`);
      await wait(delay);
      return retryApiCall(apiCall, retries - 1, Math.min(delay * 1.5, 5000)); // Exponential backoff with 5s cap
    }
    throw error;
  }
};

const safeApiCall = async <T>(
  apiCall: Promise<any>,
  errorMessage: string = 'Erro na chamada da API'
): Promise<T[]> => {
  try {
    const data = await retryApiCall<T>(apiCall);
    return cleanData(data);
  } catch (error) {
    let errorMsg = 'Não foi possível carregar os dados. Tente novamente mais tarde.';
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Handle rate limiting separately to avoid retries
        if (error.response.status === 429) {
          errorMsg = 'Limite de requisições atingido. Tente novamente em alguns minutos.';
        } else if (error.response.status >= 500) {
          errorMsg = 'O servidor está temporariamente indisponível. Tente novamente mais tarde.';
        } else {
          errorMsg = 'Não foi possível carregar os dados. Tente novamente mais tarde.';
        }
      } else if (error.request) {
        errorMsg = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else {
        // Erro na configuração da requisição
        errorMsg = error.message;
      }
    } else {
      errorMsg = error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
    }
    console.error(`${errorMessage}: ${errorMsg}`);
    return [];
  }
};

const getFormattedDate = (date: Date): string => {
  // Converte a data para o fuso horário de São Paulo
  const spDate = utcToZonedTime(date, 'America/Sao_Paulo');
  return format(spDate, 'yyyy-MM-dd');
};

export const getMatchesByDate = async (date: Date): Promise<Match[]> => {
  const formattedDate = getFormattedDate(date);
  const matches = await safeApiCall<Match[]>(
    api.get('/fixtures', { 
      params: { 
        date: formattedDate,
        timezone: 'America/Sao_Paulo'
      } 
    }),
    'Erro ao buscar partidas'
  );
  return matches || [];
};

export const getLiveMatches = async (): Promise<Match[]> => {
  const matches = await safeApiCall<Match[]>(
    api.get('/fixtures', { 
      params: { 
        live: 'all',
        timezone: 'America/Sao_Paulo'
      } 
    }),
    'Erro ao buscar partidas ao vivo'
  );
  return matches || [];
};

export const getFinishedMatches = async (): Promise<Match[]> => {
  const today = new Date();
  const formattedDate = getFormattedDate(today);
  const matches = await safeApiCall<Match[]>(
    api.get('/fixtures', { 
      params: { 
        date: formattedDate,
        status: 'FT,AET,PEN',
        timezone: 'America/Sao_Paulo'
      } 
    }),
    'Erro ao buscar partidas finalizadas'
  );
  return matches || [];
};

export const getTomorrowMatches = async (): Promise<Match[]> => {
  const tomorrow = addDays(new Date(), 1);
  const formattedDate = getFormattedDate(tomorrow);
  const matches = await safeApiCall<Match[]>(
    api.get('/fixtures', { 
      params: { 
        date: formattedDate,
        timezone: 'America/Sao_Paulo'
      } 
    }),
    'Erro ao buscar partidas de amanhã'
  );
  return matches || [];
};

export const getMatchDetails = async (fixtureId: number): Promise<MatchDetails> => {
  try {
    const [
      fixtureResponse,
      lineupResponse,
      statsResponse,
      eventsResponse,
      predictionsResponse,
      oddsResponse
    ] = await Promise.allSettled([
      safeApiCall(
        api.get('/fixtures', { 
          params: { 
            id: fixtureId,
            timezone: 'America/Sao_Paulo'
          } 
        }),
        'Erro ao buscar dados da partida'
      ),
      safeApiCall(
        api.get('/fixtures/lineups', { params: { fixture: fixtureId } }),
        'Erro ao buscar escalações'
      ),
      safeApiCall(
        api.get('/fixtures/statistics', { params: { fixture: fixtureId } }),
        'Erro ao buscar estatísticas'
      ),
      safeApiCall(
        api.get('/fixtures/events', { params: { fixture: fixtureId } }),
        'Erro ao buscar eventos'
      ),
      safeApiCall(
        api.get('/predictions', { params: { fixture: fixtureId } }),
        'Erro ao buscar previsões'
      ),
      safeApiCall(
        api.get('/odds', { params: { fixture: fixtureId } }),
        'Erro ao buscar odds'
      )
    ]);

    // Handle the main fixture data first
    if (fixtureResponse.status === 'rejected') {
      throw new Error('Não foi possível carregar os dados da partida');
    }

    const fixture = fixtureResponse.value[0];
    if (!fixture) {
      throw new Error('Partida não encontrada');
    }

    const matchDetails: MatchDetails = {
      ...fixture,
      lineups: lineupResponse.status === 'fulfilled' ? lineupResponse.value : [],
      statistics: statsResponse.status === 'fulfilled' ? statsResponse.value : [],
      events: eventsResponse.status === 'fulfilled' ? eventsResponse.value : [],
      predictions: predictionsResponse.status === 'fulfilled' ? predictionsResponse.value[0] : null,
      odds: oddsResponse.status === 'fulfilled' ? oddsResponse.value[0] : null
    };

    return cleanData(matchDetails);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao buscar detalhes da partida:', errorMsg);
    throw new Error('Erro ao carregar os detalhes da partida. Por favor, tente novamente mais tarde.');
  }
};