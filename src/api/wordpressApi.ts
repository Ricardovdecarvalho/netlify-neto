import express, { Request, Response } from 'express';
import cors from 'cors';
import { getMatchDetails, getMatchesByDate, getLiveMatches } from '../services/api';
// import { guiaJogosService } from '../services/guiaJogosService'; // Comentado

const app = express();

// Habilita CORS para permitir requisições do WordPress
app.use(cors());

// Endpoint para listar todos os jogos (hoje)
app.get('/api/wp/matches', async (req: Request, res: Response) => {
  try {
    // Busca jogos do scraping (com transmissões) - Comentado
    // const guiaMatches = await guiaJogosService.getMatches();
    
    // Busca jogos da API de futebol
    const apiMatches = await getMatchesByDate(new Date());
    
    res.json({
      success: true,
      data: {
        // guiaMatches, // Comentado
        apiMatches
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno'
    });
  }
});

// Endpoint para jogos ao vivo
app.get('/api/wp/matches/live', async (req: Request, res: Response) => {
  try {
    const matches = await getLiveMatches();
    res.json({ success: true, data: matches });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno'
    });
  }
});

// Endpoint para detalhes de uma partida específica
app.get('/api/wp/matches/:id', async (req: Request, res: Response) => {
  try {
    // Valida se req.params.id existe e é uma string válida para parseInt
    if (!req.params.id || isNaN(parseInt(req.params.id))) {
      return res.status(400).json({ success: false, error: 'ID da partida inválido' });
    }
    const matchId = parseInt(req.params.id);
    const matchDetails = await getMatchDetails(matchId);
    
    // Busca os jogos do scraping para encontrar a transmissão - Comentado
    // const guiaMatches = await guiaJogosService.getMatches();
    // const matchWithBroadcast = guiaMatches.find(m => m.matchId === matchId);

    // Verifica se matchDetails foi encontrado
    if (!matchDetails) {
      return res.status(404).json({ success: false, error: 'Detalhes da partida não encontrados' });
    }
    
    res.json({
      success: true,
      data: {
        ...matchDetails,
        // broadcast: matchWithBroadcast?.transmissao || null // Comentado
      }
    });
  } catch (error) {
    // Tratamento de erro aprimorado
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    const statusCode = (error as any).status || 500; // Tenta obter status do erro, senão 500
    console.error(`Erro ao buscar detalhes da partida ${req.params.id}:`, error);
    res.status(statusCode).json({
      success: false,
      error: message
    });
  }
});

/* Endpoint para buscar apenas as transmissões - Comentado
app.get('/api/wp/broadcasts', async (req: Request, res: Response) => {
  try {
    const matches: any[] = []; // Retorna vazio pois serviço está comentado
    const broadcasts = matches.map(match => ({
      id: match.matchId,
      home_team: match.time_casa,
      away_team: match.time_visitante,
      broadcast: match.transmissao,
      stadium: match.estadio,
      status: match.status,
      is_live: match.ao_vivo,
      match_time: match.tempo_jogo,
      score: {
        home: match.placar_casa,
        away: match.placar_visitante
      }
    }));
    
    res.json({ success: true, data: broadcasts });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno'
    });
  }
});
*/

export const wordpressApi = app;