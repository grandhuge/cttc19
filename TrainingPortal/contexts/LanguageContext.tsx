
import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { translations } from '../utils/translations';

interface LanguageContextType {
  language: 'en' | 'th';
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'en' | 'th'>(() => {
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem('language');
      if (storedLang === 'th' || storedLang === 'en') {
        return storedLang;
      }
    }
    return 'th'; // Default to Thai
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prevLang => (prevLang === 'en' ? 'th' : 'en'));
  };

  const t = useCallback((key: string): string => {
    const translation = (translations as Record<string, { en: string; th: string }>)[key];
    if (translation) {
      return translation[language];
    }
    console.warn(`Translation key not found: ${key}`);
    return key; // Fallback to the key itself if not found
  }, [language]);


  const value = { language, toggleLanguage, t };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};