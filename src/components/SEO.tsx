import React from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
}

export const SEO: React.FC<SEOProps> = ({ title, description }) => {
  const location = useLocation();
  const baseUrl = 'https://jogosnatv.com.br';
  const currentUrl = `${baseUrl}${location.pathname}`;

  const getDefaultTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Jogos na TV';
      case '/jogos-hoje':
        return 'Jogos de hoje na TV';
      case '/jogos-amanha':
        return 'Jogos de amanhã na TV';
      case '/jogos-ao-vivo':
        return 'Jogos ao vivo na TV';
      case '/resultados-hoje':
        return 'Resultado de jogos';
      default:
        return 'Jogos na TV';
    }
  };

  const getDefaultDescription = () => {
    switch (location.pathname) {
      case '/':
        return 'Onde assistir jogos de futebol';
      case '/jogos-hoje':
        return 'Onde assistir futebol hoje';
      case '/jogos-amanha':
        return 'Onde assistir futebol amanhã';
      case '/jogos-ao-vivo':
        return 'Onde assistir jogos ao vivo';
      case '/resultados-hoje':
        return 'Resultados de jogos de hoje';
      default:
        return 'Onde assistir jogos de futebol ao vivo na TV';
    }
  };

  const finalTitle = `${title || getDefaultTitle()} - Futneto`;
  const finalDescription = description || getDefaultDescription();

  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      
      <link rel="canonical" href={currentUrl} />
    </Helmet>
  );
};