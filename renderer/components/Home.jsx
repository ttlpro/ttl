import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const { t, i18n } = useTranslation('common');

  useEffect(() => {
    console.log('Home component rendered with language:', i18n.language);
    console.log('Translation for home.welcome:', t('home.welcome'));
  }, [i18n.language, t]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{t('home.welcome')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">{t('accounts.title')}</h2>
          <p className="text-gray-600 dark:text-gray-300">{t('accounts.description')}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">{t('rooms.title')}</h2>
          <p className="text-gray-600 dark:text-gray-300">{t('rooms.description')}</p>
        </div>
      </div>
    </div>
  );
};

export default Home; 