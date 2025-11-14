import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

const NotFoundPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-center px-4">
      <h1 className="text-6xl font-extrabold text-primary-600 dark:text-primary-400">404</h1>
      <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">{t('notFound.title')}</h2>
      <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
        {t('notFound.message')}
      </p>
      <div className="mt-10">
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {t('notFound.goHome')}
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
