// screens/workingMember/WorkingMemberMemberDetail.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, FlatList, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db, getAuthInstance } from '../../config/firebase';

import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Fonts } from '../../config/fonts';
import { useLanguage } from '../../context/LanguageContext';

export default function WorkingMemberMemberDetail({ navigation, route }) {
  const { t, counter } = useLanguage();
  
  // Force re-render when language changes
  const renderKey = `working-member-detail-${counter}`;

  // Get translations - EVERY SINGLE TEXT STRING is mapped to a translation key
  const translations = {
    // Common
    error: t('common.error') || 'Error',
    loading: t('common.loading') || 'Loading...',
    nA: t('common.nA') || 'N/A',
    close: t('common.close') || 'Close',
    cancel: t('common.cancel') || 'Cancel',
    
    // Header
    memberDetails: t('member.details') || 'Member Details',
    
    // Profile
    unknown: t('common.unknown') || 'Unknown',
    pending: t('common.pending') || 'Pending',
    active: t('common.active') || 'Active',
    inactive: t('common.inactive') || 'Inactive',
    
    // Donation Section
    donationSummary: t('donation.donationSummary') || 'Donation Summary',
    totalDonations: t('finances.totalDonations') || 'Total Donations',
    numberOfDonations: t('donation.numberOfDonations') || 'Number of Donations',
    recentDonations: t('donation.recentDonations') || 'Recent Donations',
    moreDonations: '+{count} more donations',
    completed: t('finances.completed') || 'completed',
    
    // Contact Section
    contactInformation: 'Contact Information',
    email: t('common.email') || 'Email',
    phone: t('common.phone') || 'Phone',
    gender: t('auth.gender') || 'Gender',
    
    // Address Section
    addressInformation: 'Address Information',
    address: t('common.address') || 'Address',
    cityState: 'City / State',
    pincode: 'Pincode',
    notProvided: t('common.notProvided') || 'Not provided',
    
    // Documents Section
    documents: t('company.documents') || 'Documents',
    aadharFront: t('auth.aadharFront') || 'Aadhar Card (Front)',
    aadharBack: t('auth.aadharBack') || 'Aadhar Card (Back)',
    panCard: t('auth.panCard') || 'PAN Card',
    signature: t('auth.signature') || 'Signature',
    notUploaded: '- Not uploaded',
    
    // Commission Section
    commissionInformation: t('commission.management') || 'Commission Information',
    commissionEarned: t('commission.totalEarned') || 'Commission Earned',
    registeredOn: t('common.registeredOn') || 'Registered On',
    registeredAt: t('common.registeredAt') || 'Registered At',
    
    // Loading
    loadingDetails: 'Loading member details...',
    memberNotFound: 'Member not found',
    memberIdNotFound: 'Member ID not found',
    failedToLoad: t('common.failedToLoad') || 'Failed to load member details',
    
    // Status
    statusLabel: t('common.status') || 'Status',
    viewDocument: 'View document',
  };

  const { memberId } = route.params || {};
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [donations, setDonations] = useState([]);
  const [totalDonations, setTotalDonations] = useState(0);

  useEffect(() => {
    fetchMemberDetails();
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

  const fetchMemberDetails = async () => {
    try {
      if (!memberId) {
        Alert.alert(translations.error, translations.memberIdNotFound);
        navigation.goBack();
        return;
      }

      const docRef = doc(db, 'registeredMembers', memberId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const memberData = { id: docSnap.id, ...docSnap.data() };
        setMember(memberData);
        
        if (memberData.memberId) {
          await fetchMemberDonations(memberData.memberId);
        }
      } else {
        Alert.alert(translations.error, translations.memberNotFound);
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching member:', error);
      Alert.alert(translations.error, translations.failedToLoad);
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberDonations = async (userId) => {
    try {
      const q = query(
        collection(db, 'donations'),
        where('memberId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const donationsList = [];
      let total = 0;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        donationsList.push({ id: doc.id, ...data });
        total += data.amount || 0;
      });
      
      donationsList.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return 0;
      });
      
      setDonations(donationsList);
      setTotalDonations(total);
    } catch (error) {
      console.error('Error fetching donations:', error);
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'active': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'inactive': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch(status?.toLowerCase()) {
      case 'active': return translations.active;
      case 'pending': return translations.pending;
      case 'inactive': return translations.inactive;
      default: return status || translations.pending;
    }
  };

  const renderProfileSection = () => (
    <View style={styles.profileSection}>
      <View style={styles.avatarContainer}>
        {member?.profilePhoto ? (
          <Image source={{ uri: member.profilePhoto }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <MaterialIcons name="person" size={54} color="#8b5cf6" />
          </View>
        )}
      </View>
      <Text style={styles.memberName}>{member?.fullName || member?.name || translations.unknown}</Text>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(member?.status) + '15' }]}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(member?.status) }]} />
        <Text style={[styles.statusText, { color: getStatusColor(member?.status) }]}>
          {getStatusLabel(member?.status)}
        </Text>
      </View>
    </View>
  );

  const renderDonationSection = () => (
    <View style={[styles.infoCard, styles.donationCard]}>
      <View style={styles.donationHeader}>
        <MaterialIcons name="volunteer-activism" size={22} color="#8b5cf6" />
        <Text style={styles.infoTitle}>{translations.donationSummary}</Text>
      </View>
      
      <View style={styles.donationStats}>
        <View style={styles.donationStat}>
          <Text style={styles.donationStatLabel}>{translations.totalDonations}</Text>
          <Text style={styles.donationStatValue}>₹{totalDonations.toLocaleString()}</Text>
        </View>
        <View style={styles.donationStat}>
          <Text style={styles.donationStatLabel}>{translations.numberOfDonations}</Text>
          <Text style={styles.donationStatValue}>{donations.length}</Text>
        </View>
      </View>

      {donations.length > 0 && (
        <View style={styles.recentDonations}>
          <Text style={styles.recentDonationsTitle}>{translations.recentDonations}</Text>
          {donations.slice(0, 3).map((donation, index) => (
            <View key={donation.id || index} style={styles.donationItem}>
              <View>
                <Text style={styles.donationItemAmount}>₹{donation.amount}</Text>
                <Text style={styles.donationItemDate}>
                  {donation.createdAt ? new Date(donation.createdAt).toLocaleDateString() : translations.nA}
                </Text>
              </View>
              <View style={[styles.donationStatusBadge, { 
                backgroundColor: donation.status === 'completed' ? '#10b98115' : '#f59e0b15' 
              }]}>
                <Text style={[styles.donationStatusText, { 
                  color: donation.status === 'completed' ? '#10b981' : '#f59e0b' 
                }]}>
                  {donation.status || translations.pending}
                </Text>
              </View>
            </View>
          ))}
          {donations.length > 3 && (
            <Text style={styles.viewAllDonations}>
              {translations.moreDonations.replace('{count}', donations.length - 3)}
            </Text>
          )}
        </View>
      )}
    </View>
  );

  const renderContactSection = () => (
    <View style={styles.infoCard}>
      <Text style={styles.infoTitle}>{translations.contactInformation}</Text>
      
      <View style={styles.infoRow}>
        <MaterialIcons name="email" size={20} color="#6b7280" />
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>{translations.email}</Text>
          <Text style={styles.infoValue}>{member?.email || translations.nA}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <MaterialIcons name="phone" size={20} color="#6b7280" />
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>{translations.phone}</Text>
          <Text style={styles.infoValue}>{member?.phone || translations.nA}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <MaterialIcons name="person" size={20} color="#6b7280" />
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>{translations.gender}</Text>
          <Text style={styles.infoValue}>{member?.gender || translations.nA}</Text>
        </View>
      </View>
    </View>
  );

  const renderAddressSection = () => (
    <View style={styles.infoCard}>
      <Text style={styles.infoTitle}>{translations.addressInformation}</Text>
      
      {member?.address ? (
        <View style={styles.infoRow}>
          <MaterialIcons name="home" size={20} color="#6b7280" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{translations.address}</Text>
            <Text style={styles.infoValue}>{member.address}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.infoRow}>
          <MaterialIcons name="home" size={20} color="#6b7280" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{translations.address}</Text>
            <Text style={[styles.infoValue, { color: '#9ca3af' }]}>{translations.notProvided}</Text>
          </View>
        </View>
      )}

      <View style={styles.infoRow}>
        <MaterialIcons name="location-city" size={20} color="#6b7280" />
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>{translations.cityState}</Text>
          <Text style={styles.infoValue}>
            {[member?.city, member?.state].filter(Boolean).join(', ') || translations.nA}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <MaterialIcons name="pin-drop" size={20} color="#6b7280" />
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>{translations.pincode}</Text>
          <Text style={styles.infoValue}>{member?.pincode || translations.nA}</Text>
        </View>
      </View>
    </View>
  );

  const renderDocumentsSection = () => (
    <View style={styles.infoCard}>
      <Text style={styles.infoTitle}>{translations.documents}</Text>
      
      {member?.aadharFront ? (
        <TouchableOpacity style={styles.documentRow} onPress={() => Alert.alert(translations.aadharFront, translations.viewDocument)} activeOpacity={0.7}>
          <MaterialIcons name="credit-card" size={20} color="#8b5cf6" />
          <Text style={styles.documentText}>{translations.aadharFront}</Text>
          <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>
      ) : (
        <View style={styles.documentRow}>
          <MaterialIcons name="credit-card" size={20} color="#9ca3af" />
          <Text style={[styles.documentText, { color: '#9ca3af' }]}>{translations.aadharFront} {translations.notUploaded}</Text>
        </View>
      )}

      {member?.aadharBack ? (
        <TouchableOpacity style={styles.documentRow} onPress={() => Alert.alert(translations.aadharBack, translations.viewDocument)} activeOpacity={0.7}>
          <MaterialIcons name="credit-card" size={20} color="#8b5cf6" />
          <Text style={styles.documentText}>{translations.aadharBack}</Text>
          <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>
      ) : (
        <View style={styles.documentRow}>
          <MaterialIcons name="credit-card" size={20} color="#9ca3af" />
          <Text style={[styles.documentText, { color: '#9ca3af' }]}>{translations.aadharBack} {translations.notUploaded}</Text>
        </View>
      )}

      {member?.panCard ? (
        <TouchableOpacity style={styles.documentRow} onPress={() => Alert.alert(translations.panCard, translations.viewDocument)} activeOpacity={0.7}>
          <MaterialIcons name="assignment" size={20} color="#8b5cf6" />
          <Text style={styles.documentText}>{translations.panCard}</Text>
          <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>
      ) : (
        <View style={styles.documentRow}>
          <MaterialIcons name="assignment" size={20} color="#9ca3af" />
          <Text style={[styles.documentText, { color: '#9ca3af' }]}>{translations.panCard} {translations.notUploaded}</Text>
        </View>
      )}

      {member?.signature ? (
        <TouchableOpacity style={styles.documentRow} onPress={() => Alert.alert(translations.signature, translations.viewDocument)} activeOpacity={0.7}>
          <MaterialIcons name="edit" size={20} color="#8b5cf6" />
          <Text style={styles.documentText}>{translations.signature}</Text>
          <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>
      ) : (
        <View style={styles.documentRow}>
          <MaterialIcons name="edit" size={20} color="#9ca3af" />
          <Text style={[styles.documentText, { color: '#9ca3af' }]}>{translations.signature} {translations.notUploaded}</Text>
        </View>
      )}
    </View>
  );

  const renderCommissionSection = () => (
    <View style={[styles.infoCard, styles.lastCard]}>
      <Text style={styles.infoTitle}>{translations.commissionInformation}</Text>
      
      <View style={styles.infoRow}>
        <MaterialIcons name="payments" size={20} color="#10b981" />
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>{translations.commissionEarned}</Text>
          <Text style={[styles.infoValue, { color: '#10b981', fontSize: 18, fontFamily: Fonts.Bold }]}>
            ₹{member?.commission || 0}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <MaterialIcons name="calendar-today" size={20} color="#6b7280" />
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>{translations.registeredOn}</Text>
          <Text style={styles.infoValue}>
            {member?.createdAt ? new Date(member.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }) : translations.nA}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <MaterialIcons name="access-time" size={20} color="#6b7280" />
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>{translations.registeredAt}</Text>
          <Text style={styles.infoValue}>
            {member?.createdAt ? new Date(member.createdAt).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit'
            }) : translations.nA}
          </Text>
        </View>
      </View>
    </View>
  );

  const sections = [
    { id: 'profile', component: renderProfileSection },
    { id: 'donation', component: renderDonationSection },
    { id: 'contact', component: renderContactSection },
    { id: 'address', component: renderAddressSection },
    { id: 'documents', component: renderDocumentsSection },
    { id: 'commission', component: renderCommissionSection },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer} key={renderKey}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>{translations.loadingDetails}</Text>
      </View>
    );
  }

  if (!member) {
    return (
      <View style={styles.loadingContainer} key={renderKey}>
        <MaterialIcons name="person-off" size={60} color="#d1d5db" />
        <Text style={styles.loadingText}>{translations.memberNotFound}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} key={renderKey}>
      <View style={styles.container}>
        {/* Purple Header Card - Fixed at top */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{translations.memberDetails}</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileIcon}
              onPress={() => navigation.navigate('WorkingMemberProfile')}
              activeOpacity={0.7}
            >
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
              ) : (
                <MaterialIcons name="person" size={26} color="#8b5cf6" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* FlatList - Same pattern as ECommerce */}
        <FlatList
          data={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => item.component()}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
          ListFooterComponent={<View style={styles.bottomPadding} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    gap: 12,
  },
  loadingText: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Purple Header Card
  headerCard: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
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
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 20,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },

  // FlatList Content
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },

  // Profile Section
  profileSection: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberName: {
    fontFamily: Fonts.Bold,
    fontSize: 22,
    color: '#1f2937',
    marginBottom: 6,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Donation Card
  donationCard: {
    borderColor: '#8b5cf6',
    borderWidth: 1,
    backgroundColor: '#faf5ff',
  },
  donationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  donationStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3e8ff',
    marginBottom: 12,
  },
  donationStat: {
    alignItems: 'center',
  },
  donationStatLabel: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  donationStatValue: {
    fontFamily: Fonts.Bold,
    fontSize: 18,
    color: '#8b5cf6',
    marginTop: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  recentDonations: {
    marginTop: 4,
  },
  recentDonationsTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  donationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3e8ff',
  },
  donationItemAmount: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  donationItemDate: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  donationStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  donationStatusText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 10,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  viewAllDonations: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#8b5cf6',
    textAlign: 'center',
    marginTop: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Info Cards
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  lastCard: {
    marginBottom: 0,
  },
  infoTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  infoValue: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#1f2937',
    marginTop: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Documents
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  documentText: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  bottomPadding: {
    height: 20,
  },
});