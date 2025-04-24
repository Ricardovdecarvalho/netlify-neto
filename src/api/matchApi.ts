import express from 'express';
import cors from 'cors';
import { getMatchDetails, getMatchesByDate, getLiveMatches } from '../services/api';
import { broadcastService } from '../services/matchBroadcastService';

const app = express();

// Habilita CORS para permitir requisições do sistema PHP
app.use(cors());

// Endpoint para listar jogos do dia
app.get('/api/matches/today', async (req, res) => {
  try {
    const matches = await getMatchesByDate(new Date());
    res.json({ success: true, data: matches });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno'
    });
  }
});

// Endpoint para jogos ao vivo
app.get('/api/matches/live', async (req, res) => {
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
app.get('/api/matches/:id', async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const matchDetails = await getMatchDetails(matchId);
    
    // Busca informações de transmissão
    const broadcast = await broadcastService.findBroadcastInfo(
      matchDetails.teams.home.name,
      matchDetails.teams.away.name
    );
    
    res.json({ 
      success: true, 
      data: {
        ...matchDetails,
        broadcast
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno'
    });
  }
});

// Endpoint para o componente React da página de detalhes
app.get('/api/matches/:id/component', async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const matchDetails = await getMatchDetails(matchId);
    
    // Retorna os dados necessários para renderizar o componente
    res.json({
      success: true,
      data: {
        match: matchDetails,
        component: {
          name: 'MatchDetailsPage',
          props: { matchId }
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno'
    });
  }
});

export const matchApi = app;