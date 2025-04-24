// Traduções para estatísticas
export const translateStatistic = (stat: string): string => {
  const translations: { [key: string]: string } = {
    'Shots on Goal': 'Chutes ao Gol',
    'Shots off Goal': 'Chutes Fora',
    'Total Shots': 'Total de Chutes',
    'Blocked Shots': 'Chutes Bloqueados',
    'Shots insidebox': 'Chutes Dentro da Área',
    'Shots outsidebox': 'Chutes Fora da Área',
    'Fouls': 'Faltas',
    'Corner Kicks': 'Escanteios',
    'Offsides': 'Impedimentos',
    'Ball Possession': 'Posse de Bola',
    'Yellow Cards': 'Cartões Amarelos',
    'Red Cards': 'Cartões Vermelhos',
    'Goalkeeper Saves': 'Defesas do Goleiro',
    'Total passes': 'Total de Passes',
    'Passes accurate': 'Passes Certos',
    'Passes %': 'Precisão de Passes',
  };

  return translations[stat] || stat;
};

// Traduções para status da partida
export const translateMatchStatus = (status: string): string => {
  const translations: { [key: string]: string } = {
    'Match Finished': 'Partida Encerrada',
    'Not Started': 'Não Iniciada',
    'First Half': 'Primeiro Tempo',
    'Second Half': 'Segundo Tempo',
    'Halftime': 'Intervalo',
    'Extra Time': 'Prorrogação',
    'Penalty In Progress': 'Pênaltis em Andamento',
    'Match Suspended': 'Partida Suspensa',
    'Match Postponed': 'Partida Adiada',
    'Match Cancelled': 'Partida Cancelada',
    'Match Abandoned': 'Partida Abandonada',
    'Technical Loss': 'Derrota Técnica',
    'Walkover': 'W.O.',
    'Break Time': 'Intervalo',
    'Interrupted': 'Interrompida',
  };

  return translations[status] || status;
};

// Traduções para posições dos jogadores
export const translatePosition = (position: string): string => {
  const translations: { [key: string]: string } = {
    'G': 'GOL',
    'D': 'DEF',
    'M': 'MEI',
    'F': 'ATA',
  };

  return translations[position] || position;
};