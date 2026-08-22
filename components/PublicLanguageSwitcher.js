import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { Fonts } from '../config/fonts';

const PublicLanguageSwitcher = ({ style, onLanguageChange }) => {
  const { currentLanguage, changeLanguage, isHindi, isLoading } = useLanguage();
  const [isChanging, setIsChanging] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleLanguageChange = async (lang) => {
    if (isChanging) return;
    setIsChanging(true);
    try {
      await changeLanguage(lang);
      setShowModal(false);
      if (onLanguageChange) {
        onLanguageChange();
      }
    } catch (error) {
      console.error('Language change error:', error);
    } finally {
      setIsChanging(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="small" color="#FF7722" />
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity 
        style={[styles.container, style]} 
        onPress={() => setShowModal(true)}
        activeOpacity={0.7}
      >
        <MaterialIcons name="translate" size={22} color="#FF7722" />
        <Text style={styles.languageText}>
          {isHindi ? 'हिंदी' : 'English'}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={20} color="#6b7280" />
      </TouchableOpacity>

      {/* Language Selection Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.languageOption, currentLanguage === 'en' && styles.languageOptionActive]}
              onPress={() => handleLanguageChange('en')}
            >
              <Text style={[styles.languageOptionText, currentLanguage === 'en' && styles.languageOptionTextActive]}>
                English
              </Text>
              {currentLanguage === 'en' && (
                <MaterialIcons name="check" size={20} color="#FF7722" />
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.languageOption, currentLanguage === 'hi' && styles.languageOptionActive]}
              onPress={() => handleLanguageChange('hi')}
            >
              <Text style={[styles.languageOptionText, currentLanguage === 'hi' && styles.languageOptionTextActive]}>
                हिंदी (Hindi)
              </Text>
              {currentLanguage === 'hi' && (
                <MaterialIcons name="check" size={20} color="#FF7722" />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 4,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  languageText: {
    fontFamily: Fonts.Medium,
    fontSize: 13,
    color: '#1f2937',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 18,
    color: '#1f2937',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  languageOptionActive: {
    backgroundColor: '#FFF5EB',
  },
  languageOptionText: {
    fontFamily: Fonts.Regular,
    fontSize: 16,
    color: '#4b5563',
  },
  languageOptionTextActive: {
    fontFamily: Fonts.SemiBold,
    color: '#FF7722',
  },
});

export default PublicLanguageSwitcher;