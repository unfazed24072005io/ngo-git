// screens/workingMember/WorkingMemberCommission.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
  Share
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db, getAuthInstance } from '../../config/firebase';

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  orderBy, 
  doc, 
  getDoc, 
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { Fonts } from '../../config/fonts';
import { getLevelDetails, getPrimaryCommission, getSecondaryCommission, LEVELS, getLevelByMemberCount } from '../../config/commissionLevels';
import { WalletService } from '../../services/WalletService';
import { CommissionService } from '../../services/CommissionService';
import { useLanguage } from '../../context/LanguageContext';

const { width } = Dimensions.get('window');

export default function WorkingMemberCommission({ navigation }) {
  const { t, counter } = useLanguage();
  
  // Force re-render when language changes
  const renderKey = `working-commission-${counter}`;

  // Get translations - EVERY SINGLE TEXT STRING is mapped to a translation key
  const translations = {
    // Common
    error: t('common.error') || 'Error',
    loading: t('common.loading') || 'Loading...',
    nA: t('common.nA') || 'N/A',
    close: t('common.close') || 'Close',
    cancel: t('common.cancel') || 'Cancel',
    
    // Header
    commissions: t('commission.management') || 'Commissions',
    searchCommissions: 'Search commissions...',
    
    // Stats
    totalEarned: t('commission.totalEarned') || 'Total Earned',
    pending: t('commission.pending') || 'Pending',
    paid: t('commission.paid') || 'Paid',
    thisMonth: t('commission.thisMonth') || 'This Month',
    lastMonth: t('commission.lastMonth') || 'Last Month',
    total: t('common.total') || 'Total',
    
    // Commission Types
    primaryCommission: t('commission.primaryCommission') || 'Primary Commission',
    secondaryCommission: t('commission.secondaryCommission') || 'Secondary Commission',
    donationCommission: t('commission.donationCommission') || 'Donation Commission',
    primary: t('commission.primary') || 'Primary',
    secondary: t('commission.secondary') || 'Secondary',
    donations: t('commission.donations') || 'Donations',
    
    // Donation Commission Card
    donationCommissions: t('commission.donationCommission') || 'Donation Commissions',
    donationSubtitle: 'Earned from members\' donations',
    totalEarnedLabel: t('commission.totalEarned') || 'Total Earned',
    transactions: t('commission.transactions') || 'Transactions',
    
    // Summary
    primaryCommissionsLabel: t('commission.primaryCommission') || 'Primary Commissions',
    secondaryCommissionsLabel: t('commission.secondaryCommission') || 'Secondary Commissions',
    transactionsCount: '{count} transactions',
    
    // Filter
    all: t('common.all') || 'All',
    
    // Commission Card
    memberRegistration: 'Member registration',
    uplineReferral: 'Upline referral',
    paidStatus: t('commission.paid') || 'Paid',
    pendingStatus: t('commission.pending') || 'Pending',
    
    // Modal
    commissionDetails: 'Commission Details',
    commissionBreakdown: 'Commission Breakdown',
    type: t('common.type') || 'Type',
    level: t('common.level') || 'Level',
    commissionRate: 'Commission Rate',
    source: 'Source',
    appliedRate: 'Applied Rate',
    commissionAmount: t('commission.commissionAmount') || 'Commission Amount',
    description: t('common.description') || 'Description',
    metadata: 'Metadata',
    transactionId: t('commission.transactionId') || 'Transaction ID',
    created: t('common.created') || 'Created',
    reference: 'Reference',
    memberDonation: 'Member Donation',
    differenceBased: 'Difference-based (Primary Difference)',
    primaryRate: 'Primary Rate',
    secondaryRate: 'Secondary Rate (Difference)',
    
    // Share
    myCommissionReport: 'My Commission Report',
    keepReferring: '🚀 Keep referring more members to earn more!',
    
    // Empty State
    noCommissions: 'No commissions found',
    tryAdjustingSearch: 'Try adjusting your search',
    registerMembersOrGetDonations: 'Register members or get donation commissions',
    
    // Loading
    loadingCommissions: 'Loading commissions...',
    
    // Donation
    donationCommissionLabel: 'Donation Commission',
    donationSource: 'Member Donation',
    
    // Status
    paidStatusLabel: t('commission.paid') || 'Paid',
    pendingStatusLabel: t('commission.pending') || 'Pending',
    
    // Difference
    differenceLabel: 'Difference from previous level',
  };

  const [commissions, setCommissions] = useState([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [pendingCommission, setPendingCommission] = useState(0);
  const [paidCommission, setPaidCommission] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [userLevel, setUserLevel] = useState('I');
  const [userData, setUserData] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showStats, setShowStats] = useState(true);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [donationCommissionTotal, setDonationCommissionTotal] = useState(0);
  const [donationCommissionCount, setDonationCommissionCount] = useState(0);
  const [commissionSummary, setCommissionSummary] = useState({
    primaryTotal: 0,
    secondaryTotal: 0,
    donationTotal: 0,
    primaryCount: 0,
    secondaryCount: 0,
    donationCount: 0,
    thisMonth: 0,
    lastMonth: 0
  });

  useEffect(() => {
    fetchUserData();
    setupRealtimeListener();
    fetchUserProfile();
    calculateMonthlyEarnings();
    fetchDonationCommissionTotal();
  }, []);

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
        setUserLevel(data.level || 'I');
        setProfilePhoto(data.profilePhoto || null);
        setDonationCommissionTotal(data.totalDonationCommission || 0);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
    const auth = getAuthInstance();

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
  const auth = getAuthInstance();

    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const q = query(
      collection(db, 'walletTransactions'),
      where('userId', '==', userId),
      where('type', 'in', ['primary_commission', 'secondary_commission']),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commissionsList = [];
      let total = 0;
      let pending = 0;
      let paid = 0;
      let primaryTotal = 0;
      let secondaryTotal = 0;
      let primaryCount = 0;
      let secondaryCount = 0;
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
        
        const isDonation = data.description?.toLowerCase().includes('donation') || false;
        
        const commission = { 
          id: doc.id, 
          ...data,
          title: data.type === 'primary_commission' ? translations.primaryCommission : translations.secondaryCommission,
          description: data.description || '',
          status: data.status || 'pending',
          amount: data.amount || 0,
          type: data.type === 'primary_commission' ? 'primary' : 'secondary',
          createdAt: createdAt,
          date: createdAt,
          isDonation: isDonation
        };
        
        commissionsList.push(commission);
        
        if (data.status === 'paid' || data.status === 'completed') {
          total += data.amount || 0;
          paid += data.amount || 0;
        } else {
          pending += data.amount || 0;
        }
        
        if (data.type === 'primary_commission') {
          primaryTotal += data.amount || 0;
          primaryCount++;
        } else if (data.type === 'secondary_commission') {
          secondaryTotal += data.amount || 0;
          secondaryCount++;
        }
      });
      
      setCommissions(commissionsList);
      setTotalEarned(total);
      setPendingCommission(pending);
      setPaidCommission(paid);
      setCommissionSummary(prev => ({
        ...prev,
        primaryTotal,
        secondaryTotal,
        primaryCount,
        secondaryCount
      }));
      setLoading(false);
    });

    return () => unsubscribe();
  };

  const fetchDonationCommissionTotal = async () => {

    try {
    const auth = getAuthInstance();

      const userId = auth.currentUser?.uid;
      if (!userId) return;
      
      const q = query(
        collection(db, 'commissionLogs'),
        where('workingMemberId', '==', userId),
        where('type', '==', 'donation_commission')
      );
      
      const snapshot = await getDocs(q);
      let total = 0;
      let count = 0;
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        total += data.commissionAmount || 0;
        count++;
      });
      
      setDonationCommissionTotal(total);
      setDonationCommissionCount(count);
      setCommissionSummary(prev => ({
        ...prev,
        donationTotal: total,
        donationCount: count
      }));
    } catch (error) {
      console.error('Error fetching donation commission total:', error);
    }
  };

  const calculateMonthlyEarnings = async () => {
    try {
    const auth = getAuthInstance();

      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const q = query(
        collection(db, 'walletTransactions'),
        where('userId', '==', userId),
        where('type', 'in', ['primary_commission', 'secondary_commission']),
        where('status', 'in', ['completed', 'paid'])
      );

      const snapshot = await getDocs(q);
      let thisMonth = 0;
      let lastMonth = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
        if (createdAt >= startOfMonth) {
          thisMonth += data.amount || 0;
        } else if (createdAt >= startOfLastMonth && createdAt < startOfMonth) {
          lastMonth += data.amount || 0;
        }
      });

      setMonthlyEarnings(thisMonth);
      setCommissionSummary(prev => ({
        ...prev,
        thisMonth,
        lastMonth
      }));
    } catch (error) {
      console.error('Error calculating monthly earnings:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    await calculateMonthlyEarnings();
    await fetchDonationCommissionTotal();
    setRefreshing(false);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const getCommissionTypeColor = (type) => {
    if (type === 'primary') return '#8b5cf6';
    if (type === 'secondary') return '#10b981';
    if (type === 'donation') return '#f59e0b';
    return '#6b7280';
  };

  const getCommissionTypeIcon = (type) => {
    if (type === 'primary') return 'person-add';
    if (type === 'secondary') return 'share';
    if (type === 'donation') return 'volunteer-activism';
    return 'attach-money';
  };

  const getFilteredCommissions = () => {
    let filtered = commissions;
    
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterType === 'primary') {
      filtered = filtered.filter(c => c.type === 'primary' && !c.isDonation);
    } else if (filterType === 'secondary') {
      filtered = filtered.filter(c => c.type === 'secondary');
    } else if (filterType === 'donation') {
      filtered = filtered.filter(c => c.isDonation);
    }

    if (filterStatus === 'paid') {
      filtered = filtered.filter(c => c.status === 'paid' || c.status === 'completed');
    } else if (filterStatus === 'pending') {
      filtered = filtered.filter(c => c.status === 'pending' || c.status === 'partially_paid');
    }

    return filtered;
  };

  const handleShare = async () => {
    try {
      const levelDetails = getLevelDetails(userLevel);
      const message = 
        `📊 ${translations.myCommissionReport}\n\n` +
        `🎯 ${translations.level}: ${levelDetails.title}\n` +
        `💰 ${translations.totalEarned}: ₹${totalEarned.toLocaleString()}\n` +
        `📈 ${translations.thisMonth}: ₹${monthlyEarnings.toLocaleString()}\n` +
        `⏳ ${translations.pending}: ₹${pendingCommission.toLocaleString()}\n` +
        `✅ ${translations.paid}: ₹${paidCommission.toLocaleString()}\n` +
        `📋 ${translations.primary}: ₹${commissionSummary.primaryTotal.toLocaleString()} (${commissionSummary.primaryCount} txns)\n` +
        `🔄 ${translations.secondary}: ₹${commissionSummary.secondaryTotal.toLocaleString()} (${commissionSummary.secondaryCount} txns)\n` +
        `❤️ ${translations.donationCommission}: ₹${commissionSummary.donationTotal.toLocaleString()} (${commissionSummary.donationCount} txns)\n\n` +
        translations.keepReferring;
      
      await Share.share({
        message: message,
        title: translations.myCommissionReport
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const StatCard = ({ label, count, icon, color }) => (
    <View style={[styles.statCard]}>
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <MaterialIcons name={icon} size={16} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={[styles.statValue, { color }]}>₹{count.toLocaleString()}</Text>
      </View>
    </View>
  );

  const CommissionCard = ({ item }) => {
    const isDonation = item.isDonation || false;
    const type = isDonation ? 'donation' : item.type;
    const color = getCommissionTypeColor(type);
    const icon = getCommissionTypeIcon(type);
    const isPrimary = item.type === 'primary' && !isDonation;
    const isPaid = item.status === 'paid' || item.status === 'completed';
    
    let levelDetails = null;
    let levelName = '';
    if (item.levelId) {
      levelDetails = getLevelDetails(item.levelId);
      levelName = levelDetails?.title || '';
    }

    let title = isPrimary ? translations.primaryCommission : translations.secondaryCommission;
    if (isDonation) {
      title = translations.donationCommission;
    }

    // Get primary and secondary rates for display
    let primaryRate = 0;
    let secondaryRate = 0;
    if (item.levelId && !isDonation) {
      primaryRate = getPrimaryCommission(item.levelId);
      secondaryRate = getSecondaryCommission(item.levelId);
    }

    return (
      <TouchableOpacity 
        style={[styles.commissionCard, !isPaid && styles.commissionCardPending, isDonation && styles.commissionCardDonation]}
        onPress={() => {
          setSelectedCommission(item);
          setDetailModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.commissionHeader}>
          <View style={[styles.commissionIcon, { backgroundColor: color + '15' }]}>
            <MaterialIcons name={icon} size={18} color={color} />
          </View>
          <View style={styles.commissionInfo}>
            <Text style={styles.commissionTitle}>
              {title}
              {item.level && !isDonation ? ` (${translations.level} ${item.level})` : ''}
            </Text>
            <Text style={styles.commissionDescription} numberOfLines={1}>
              {item.description || (isPrimary ? translations.memberRegistration : isDonation ? translations.donationCommissionLabel : translations.uplineReferral)}
            </Text>
          </View>
          <View style={[styles.commissionStatus, { backgroundColor: isPaid ? '#10b981' : '#f59e0b' }]}>
            <Text style={styles.commissionStatusText}>
              {isPaid ? translations.paidStatusLabel : translations.pendingStatusLabel}
            </Text>
          </View>
        </View>
        
        <View style={styles.commissionFooter}>
          <View>
            <Text style={[styles.commissionAmount, isDonation && styles.donationAmount]}>
              ₹{item.amount?.toLocaleString() || 0}
            </Text>
            {levelName && !isDonation && (
              <Text style={styles.commissionLevel}>
                {translations.primary}: {primaryRate}% | {translations.secondary}: {secondaryRate}%
              </Text>
            )}
            {isDonation && (
              <Text style={styles.donationLabel}>
                ❤️ {translations.donationCommissionLabel}
              </Text>
            )}
          </View>
          <Text style={styles.commissionDate}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : translations.nA}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const CommissionDetailModal = () => {
    if (!selectedCommission) return null;
    
    const isDonation = selectedCommission.isDonation || false;
    const type = isDonation ? 'donation' : selectedCommission.type;
    const color = getCommissionTypeColor(type);
    const icon = getCommissionTypeIcon(type);
    const isPrimary = selectedCommission.type === 'primary' && !isDonation;
    const isPaid = selectedCommission.status === 'paid' || selectedCommission.status === 'completed';

    let levelDetails = null;
    let primaryRate = 0;
    let secondaryRate = 0;
    if (selectedCommission.levelId && !isDonation) {
      levelDetails = getLevelDetails(selectedCommission.levelId);
      primaryRate = getPrimaryCommission(selectedCommission.levelId);
      secondaryRate = getSecondaryCommission(selectedCommission.levelId);
    }

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{translations.commissionDetails}</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)} activeOpacity={0.7}>
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.detailHeader}>
                <View style={[styles.detailIcon, { backgroundColor: color + '15' }]}>
                  <MaterialIcons name={icon} size={28} color={color} />
                </View>
                <View style={styles.detailTitleContainer}>
                  <Text style={styles.detailTitle}>
                    {isDonation ? translations.donationCommission : 
                     isPrimary ? translations.primaryCommission : `${translations.secondaryCommission}${selectedCommission.level ? ` (${translations.level} ${selectedCommission.level})` : ''}`}
                  </Text>
                  <View style={[styles.detailStatus, { backgroundColor: isPaid ? '#10b981' : '#f59e0b' }]}>
                    <Text style={styles.detailStatusText}>
                      {isPaid ? translations.paidStatusLabel : translations.pendingStatusLabel}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.breakdownCard}>
                <Text style={styles.breakdownTitle}>{translations.commissionBreakdown}</Text>
                
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{translations.type}</Text>
                  <Text style={styles.breakdownValue}>
                    {isDonation ? translations.donations : isPrimary ? translations.primary : translations.secondary}
                  </Text>
                </View>
                
                {levelDetails && !isDonation && (
                  <>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>{translations.level}</Text>
                      <Text style={styles.breakdownValue}>
                        {selectedCommission.levelId} - {levelDetails.title}
                      </Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>{translations.primaryRate}</Text>
                      <Text style={styles.breakdownValue}>
                        {primaryRate}%
                      </Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>{translations.secondaryRate}</Text>
                      <Text style={styles.breakdownValue}>
                        {secondaryRate}% ({translations.differenceLabel})
                      </Text>
                    </View>
                  </>
                )}
                
                {isDonation && (
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{translations.source}</Text>
                    <Text style={styles.breakdownValue}>{translations.memberDonation}</Text>
                  </View>
                )}
                
                {selectedCommission.percentage && !isDonation && (
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{translations.appliedRate}</Text>
                    <Text style={styles.breakdownValue}>{selectedCommission.percentage}%</Text>
                  </View>
                )}
                
                {selectedCommission.previousRate !== undefined && !isDonation && (
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Previous Level Rate</Text>
                    <Text style={styles.breakdownValue}>{selectedCommission.previousRate}%</Text>
                  </View>
                )}
                
                <View style={[styles.breakdownRow, styles.totalRow]}>
                  <Text style={styles.breakdownLabel}>{translations.commissionAmount}</Text>
                  <Text style={[styles.breakdownValue, { color: isDonation ? '#f59e0b' : '#10b981', fontSize: 18 }]}>
                    ₹{selectedCommission.amount?.toLocaleString() || 0}
                  </Text>
                </View>
              </View>

              {selectedCommission.description && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>{translations.description}</Text>
                  <Text style={styles.detailSectionText}>{selectedCommission.description}</Text>
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>{translations.metadata}</Text>
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>{translations.transactionId}</Text>
                  <Text style={styles.metadataValue}>{selectedCommission.id?.slice(0, 12)}...</Text>
                </View>
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>{translations.created}</Text>
                  <Text style={styles.metadataValue}>
                    {selectedCommission.createdAt ? new Date(selectedCommission.createdAt).toLocaleString() : translations.nA}
                  </Text>
                </View>
                {selectedCommission.referenceId && (
                  <View style={styles.metadataRow}>
                    <Text style={styles.metadataLabel}>{translations.reference}</Text>
                    <Text style={styles.metadataValue}>{selectedCommission.referenceId}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setDetailModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.closeButtonText}>{translations.close}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const SummaryCard = ({ title, value, icon, color, subtitle }) => (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: color + '15' }]}>
        <MaterialIcons name={icon} size={18} color={color} />
      </View>
      <View style={styles.summaryContent}>
        <Text style={styles.summaryTitle}>{title}</Text>
        <Text style={[styles.summaryValue, { color }]}>₹{value.toLocaleString()}</Text>
        {subtitle && <Text style={styles.summarySubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  const MonthlyStats = () => (
    <View style={styles.monthlyStatsContainer}>
      <View style={styles.monthlyStat}>
        <Text style={styles.monthlyStatLabel}>{translations.thisMonth}</Text>
        <Text style={[styles.monthlyStatValue, { color: '#10b981' }]}>
          ₹{commissionSummary.thisMonth.toLocaleString()}
        </Text>
      </View>
      <View style={styles.monthlyDivider} />
      <View style={styles.monthlyStat}>
        <Text style={styles.monthlyStatLabel}>{translations.lastMonth}</Text>
        <Text style={[styles.monthlyStatValue, { color: '#8b5cf6' }]}>
          ₹{commissionSummary.lastMonth.toLocaleString()}
        </Text>
      </View>
      <View style={styles.monthlyDivider} />
      <View style={styles.monthlyStat}>
        <Text style={styles.monthlyStatLabel}>{translations.total}</Text>
        <Text style={[styles.monthlyStatValue, { color: '#f59e0b' }]}>
          ₹{(commissionSummary.thisMonth + commissionSummary.lastMonth).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  const DonationCommissionCard = () => (
    <View style={styles.donationCommissionCard}>
      <View style={styles.donationCommissionHeader}>
        <View style={styles.donationCommissionIcon}>
          <MaterialIcons name="volunteer-activism" size={22} color="#f59e0b" />
        </View>
        <View style={styles.donationCommissionContent}>
          <Text style={styles.donationCommissionTitle}>{translations.donationCommissions}</Text>
          <Text style={styles.donationCommissionSubtitle}>
            {translations.donationSubtitle}
          </Text>
        </View>
      </View>
      <View style={styles.donationCommissionStats}>
        <View style={styles.donationCommissionStat}>
          <Text style={styles.donationCommissionStatValue}>
            ₹{commissionSummary.donationTotal.toLocaleString()}
          </Text>
          <Text style={styles.donationCommissionStatLabel}>{translations.totalEarnedLabel}</Text>
        </View>
        <View style={styles.donationStatDivider} />
        <View style={styles.donationCommissionStat}>
          <Text style={styles.donationCommissionStatValue}>
            {commissionSummary.donationCount}
          </Text>
          <Text style={styles.donationCommissionStatLabel}>{translations.transactions}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer} key={renderKey}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>{translations.loadingCommissions}</Text>
      </View>
    );
  }

  const filteredCommissions = getFilteredCommissions();

  return (
    <View style={styles.container} key={renderKey}>
      {/* Purple Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
              <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{translations.commissions}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.7}>
              <MaterialIcons name="share" size={20} color="#ffffff" />
            </TouchableOpacity>
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

        {/* Search Bar inside header */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder={translations.searchCommissions}
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={handleSearch}
            textAlignVertical="center"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')} activeOpacity={0.7}>
              <MaterialIcons name="close" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Stat Cards inside header */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.statsContainer}
          contentContainerStyle={styles.statsContent}
        >
          <StatCard label={translations.totalEarned} count={totalEarned} icon="attach-money" color="#10b981" />
          <StatCard label={translations.pending} count={pendingCommission} icon="pending" color="#f59e0b" />
          <StatCard label={translations.paid} count={paidCommission} icon="check-circle" color="#8b5cf6" />
        </ScrollView>
      </View>

      {/* Donation Commission Card */}
      <DonationCommissionCard />

      {/* Monthly Stats */}
      <MonthlyStats />

      {/* Commission Summary */}
      <View style={styles.summaryContainer}>
        <SummaryCard 
          title={translations.primaryCommissionsLabel} 
          value={commissionSummary.primaryTotal} 
          icon="person-add" 
          color="#8b5cf6"
          subtitle={translations.transactionsCount.replace('{count}', commissionSummary.primaryCount)}
        />
        <SummaryCard 
          title={translations.secondaryCommissionsLabel} 
          value={commissionSummary.secondaryTotal} 
          icon="share" 
          color="#10b981"
          subtitle={translations.transactionsCount.replace('{count}', commissionSummary.secondaryCount)}
        />
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
            onPress={() => setFilterType('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, filterType === 'all' && styles.filterChipTextActive]}>{translations.all}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'primary' && styles.filterChipActive]}
            onPress={() => setFilterType('primary')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="person-add" size={12} color={filterType === 'primary' ? '#ffffff' : '#6b7280'} />
            <Text style={[styles.filterChipText, filterType === 'primary' && styles.filterChipTextActive]}>{translations.primary}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'secondary' && styles.filterChipActive]}
            onPress={() => setFilterType('secondary')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="share" size={12} color={filterType === 'secondary' ? '#ffffff' : '#6b7280'} />
            <Text style={[styles.filterChipText, filterType === 'secondary' && styles.filterChipTextActive]}>{translations.secondary}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'donation' && styles.filterChipActive]}
            onPress={() => setFilterType('donation')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="volunteer-activism" size={12} color={filterType === 'donation' ? '#ffffff' : '#6b7280'} />
            <Text style={[styles.filterChipText, filterType === 'donation' && styles.filterChipTextActive]}>{translations.donations}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === 'paid' && styles.filterChipActive]}
            onPress={() => setFilterStatus('paid')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="check-circle" size={12} color={filterStatus === 'paid' ? '#ffffff' : '#6b7280'} />
            <Text style={[styles.filterChipText, filterStatus === 'paid' && styles.filterChipTextActive]}>{translations.paid}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === 'pending' && styles.filterChipActive]}
            onPress={() => setFilterStatus('pending')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="pending" size={12} color={filterStatus === 'pending' ? '#ffffff' : '#6b7280'} />
            <Text style={[styles.filterChipText, filterStatus === 'pending' && styles.filterChipTextActive]}>{translations.pending}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Commissions List */}
      <FlatList
        data={filteredCommissions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CommissionCard item={item} />}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8b5cf6']} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="attach-money" size={44} color="#d1d5db" />
            <Text style={styles.emptyStateText}>{translations.noCommissions}</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? translations.tryAdjustingSearch : translations.registerMembersOrGetDonations}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Detail Modal */}
      <CommissionDetailModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    marginBottom: 16,
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
    fontSize: 22,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shareButton: {
    padding: 4,
  },
  profileIcon: {
    width: 64,
    height: 64,
    borderRadius: 50,
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
    borderRadius: 50,
  },

  // Search inside header
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: { 
    flex: 1, 
    fontFamily: Fonts.Regular,
    fontSize: 14, 
    color: '#1f2937',
    paddingVertical: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Stats inside header
  statsContainer: { 
    maxHeight: 72,
  },
  statsContent: { 
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 6,
    minWidth: 62,
    width: 68,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: 62,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statContent: { 
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  statLabel: { 
    fontFamily: Fonts.Regular,
    fontSize: 7, 
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  statValue: { 
    fontFamily: Fonts.Bold,
    fontSize: 13, 
    color: '#ffffff',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  statIcon: { 
    width: 22, 
    height: 22, 
    borderRadius: 11, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: 1,
  },

  // Donation Commission Card
  donationCommissionCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fef3c7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  donationCommissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  donationCommissionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  donationCommissionContent: {
    flex: 1,
  },
  donationCommissionTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 15,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  donationCommissionSubtitle: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  donationCommissionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  donationCommissionStat: {
    alignItems: 'center',
  },
  donationCommissionStatValue: {
    fontFamily: Fonts.Bold,
    fontSize: 18,
    color: '#f59e0b',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  donationCommissionStatLabel: {
    fontFamily: Fonts.Regular,
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  donationStatDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },

  // Monthly Stats
  monthlyStatsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  monthlyStat: {
    flex: 1,
    alignItems: 'center',
  },
  monthlyStatLabel: {
    fontFamily: Fonts.Regular,
    fontSize: 9,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  monthlyStatValue: {
    fontFamily: Fonts.Bold,
    fontSize: 15,
    marginTop: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  monthlyDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 6,
  },

  // Summary Container
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontFamily: Fonts.Regular,
    fontSize: 10,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  summaryValue: {
    fontFamily: Fonts.Bold,
    fontSize: 15,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  summarySubtitle: {
    fontFamily: Fonts.Regular,
    fontSize: 9,
    color: '#9ca3af',
    marginTop: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Filters
  filterContainer: {
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    marginRight: 6,
    gap: 3,
  },
  filterChipActive: {
    backgroundColor: '#8b5cf6',
  },
  filterChipText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 11,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 6,
  },

  commissionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  commissionCardPending: {
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  commissionCardDonation: {
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  commissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commissionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  commissionInfo: {
    flex: 1,
  },
  commissionTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 13,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  commissionDescription: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  commissionStatus: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  commissionStatusText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 9,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  commissionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  commissionAmount: {
    fontFamily: Fonts.Bold,
    fontSize: 15,
    color: '#10b981',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  donationAmount: {
    color: '#f59e0b',
  },
  donationLabel: {
    fontFamily: Fonts.Regular,
    fontSize: 9,
    color: '#f59e0b',
    marginTop: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  commissionLevel: {
    fontFamily: Fonts.Regular,
    fontSize: 9,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  commissionDate: {
    fontFamily: Fonts.Regular,
    fontSize: 10,
    color: '#9ca3af',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    maxHeight: '90%',
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
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Detail View
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailTitleContainer: {
    flex: 1,
  },
  detailTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 17,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  detailStatus: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  detailStatusText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 10,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Breakdown Card
  breakdownCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  breakdownTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 13,
    color: '#1f2937',
    marginBottom: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  breakdownLabel: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  breakdownValue: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
    marginTop: 4,
    paddingTop: 6,
  },

  // Detail Sections
  detailSection: {
    marginBottom: 12,
  },
  detailSectionTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  detailSectionText: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#1f2937',
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  metadataLabel: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  metadataValue: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  closeButton: {
    backgroundColor: '#6b7280',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: 13,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 10,
  },
  emptyStateText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  emptyStateSubtext: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
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
});