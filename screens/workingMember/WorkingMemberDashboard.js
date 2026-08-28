// screens/workingMember/WorkingMemberDashboard.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Modal,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db, getAuthInstance } from '../../config/firebase';

import { collection, getDocs, query, where, doc, getDoc, orderBy, limit, onSnapshot, updateDoc } from 'firebase/firestore';
import { Fonts } from '../../config/fonts';
import { 
  getLevelDetails, 
  getLevelProgress,
  isEligibleForPromotion,
  getPromotionRequirements 
} from '../../config/commissionLevels';
import { WalletService } from '../../services/WalletService';
import { CommissionService } from '../../services/CommissionService';
import { LevelUpdateService } from '../../services/LevelUpdateService';
import { useLanguage } from '../../context/LanguageContext';

// Helper functions for dynamic levels
const getLevelBadge = (levelId) => {
  const badges = {
    'I': '⭐',
    'II': '🌟',
    'III': '💫',
    'IV': '✨',
    'V': '🌟',
    'VI': '⭐',
    'VII': '👑'
  };
  return badges[levelId] || '⭐';
};

const getLevelColor = (levelId) => {
  const colors = {
    'I': '#8b5cf6',
    'II': '#3b82f6',
    'III': '#10b981',
    'IV': '#f59e0b',
    'V': '#ef4444',
    'VI': '#8b5cf6',
    'VII': '#fbbf24'
  };
  return colors[levelId] || '#8b5cf6';
};

export default function WorkingMemberDashboard({ navigation }) {
  const { t, counter } = useLanguage();
  
  // Force re-render when language changes
  const renderKey = `working-dashboard-${counter}`;

  // Get translations - EVERY SINGLE TEXT STRING is mapped to a translation key
  const translations = {
    // Common
    loading: t('common.loading') || 'Loading...',
    nA: t('common.nA') || 'N/A',
    close: t('common.close') || 'Close',
    error: t('common.error') || 'Error',
    success: t('common.success') || 'Success',
    
    // Header
    hi: t('common.hi') || 'Hi',
    subGreeting: t('dashboard.workingSubGreeting') || 'Welcome to Working Member Dashboard',
    
    // Quick Actions
    members: t('dashboard.members') || 'Members',
    shop: t('dashboard.shop') || 'Shop',
    events: t('dashboard.events') || 'Events',
    wallet: t('dashboard.wallet') || 'Wallet',
    referral: t('dashboard.referral') || 'Referral',
    
    // Stats
    membersLabel: t('dashboard.members') || 'Members',
    commission: t('dashboard.commission') || 'Commission',
    pending: t('common.pending') || 'Pending',
    orders: t('dashboard.orders') || 'Orders',
    
    // Level Card
    directCommission: t('commission.directCommission') || 'Direct',
    secondaryCommission: t('commission.secondaryCommission') || 'Secondary',
    donationsProgress: t('dashboard.donationsProgress') || 'Donations Progress',
    neededForNextLevel: t('dashboard.neededForNextLevel') || 'needed for {level}',
    moreInDonationsNeeded: t('dashboard.moreInDonationsNeeded') || '₹{amount} more in donations needed',
    readyForPromotion: t('dashboard.readyForPromotion') || '🎉 Ready for promotion!',
    toReach: t('dashboard.toReach') || 'to reach',
    eligibleForPromotion: t('dashboard.eligibleForPromotion') || 'Eligible for Promotion!',
    highestLevelReached: t('dashboard.highestLevelReached') || '🎉 You\'ve reached the highest level!',
    directMembers: t('dashboard.directMembers') || 'Direct Members',
    totalMembers: t('dashboard.totalMembers') || 'Total Members',
    totalDonations: t('dashboard.totalDonations') || 'Total Donations',
    noDonationTarget: t('dashboard.noDonationTarget') || 'No donation target set for next level',
    
    // Wallet Card
    walletTitle: t('dashboard.wallet') || 'Wallet',
    availableBalance: t('dashboard.availableBalance') || 'Available Balance',
    totalEarned: t('dashboard.totalEarned') || 'Total Earned',
    pendingLabel: t('common.pending') || 'Pending',
    donationCommissions: t('dashboard.donationCommissions') || '❤️ Donations',
    
    // Referral
    referralTitle: t('dashboard.referralTitle') || 'Referral Code',
    referralSubtext: t('dashboard.referralSubtext') || 'Share your referral code to earn commissions',
    noReferralCode: t('dashboard.noReferralCode') || 'No referral code generated yet',
    generateReferral: t('dashboard.generateReferral') || 'Generate Referral Code',
    yourReferralCode: t('dashboard.yourReferralCode') || 'Your Referral Code',
    shareCode: t('dashboard.shareCode') || 'Share Code',
    copyCode: t('dashboard.copyCode') || 'Copy Code',
    referralMessage: t('dashboard.referralMessage') || 'Join using my referral code: {code}',
    
    // Recent Activities
    recentRegistrations: t('dashboard.recentRegistrations') || 'Recent Registrations',
    viewAll: t('common.viewAll') || 'View All',
    noRecentRegistrations: t('dashboard.noRecentRegistrations') || 'No recent registrations',
    
    // FAB Modal
    quickActions: t('donation.quickActions') || 'Quick Actions',
    applications: t('dashboard.applications') || 'Applications',
    applyForServices: t('dashboard.applyForServices') || 'Apply for services & competitions',
    eventsLabel: t('dashboard.events') || 'Events',
    viewEvents: t('dashboard.viewEvents') || 'View upcoming events',
    walletLabel: t('dashboard.wallet') || 'Wallet',
    viewWalletBalance: t('dashboard.viewWalletBalance') || 'View your wallet balance',
    viewNotices: t('dashboard.viewNotices') || 'View Notices',
    checkUpdates: t('dashboard.checkUpdates') || 'Check latest updates',
    submitComplaint: t('dashboard.submitComplaint') || 'Submit Complaint',
    reportIssue: t('dashboard.reportIssue') || 'Report an issue',
    submitSuggestion: t('dashboard.submitSuggestion') || 'Submit Suggestion',
    shareIdeas: t('dashboard.shareIdeas') || 'Share your ideas',
    companyInfo: t('dashboard.companyInfo') || 'Company Info',
    viewCompanyDetails: t('dashboard.viewCompanyDetails') || 'View company details',
    closeButton: t('common.close') || 'Close',
    
    // Working Member
    workingMember: 'Working Member',
    newMemberRegistered: '{name} registered',
    activity: 'Activity',
    
    // Downline Section
    downlineTitle: 'My Downline Network',
    downlineSubtitle: 'Working members linked below you',
    workingMembers: 'Working Members',
    registeredMembers: 'Registered Members',
    noDownline: 'No working members linked below you yet',
    expandHint: 'Tap to expand',
    collapseHint: 'Tap to collapse',
    viewAllMembers: 'View All Members',
    levelLabel: 'Level',
  };

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [fabModalVisible, setFabModalVisible] = useState(false);
  const [pendingApplications, setPendingApplications] = useState(0);
  const [levelDetails, setLevelDetails] = useState(null);
  const [levelProgress, setLevelProgress] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [promotionData, setPromotionData] = useState(null);
  const [totalDonations, setTotalDonations] = useState(0);
  const [referralCode, setReferralCode] = useState('');
  const [referralModalVisible, setReferralModalVisible] = useState(false);
  const [generatingReferral, setGeneratingReferral] = useState(false);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalCommission: 0,
    pendingCommission: 0,
    totalOrders: 0,
    donationCommission: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [referredMembers, setReferredMembers] = useState([]);
  const [loadingReferred, setLoadingReferred] = useState(false);

  // ============ NEW: Downline State ============
  const [downlineData, setDownlineData] = useState([]);
  const [loadingDownline, setLoadingDownline] = useState(false);
  const [expandedDownline, setExpandedDownline] = useState({});

  useEffect(() => {
    fetchUserData();
    setupRealtimeListener();
    fetchStats();
    fetchRecentActivities();
    fetchPendingApplications();
    fetchPromotionProgress();
    fetchReferredMembers();
    fetchDownlineData(); // ✅ Fetch downline data
  }, []);

  // ============ FETCH DOWNLINE DATA ============
  const fetchDownlineData = async () => {
    const auth = getAuthInstance();
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    setLoadingDownline(true);
    try {
      // 1. Get ALL users who were registered by this user (direct referrals)
      const usersQuery = query(
        collection(db, 'users'),
        where('registeredBy', '==', userId)
      );
      const usersSnap = await getDocs(usersQuery);
      
      const downline = [];

      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;
        
        // Check if this user is a working member
        const isWorkingMember = userData.role === 'working' || userData.role === 'workingMember';
        
        // Get members registered by this user
        const membersQuery = query(
          collection(db, 'users'),
          where('registeredBy', '==', userId)
        );
        const membersSnap = await getDocs(membersQuery);
        const membersList = [];
        membersSnap.forEach((doc) => {
          membersList.push({
            id: doc.id,
            ...doc.data()
          });
        });

        downline.push({
          id: userId,
          ...userData,
          isWorkingMember: isWorkingMember,
          registeredMembers: membersList,
          memberCount: membersList.length
        });
      }

      // Sort: Working members first, then by member count
      downline.sort((a, b) => {
        if (a.isWorkingMember && !b.isWorkingMember) return -1;
        if (!a.isWorkingMember && b.isWorkingMember) return 1;
        return b.memberCount - a.memberCount;
      });

      setDownlineData(downline);
    } catch (error) {
      console.error('Error fetching downline data:', error);
    } finally {
      setLoadingDownline(false);
    }
  };

  const toggleExpand = (userId) => {
    setExpandedDownline(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // ============ DOWNLINE RENDER COMPONENT ============
  const DownlineSection = () => {
    if (loadingDownline) {
      return (
        <View style={styles.downlineLoadingContainer}>
          <ActivityIndicator size="small" color="#8b5cf6" />
          <Text style={styles.downlineLoadingText}>Loading downline...</Text>
        </View>
      );
    }

    if (downlineData.length === 0) {
      return (
        <View style={styles.downlineEmptyContainer}>
          <MaterialIcons name="people-outline" size={40} color="#d1d5db" />
          <Text style={styles.downlineEmptyText}>{translations.noDownline}</Text>
          <Text style={styles.downlineEmptySubtext}>Share your referral code to build your network</Text>
        </View>
      );
    }

    return (
      <View style={styles.downlineContainer}>
        {downlineData.map((item) => (
          <View key={item.id} style={styles.downlineCard}>
            {/* Downline User Header */}
            <TouchableOpacity 
              style={styles.downlineHeader}
              onPress={() => toggleExpand(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.downlineHeaderLeft}>
                <View style={[
                  styles.downlineAvatar,
                  { backgroundColor: item.isWorkingMember ? '#8b5cf615' : '#10b98115' }
                ]}>
                  <Text style={[
                    styles.downlineAvatarText,
                    { color: item.isWorkingMember ? '#8b5cf6' : '#10b981' }
                  ]}>
                    {item.fullName?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.downlineName} numberOfLines={1}>
                    {item.fullName || item.name || 'Unknown'}
                  </Text>
                  <View style={styles.downlineMeta}>
                    {item.isWorkingMember && (
                      <View style={styles.downlineWorkingBadge}>
                        <MaterialIcons name="star" size={10} color="#8b5cf6" />
                        <Text style={styles.downlineWorkingText}>Working</Text>
                      </View>
                    )}
                    <Text style={styles.downlineLevel}>
                      {translations.levelLabel} {item.level || 'I'}
                    </Text>
                    <Text style={styles.downlineMemberCount}>
                      👤 {item.memberCount} {translations.registeredMembers}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.downlineHeaderRight}>
                <MaterialIcons 
                  name={expandedDownline[item.id] ? 'expand-less' : 'expand-more'} 
                  size={24} 
                  color="#6b7280" 
                />
              </View>
            </TouchableOpacity>

            {/* Expanded Registered Members */}
            {expandedDownline[item.id] && (
              <View style={styles.downlineMembersContainer}>
                {item.registeredMembers.length > 0 ? (
                  item.registeredMembers.map((member, index) => (
                    <View key={member.id || index} style={styles.downlineMemberItem}>
                      <View style={styles.downlineMemberIcon}>
                        <MaterialIcons name="person" size={14} color="#6b7280" />
                      </View>
                      <View style={styles.downlineMemberInfo}>
                        <Text style={styles.downlineMemberName} numberOfLines={1}>
                          {member.fullName || member.name || 'Unknown'}
                        </Text>
                        <Text style={styles.downlineMemberDetails} numberOfLines={1}>
                          {member.phone || member.email || 'N/A'} • {member.role || 'Member'}
                        </Text>
                      </View>
                      <Text style={styles.downlineMemberDate}>
                        {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.downlineNoMembers}>No registered members yet</Text>
                )}
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const setupRealtimeListener = () => {
    const auth = getAuthInstance();
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const userRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userRef, async (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUserData(data);
        setProfilePhoto(data.profilePhoto || null);
        setReferralCode(data.referralCode || '');
        
        const level = data.level || 'I';
        
        try {
          const settingsRef = doc(db, 'settings', 'commission');
          const settingsSnap = await getDoc(settingsRef);
          let dynamicLevels = null;
          
          if (settingsSnap.exists()) {
            const settingsData = settingsSnap.data();
            if (settingsData.levels) {
              dynamicLevels = settingsData.levels;
            }
          }
          
          let details;
          let nextLevelData = null;
          let nextLevelId = null;
          let nextLevelMinDonations = 0;
          
          if (dynamicLevels) {
            const levelData = dynamicLevels.find(l => l.id === level);
            if (levelData) {
              details = {
                ...levelData,
                title: levelData.name,
                badge: getLevelBadge(level),
                color: getLevelColor(level)
              };
              const currentIndex = dynamicLevels.findIndex(l => l.id === level);
              if (currentIndex !== -1 && currentIndex < dynamicLevels.length - 1) {
                nextLevelData = dynamicLevels[currentIndex + 1];
                nextLevelId = nextLevelData.id;
                nextLevelMinDonations = levelData.donationsRequiredForPromotion || 0;
              }
            } else {
              details = getLevelDetails(level);
              const nextLevel = getLevelDetails(level).nextLevel;
              if (nextLevel) {
                nextLevelId = nextLevel;
                nextLevelMinDonations = getLevelDetails(nextLevel).minDonations || 0;
              }
            }
          } else {
            details = getLevelDetails(level);
            const nextLevel = getLevelDetails(level).nextLevel;
            if (nextLevel) {
              nextLevelId = nextLevel;
              nextLevelMinDonations = getLevelDetails(nextLevel).minDonations || 0;
            }
          }
          
          if (nextLevelData) {
            details.nextLevelData = nextLevelData;
          }
          setLevelDetails(details);
          
          const donations = await CommissionService.getTotalDonationsByMember(userId);
          setTotalDonations(donations);
          
          const progress = {
            progress: nextLevelMinDonations > 0 ? Math.min((donations / nextLevelMinDonations) * 100, 100) : 100,
            nextLevel: nextLevelId,
            nextLevelTitle: nextLevelData ? nextLevelData.name : (nextLevelId ? getLevelDetails(nextLevelId)?.title || nextLevelId : null),
            remainingDonations: nextLevelMinDonations > 0 ? Math.max(0, nextLevelMinDonations - donations) : 0,
            donationProgress: nextLevelMinDonations > 0 ? (donations / nextLevelMinDonations) * 100 : 100,
            requiredDonations: nextLevelMinDonations
          };
          setLevelProgress(progress);
          
          const isEligible = nextLevelMinDonations > 0 && donations >= nextLevelMinDonations;
          setPromotionData({ isEligible });
          
          try {
            const wallet = await WalletService.getOrCreateWallet(userId);
            setWalletData(wallet);
          } catch (error) {
            console.error('Error fetching wallet:', error);
          }
        } catch (error) {
          console.error('Error fetching dynamic levels:', error);
          const details = getLevelDetails(level);
          setLevelDetails(details);
          const donations = await CommissionService.getTotalDonationsByMember(userId);
          setTotalDonations(donations);
          const progress = getLevelProgress(level, donations);
          setLevelProgress(progress);
          const isEligible = isEligibleForPromotion(level, donations);
          setPromotionData({ isEligible });
        }
      }
    });

    return () => unsubscribe();
  };

  const fetchReferredMembers = async () => {
    const auth = getAuthInstance();

    const userId = auth.currentUser?.uid;
    if (!userId) return;
    
    setLoadingReferred(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const directReferrals = userData.directReferrals || [];
        
        if (directReferrals.length === 0) {
          setReferredMembers([]);
          return;
        }
        
        const members = [];
        for (const refId of directReferrals) {
          const refDoc = await getDoc(doc(db, 'users', refId));
          if (refDoc.exists()) {
            const refData = refDoc.data();
            members.push({
              id: refId,
              ...refData
            });
          }
        }
        setReferredMembers(members);
      }
    } catch (error) {
      console.error('Error fetching referred members:', error);
    } finally {
      setLoadingReferred(false);
    }
  };

  const fetchUserData = async () => {
    try {
    const auth = getAuthInstance();

      const userId = auth.currentUser?.uid;
      if (!userId) return;
      
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        setProfilePhoto(data.profilePhoto || null);
        setReferralCode(data.referralCode || '');
        
        const level = data.level || 'I';
        console.log('🔍 Current Level:', level);
        
        try {
          const settingsRef = doc(db, 'settings', 'commission');
          const settingsSnap = await getDoc(settingsRef);
          let dynamicLevels = null;
          
          if (settingsSnap.exists()) {
            const settingsData = settingsSnap.data();
            console.log('🔍 Settings Data:', settingsData);
            if (settingsData.levels) {
              dynamicLevels = settingsData.levels;
              console.log('🔍 Dynamic Levels:', dynamicLevels);
            }
          }
          
          let details;
          let nextLevelData = null;
          let nextLevelId = null;
          let nextLevelMinDonations = 0;
          
          if (dynamicLevels) {
            const levelData = dynamicLevels.find(l => l.id === level);
            console.log('🔍 Level Data Found:', levelData);
            
            if (levelData) {
              details = {
                ...levelData,
                title: levelData.name,
                badge: getLevelBadge(level),
                color: getLevelColor(level)
              };
              const currentIndex = dynamicLevels.findIndex(l => l.id === level);
              console.log('🔍 Current Index:', currentIndex);
              
              if (currentIndex !== -1 && currentIndex < dynamicLevels.length - 1) {
                nextLevelData = dynamicLevels[currentIndex + 1];
                nextLevelId = nextLevelData.id;
                nextLevelMinDonations = levelData.donationsRequiredForPromotion || 0;
                console.log('🔍 Next Level Data:', nextLevelData);
                console.log('🔍 Donations Required for Promotion:', nextLevelMinDonations);
              }
            } else {
              details = getLevelDetails(level);
              const nextLevel = getLevelDetails(level).nextLevel;
              if (nextLevel) {
                nextLevelId = nextLevel;
                nextLevelMinDonations = getLevelDetails(nextLevel).minDonations || 0;
              }
            }
          } else {
            details = getLevelDetails(level);
            const nextLevel = getLevelDetails(level).nextLevel;
            if (nextLevel) {
              nextLevelId = nextLevel;
              nextLevelMinDonations = getLevelDetails(nextLevel).minDonations || 0;
            }
          }
          
          if (nextLevelData) {
            details.nextLevelData = nextLevelData;
          }
          setLevelDetails(details);
          
          const donations = await CommissionService.getTotalDonationsByMember(userId);
          setTotalDonations(donations);
          console.log('🔍 Total Donations:', donations);
          console.log('🔍 Next Level Min Donations (final):', nextLevelMinDonations);
          
          const progress = {
            progress: nextLevelMinDonations > 0 ? Math.min((donations / nextLevelMinDonations) * 100, 100) : 100,
            nextLevel: nextLevelId,
            nextLevelTitle: nextLevelData ? nextLevelData.name : (nextLevelId ? getLevelDetails(nextLevelId)?.title || nextLevelId : null),
            remainingDonations: nextLevelMinDonations > 0 ? Math.max(0, nextLevelMinDonations - donations) : 0,
            donationProgress: nextLevelMinDonations > 0 ? (donations / nextLevelMinDonations) * 100 : 100,
            requiredDonations: nextLevelMinDonations
          };
          console.log('🔍 Progress Object:', progress);
          setLevelProgress(progress);
          
          const isEligible = nextLevelMinDonations > 0 && donations >= nextLevelMinDonations;
          setPromotionData({ isEligible });
          
          try {
            const wallet = await WalletService.getOrCreateWallet(userId);
            setWalletData(wallet);
          } catch (error) {
            console.error('Error fetching wallet:', error);
          }
        } catch (error) {
          console.error('Error fetching dynamic levels:', error);
          const details = getLevelDetails(level);
          setLevelDetails(details);
          const donations = await CommissionService.getTotalDonationsByMember(userId);
          setTotalDonations(donations);
          const progress = getLevelProgress(level, donations);
          setLevelProgress(progress);
          const isEligible = isEligibleForPromotion(level, donations);
          setPromotionData({ isEligible });
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPromotionProgress = async () => {
    try {
    const auth = getAuthInstance();

      const userId = auth.currentUser?.uid;
      if (!userId) return;
      
      const progress = await LevelUpdateService.getPromotionProgress(userId);
      if (progress) {
        setPromotionData(progress);
      }
    } catch (error) {
      console.error('Error fetching promotion progress:', error);
    }
  };

  const fetchPendingApplications = async () => {
    try {
    const auth = getAuthInstance();

      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const appsQuery = query(
        collection(db, 'serviceApplications'),
        where('userId', '==', userId),
        where('status', '==', 'pending')
      );
      const appsSnap = await getDocs(appsQuery);
      setPendingApplications(appsSnap.size);
    } catch (error) {
      console.error('Error fetching pending applications:', error);
    }
  };

  const fetchStats = async () => {
    try {
    const auth = getAuthInstance();

      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const membersSnap = await getDocs(query(
        collection(db, 'registeredMembers'),
        where('workingMemberId', '==', userId)
      ));

      const commissionsSnap = await getDocs(query(
        collection(db, 'walletTransactions'),
        where('userId', '==', userId),
        where('type', 'in', ['primary_commission', 'secondary_commission'])
      ));

      let totalCommission = 0;
      let pendingCommission = 0;
      let donationCommission = 0;
      
      commissionsSnap.forEach(doc => {
        const data = doc.data();
        if (data.status === 'paid' || data.status === 'completed') {
          totalCommission += data.amount || 0;
          if (data.description?.toLowerCase().includes('donation')) {
            donationCommission += data.amount || 0;
          }
        } else {
          pendingCommission += data.amount || 0;
        }
      });

      const ordersSnap = await getDocs(query(
        collection(db, 'orders'),
        where('memberId', '==', userId)
      ));

      setStats({
        totalMembers: membersSnap.size,
        totalCommission,
        pendingCommission,
        totalOrders: ordersSnap.size,
        donationCommission
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
    const auth = getAuthInstance();

      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const membersQuery = query(
        collection(db, 'registeredMembers'),
        where('workingMemberId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      
      const membersSnap = await getDocs(membersQuery);
      const activitiesList = [];
      membersSnap.forEach(doc => {
        const data = doc.data();
        activitiesList.push({
          id: doc.id,
          title: translations.newMemberRegistered.replace('{name}', data.fullName || 'New Member'),
          description: data.email || '',
          type: 'member',
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      setRecentActivities(activitiesList);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  // ============ REFERRAL FUNCTIONS ============
  const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleGenerateReferral = async () => {
  const auth = getAuthInstance();

    const userId = auth.currentUser?.uid;
    if (!userId) return;
    
    setGeneratingReferral(true);
    try {
      const newCode = generateReferralCode();
      setReferralCode(newCode);
      
      await updateDoc(doc(db, 'users', userId), {
        referralCode: newCode,
        referralCodeGeneratedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      Alert.alert('Success', `Your referral code: ${newCode}`);
      
    } catch (error) {
      console.error('Error generating referral code:', error);
      Alert.alert('Error', 'Failed to generate referral code. Please try again.');
    } finally {
      setGeneratingReferral(false);
    }
  };

  const handleShareReferral = async () => {
    if (!referralCode) {
      Alert.alert('Error', 'Please generate a referral code first');
      return;
    }

    const message = translations.referralMessage.replace('{code}', referralCode);
    
    try {
      await Share.share({
        message: message,
        title: 'Referral Code',
      });
    } catch (error) {
      console.error('Error sharing referral code:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    await fetchStats();
    await fetchRecentActivities();
    await fetchPendingApplications();
    await fetchPromotionProgress();
    await fetchReferredMembers();
    await fetchDownlineData(); // ✅ Refresh downline
    setRefreshing(false);
  };

  const QuickActionButton = ({ title, icon, onPress, badge }) => (
    <TouchableOpacity style={styles.quickActionButton} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.quickActionIconBg}>
        <MaterialIcons name={icon} size={24} color="#ffffff" />
        {badge > 0 && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  const StatCard = ({ title, value, icon, color }) => (
    <View style={styles.statCard}>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
    </View>
  );

  const ActivityItem = ({ item }) => (
    <View style={styles.activityItem}>
      <View style={styles.activityItemLeft}>
        <View style={[styles.activityItemIcon, { backgroundColor: item.type === 'member' ? '#3b82f615' : '#10b98115' }]}>
          <MaterialIcons 
            name={item.type === 'member' ? 'person-add' : 'event'} 
            size={16} 
            color={item.type === 'member' ? '#3b82f6' : '#10b981'} 
          />
        </View>
        <View>
          <Text style={styles.activityItemTitle}>{item.title || translations.activity}</Text>
          <Text style={styles.activityItemSubtitle}>{item.description || ''}</Text>
        </View>
      </View>
      <Text style={styles.activityItemDate}>
        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : translations.nA}
      </Text>
    </View>
  );

  const LevelProgressBar = () => {
    if (!levelProgress || !levelDetails) return null;

    const progress = levelProgress.progress || 0;
    const nextLevel = levelProgress.nextLevel;
    const remainingDonations = levelProgress.remainingDonations || 0;
    const donationProgress = levelProgress.donationProgress || 0;

    const isEligible = promotionData?.isEligible || false;
    const requiredDonations = levelProgress.requiredDonations || 0;
    const nextLevelTitle = levelProgress.nextLevelTitle || 'Next Level';

    return (
      <View style={styles.levelCard}>
        <View style={styles.levelHeader}>
          <View style={styles.levelBadgeContainer}>
            <Text style={styles.levelBadgeEmoji}>{levelDetails.badge || '⭐'}</Text>
            <Text style={styles.levelTitle}>{levelDetails.title}</Text>
          </View>
          
        </View>

        {nextLevel && requiredDonations > 0 ? (
          <>
            <View style={styles.progressSection}>
              <View style={styles.progressLabelContainer}>
                <Text style={styles.progressLabel}>{translations.donationsProgress}</Text>
                <Text style={styles.progressPercentage}>
                  {Math.round(Math.min(donationProgress, 100))}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { 
                  width: `${Math.min(donationProgress, 100)}%`, 
                  backgroundColor: '#f59e0b' 
                }]} />
              </View>
              <Text style={styles.progressSubtext}>
                ₹{totalDonations.toLocaleString()} / ₹{requiredDonations.toLocaleString()} 
                {translations.neededForNextLevel.replace('{level}', nextLevelTitle)}
              </Text>
            </View>
          </>
        ) : nextLevel && requiredDonations === 0 ? (
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>{translations.noDonationTarget}</Text>
          </View>
        ) : null}

        {nextLevel ? (
          <View style={styles.nextLevelInfo}>
            <Text style={styles.nextLevelText}>
              {remainingDonations > 0 
                ? translations.moreInDonationsNeeded.replace('{amount}', remainingDonations.toLocaleString())
                : translations.readyForPromotion}
              {' ' + translations.toReach + ' '}
              <Text style={[styles.nextLevelHighlight, { color: levelDetails.color }]}>
                {nextLevelTitle}
              </Text>
            </Text>
            {isEligible && (
              <View style={styles.eligibleBadge}>
                <MaterialIcons name="stars" size={16} color="#10b981" />
                <Text style={styles.eligibleText}>{translations.eligibleForPromotion}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.maxLevelContainer}>
            <MaterialIcons name="emoji-events" size={20} color="#fbbf24" />
            <Text style={styles.maxLevelText}>{translations.highestLevelReached}</Text>
          </View>
        )}

        <View style={styles.memberCountContainer}>
          <View style={styles.memberCountItem}>
            <Text style={styles.memberCountNumber}>{userData?.directReferrals?.length || 0}</Text>
            <Text style={styles.memberCountLabel}>{translations.directMembers}</Text>
          </View>
          <View style={styles.memberCountDivider} />
          <View style={styles.memberCountItem}>
            <Text style={styles.memberCountNumber}>{stats.totalMembers}</Text>
            <Text style={styles.memberCountLabel}>{translations.totalMembers}</Text>
          </View>
          <View style={styles.memberCountDivider} />
          <View style={styles.memberCountItem}>
            <Text style={[styles.memberCountNumber, { color: '#f59e0b' }]}>
              ₹{totalDonations.toLocaleString()}
            </Text>
            <Text style={styles.memberCountLabel}>{translations.totalDonations}</Text>
          </View>
        </View>
      </View>
    );
  };

  const WalletCard = () => {
    if (!walletData) return null;

    return (
      <TouchableOpacity 
        style={styles.walletCard}
        onPress={() => navigation.navigate('Wallet')}
        activeOpacity={0.7}
      >
        <View style={styles.walletHeader}>
          <View style={styles.walletHeaderLeft}>
            <MaterialIcons name="account-balance-wallet" size={20} color="#10b981" />
            <Text style={styles.walletTitle}>{translations.walletTitle}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
        </View>
        <View style={styles.walletContent}>
          <View style={styles.walletBalance}>
            <Text style={styles.walletBalanceLabel}>{translations.availableBalance}</Text>
            <Text style={styles.walletBalanceAmount}>₹{walletData.balance?.toLocaleString() || 0}</Text>
          </View>
          <View style={styles.walletStats}>
            <View style={styles.walletStat}>
              <Text style={styles.walletStatValue}>₹{walletData.totalEarned?.toLocaleString() || 0}</Text>
              <Text style={styles.walletStatLabel}>{translations.totalEarned}</Text>
            </View>
            <View style={styles.walletStatDivider} />
            <View style={styles.walletStat}>
              <Text style={styles.walletStatValue}>₹{walletData.pendingCommission?.toLocaleString() || 0}</Text>
              <Text style={styles.walletStatLabel}>{translations.pendingLabel}</Text>
            </View>
            {walletData.donationCommission > 0 && (
              <>
                <View style={styles.walletStatDivider} />
                <View style={styles.walletStat}>
                  <Text style={[styles.walletStatValue, { color: '#f59e0b' }]}>
                    ₹{walletData.donationCommission?.toLocaleString() || 0}
                  </Text>
                  <Text style={styles.walletStatLabel}>{translations.donationCommissions}</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ============ REFERRAL CARD ============
  const ReferralCard = () => (
    <TouchableOpacity 
      style={styles.referralCard}
      onPress={() => setReferralModalVisible(true)}
      activeOpacity={0.7}
    >
      <View style={styles.referralHeader}>
        <View style={styles.referralHeaderLeft}>
          <MaterialIcons name="share" size={20} color="#f59e0b" />
          <Text style={styles.referralTitle}>{translations.referralTitle}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
      </View>
      <View style={styles.referralContent}>
        {referralCode ? (
          <>
            <Text style={styles.referralCodeDisplay}>{referralCode}</Text>
            <Text style={styles.referralSubtext}>{translations.referralSubtext}</Text>
          </>
        ) : (
          <>
            <Text style={styles.referralNoCode}>{translations.noReferralCode}</Text>
            <Text style={styles.referralSubtext}>{translations.referralSubtext}</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  // ============ REFERRAL MODAL ============
  const ReferralModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={referralModalVisible}
      onRequestClose={() => setReferralModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.referralModalContainer}>
          <View style={styles.referralModalHeader}>
            <Text style={styles.referralModalTitle}>{translations.referralTitle}</Text>
            <TouchableOpacity onPress={() => setReferralModalVisible(false)}>
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.referralModalContent}>
            {referralCode ? (
              <>
                <Text style={styles.referralModalLabel}>{translations.yourReferralCode}</Text>
                <View style={styles.referralCodeContainer}>
                  <Text style={styles.referralCodeLarge}>{referralCode}</Text>
                </View>
                <Text style={styles.referralModalSubtext}>{translations.referralSubtext}</Text>
                <View style={styles.referralModalButtons}>
                  <TouchableOpacity 
                    style={[styles.referralModalButton, styles.referralShareButton]}
                    onPress={handleShareReferral}
                  >
                    <MaterialIcons name="share" size={20} color="#ffffff" />
                    <Text style={styles.referralModalButtonText}>{translations.shareCode}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.referralModalButton, styles.referralCopyButton]}
                    onPress={() => {
                      Alert.alert('Copy Code', `Referral code: ${referralCode}`);
                    }}
                  >
                    <MaterialIcons name="content-copy" size={20} color="#ffffff" />
                    <Text style={styles.referralModalButtonText}>{translations.copyCode}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.referralModalNoCode}>{translations.noReferralCode}</Text>
                <Text style={styles.referralModalSubtext}>{translations.referralSubtext}</Text>
                <TouchableOpacity 
                  style={[styles.referralGenerateButtonLarge, generatingReferral && { opacity: 0.6 }]}
                  onPress={handleGenerateReferral}
                  disabled={generatingReferral}
                >
                  {generatingReferral ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <MaterialIcons name="refresh" size={20} color="#ffffff" />
                      <Text style={styles.referralGenerateButtonText}>{translations.generateReferral}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

          <TouchableOpacity 
            style={styles.referralModalClose}
            onPress={() => setReferralModalVisible(false)}
          >
            <Text style={styles.referralModalCloseText}>{translations.closeButton}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer} key={renderKey}>
        <Text style={styles.loadingText}>{translations.loading}</Text>
      </View>
    );
  }

  const firstName = userData?.fullName?.split(' ')[0] || userData?.name?.split(' ')[0] || translations.workingMember;

  return (
    <View style={{ flex: 1 }} key={renderKey}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8b5cf6']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Purple Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{translations.hi}, {firstName}</Text>
              <Text style={styles.subGreeting}>{translations.subGreeting}</Text>
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

          {/* Quick Actions */}
          <View style={styles.quickActionsRow}>
            <QuickActionButton 
              title={translations.members} 
              icon="people" 
              onPress={() => navigation.navigate('WorkingMemberRegisteredMembers')}
            />
            <QuickActionButton 
              title={translations.shop} 
              icon="shopping-cart" 
              onPress={() => navigation.navigate('Shop')}
            />
            <QuickActionButton 
              title={translations.events} 
              icon="event" 
              onPress={() => navigation.navigate('Events')}
            />
            <QuickActionButton 
              title={translations.wallet} 
              icon="account-balance-wallet" 
              onPress={() => navigation.navigate('Wallet')}
            />
            <QuickActionButton 
              title={translations.referral} 
              icon="share" 
              onPress={() => setReferralModalVisible(true)}
              badge={referralCode ? 0 : 1}
            />
          </View>
        </View>

        {/* Level Progress Card - Donation Only */}
        <LevelProgressBar />

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <StatCard 
            title={translations.membersLabel} 
            value={stats.totalMembers} 
            icon="people" 
            color="#8b5cf6" 
          />
          <StatCard 
            title={translations.commission} 
            value={`₹${stats.totalCommission.toLocaleString()}`} 
            icon="attach-money" 
            color="#10b981" 
          />
          <StatCard 
            title={translations.pending} 
            value={`₹${stats.pendingCommission.toLocaleString()}`} 
            icon="pending" 
            color="#f59e0b" 
          />
          <StatCard 
            title={translations.orders} 
            value={stats.totalOrders} 
            icon="shopping-bag" 
            color="#3b82f6" 
          />
        </View>

        {/* Referral Card */}
        <ReferralCard />

        {/* Wallet Card */}
        <WalletCard />

        {/* ============ NEW: DOWNLINE SECTION ============ */}
        <View style={styles.downlineSection}>
          <View style={styles.downlineSectionHeader}>
            <View style={styles.downlineSectionLeft}>
              <MaterialIcons name="account-tree" size={22} color="#8b5cf6" />
              <Text style={styles.downlineSectionTitle}>{translations.downlineTitle}</Text>
            </View>
            <Text style={styles.downlineSectionSubtitle}>
              {downlineData.filter(m => m.isWorkingMember).length} {translations.workingMembers}
            </Text>
          </View>
          <DownlineSection />
        </View>

        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>📋 My Referred Members</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Members')} activeOpacity={0.7}>
              <Text style={styles.viewAllText}>{translations.viewAll}</Text>
            </TouchableOpacity>
          </View>

          {loadingReferred ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="small" color="#8b5cf6" />
              <Text style={styles.emptyStateText}>Loading...</Text>
            </View>
          ) : referredMembers.length > 0 ? (
            referredMembers.slice(0, 5).map((member, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityItemLeft}>
                  <View style={[styles.activityItemIcon, { backgroundColor: '#8b5cf615' }]}>
                    <MaterialIcons name="person" size={16} color="#8b5cf6" />
                  </View>
                  <View>
                    <Text style={styles.activityItemTitle}>{member.fullName}</Text>
                    <Text style={styles.activityItemSubtitle}>
                      {member.phone} • {member.status || 'Active'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.activityItemDate}>
                  {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No referred members yet</Text>
              <Text style={styles.emptyStateSubtext}>Share your referral code to get started!</Text>
            </View>
          )}
        </View>

        {/* Recent Activities */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>{translations.recentRegistrations}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Members')} activeOpacity={0.7}>
              <Text style={styles.viewAllText}>{translations.viewAll}</Text>
            </TouchableOpacity>
          </View>

          {recentActivities.length > 0 ? (
            recentActivities.map((item, index) => (
              <ActivityItem key={index} item={item} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>{translations.noRecentRegistrations}</Text>
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
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setFabModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{translations.quickActions}</Text>
              
              <TouchableOpacity 
                style={styles.modalItem}
                onPress={() => {
                  setFabModalVisible(false);
                  navigation.navigate('WorkingMemberApplications');
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.modalItemIcon, { backgroundColor: '#8b5cf6' }]}>
                  <MaterialIcons name="handshake" size={22} color="#ffffff" />
                </View>
                <View style={styles.modalItemTextContainer}>
                  <Text style={styles.modalItemTitle}>{translations.applications}</Text>
                  <Text style={styles.modalItemSubtitle}>{translations.applyForServices}</Text>
                </View>
                {pendingApplications > 0 && (
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>{pendingApplications}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalItem}
                onPress={() => {
                  setFabModalVisible(false);
                  navigation.navigate('WorkingMemberEvents');
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.modalItemIcon, { backgroundColor: '#3b82f6' }]}>
                  <MaterialIcons name="event" size={22} color="#ffffff" />
                </View>
                <View style={styles.modalItemTextContainer}>
                  <Text style={styles.modalItemTitle}>{translations.eventsLabel}</Text>
                  <Text style={styles.modalItemSubtitle}>{translations.viewEvents}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalItem}
                onPress={() => {
                  setFabModalVisible(false);
                  navigation.navigate('Wallet');
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.modalItemIcon, { backgroundColor: '#10b981' }]}>
                  <MaterialIcons name="account-balance-wallet" size={22} color="#ffffff" />
                </View>
                <View style={styles.modalItemTextContainer}>
                  <Text style={styles.modalItemTitle}>{translations.walletLabel}</Text>
                  <Text style={styles.modalItemSubtitle}>{translations.viewWalletBalance}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalItem}
                onPress={() => {
                  setFabModalVisible(false);
                  navigation.navigate('WorkingMemberNotice');
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.modalItemIcon, { backgroundColor: '#8b5cf6' }]}>
                  <MaterialIcons name="announcement" size={22} color="#ffffff" />
                </View>
                <View style={styles.modalItemTextContainer}>
                  <Text style={styles.modalItemTitle}>{translations.viewNotices}</Text>
                  <Text style={styles.modalItemSubtitle}>{translations.checkUpdates}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalItem}
                onPress={() => {
                  setFabModalVisible(false);
                  navigation.navigate('WorkingMemberComplaint');
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.modalItemIcon, { backgroundColor: '#ef4444' }]}>
                  <MaterialIcons name="report-problem" size={22} color="#ffffff" />
                </View>
                <View style={styles.modalItemTextContainer}>
                  <Text style={styles.modalItemTitle}>{translations.submitComplaint}</Text>
                  <Text style={styles.modalItemSubtitle}>{translations.reportIssue}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalItem}
                onPress={() => {
                  setFabModalVisible(false);
                  navigation.navigate('WorkingMemberSuggestion');
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.modalItemIcon, { backgroundColor: '#f59e0b' }]}>
                  <MaterialIcons name="lightbulb" size={22} color="#ffffff" />
                </View>
                <View style={styles.modalItemTextContainer}>
                  <Text style={styles.modalItemTitle}>{translations.submitSuggestion}</Text>
                  <Text style={styles.modalItemSubtitle}>{translations.shareIdeas}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalItem}
                onPress={() => {
                  setFabModalVisible(false);
                  navigation.navigate('WorkingMemberCompany');
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.modalItemIcon, { backgroundColor: '#10b981' }]}>
                  <MaterialIcons name="business" size={22} color="#ffffff" />
                </View>
                <View style={styles.modalItemTextContainer}>
                  <Text style={styles.modalItemTitle}>{translations.companyInfo}</Text>
                  <Text style={styles.modalItemSubtitle}>{translations.viewCompanyDetails}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setFabModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCloseButtonText}>{translations.closeButton}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Referral Modal */}
      <ReferralModal />
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
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  headerCard: {
    backgroundColor: '#8b5cf6',
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
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  profileIcon: {
    width: 64,
    height: 64,
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
    width: 64,
    height: 64,
    borderRadius: 40,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  quickActionIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  badgeText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 9,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  quickActionText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: 9,
    marginTop: 3,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  // Level Card (Donation ONLY)
  levelCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  levelBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelBadgeEmoji: {
    fontSize: 22,
  },
  levelTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 18,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  levelCommissionContainer: {
    alignItems: 'flex-end',
  },
  levelCommissionText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 13,
    color: '#10b981',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  levelCommissionSubtext: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#8b5cf6',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  progressSection: {
    marginBottom: 8,
  },
  progressLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  progressLabel: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  progressPercentage: {
    fontFamily: Fonts.SemiBold,
    fontSize: 11,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressSubtext: {
    fontFamily: Fonts.Regular,
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  nextLevelInfo: {
    marginTop: 4,
    marginBottom: 10,
  },
  nextLevelText: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  nextLevelHighlight: {
    fontFamily: Fonts.SemiBold,
  },
  eligibleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  eligibleText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 11,
    color: '#10b981',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  maxLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 10,
    paddingVertical: 6,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
  },
  maxLevelText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 13,
    color: '#92400e',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  memberCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  memberCountItem: {
    alignItems: 'center',
  },
  memberCountNumber: {
    fontFamily: Fonts.Bold,
    fontSize: 18,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  memberCountLabel: {
    fontFamily: Fonts.Regular,
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  memberCountDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  // Stats Grid
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
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
  // Wallet Card
  walletCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  walletContent: {
    gap: 8,
  },
  walletBalance: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  walletBalanceLabel: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  walletBalanceAmount: {
    fontFamily: Fonts.Bold,
    fontSize: 24,
    color: '#10b981',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  walletStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  walletStat: {
    alignItems: 'center',
  },
  walletStatValue: {
    fontFamily: Fonts.Bold,
    fontSize: 14,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  walletStatLabel: {
    fontFamily: Fonts.Regular,
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  walletStatDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  // Referral Card
  referralCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  referralHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  referralHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  referralTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  referralContent: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  referralCodeDisplay: {
    fontFamily: Fonts.Bold,
    fontSize: 20,
    color: '#f59e0b',
    letterSpacing: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  referralNoCode: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  referralSubtext: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  // Referral Modal
  referralModalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '80%',
    marginTop: 'auto',
  },
  referralModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  referralModalTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 20,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  referralModalContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  referralModalLabel: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  referralCodeContainer: {
    backgroundColor: '#fef3c7',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f59e0b',
    marginBottom: 12,
  },
  referralCodeLarge: {
    fontFamily: Fonts.Bold,
    fontSize: 28,
    color: '#f59e0b',
    letterSpacing: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  referralModalSubtext: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  referralModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  referralModalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  referralShareButton: {
    backgroundColor: '#f59e0b',
  },
  referralCopyButton: {
    backgroundColor: '#10b981',
  },
  referralModalButtonText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  referralModalNoCode: {
    fontFamily: Fonts.SemiBold,
    fontSize: 18,
    color: '#1f2937',
    marginBottom: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  referralGenerateButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF7722',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
    width: '100%',
    marginTop: 8,
  },
  referralGenerateButtonText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  referralModalClose: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    marginTop: 12,
  },
  referralModalCloseText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  // Recent Section
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
    color: '#8b5cf6',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  activityItem: {
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
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activityItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  activityItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityItemTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  activityItemSubtitle: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  activityItemDate: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#9ca3af',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
  },
  emptyStateText: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#9ca3af',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  emptyStateSubtext: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#d1d5db',
    marginTop: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  bottomSpacing: {
    height: 20,
  },

  // ============ DOWNLINE STYLES ============
  downlineSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  downlineSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  downlineSectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  downlineSectionTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 18,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  downlineSectionSubtitle: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  downlineContainer: {
    gap: 10,
  },
  downlineCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  downlineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  downlineHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  downlineAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downlineAvatarText: {
    fontFamily: Fonts.Bold,
    fontSize: 18,
  },
  downlineName: {
    fontFamily: Fonts.SemiBold,
    fontSize: 15,
    color: '#1f2937',
  },
  downlineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  downlineWorkingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf615',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  downlineWorkingText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 9,
    color: '#8b5cf6',
  },
  downlineLevel: {
    fontFamily: Fonts.Regular,
    fontSize: 10,
    color: '#6b7280',
  },
  downlineMemberCount: {
    fontFamily: Fonts.Regular,
    fontSize: 10,
    color: '#6b7280',
  },
  downlineHeaderRight: {
    paddingLeft: 8,
  },

  downlineMembersContainer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  downlineMemberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  
  downlineMemberIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  downlineMemberInfo: {
    flex: 1,
  },
  downlineMemberName: {
    fontFamily: Fonts.SemiBold,
    fontSize: 13,
    color: '#1f2937',
  },
  downlineMemberDetails: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#6b7280',
  },
  downlineMemberDate: {
    fontFamily: Fonts.Regular,
    fontSize: 10,
    color: '#9ca3af',
  },
  downlineNoMembers: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 10,
  },
  downlineLoadingContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  downlineLoadingText: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
  },
  downlineEmptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  downlineEmptyText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
    marginTop: 8,
  },
  downlineEmptySubtext: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },

  // FAB Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalContent: {
    width: '100%',
  },
  modalTitle: {
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
  pendingBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pendingBadgeText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 11,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  modalCloseButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    marginTop: 8,
  },
  modalCloseButtonText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});