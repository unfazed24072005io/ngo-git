// screens/workingMember/WorkingMemberIDCard.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator, Share } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db, getAuthInstance } from '../../config/firebase';

import { doc, getDoc } from 'firebase/firestore';
import { Fonts } from '../../config/fonts';
import { useLanguage } from '../../context/LanguageContext';

export default function WorkingMemberIDCard({ navigation }) {
  const { t, counter } = useLanguage();
  
  // Force re-render when language changes
  const renderKey = `working-idcard-${counter}`;

  // Get translations - EVERY SINGLE TEXT STRING is mapped to a translation key
  const translations = {
    // Common
    error: t('common.error') || 'Error',
    loading: t('common.loading') || 'Loading...',
    nA: t('common.nA') || 'N/A',
    active: t('common.active') || 'Active',
    close: t('common.close') || 'Close',
    
    // Header
    myIDCard: t('idcard.myIDCard') || 'My ID Card',
    
    // Card
    workingMember: t('idcard.workingMember') || 'WORKING MEMBER',
    activeBadge: t('idcard.activeBadge') || 'ACTIVE',
    id: t('common.id') || 'ID',
    joined: t('common.joined') || 'Joined',
    validUntil: t('idcard.validUntil') || 'Valid Until',
    ngoApp: t('idcard.ngoApp') || 'NGO App',
    
    // Buttons
    download: t('idcard.download') || 'Download',
    share: t('common.share') || 'Share',
    
    // Info Section
    memberInformation: t('idcard.memberInformation') || 'Member Information',
    fullName: t('auth.fullName') || 'Full Name',
    position: t('employee.position') || 'Position',
    department: t('employee.department') || 'Department',
    email: t('common.email') || 'Email',
    phone: t('common.phone') || 'Phone',
    address: t('common.address') || 'Address',
    employeeId: t('employee.employeeId') || 'Employee ID',
    status: t('common.status') || 'Status',
    
    // Alert
    userNotLoggedIn: t('common.userNotLoggedIn') || 'User not logged in',
    failedToLoad: t('common.failedToLoad') || 'Failed to load ID card',
    failedToShare: t('idcard.failedToShare') || 'Failed to share ID card',
    downloadTitle: t('idcard.downloadTitle') || 'Download',
    downloadMessage: t('idcard.downloadMessage') || 'ID card will be downloaded as image',
    loadingIDCard: t('idcard.loadingIDCard') || 'Loading ID Card...',
    shareTitle: t('idcard.shareTitle') || 'My Working Member ID Card',
    shareMessage: t('idcard.shareMessage') || 
      'Working Member ID Card\n\nName: {name}\nID: {id}\nDepartment: {department}\nPosition: {position}\nEmail: {email}\nPhone: {phone}',
    
    // Working Member
    workingMemberLabel: 'Working Member',
    member: 'Member',
  };

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cardId, setCardId] = useState('');
  const [joinedDate, setJoinedDate] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const auth = getAuthInstance();

    setLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert(translations.error, translations.userNotLoggedIn);
        return;
      }
      
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        setCardId(`WM-${userId.slice(0, 8).toUpperCase()}`);
        setJoinedDate(data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : translations.nA);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert(translations.error, translations.failedToLoad);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareMessage = translations.shareMessage
        .replace('{name}', userData?.fullName || userData?.name || translations.member)
        .replace('{id}', cardId)
        .replace('{department}', userData?.department || translations.nA)
        .replace('{position}', userData?.position || translations.workingMemberLabel)
        .replace('{email}', userData?.email || translations.nA)
        .replace('{phone}', userData?.phone || translations.nA);

      await Share.share({
        message: shareMessage,
        title: translations.shareTitle,
      });
    } catch (error) {
      Alert.alert(translations.error, translations.failedToShare);
    }
  };

  const handleDownload = () => {
    Alert.alert(translations.downloadTitle, translations.downloadMessage);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer} key={renderKey}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>{translations.loadingIDCard}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} key={renderKey}>
      {/* Blue Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{translations.myIDCard}</Text>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton} activeOpacity={0.7}>
            <MaterialIcons name="share" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Card */}
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardLogo}>
                <MaterialIcons name="work" size={24} color="#ffffff" />
              </View>
              <Text style={styles.cardTitle}>{translations.workingMember}</Text>
              <View style={styles.cardBadge}>
                <Text style={styles.cardBadgeText}>{translations.activeBadge}</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.cardAvatarContainer}>
                {userData?.profilePhoto ? (
                  <Image source={{ uri: userData.profilePhoto }} style={styles.cardAvatar} />
                ) : (
                  <View style={styles.cardAvatarPlaceholder}>
                    <MaterialIcons name="person" size={44} color="#3b82f6" />
                  </View>
                )}
              </View>
              <Text style={styles.cardName}>{userData?.fullName || userData?.name || translations.member}</Text>
              <Text style={styles.cardPosition}>{userData?.position || translations.workingMemberLabel}</Text>
              <Text style={styles.cardId}>{translations.id}: {cardId}</Text>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.cardDetail}>
                <MaterialIcons name="business" size={16} color="#6b7280" />
                <Text style={styles.cardDetailText}>{userData?.department || translations.nA}</Text>
              </View>
              <View style={styles.cardDetail}>
                <MaterialIcons name="email" size={16} color="#6b7280" />
                <Text style={styles.cardDetailText}>{userData?.email || translations.nA}</Text>
              </View>
              <View style={styles.cardDetail}>
                <MaterialIcons name="phone" size={16} color="#6b7280" />
                <Text style={styles.cardDetailText}>{userData?.phone || translations.nA}</Text>
              </View>
              <View style={styles.cardDetail}>
                <MaterialIcons name="calendar-today" size={16} color="#6b7280" />
                <Text style={styles.cardDetailText}>{translations.joined}: {joinedDate}</Text>
              </View>
            </View>

            <View style={styles.cardBottom}>
              <Text style={styles.cardBottomText}>{translations.validUntil}: {new Date().getFullYear() + 1}-12-31</Text>
              <Text style={styles.cardBottomText}>•</Text>
              <Text style={styles.cardBottomText}>{translations.ngoApp}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.downloadButton} onPress={handleDownload} activeOpacity={0.7}>
            <MaterialIcons name="download" size={20} color="#ffffff" />
            <Text style={styles.downloadButtonText}>{translations.download}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.printButton} onPress={handleShare} activeOpacity={0.7}>
            <MaterialIcons name="print" size={20} color="#ffffff" />
            <Text style={styles.printButtonText}>{translations.share}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{translations.memberInformation}</Text>
          
          <View style={styles.infoItem}>
            <MaterialIcons name="person" size={18} color="#6b7280" />
            <Text style={styles.infoLabel}>{translations.fullName}</Text>
            <Text style={styles.infoValue}>{userData?.fullName || userData?.name || translations.nA}</Text>
          </View>

          <View style={styles.infoItem}>
            <MaterialIcons name="work" size={18} color="#6b7280" />
            <Text style={styles.infoLabel}>{translations.position}</Text>
            <Text style={styles.infoValue}>{userData?.position || translations.nA}</Text>
          </View>

          <View style={styles.infoItem}>
            <MaterialIcons name="business" size={18} color="#6b7280" />
            <Text style={styles.infoLabel}>{translations.department}</Text>
            <Text style={styles.infoValue}>{userData?.department || translations.nA}</Text>
          </View>

          <View style={styles.infoItem}>
            <MaterialIcons name="email" size={18} color="#6b7280" />
            <Text style={styles.infoLabel}>{translations.email}</Text>
            <Text style={styles.infoValue}>{userData?.email || translations.nA}</Text>
          </View>

          <View style={styles.infoItem}>
            <MaterialIcons name="phone" size={18} color="#6b7280" />
            <Text style={styles.infoLabel}>{translations.phone}</Text>
            <Text style={styles.infoValue}>{userData?.phone || translations.nA}</Text>
          </View>

          <View style={styles.infoItem}>
            <MaterialIcons name="location-on" size={18} color="#6b7280" />
            <Text style={styles.infoLabel}>{translations.address}</Text>
            <Text style={styles.infoValue}>{userData?.address || translations.nA}</Text>
          </View>

          <View style={styles.infoItem}>
            <MaterialIcons name="badge" size={18} color="#6b7280" />
            <Text style={styles.infoLabel}>{translations.employeeId}</Text>
            <Text style={styles.infoValue}>{userData?.employeeId || translations.nA}</Text>
          </View>

          <View style={styles.infoItem}>
            <MaterialIcons name="verified" size={18} color="#6b7280" />
            <Text style={styles.infoLabel}>{translations.status}</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{translations.active}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  // Blue Header
  headerCard: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 20,
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  shareButton: {
    padding: 4,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontFamily: Fonts.Regular,
    marginTop: 10,
    color: '#6b7280',
    fontSize: 14,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  cardContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#3b82f6',
    paddingBottom: 0,
  },
  cardLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontFamily: Fonts.Bold,
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    letterSpacing: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  cardBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  cardBadgeText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: 10,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  cardBody: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
  },
  cardAvatarContainer: {
    marginBottom: 12,
  },
  cardAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#3b82f6',
  },
  cardAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#3b82f6',
  },
  cardName: {
    fontFamily: Fonts.Bold,
    fontSize: 18,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  cardPosition: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  cardId: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  cardFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 6,
  },
  cardDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardDetailText: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  cardBottomText: {
    fontFamily: Fonts.Regular,
    fontSize: 10,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  actionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  downloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  downloadButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: 14,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  printButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  printButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: 14,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  infoTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  infoLabel: {
    fontFamily: Fonts.SemiBold,
    fontSize: 13,
    color: '#6b7280',
    width: 90,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  infoValue: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#1f2937',
    flex: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  statusText: {
    fontFamily: Fonts.SemiBold,
    color: '#10b981',
    fontSize: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});