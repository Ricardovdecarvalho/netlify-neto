import { Link, useLocation, useParams } from 'react-router-dom';

export default function LeagueNavigation() {
  const location = useLocation();
  const { leagueId } = useParams<{ leagueId: string }>();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow mb-8 mt-16">
      <div className="container mx-auto px-4">
        <div className="flex space-x-8">
          <Link
            to={`/leagues/${leagueId}/standings`}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              isActive(`/leagues/${leagueId}/standings`)
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Classificação
          </Link>
          <Link
            to={`/leagues/${leagueId}/teams`}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              isActive(`/leagues/${leagueId}/teams`)
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Times
          </Link>
          <Link
            to={`/leagues/${leagueId}/matches`}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              isActive(`/leagues/${leagueId}/matches`)
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Próximos Jogos
          </Link>
          <Link
            to={`/leagues/${leagueId}/stats`}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              isActive(`/leagues/${leagueId}/stats`)
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Estatísticas
          </Link>
        </div>
      </div>
    </nav>
  );
} 