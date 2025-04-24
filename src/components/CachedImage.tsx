import React, { useState, useEffect } from 'react';
import { Loader2, ImageOff } from 'lucide-react';
import { isValidUrl } from '../utils/validation';

interface CachedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSize?: 'sm' | 'md' | 'lg';
}

// Cache simples usando Map
const imageCache = new Map<string, string>();
const loadingImages = new Map<string, Promise<string>>();
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const MAX_CONCURRENT_LOADS = 5;
let currentLoads = 0;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const loadQueue: (() => Promise<void>)[] = [];

const processQueue = async () => {
  if (loadQueue.length === 0 || currentLoads >= MAX_CONCURRENT_LOADS) return;
  
  while (loadQueue.length > 0 && currentLoads < MAX_CONCURRENT_LOADS) {
    const nextLoad = loadQueue.shift();
    if (nextLoad) {
      currentLoads++;
      try {
        await nextLoad();
      } finally {
        currentLoads--;
        processQueue();
      }
    }
  }
};

const CachedImage: React.FC<CachedImageProps> = ({ 
  src, 
  alt, 
  className,
  fallbackSize = 'md'
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const getFallbackSize = () => {
    switch (fallbackSize) {
      case 'sm': return 'w-4 h-4';
      case 'lg': return 'w-8 h-8';
      default: return 'w-6 h-6';
    }
  };

  const loadImage = async (url: string): Promise<string> => {
    // Verifica se já existe uma promessa em andamento
    let loadingPromise = loadingImages.get(url);
    if (loadingPromise) {
      return loadingPromise;
    }

    loadingPromise = new Promise<string>(async (resolve, reject) => {
      const loadWithRetry = async (retries: number = MAX_RETRIES): Promise<void> => {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';

          const loadPromise = new Promise<void>((resolveLoad, rejectLoad) => {
            img.onload = () => resolveLoad();
            img.onerror = () => rejectLoad(new Error('Falha ao carregar imagem'));
          });

          img.src = url;
          await loadPromise;
          resolve(url);
        } catch (error) {
          if (retries > 0) {
            console.log(`Tentativa ${MAX_RETRIES - retries + 1} de carregar ${url}. Aguardando ${RETRY_DELAY}ms...`);
            await wait(RETRY_DELAY);
            return loadWithRetry(retries - 1);
          }
          throw error;
        }
      };

      try {
        await loadWithRetry();
      } catch (error) {
        reject(error);
      } finally {
        loadingImages.delete(url);
      }
    });

    loadingImages.set(url, loadingPromise);
    return loadingPromise;
  };

  useEffect(() => {
    if (!src) {
      setError(true);
      setLoading(false);
      return;
    }

    const cachedImage = imageCache.get(src);
    let mounted = true;

    const fetchImage = async () => {
      try {
        if (cachedImage) {
          setImageSrc(cachedImage);
          setLoading(false);
          setError(false);
        } else {
          // Adiciona à fila de carregamento
          const loadTask = async () => {
            try {
              const imageUrl = await loadImage(src);
              if (mounted) {
                setImageSrc(imageUrl);
                imageCache.set(src, imageUrl);
                setLoading(false);
                setError(false);
              }
            } catch (err) {
              console.error('Erro ao carregar imagem:', err);
              if (mounted) {
                setError(true);
                setLoading(false);
              }
            }
          };

          loadQueue.push(loadTask);
          processQueue();
        }
      } catch (err) {
        console.error('Erro ao carregar imagem:', err);
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    fetchImage();
    
    return () => {
      mounted = false;
    };
  }, [src]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-50/50 dark:bg-gray-800/50 rounded-lg ${className}`}>
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !imageSrc) {
    return (
      <div className={`flex items-center justify-center bg-gray-50/50 dark:bg-gray-800/50 rounded-lg ${className}`}>
        <ImageOff className={`${getFallbackSize()} text-gray-400`} />
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      loading="lazy"
      crossOrigin="anonymous"
      onError={() => setError(true)}
    />
  );
};

export default CachedImage;