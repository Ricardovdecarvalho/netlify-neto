import React from 'react';
import { Link } from 'react-router-dom';
import { apiChecker } from '../utils/apiChecker';

interface ApiErrorPageProps {
  error: Error;
  resetError?: () => void;
}

export default function ApiErrorPage({ error, resetError }: ApiErrorPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-3xl w-full bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100">
            <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Problema de conexão com a API</h1>
          <p className="mt-2 text-gray-600">{error.message}</p>
        </div>

        <div className="mt-6 border-t border-gray-200 pt-6">
          <h2 className="text-lg font-medium text-gray-900">Soluções possíveis:</h2>
          <ul className="mt-3 list-disc pl-5 space-y-2 text-gray-600">
            <li>Verifique se o servidor da API está em execução no endereço correto</li>
            <li>Confirme se a porta e o caminho da API estão configurados corretamente</li>
            <li>Verifique se há firewalls ou proxies bloqueando a conexão</li>
            <li>Se você é desenvolvedor, verifique o console para mais detalhes</li>
          </ul>
        </div>

        <div className="mt-6 border-t border-gray-200 pt-6">
          <h2 className="text-lg font-medium text-gray-900">Informações para diagnóstico:</h2>
          <div className="mt-3 bg-gray-50 p-4 rounded text-sm font-mono overflow-x-auto">
            <p>URL da API: {apiChecker.getApiUrl()}</p>
            <p>Erro: {error.name} - {error.message}</p>
            {error.stack && (
              <details className="mt-2">
                <summary className="cursor-pointer">Stack trace</summary>
                <pre className="mt-2 whitespace-pre-wrap">{error.stack}</pre>
              </details>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={resetError} 
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Tentar novamente
          </button>
          
          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3 bg-white text-blue-600 font-medium rounded-md border border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
} 