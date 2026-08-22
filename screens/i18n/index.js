import { translations } from './translations';
import AsyncStorage from '@react-native-async-storage/async-storage';

let currentLanguage = 'en';

export const initLanguage = async () => {
  try {
    const savedLang = await AsyncStorage.getItem('app_language');
    if (savedLang && (savedLang === 'en' || savedLang === 'hi')) {
      currentLanguage = savedLang;
    }
  } catch (error) {
    console.error('Error loading language:', error);
  }
  return currentLanguage;
};

export const getTranslation = (key, params = {}) => {
  const keys = key.split('.');
  let value = translations[currentLanguage];
  
  for (const k of keys) {
    if (value && value[k] !== undefined) {
      value = value[k];
    } else {
      console.warn(`Translation missing: ${key}`);
      // Fallback to English
      let fallback = translations.en;
      for (const fk of keys) {
        if (fallback && fallback[fk] !== undefined) {
          fallback = fallback[fk];
        } else {
          return key;
        }
      }
      value = fallback;
      break;
    }
  }

  // Replace parameters like {{name}}
  if (typeof value === 'string') {
    Object.keys(params).forEach(param => {
      value = value.replace(`{{${param}}}`, params[param]);
    });
  }
  
  return value;
};

export const changeLanguage = async (lang) => {
  if (lang === 'en' || lang === 'hi') {
    currentLanguage = lang;
    await AsyncStorage.setItem('app_language', lang);
    return true;
  }
  return false;
};

export const getCurrentLanguage = () => currentLanguage;

export const useTranslation = () => {
  return {
    t: getTranslation,
    currentLanguage: getCurrentLanguage(),
    changeLanguage: changeLanguage,
    isHindi: currentLanguage === 'hi',
    isEnglish: currentLanguage === 'en'
  };
};