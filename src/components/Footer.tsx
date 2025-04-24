import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-r from-blue-900 to-blue-800 dark:from-gray-900 dark:to-gray-800 text-white py-4">
      <div className="container mx-auto px-4 sm:px-12 max-w-5xl text-center">
        <p className="text-xs sm:text-sm text-gray-300">
          Todos os direitos reservados FutNeto® Copyright © 2025
        </p>
      </div>
    </footer>
  );
};