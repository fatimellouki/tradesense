import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import fr from './locales/fr.json';
import en from './locales/en.json';
import ar from './locales/ar.json';

// Get stored language or default to French
const storedLanguage = typeof window !== 'undefined'
  ? localStorage.getItem('ui-storage')
  : null;

let defaultLanguage = 'fr';
if (storedLanguage) {
  try {
    const parsed = JSON.parse(storedLanguage);
    if (parsed.state?.language) {
      defaultLanguage = parsed.state.language;
    }
  } catch {
    // Use default
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      ar: { translation: ar }
    },
    lng: defaultLanguage,
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false // React already escapes values
    },
    // RTL support for Arabic
    react: {
      useSuspense: false
    }
  });

// Function to change language and update document direction
export const changeLanguage = (lang: string) => {
  i18n.changeLanguage(lang);

  // Update document direction for RTL languages (Arabic)
  if (lang === 'ar') {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  } else {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = lang;
  }
};

// Initialize direction on load
if (typeof window !== 'undefined') {
  if (defaultLanguage === 'ar') {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }
}

export default i18n;
