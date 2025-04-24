# Gerenciador de Ligas Esportivas

Sistema para visualização de ligas esportivas, times e estatísticas.

## Funcionalidades

- Visualização de ligas disponíveis
- Filtragem por país e busca de ligas
- Visualização de classificação
- Lista de times por liga
- Estatísticas da liga
- Próximos jogos

## ⚠️ Importante: Configuração da API-Football

Este projeto utiliza a API-Football para obter dados de futebol em tempo real. É necessário ter uma chave de API válida.

### Obtendo uma chave API

1. Acesse [API-Football](https://www.api-football.com/) e crie uma conta
2. Após o registro, obtenha sua chave API no painel de controle
3. Configure a chave no arquivo `.env` conforme explicado abaixo

### Configurando a API-Football

Você precisa configurar a chave da API em um arquivo `.env` na raiz do projeto:

```
VITE_API_SPORTS_KEY=sua_chave_api_aqui
```

### Limites da API

A API-Football possui diferentes planos com limites de requisições:
- Plano gratuito: 100 requisições por dia
- Planos pagos: limites maiores conforme o plano contratado

Fique atento ao consumo para evitar atingir o limite diário.

## Funcionalidades integradas com a API-Football

A aplicação utiliza os seguintes endpoints da API-Football:

| Funcionalidade | Endpoint API-Football |
|----------------|------------------------|
| Lista de ligas | `/leagues` |
| Detalhes da liga | `/leagues?id={id}` |
| Times da liga | `/teams?league={id}&season={year}` |
| Classificação | `/standings?league={id}&season={year}` |
| Próximos jogos | `/fixtures?league={id}&season={year}&from={date}&to={date}` |
| Estatísticas | Calculado com base em `/fixtures?league={id}&season={year}&status=FT` |

## Tratamento de erros

A aplicação está configurada para exibir mensagens de erro quando não conseguir se conectar à API-Football ou quando a API retornar um código de status que não seja de sucesso.

### Verificação do Status da API

A aplicação inclui um componente de verificação que mostra o status da API no canto inferior direito da tela. Isso facilita a identificação de problemas na conexão com o servidor.

## Instalação e Execução

```bash
# Instalar dependências
npm install

# Executar em modo de desenvolvimento
npm run dev

# Construir para produção
npm run build

# Executar testes
npm test
```

## Estrutura de dados

A aplicação trabalha com os seguintes tipos de dados, mapeados a partir das respostas da API-Football:

### Liga (League)

```typescript
{
  id: string;
  name: string;
  season: string;
  teams: Team[];
  matches: Match[];
  startDate: string;
  endDate: string;
}
```

### Time (Team)

```typescript
{
  id: string;
  name: string;
  logo?: string;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}
```

### Partida (Match)

```typescript
{
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  homeScore?: number;
  awayScore?: number;
  status: 'scheduled' | 'in_progress' | 'completed';
}
```

### Estatísticas (LeagueStats)

```typescript
{
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
``` 