import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from '../i18n';

const LanguageSwitcher = ({ style, textStyle }) => {
  const { currentLanguage, changeLanguage, t } = useTranslation();

  const toggleLanguage = async () => {
    const newLang = currentLanguage === 'en' ? 'hi' : 'en';
    await changeLanguage(newLang);
    // Force re-render (in real app, use state management)
    // For now, we'll use a simple approach
    global.languageChange = !global.languageChange;
  };

  return (
    <TouchableOpacity 
      style={[styles.button, style]} 
      onPress={toggleLanguage}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, textStyle]}>
        {currentLanguage === 'en' ? '🇮🇳 हिंदी' : '🇬🇧 English'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});

export default LanguageSwitcher;