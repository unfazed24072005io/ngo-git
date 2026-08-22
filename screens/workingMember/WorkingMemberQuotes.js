// screens/workingMember/WorkingMemberQuotes.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Share,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db, getAuthInstance } from '../../config/firebase';

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDoc,
  setDoc,
  doc
} from 'firebase/firestore';
import { Fonts } from '../../config/fonts';
import { useLanguage } from '../../context/LanguageContext';

const { width } = Dimensions.get('window');

export default function WorkingMemberQuotes({ navigation }) {
  const { t, counter } = useLanguage();
  
  // Force re-render when language changes
  const renderKey = `working-quotes-${counter}`;

  // Get translations - EVERY SINGLE TEXT STRING is mapped to a translation key
  const translations = {
    // Common
    error: t('common.error') || 'Error',
    loading: t('common.loading') || 'Loading...',
    nA: t('common.nA') || 'N/A',
    close: t('common.close') || 'Close',
    
    // Header
    dailyQuotes: t('quotes.dailyQuotes') || 'Daily Quotes',
    
    // Header Info
    dailyInspiration: t('quotes.dailyInspiration') || '✨ Daily Inspiration',
    shareQuotesSubtext: t('quotes.shareQuotesSubtext') || 'Share these quotes with your friends and family',
    
    // Quote Card
    unknown: t('common.unknown') || 'Unknown',
    showLess: t('common.showLess') || 'Show less',
    readMore: t('common.readMore') || 'Read more',
    valid: t('quotes.valid') || 'Valid',
    share: t('common.share') || 'Share',
    shareTitle: t('quotes.shareTitle') || 'Inspirational Quote',
    shareMessage: t('quotes.shareMessage') || '"{text}"\n— {author}\n\nShared from NGO App 💫',
    
    // Empty State
    noQuotes: t('quotes.noQuotes') || 'No quotes available',
    noQuotesSubtext: t('quotes.noQuotesSubtext') || 'Check back later for inspiring quotes',
    
    // Loading
    loadingQuotes: t('quotes.loading') || 'Loading quotes...',
    
    // Alert
    failedToShare: t('quotes.failedToShare') || 'Failed to share quote',
  };

  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);

  useEffect(() => {
    setupRealtimeListener();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const auth = getAuthInstance();

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfilePhoto(data.profilePhoto || null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const setupRealtimeListener = () => {
    const now = new Date();
    const q = query(
      collection(db, 'quotes'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const quotesList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const startDate = data.startDate?.toDate?.() || new Date(data.startDate);
        const endDate = data.endDate?.toDate?.() || new Date(data.endDate);
        const isValid = now >= startDate && now <= endDate;
        
        if (isValid) {
          quotesList.push({ 
            id: doc.id, 
            ...data,
            startDate,
            endDate
          });
        }
      });
      setQuotes(quotesList);
      setLoading(false);
    });

    return () => unsubscribe();
  };

  const handleShare = async (quote) => {
    try {
      const author = quote.author || translations.unknown;
      const message = translations.shareMessage
        .replace('{text}', quote.text)
        .replace('{author}', author);
      
      await Share.share({
        message: message,
        title: translations.shareTitle,
      });
    } catch (error) {
      console.error('Error sharing quote:', error);
      Alert.alert(translations.error, translations.failedToShare);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const QuoteCard = ({ quote }) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <View style={styles.quoteCard}>
        <Image source={{ uri: quote.imageUrl }} style={styles.quoteImage} />
        <View style={styles.quoteContent}>
          <Text 
            style={styles.quoteText}
            numberOfLines={expanded ? undefined : 3}
          >
            "{quote.text}"
          </Text>
          {quote.text && quote.text.length > 100 && (
            <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
              <Text style={styles.expandText}>
                {expanded ? translations.showLess : translations.readMore}
              </Text>
            </TouchableOpacity>
          )}
          {quote.author && (
            <Text style={styles.quoteAuthor} numberOfLines={1}>— {quote.author}</Text>
          )}
          <View style={styles.quoteFooter}>
            <View style={styles.dateInfo}>
              <MaterialIcons name="event" size={14} color="#6b7280" />
              <Text style={styles.dateText} numberOfLines={1}>
                {translations.valid}: {formatDate(quote.startDate)} - {formatDate(quote.endDate)}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={() => handleShare(quote)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="share" size={24} color="#8b5cf6" />
              <Text style={styles.shareText}>{translations.share}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer} key={renderKey}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>{translations.loadingQuotes}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} key={renderKey}>
      {/* Purple Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
              <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>{translations.dailyQuotes}</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileIcon}
            onPress={() => navigation.navigate('WorkingMemberProfile')}
            activeOpacity={0.7}
          >
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
            ) : (
              <MaterialIcons name="person" size={28} color="#8b5cf6" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Quotes List */}
      <FlatList
        data={quotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <QuoteCard quote={item} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8b5cf6']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="format-quote" size={44} color="#d1d5db" />
            <Text style={styles.emptyStateText}>{translations.noQuotes}</Text>
            <Text style={styles.emptyStateSubtext}>{translations.noQuotesSubtext}</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerInfo}>
            <Text style={styles.headerInfoText}>{translations.dailyInspiration}</Text>
            <Text style={styles.headerInfoSubtext}>
              {translations.shareQuotesSubtext}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#6b7280',
    marginTop: 10,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Header
  headerCard: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 22,
    color: '#ffffff',
    flexShrink: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
    flexShrink: 0,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },

  headerInfo: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  headerInfoText: {
    fontFamily: Fonts.Bold,
    fontSize: 20,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  headerInfoSubtext: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // List
  listContent: {
    paddingBottom: 20,
  },

  // Quote Card
  quoteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quoteImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    backgroundColor: '#f3f4f6',
  },
  quoteContent: {
    padding: 16,
  },
  quoteText: {
    fontFamily: Fonts.Medium,
    fontSize: 17,
    color: '#1f2937',
    fontStyle: 'italic',
    lineHeight: 26,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  expandText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 13,
    color: '#8b5cf6',
    marginTop: 6,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  quoteAuthor: {
    fontFamily: Fonts.Regular,
    fontSize: 15,
    color: '#6b7280',
    marginTop: 10,
    textAlign: 'right',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  quoteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  dateText: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    flexShrink: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    flexShrink: 0,
  },
  shareText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    color: '#8b5cf6',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 10,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
    color: '#1f2937',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  emptyStateSubtext: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});