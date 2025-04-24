import React, { useState } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Home } from './pages/Home';
import { MatchDetailsPage } from './pages/MatchDetails';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SEO } from './components/SEO';
import LeagueNavigation from './components/LeagueNavigation';
import LeagueStandings from './pages/LeagueStandings';
import UpcomingMatches from './pages/UpcomingMatches';
import LeagueStats from './pages/LeagueStats';
import LeagueTeams from './pages/LeagueTeams';
import LeaguesList from './pages/LeaguesList';
import ErrorPage from './pages/ErrorPage';
import ApiStatus from './components/ApiStatus';
import TeamDetails from './pages/TeamDetails';
import Sidebar from './components/Sidebar';
import { Menu, X } from 'lucide-react';

const AppLayout = () => {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const toggleMobileSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col pt-16">
      <SEO />
      <Header />
      <div className="flex flex-grow relative">
        {/* Sidebar para desktop */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Botão de menu para mobile */}
        <button 
          onClick={toggleMobileSidebar}
          className="fixed z-50 md:hidden bottom-6 left-6 bg-blue-600 dark:bg-blue-700 text-white p-3 rounded-full shadow-lg"
          aria-label="Menu de ligas"
        >
          {showMobileSidebar ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Sidebar para mobile */}
        <div 
          className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${
            showMobileSidebar ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setShowMobileSidebar(false)}
        />
        <div 
          className={`fixed left-0 top-0 h-full z-50 md:hidden transition-transform duration-300 ease-in-out ${
            showMobileSidebar ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar />
        </div>

        <main className="flex-grow">
          <Outlet />
        </main>
      </div>
      <Footer />
      <ApiStatus />
    </div>
  );
};

// Componente que exibe o menu de navegação de ligas e seus filhos
const LeagueLayout = () => (
  <div>
    <LeagueNavigation />
    <Outlet />
  </div>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: "jogos-hoje",
        element: <Home />
      },
      {
        path: "jogos-ao-vivo",
        element: <Home />
      },
      {
        path: "resultados-hoje",
        element: <Home />
      },
      {
        path: "jogos-amanha",
        element: <Home />
      },
      {
        path: "jogo/:league/:match",
        element: <MatchDetailsPage />
      },
      {
        path: "leagues",
        children: [
          {
            index: true,
            element: <LeaguesList />
          },
          {
            path: ":leagueId",
            element: <LeagueLayout />,
            children: [
              {
                path: "standings",
                element: <LeagueStandings />
              },
              {
                path: "teams",
                element: <LeagueTeams />
              },
              {
                path: "matches",
                element: <UpcomingMatches />
              },
              {
                path: "stats",
                element: <LeagueStats />
              }
            ]
          }
        ]
      },
      {
        path: "team/:id",
        element: <TeamDetails />
      }
    ]
  }
]);

function App() {
  return (
    <HelmetProvider>
      <RouterProvider router={router} />
    </HelmetProvider>
  );
}

export default App;