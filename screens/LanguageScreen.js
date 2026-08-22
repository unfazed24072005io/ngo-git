import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { Fonts } from '../config/fonts';

export default function LanguageScreen({ navigation }) {
  const { currentLanguage, changeLanguage, isHindi } = useLanguage();

  const handleLanguageSelect = async (lang) => {
    if (lang !== currentLanguage) {
      await changeLanguage(lang);
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Language</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Choose your preferred language</Text>

        <TouchableOpacity
          style={[
            styles.languageCard,
            currentLanguage === 'en' && styles.languageCardSelected,
          ]}
          onPress={() => handleLanguageSelect('en')}
          activeOpacity={0.7}
        >
          <View style={styles.languageInfo}>
            <Text style={styles.flag}>🇬🇧</Text>
            <View style={styles.languageTexts}>
              <Text style={styles.languageName}>English</Text>
              <Text style={styles.languageNativeName}>English</Text>
            </View>
          </View>
          {currentLanguage === 'en' && (
            <View style={styles.checkmark}>
              <MaterialIcons name="check-circle" size={28} color="#FF7722" />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.languageCard,
            currentLanguage === 'hi' && styles.languageCardSelected,
          ]}
          onPress={() => handleLanguageSelect('hi')}
          activeOpacity={0.7}
        >
          <View style={styles.languageInfo}>
            <Text style={styles.flag}>🇮🇳</Text>
            <View style={styles.languageTexts}>
              <Text style={styles.languageName}>Hindi</Text>
              <Text style={styles.languageNativeName}>हिंदी</Text>
            </View>
          </View>
          {currentLanguage === 'hi' && (
            <View style={styles.checkmark}>
              <MaterialIcons name="check-circle" size={28} color="#FF7722" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 20,
    color: '#1f2937',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  languageCardSelected: {
    borderColor: '#FF7722',
    backgroundColor: '#FFF5EB',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    fontSize: 32,
    marginRight: 16,
  },
  languageTexts: {
    flexDirection: 'column',
  },
  languageName: {
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
    color: '#1f2937',
  },
  languageNativeName: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  checkmark: {
    marginLeft: 8,
  },
});