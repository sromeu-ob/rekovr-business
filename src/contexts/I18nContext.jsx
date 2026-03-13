import React, { createContext, useContext, useState, useCallback } from 'react';
import translations from '../i18n/translations';

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('rekovr_business_language') || 'en';
  });

  const t = useCallback((key) => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  }, [language]);

  const changeLanguage = useCallback((lang) => {
    setLanguage(lang);
    localStorage.setItem('rekovr_business_language', lang);
  }, []);

  return (
    <I18nContext.Provider value={{ language, t, changeLanguage }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}
