import { useRouteError, Link, isRouteErrorResponse } from "react-router-dom";

export default function ErrorPage() {
  const error = useRouteError();
  
  let errorMessage: string;
  let status: number;
  
  if (isRouteErrorResponse(error)) {
    // Erro de rota (por exemplo, 404)
    status = error.status;
    errorMessage = error.data?.message || error.statusText;
  } else if (error instanceof Error) {
    // Erro de JavaScript
    status = 500;
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    // Mensagem de erro direta
    status = 500;
    errorMessage = error;
  } else {
    // Erro desconhecido
    status = 500;
    errorMessage = 'Ocorreu um erro inesperado';
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="max-w-lg w-full text-center bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
        <div className="text-red-600 dark:text-red-400 text-6xl font-bold mb-4">
          {status}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Oops! {status === 404 ? 'Página não encontrada' : 'Algo deu errado'}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {errorMessage}
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg transition-colors hover:bg-blue-700"
        >
          Voltar para a página inicial
        </Link>
      </div>
    </div>
  );
} 