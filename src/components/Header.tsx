import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CircleDot, Calendar, Activity, Clock, Moon, Sun, Menu, X, Trophy } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export const Header: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  // Previne o scroll quando o menu está aberto
  React.useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);
  
  // Verifica se está em qualquer página de liga
  const isLeaguePage = () => {
    return location.pathname.startsWith('/leagues');
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-gradient-to-r from-blue-900 to-blue-800 dark:from-gray-900 dark:to-gray-800 text-white shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="relative">
              <CircleDot className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            </div>
            <span className="text-lg sm:text-2xl font-bold tracking-tight">FutNeto</span>
          </Link>

          {/* Menu Mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-blue-700/50"
            aria-label="Menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex items-center space-x-1 overflow-x-auto scrollbar-hide">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors
                ${location.pathname === '/'
                  ? 'bg-blue-700 dark:bg-gray-700 text-white' 
                  : 'hover:bg-blue-700/50 dark:hover:bg-gray-700/50 text-gray-100'}`}
            >
              <CircleDot className="w-5 h-5" />
              <span className="text-sm sm:text-base">Home</span>
            </Link>

            <Link
              to="/jogos-hoje"
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors
                ${location.pathname === '/jogos-hoje'
                  ? 'bg-blue-700 dark:bg-gray-700 text-white' 
                  : 'hover:bg-blue-700/50 dark:hover:bg-gray-700/50 text-gray-100'}`}
            >
              <Clock className="w-5 h-5" />
              <span className="text-sm sm:text-base">Hoje</span>
            </Link>

            <Link
              to="/jogos-ao-vivo"
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors
                ${location.pathname === '/jogos-ao-vivo'
                  ? 'bg-blue-700 dark:bg-gray-700 text-white'
                  : 'hover:bg-blue-700/50 dark:hover:bg-gray-700/50 text-gray-100'}`}
            >
              <div className="relative flex items-center">
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="font-medium">•</span>
              </div>
              <span className="text-sm sm:text-base">Ao Vivo</span>
            </Link>
            
            <Link
              to="/resultados-hoje"
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors
                ${location.pathname === '/resultados-hoje' 
                  ? 'bg-blue-700 dark:bg-gray-700 text-white' 
                  : 'hover:bg-blue-700/50 dark:hover:bg-gray-700/50 text-gray-100'}`}
            >
              <Activity className="w-5 h-5" />
              <span className="text-sm sm:text-base">Resultados</span>
            </Link>

            <Link
              to="/jogos-amanha"
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors
                ${location.pathname === '/jogos-amanha'
                  ? 'bg-blue-700 dark:bg-gray-700 text-white'
                  : 'hover:bg-blue-700/50 dark:hover:bg-gray-700/50 text-gray-100'}`}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-sm sm:text-base">Amanhã</span>
            </Link>

            <Link
              to="/leagues"
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors
                ${isLeaguePage()
                  ? 'bg-blue-700 dark:bg-gray-700 text-white'
                  : 'hover:bg-blue-700/50 dark:hover:bg-gray-700/50 text-gray-100'}`}
            >
              <Trophy className="w-5 h-5" />
              <span className="text-sm sm:text-base">Ligas</span>
            </Link>

            <button
              onClick={toggleTheme}
              className="ml-2 sm:ml-4 p-2 rounded-lg hover:bg-blue-700/50 dark:hover:bg-gray-700/50 transition-colors"
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </nav>

          {/* Mobile Theme Toggle */}
          <div className="flex md:hidden space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-blue-700/50 dark:hover:bg-gray-700/50 transition-colors"
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile Full Screen */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-blue-900 dark:bg-gray-900 flex flex-col pt-16">
          <div className="container mx-auto px-4 py-8">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/"
                className="py-3 px-4 rounded-lg text-white text-lg flex items-center space-x-3"
                onClick={() => setIsMenuOpen(false)}
              >
                <CircleDot className="w-6 h-6" />
                <span>Home</span>
              </Link>
              <Link
                to="/jogos-hoje"
                className="py-3 px-4 rounded-lg text-white text-lg flex items-center space-x-3"
                onClick={() => setIsMenuOpen(false)}
              >
                <Clock className="w-6 h-6" />
                <span>Hoje</span>
              </Link>
              <Link
                to="/jogos-ao-vivo"
                className="py-3 px-4 rounded-lg text-white text-lg flex items-center space-x-3"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="relative flex items-center">
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="font-medium text-xl">•</span>
                </div>
                <span>Ao Vivo</span>
              </Link>
              <Link
                to="/resultados-hoje"
                className="py-3 px-4 rounded-lg text-white text-lg flex items-center space-x-3"
                onClick={() => setIsMenuOpen(false)}
              >
                <Activity className="w-6 h-6" />
                <span>Resultados</span>
              </Link>
              <Link
                to="/jogos-amanha"
                className="py-3 px-4 rounded-lg text-white text-lg flex items-center space-x-3"
                onClick={() => setIsMenuOpen(false)}
              >
                <Calendar className="w-6 h-6" />
                <span>Amanhã</span>
              </Link>
              <Link
                to="/leagues"
                className="py-3 px-4 rounded-lg text-white text-lg flex items-center space-x-3"
                onClick={() => setIsMenuOpen(false)}
              >
                <Trophy className="w-6 h-6" />
                <span>Ligas</span>
              </Link>
            </nav>
            
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-blue-800 dark:hover:bg-gray-800"
              aria-label="Fechar menu"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};