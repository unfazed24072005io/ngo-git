import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
  Alert,
  FlatList,
  Image,
  Platform,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db, getAuthInstance } from '../../config/firebase';
import { collection, getDocs, query, where, doc, getDoc, onSnapshot, orderBy, limit, updateDoc } from 'firebase/firestore';
import { Fonts } from '../../config/fonts';
import { useLanguage } from '../../context/LanguageContext';

const { width } = Dimensions.get('window');

export default function AdminDashboard({ navigation }) {
  const { t, counter } = useLanguage();
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalDonations: 0,
    totalOrders: 0,
    totalEvents: 0,
    pendingApprovals: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [recentMembers, setRecentMembers] = useState([]);
  const [recentDonations, setRecentDonations] = useState([]);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [fabModalVisible, setFabModalVisible] = useState(false);
const [pendingRegistrations, setPendingRegistrations] = useState([]);
const [showPendingModal, setShowPendingModal] = useState(false);
const [selectedRegistration, setSelectedRegistration] = useState(null);
  // Force re-render when language changes
  const renderKey = `admin-dash-${counter}`;

  // Get translations
  const getTranslations = () => ({
    welcomeBack: t('admin.welcomeBack') || 'Welcome to Admin Dashboard',
    hi: t('common.hi') || 'Hi',
    members: t('admin.members') || 'Members',
    ecommerce: t('admin.ecommerce') || 'E-Commerce',
    finance: t('admin.finance') || 'Finance',
    events: t('admin.events') || 'Events',
    totalMembers: t('admin.totalMembers') || 'Total Members',
    totalDonations: t('admin.totalDonations') || 'Total Donations',
    totalOrders: t('admin.totalOrders') || 'Total Orders',
    totalEvents: t('admin.totalEvents') || 'Total Events',
    pendingApprovals: t('admin.pendingApprovals') || 'Pending Approvals',
    recentMembers: t('admin.recentMembers') || 'Recent Members',
    recentDonations: t('admin.recentDonations') || 'Recent Donations',
    viewAll: t('common.viewAll') || 'View All',
    noMembers: t('admin.noMembers') || 'No members found',
    noDonations: t('admin.noDonations') || 'No donations found',
    quickActions: t('admin.quickActions') || 'Quick Actions',
    viewNotices: t('admin.viewNotices') || 'View Notices',
    manageNotices: t('admin.manageNotices') || 'Manage all notices',
    viewComplaints: t('admin.viewComplaints') || 'View Complaints',
    manageComplaints: t('admin.manageComplaints') || 'Manage member complaints',
    viewSuggestions: t('admin.viewSuggestions') || 'View Suggestions',
    manageSuggestions: t('admin.manageSuggestions') || 'Manage member suggestions',
    close: t('common.close') || 'Close',
    error: t('common.error') || 'Error',
    failedToLoad: t('admin.failedToLoad') || 'Failed to load dashboard data',
    anonymous: t('common.anonymous') || 'Anonymous',
    unknown: t('common.unknown') || 'Unknown',
    nA: t('common.nA') || 'N/A',
    admin: t('common.admin') || 'Admin',
  });

  const translations = getTranslations();

  useEffect(() => {
    fetchDashboardData();
    fetchAdminName();
    fetchUserProfile();
    fetchRecentData();
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
const fetchPendingRegistrations = async () => {
  try {
    const pendingQuery = query(
      collection(db, 'users'), 
      where('status', '==', 'pending')
    );
    const pendingSnap = await getDocs(pendingQuery);
    const pendingList = [];
    pendingSnap.forEach((doc) => {
      pendingList.push({ id: doc.id, ...doc.data() });
    });
    setPendingRegistrations(pendingList);
  } catch (error) {
    console.error('Error fetching pending registrations:', error);
  }
};
useEffect(() => {
  fetchPendingRegistrations();
}, []);
  const fetchAdminName = async () => {
const auth = getAuthInstance();
    try {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAdminName(docSnap.data().fullName || docSnap.data().name || translations.admin);
        }
      }
    } catch (error) {
      console.error('Error fetching admin name:', error);
    }
  };

  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      const membersSnap = await getDocs(collection(db, 'users'));
      const members = membersSnap.docs.filter(doc => doc.data().role === 'member');
      
      const donationsSnap = await getDocs(collection(db, 'donations'));
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const eventsSnap = await getDocs(collection(db, 'events'));
      const pendingSnap = await getDocs(query(collection(db, 'users'), where('status', '==', 'pending')));

      setStats({
        totalMembers: members.length,
        totalDonations: donationsSnap.size,
        totalOrders: ordersSnap.size,
        totalEvents: eventsSnap.size,
        pendingApprovals: pendingSnap.size,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert(translations.error, translations.failedToLoad);
    } finally {
      setRefreshing(false);
    }
  };
// In AdminDashboard.js

const approveRegistration = async (user) => {
const auth = getAuthInstance();
  try {
    // ✅ Get the correct collection reference
    const userRef = doc(db, 'users', user.id);
    
    await updateDoc(userRef, {
      status: 'active',
      approvedAt: new Date().toISOString(),
      approvedBy: auth.currentUser?.uid,
    });
    
    console.log('✅ Registration approved:', user.fullName || user.name);
    
    // Refresh the lists
    await fetchPendingRegistrations();
    await fetchDashboardData();
    
    // Close modal if no more pending
    if (pendingRegistrations.length <= 1) {
      setShowPendingModal(false);
    }
    
  } catch (error) {
    console.error('Error approving registration:', error);
    // ❌ NO ALERT - Silent fail with console log
  }
};

const rejectRegistration = async (user) => {
const auth = getAuthInstance();
  try {
    // ✅ Get the correct collection reference
    const userRef = doc(db, 'users', user.id);
    
    await updateDoc(userRef, {
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectedBy: auth.currentUser?.uid,
    });
    
    console.log('❌ Registration rejected:', user.fullName || user.name);
    
    // Refresh the lists
    await fetchPendingRegistrations();
    await fetchDashboardData();
    
    // Close modal if no more pending
    if (pendingRegistrations.length <= 1) {
      setShowPendingModal(false);
    }
    
  } catch (error) {
    console.error('Error rejecting registration:', error);
    // ❌ NO ALERT - Silent fail with console log
  }
};
  const fetchRecentData = async () => {
    try {
      const membersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'member')));
      const members = [];
      membersSnap.forEach((doc) => {
        const data = doc.data();
        members.push({ id: doc.id, ...data });
      });
      members.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });
      setRecentMembers(members.slice(0, 5));

      const donationsQuery = query(
        collection(db, 'donations'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const donationsSnap = await getDocs(donationsQuery);
      const donationsList = [];
      donationsSnap.forEach((doc) => {
        donationsList.push({ id: doc.id, ...doc.data() });
      });
      setRecentDonations(donationsList);
    } catch (error) {
      console.error('Error fetching recent data:', error);
    }
  };

  const onRefresh = async () => {
    await fetchDashboardData();
    await fetchRecentData();
  };

  const QuickActionButton = ({ title, icon, onPress }) => (
    <TouchableOpacity style={styles.quickActionButton} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.quickActionIconBg}>
        <MaterialIcons name={icon} size={24} color="#ffffff" />
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  const StatCard = ({ title, value, icon, color, onPress, badge }) => (
  <TouchableOpacity 
    style={[
      styles.statCard, 
      onPress && styles.statCardClickable,
      onPress && badge > 0 && styles.statCardClickableActive
    ]} 
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
    disabled={!onPress}
  >
    <View style={styles.statContent}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
    <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
      <MaterialIcons name={icon} size={20} color={color} />
    </View>
    {badge > 0 && (
      <View style={styles.statBadge}>
        <Text style={styles.statBadgeText}>{badge}</Text>
      </View>
    )}
  </TouchableOpacity>
);

  const RecentMemberItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.recentItem}
      onPress={() => navigation.navigate('Members')}
      activeOpacity={0.7}
    >
      <View style={styles.recentItemLeft}>
        <View style={[styles.recentItemIcon, { backgroundColor: '#FF772215' }]}>
          <MaterialIcons name="person" size={16} color="#FF7722" />
        </View>
        <View>
          <Text style={styles.recentItemTitle}>{item.fullName || item.name || translations.unknown}</Text>
          <Text style={styles.recentItemSubtitle}>{item.email}</Text>
        </View>
      </View>
      <Text style={styles.recentItemDate}>
        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : translations.nA}
      </Text>
    </TouchableOpacity>
  );

  const RecentDonationItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.recentItem}
      onPress={() => navigation.navigate('Finance')}
      activeOpacity={0.7}
    >
      <View style={styles.recentItemLeft}>
        <View style={[styles.recentItemIcon, { backgroundColor: '#ef444415' }]}>
          <MaterialIcons name="favorite" size={16} color="#ef4444" />
        </View>
        <View>
          <Text style={styles.recentItemTitle}>₹{item.amount?.toLocaleString() || 0}</Text>
          <Text style={styles.recentItemSubtitle}>{item.donorName || translations.anonymous}</Text>
        </View>
      </View>
      <Text style={styles.recentItemDate}>
        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : translations.nA}
      </Text>
    </TouchableOpacity>
  );

  const firstName = adminName?.split(' ')[0] || translations.admin;

  return (
    <View style={{ flex: 1 }} key={renderKey}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF7722']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Saffron Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{translations.hi}, {firstName}</Text>
              <Text style={styles.subGreeting}>{translations.welcomeBack}</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileIcon}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.7}
            >
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
              ) : (
                <MaterialIcons name="person" size={30} color="#FF7722" />
              )}
            </TouchableOpacity>
          </View>

          {/* Quick Actions - 4 buttons in a row */}
          <View style={styles.quickActionsRow}>
            <QuickActionButton 
              title={translations.members} 
              icon="people" 
              onPress={() => navigation.navigate('Members')}
            />
            <QuickActionButton 
              title={translations.ecommerce} 
              icon="shopping-cart" 
              onPress={() => navigation.navigate('E-Commerce')}
            />
            <QuickActionButton 
              title={translations.finance} 
              icon="attach-money" 
              onPress={() => navigation.navigate('Finance')}
            />
            <QuickActionButton 
              title={translations.events} 
              icon="event" 
              onPress={() => navigation.navigate('Events')}
            />
          </View>
        </View>

        {/* Stats Cards */}
        {/* Stats Cards */}
<View style={styles.statsGrid}>
  <StatCard 
    title={translations.totalMembers} 
    value={stats.totalMembers} 
    icon="people" 
    color="#FF7722" 
  />
  <StatCard 
    title={translations.totalDonations} 
    value={stats.totalDonations} 
    icon="favorite" 
    color="#ef4444" 
  />
  <StatCard 
    title={translations.totalOrders} 
    value={stats.totalOrders} 
    icon="shopping-bag" 
    color="#8b5cf6" 
  />
  <StatCard 
    title={translations.totalEvents} 
    value={stats.totalEvents} 
    icon="event" 
    color="#10b981" 
  />
  <StatCard 
    title={translations.pendingApprovals} 
    value={stats.pendingApprovals} 
    icon="pending" 
    color="#f59e0b" 
    badge={stats.pendingApprovals}
    onPress={() => setShowPendingModal(true)}
  />
</View>

        {/* Recent Members */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>{translations.recentMembers}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Members')} activeOpacity={0.7}>
              <Text style={styles.viewAllText}>{translations.viewAll}</Text>
            </TouchableOpacity>
          </View>

          {recentMembers.length > 0 ? (
            recentMembers.map((item, index) => (
              <RecentMemberItem key={index} item={item} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>{translations.noMembers}</Text>
            </View>
          )}
        </View>

        {/* Recent Donations */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>{translations.recentDonations}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Finance')} activeOpacity={0.7}>
              <Text style={styles.viewAllText}>{translations.viewAll}</Text>
            </TouchableOpacity>
          </View>

          {recentDonations.length > 0 ? (
            recentDonations.map((item, index) => (
              <RecentDonationItem key={index} item={item} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>{translations.noDonations}</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* FAB Modal */}
      <Modal
  animationType="fade"
  transparent={true}
  visible={fabModalVisible}
  onRequestClose={() => setFabModalVisible(false)}
>
  <TouchableOpacity 
    style={styles.fabModalOverlay}
    activeOpacity={1} 
    onPress={() => setFabModalVisible(false)}
  >
    <View style={styles.fabModalContainer}>
      <View style={styles.fabModalContent}>
        <Text style={styles.fabModalTitle}>{translations.quickActions}</Text>
        
        <TouchableOpacity 
          style={styles.modalItem}
          onPress={() => {
            setFabModalVisible(false);
            navigation.navigate('NoticeComplaint');
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.modalItemIcon, { backgroundColor: '#FF7722' }]}>
            <MaterialIcons name="announcement" size={22} color="#ffffff" />
          </View>
          <View style={styles.modalItemTextContainer}>
            <Text style={styles.modalItemTitle}>{translations.viewNotices}</Text>
            <Text style={styles.modalItemSubtitle}>{translations.manageNotices}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.modalItem}
          onPress={() => {
            setFabModalVisible(false);
            navigation.navigate('NoticeComplaint');
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.modalItemIcon, { backgroundColor: '#ef4444' }]}>
            <MaterialIcons name="report-problem" size={22} color="#ffffff" />
          </View>
          <View style={styles.modalItemTextContainer}>
            <Text style={styles.modalItemTitle}>{translations.viewComplaints}</Text>
            <Text style={styles.modalItemSubtitle}>{translations.manageComplaints}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.modalItem}
          onPress={() => {
            setFabModalVisible(false);
            navigation.navigate('NoticeComplaint');
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.modalItemIcon, { backgroundColor: '#f59e0b' }]}>
            <MaterialIcons name="lightbulb" size={22} color="#ffffff" />
          </View>
          <View style={styles.modalItemTextContainer}>
            <Text style={styles.modalItemTitle}>{translations.viewSuggestions}</Text>
            <Text style={styles.modalItemSubtitle}>{translations.manageSuggestions}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.fabModalCloseButton}
          onPress={() => setFabModalVisible(false)}
          activeOpacity={0.7}
        >
          <Text style={styles.fabModalCloseButtonText}>{translations.close}</Text>
        </TouchableOpacity>
      </View>
    </View>
  </TouchableOpacity>
</Modal>
<Modal
  animationType="slide"
  transparent={true}
  visible={showPendingModal}
  onRequestClose={() => setShowPendingModal(false)}
  statusBarTranslucent={true}
>
  <TouchableOpacity 
    style={styles.pendingModalOverlay}
    activeOpacity={1} 
    onPress={() => setShowPendingModal(false)}
  >
    <View style={styles.pendingModalContainer}>
      <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ flex: 1 }}>
        <View style={styles.pendingModalContent}>
          <Text style={styles.pendingModalTitle}>Pending Registrations</Text>
          <Text style={styles.pendingModalSubtitle}>
            {pendingRegistrations.length} registrations waiting for approval
          </Text>

          <ScrollView 
            style={{ flex: 1, width: '100%' }}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: 8 }}
            keyboardShouldPersistTaps="handled"
          >
            {pendingRegistrations.length > 0 ? (
              pendingRegistrations.map((item) => (
                <View key={item.id} style={styles.pendingItem}>
                  <View style={styles.pendingItemHeader}>
                    <Text style={styles.pendingItemName}>
                      {item.fullName || item.name || 'Unknown'}
                    </Text>
                    <View style={styles.pendingStatusBadge}>
                      <Text style={styles.pendingStatusText}>Pending</Text>
                    </View>
                  </View>
                  <Text style={styles.pendingItemEmail}>📧 {item.email || 'No email'}</Text>
                  <Text style={styles.pendingItemPhone}>📱 {item.phone || 'N/A'}</Text>
                  {item.paymentSkipped && (
                    <Text style={styles.pendingItemReason}>
                      ⚠️ Payment skipped: {item.paymentSkippedReason || 'Not specified'}
                    </Text>
                  )}
                  <View style={styles.pendingItemActions}>
                    <TouchableOpacity
                      style={[styles.pendingActionButton, styles.pendingApproveButton]}
                      onPress={() => approveRegistration(item)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="check" size={18} color="#ffffff" />
                      <Text style={styles.pendingActionText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.pendingActionButton, styles.pendingRejectButton]}
                      onPress={() => rejectRegistration(item)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="close" size={18} color="#ffffff" />
                      <Text style={styles.pendingActionText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="check-circle" size={48} color="#10b981" />
                <Text style={styles.emptyStateText}>No pending registrations</Text>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.pendingModalCloseButton}
            onPress={() => setShowPendingModal(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.pendingModalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
</Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf8f3',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fdf8f3',
  },
  loadingText: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // ============ SAFFRON HEADER CARD ============
  headerCard: {
    backgroundColor: '#FF7722',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontFamily: Fonts.Bold,
    fontSize: 22,
    color: '#ffffff',
    marginBottom: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  subGreeting: {
    fontFamily: Fonts.Italic,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  profileIcon: {
    width: 70,
    height: 70,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 40,
  },

  // ============ QUICK ACTIONS ============
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  quickActionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#e0661a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: 10,
    marginTop: 6,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // ============ STATS GRID ============
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    width: '48%',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statCardClickable: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    width: '48%',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statCardClickableActive: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  statValue: {
    fontFamily: Fonts.Bold,
    fontSize: 18,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  statIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  statBadgeText: {
    fontFamily: Fonts.Bold,
    fontSize: 10,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // ============ RECENT SECTION ============
  recentSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 18,
    color: '#1f2937',
    letterSpacing: 0.5,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  viewAllText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 13,
    color: '#FF7722',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  recentItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FF772215',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentItemTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  recentItemSubtitle: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  recentItemDate: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#9ca3af',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  bottomSpacing: {
    height: 20,
  },

  // ============ FAB MODAL (Bottom Sheet) ============
  fabModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  fabModalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '50%',
  },
  fabModalContent: {
    width: '100%',
  },
  fabModalTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 20,
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  modalItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  modalItemTextContainer: {
    flex: 1,
  },
  modalItemTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  modalItemSubtitle: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  fabModalCloseButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  fabModalCloseButtonText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // ============ PENDING REGISTRATIONS MODAL (Centered) ============
  // ============ PENDING REGISTRATIONS MODAL (Centered) ============
pendingModalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.6)',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 12, // Reduced padding for more space
  width: '100%',
  height: '100%',
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
},
pendingModalContainer: {
  backgroundColor: '#ffffff',
  borderRadius: 24,
  padding: 20,
  paddingBottom: 16,
  width: '95%', // Increased from 100% with maxWidth
  maxWidth: 700, // Increased from 500
  maxHeight: '100%', // Increased from 85%
  minHeight: 400, // Increased from 200
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 8,
  elevation: 5,
},
pendingModalContent: {
  flex: 1,
  width: '100%',
  minHeight: 250, // Increased from 150
},
  pendingModalTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 22,
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  pendingModalSubtitle: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  pendingItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    width: '100%',
  },
  pendingItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  pendingItemName: {
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  pendingStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
    marginLeft: 8,
  },
  pendingStatusText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 11,
    color: '#92400e',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  pendingItemEmail: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  pendingItemPhone: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  pendingItemReason: {
    fontFamily: Fonts.Italic,
    fontSize: 12,
    color: '#f59e0b',
    marginTop: 4,
    marginBottom: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  pendingItemActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    width: '100%',
  },
  pendingActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    gap: 6,
  },
  pendingApproveButton: {
    backgroundColor: '#10b981',
  },
  pendingRejectButton: {
    backgroundColor: '#ef4444',
  },
  pendingActionText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 13,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  pendingModalCloseButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    marginTop: 8,
    width: '100%',
  },
  pendingModalCloseButtonText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // ============ EMPTY STATE ============
  emptyState: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    width: '100%',
  },
  emptyStateText: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});