import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db, getAuthInstance } from '../../config/firebase';
import { collection, getDocs, query, where, doc, updateDoc, orderBy } from 'firebase/firestore';
import { Fonts } from '../../config/fonts';
import { useLanguage } from '../../context/LanguageContext';

export default function PendingApprovals({ navigation }) {
  const { t } = useLanguage();
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const getTranslations = () => ({
    pendingApprovals: t('admin.pendingApprovals') || 'Pending Approvals',
    noPending: t('admin.noPending') || 'No pending registrations',
    approve: t('admin.approve') || 'Approve',
    reject: t('admin.reject') || 'Reject',
    name: t('common.name') || 'Name',
    email: t('common.email') || 'Email',
    phone: t('common.phone') || 'Phone',
    registered: t('admin.registered') || 'Registered',
    paymentSkipped: t('admin.paymentSkipped') || 'Payment Skipped',
    reason: t('admin.reason') || 'Reason',
    error: t('common.error') || 'Error',
    failedToLoad: t('admin.failedToLoad') || 'Failed to load pending approvals',
    approved: t('admin.approved') || 'Approved successfully',
    rejected: t('admin.rejected') || 'Rejected successfully',
  });

  const translations = getTranslations();

  useEffect(() => {
    fetchPendingRegistrations();
  }, []);

  const fetchPendingRegistrations = async () => {
    setLoading(true);
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
      Alert.alert(translations.error, translations.failedToLoad);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPendingRegistrations();
  };

  const approveRegistration = async (user) => {
    const auth = getAuthInstance();
    setProcessingId(user.id);
    try {
      const userRef = doc(db, 'users', user.id);
      
      await updateDoc(userRef, {
        status: 'active',
        approvedAt: new Date().toISOString(),
        approvedBy: auth.currentUser?.uid,
      });
      
      Alert.alert('Success', `${user.fullName || user.name} ${translations.approved}`);
      
      // Remove from list
      setPendingRegistrations(prev => prev.filter(item => item.id !== user.id));
    } catch (error) {
      console.error('Error approving registration:', error);
      Alert.alert(translations.error, 'Failed to approve registration');
    } finally {
      setProcessingId(null);
    }
  };

  const rejectRegistration = async (user) => {
    const auth = getAuthInstance();
    setProcessingId(user.id);
    try {
      const userRef = doc(db, 'users', user.id);
      
      await updateDoc(userRef, {
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectedBy: auth.currentUser?.uid,
      });
      
      Alert.alert('Success', `${user.fullName || user.name} ${translations.rejected}`);
      
      // Remove from list
      setPendingRegistrations(prev => prev.filter(item => item.id !== user.id));
    } catch (error) {
      console.error('Error rejecting registration:', error);
      Alert.alert(translations.error, 'Failed to reject registration');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const PendingItem = ({ item }) => (
    <View style={styles.pendingItem}>
      <View style={styles.pendingItemHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            {item.profilePhoto ? (
              <Image source={{ uri: item.profilePhoto }} style={styles.avatarImage} />
            ) : (
              <MaterialIcons name="person" size={24} color="#FF7722" />
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.fullName || item.name || 'Unknown'}</Text>
            <Text style={styles.userEmail}>{item.email || 'No email'}</Text>
          </View>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Pending</Text>
        </View>
      </View>

      <View style={styles.userMeta}>
        <View style={styles.metaItem}>
          <MaterialIcons name="phone" size={16} color="#6b7280" />
          <Text style={styles.metaText}>{item.phone || 'N/A'}</Text>
        </View>
        <View style={styles.metaItem}>
          <MaterialIcons name="calendar-today" size={16} color="#6b7280" />
          <Text style={styles.metaText}>Registered: {formatDate(item.createdAt)}</Text>
        </View>
      </View>

      {item.paymentSkipped && (
        <View style={styles.paymentSkippedContainer}>
          <MaterialIcons name="warning" size={16} color="#f59e0b" />
          <Text style={styles.paymentSkippedText}>
            {translations.paymentSkipped}: {item.paymentSkippedReason || translations.reason}
          </Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => approveRegistration(item)}
          disabled={processingId === item.id}
          activeOpacity={0.7}
        >
          {processingId === item.id ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <MaterialIcons name="check" size={18} color="#ffffff" />
              <Text style={styles.actionButtonText}>{translations.approve}</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => rejectRegistration(item)}
          disabled={processingId === item.id}
          activeOpacity={0.7}
        >
          {processingId === item.id ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <MaterialIcons name="close" size={18} color="#ffffff" />
              <Text style={styles.actionButtonText}>{translations.reject}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{translations.pendingApprovals}</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{pendingRegistrations.length}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#FF7722']}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF7722" />
            <Text style={styles.loadingText}>Loading pending approvals...</Text>
          </View>
        ) : pendingRegistrations.length > 0 ? (
          pendingRegistrations.map((item) => (
            <PendingItem key={item.id} item={item} />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <MaterialIcons name="check-circle" size={64} color="#10b981" />
            </View>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>{translations.noPending}</Text>
          </View>
        )}
        
        {!loading && pendingRegistrations.length > 0 && (
          <Text style={styles.footerText}>
            Showing {pendingRegistrations.length} pending registration{pendingRegistrations.length > 1 ? 's' : ''}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf8f3',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
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
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  headerBadge: {
    backgroundColor: '#FF7722',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeText: {
    fontFamily: Fonts.Bold,
    fontSize: 14,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  
  // Pending Item
  pendingItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  pendingItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF772215',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  userEmail: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 11,
    color: '#92400e',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  userMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  paymentSkippedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  paymentSkippedText: {
    fontFamily: Fonts.Italic,
    fontSize: 12,
    color: '#92400e',
    marginLeft: 6,
    flex: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    gap: 6,
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Empty State
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 20,
    color: '#1f2937',
    marginBottom: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  emptySubtitle: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  footerText: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});