import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LoadingSpinner = ({ message, delay = 100 }) => {
  const { t } = useTranslation('common');
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Add a small delay before showing the spinner to avoid flashing
    const timer = setTimeout(() => {
      setShow(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!show) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-opacity duration-200 ease-in-out opacity-0 animate-fadeIn">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          {message || t('common.loading')}
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner; 