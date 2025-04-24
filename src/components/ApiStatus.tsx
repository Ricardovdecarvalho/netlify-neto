import { useState, useEffect } from 'react';
import { apiChecker } from '../utils/apiChecker';

export default function ApiStatus() {
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState({
    isAvailable: false,
    message: 'Verificando status da API...',
    details: '',
  });

  const checkStatus = async () => {
    try {
      const result = await apiChecker.checkApiStatus();
      setStatus({
        isAvailable: result.isAvailable,
        message: result.message,
        details: result.details || '',
      });
    } catch (error) {
      setStatus({
        isAvailable: false,
        message: 'Erro ao verificar API',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  };

  useEffect(() => {
    checkStatus();

    // Verificar status a cada 5 minutos
    const intervalId = setInterval(checkStatus, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Este componente agora não exibe nada na tela
  // mas continua verificando o status da API em segundo plano
  return null;
} 