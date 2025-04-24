/**
 * Utilitário para verificar a disponibilidade da API e fornecer informações de depuração
 */
const API_KEY = import.meta.env.VITE_API_SPORTS_KEY;
const API_FOOTBALL_URL = 'https://v3.football.api-sports.io';

export const apiChecker = {
  async checkApiStatus(): Promise<{ 
    isAvailable: boolean; 
    message: string;
    details?: string;
  }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout
      
      const response = await fetch(`${API_FOOTBALL_URL}/leagues?season=2025`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': 'v3.football.api-sports.io'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.errors && Object.keys(data.errors).length > 0) {
          return {
            isAvailable: false,
            message: 'API-Football retornou erro',
            details: Object.values(data.errors).join(', ')
          };
        }
        
        return {
          isAvailable: true,
          message: 'API-Football está funcionando corretamente',
          details: `Encontradas ${data.results || 0} ligas`
        };
      } else {
        return {
          isAvailable: false,
          message: 'API-Football retornou erro',
          details: `Status: ${response.status} - ${response.statusText}`
        };
      }
    } catch (error) {
      // Verificar se é um erro de timeout
      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          isAvailable: false,
          message: 'API-Football não respondeu no tempo esperado',
          details: 'Timeout após 5 segundos'
        };
      }
      
      // Erro comum de conexão recusada
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          isAvailable: false,
          message: 'Não foi possível conectar ao servidor da API-Football',
          details: 'Verifique sua conexão com a internet'
        };
      }
      
      return {
        isAvailable: false,
        message: 'Erro ao verificar a API-Football',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  },
  
  getApiUrl(): string {
    return API_FOOTBALL_URL;
  }
}; 