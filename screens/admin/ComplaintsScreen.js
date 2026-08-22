import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db } from '../../config/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Fonts } from '../../config/fonts';
import { useLanguage } from '../../context/LanguageContext';

export default function ComplaintsScreen({ navigation }) {
  const { t, counter } = useLanguage();
  
  // Force re-render when language changes
  const renderKey = `complaints-${counter}`;

  // Get translations
  const getTranslations = () => ({
    complaints: t('complaints.title') || 'Complaints',
    searchComplaints: t('complaints.search') || 'Search complaints...',
    total: t('complaints.total') || 'Total',
    pending: t('common.pending') || 'Pending',
    resolved: t('complaints.resolved') || 'Resolved',
    rejected: t('complaints.rejected') || 'Rejected',
    noComplaints: t('complaints.noComplaints') || 'No complaints',
    noComplaintsSubtext: t('complaints.noComplaintsSubtext') || 'Complaints from members will appear here',
    complaintDetails: t('complaints.details') || 'Complaint Details',
    description: t('common.description') || 'Description',
    category: t('common.category') || 'Category',
    created: t('common.created') || 'Created',
    createdBy: t('common.createdBy') || 'Created By',
    anonymous: t('common.anonymous') || 'Anonymous',
    resolve: t('complaints.resolve') || 'Resolve',
    reopen: t('complaints.reopen') || 'Reopen',
    reject: t('common.reject') || 'Reject',
    delete: t('common.delete') || 'Delete',
    general: t('common.general') || 'General',
    medium: t('common.medium') || 'medium',
    success: t('common.success') || 'Success',
    error: t('common.error') || 'Error',
    complaintDeleted: t('complaints.deleted') || 'Complaint deleted successfully',
    statusUpdated: t('complaints.statusUpdated') || 'Status updated to {status}',
    confirmDelete: t('complaints.confirmDelete') || 'Are you sure you want to delete this complaint?',
    cancel: t('common.cancel') || 'Cancel',
    all: t('common.all') || 'All',
    nA: t('common.nA') || 'N/A',
    active: t('common.active') || 'active',
    high: t('common.high') || 'high',
    low: t('common.low') || 'low',
  });

  const translations = getTranslations();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setupRealtimeListeners();
  }, []);

  const setupRealtimeListeners = () => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'complaints'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const complaintsList = [];
        snapshot.forEach((doc) => {
          complaintsList.push({ id: doc.id, ...doc.data() });
        });
        setComplaints(complaintsList);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  };

  const handleDelete = async (id) => {
    Alert.alert(
      translations.delete,
      translations.confirmDelete,
      [
        { text: translations.cancel, style: 'cancel' },
        {
          text: translations.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'complaints', id));
              Alert.alert(translations.success, translations.complaintDeleted);
            } catch (error) {
              Alert.alert(translations.error, error.message);
            }
          }
        }
      ]
    );
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateDoc(doc(db, 'complaints', id), { 
        status, 
        updatedAt: new Date().toISOString() 
      });
      Alert.alert(translations.success, translations.statusUpdated.replace('{status}', status));
    } catch (error) {
      Alert.alert(translations.error, error.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'resolved': return '#FF7722';
      case 'closed': return '#6b7280';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getFilteredItems = () => {
    let items = complaints;
    if (filterStatus !== 'All') {
      items = items.filter(item => item.status === filterStatus.toLowerCase());
    }
    if (searchQuery) {
      items = items.filter(item => 
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return items;
  };

  const StatCard = ({ label, count, icon, color, active, onPress }) => (
    <TouchableOpacity 
      style={[styles.statCard, active && styles.statCardActive]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.statIconCircle, { backgroundColor: color + '15' }]}>
        <MaterialIcons name={icon} size={16} color={color} />
      </View>
      <Text style={styles.statType} numberOfLines={1}>{label}</Text>
      <Text style={[styles.statCount, { color }]}>{count}</Text>
    </TouchableOpacity>
  );

  const ComplaintCard = ({ item }) => {
    const statusColor = getStatusColor(item.status);
    const priorityColor = getPriorityColor(item.priority);
    
    return (
      <TouchableOpacity 
        style={styles.itemCard}
        onPress={() => {
          setSelectedItem(item);
          setDetailModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.itemHeader}>
          <View style={styles.itemTitleContainer}>
            <View style={[styles.itemIcon, { backgroundColor: statusColor + '15' }]}>
              <MaterialIcons name="report-problem" size={18} color={statusColor} />
            </View>
            <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
          </View>
          <View style={[styles.itemStatusBadge, { backgroundColor: statusColor + '15' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.itemStatusText, { color: statusColor }]}>{item.status || translations.pending.toLowerCase()}</Text>
          </View>
        </View>

        <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text>

        <View style={styles.itemFooter}>
          <View style={styles.itemMeta}>
            <View style={styles.metaTag}>
              <MaterialIcons name="folder" size={12} color="#6b7280" />
              <Text style={styles.itemCategory}>{item.category || translations.general}</Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '15' }]}>
              <MaterialIcons name="flag" size={12} color={priorityColor} />
              <Text style={[styles.priorityText, { color: priorityColor }]}>
                {item.priority || translations.medium}
              </Text>
            </View>
          </View>
          <Text style={styles.itemDate}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : translations.nA}
          </Text>
        </View>

        <View style={styles.itemActions}>
          {item.status === 'pending' && (
            <TouchableOpacity 
              style={[styles.itemActionButton, styles.itemResolveButton]}
              onPress={() => handleStatusUpdate(item.id, 'resolved')}
              activeOpacity={0.7}
            >
              <MaterialIcons name="check-circle" size={12} color="#ffffff" />
              <Text style={styles.itemActionText}>{translations.resolve}</Text>
            </TouchableOpacity>
          )}
          {item.status === 'resolved' && (
            <TouchableOpacity 
              style={[styles.itemActionButton, styles.itemReopenButton]}
              onPress={() => handleStatusUpdate(item.id, 'pending')}
              activeOpacity={0.7}
            >
              <MaterialIcons name="refresh" size={12} color="#ffffff" />
              <Text style={styles.itemActionText}>{translations.reopen}</Text>
            </TouchableOpacity>
          )}
          {item.status !== 'rejected' && (
            <TouchableOpacity 
              style={[styles.itemActionButton, styles.itemRejectButton]}
              onPress={() => handleStatusUpdate(item.id, 'rejected')}
              activeOpacity={0.7}
            >
              <MaterialIcons name="block" size={12} color="#ffffff" />
              <Text style={styles.itemActionText}>{translations.reject}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.itemActionButton, styles.itemDeleteButton]}
            onPress={() => handleDelete(item.id)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="delete" size={12} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container} key={renderKey}>
      {/* Saffron Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{translations.complaints}</Text>
          <View style={styles.placeholderButton} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder={translations.searchComplaints}
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlignVertical="center"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScrollContent}>
            <StatCard 
              label={translations.total} 
              count={complaints.length} 
              icon="list" 
              color="#ffffff" 
              active={filterStatus === 'All'}
              onPress={() => setFilterStatus('All')}
            />
            <StatCard 
              label={translations.pending} 
              count={complaints.filter(i => i.status === 'pending').length} 
              icon="pending" 
              color="#ffffff"
              active={filterStatus === 'Pending'}
              onPress={() => setFilterStatus('Pending')}
            />
            <StatCard 
              label={translations.resolved} 
              count={complaints.filter(i => i.status === 'resolved').length} 
              icon="done" 
              color="#ffffff"
              active={filterStatus === 'Resolved'}
              onPress={() => setFilterStatus('Resolved')}
            />
            <StatCard 
              label={translations.rejected} 
              count={complaints.filter(i => i.status === 'rejected').length} 
              icon="block" 
              color="#ffffff"
              active={filterStatus === 'Rejected'}
              onPress={() => setFilterStatus('Rejected')}
            />
          </ScrollView>
        </View>
      </View>

      {/* Content */}
      <FlatList
        data={getFilteredItems()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ComplaintCard item={item} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF7722']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="report-problem" size={44} color="#d1d5db" />
            <Text style={styles.emptyStateText}>{translations.noComplaints}</Text>
            <Text style={styles.emptyStateSubtext}>{translations.noComplaintsSubtext}</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Detail View Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.detailModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{translations.complaintDetails}</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {selectedItem && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailTitle}>{selectedItem.title}</Text>
                  <View style={styles.detailStatusRow}>
                    <View style={[styles.detailStatusBadge, { backgroundColor: getStatusColor(selectedItem.status) + '15' }]}>
                      <Text style={[styles.detailStatusText, { color: getStatusColor(selectedItem.status) }]}>
                        {selectedItem.status || translations.pending.toLowerCase()}
                      </Text>
                    </View>
                    <View style={[styles.detailPriorityBadge, { backgroundColor: getPriorityColor(selectedItem.priority) + '15' }]}>
                      <MaterialIcons name="flag" size={14} color={getPriorityColor(selectedItem.priority)} />
                      <Text style={[styles.detailPriorityText, { color: getPriorityColor(selectedItem.priority) }]}>
                        {selectedItem.priority || translations.medium}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.description}</Text>
                  <Text style={styles.detailValue}>{selectedItem.description}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.category}</Text>
                  <Text style={styles.detailValue}>{selectedItem.category || translations.general}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.created}</Text>
                  <Text style={styles.detailValue}>
                    {selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleString() : translations.nA}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.createdBy}</Text>
                  <Text style={styles.detailValue}>{selectedItem.createdByName || translations.anonymous}</Text>
                </View>

                <View style={styles.detailActions}>
                  {selectedItem.status === 'pending' && (
                    <TouchableOpacity 
                      style={[styles.detailActionButton, styles.detailResolveButton]}
                      onPress={() => {
                        setDetailModalVisible(false);
                        handleStatusUpdate(selectedItem.id, 'resolved');
                      }}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="check-circle" size={16} color="#ffffff" />
                      <Text style={styles.detailActionText}>{translations.resolve}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={[styles.detailActionButton, styles.detailDeleteButton]}
                    onPress={() => {
                      setDetailModalVisible(false);
                      handleDelete(selectedItem.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="delete" size={16} color="#ffffff" />
                    <Text style={styles.detailActionText}>{translations.delete}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf8f3',
  },
  headerCard: {
    backgroundColor: '#FF7722',
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
    marginBottom: 12,
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
  placeholderButton: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 12,
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
  statsWrapper: {
    marginBottom: 4,
  },
  statsScrollContent: {
    gap: 8,
    alignItems: 'center',
    paddingVertical: 2,
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 6,
    minWidth: 70,
    width: 75,
    alignItems: 'center',
    justifyContent: 'center',
    height: 58,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statCardActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderColor: '#ffffff',
  },
  statIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  statType: {
    fontFamily: Fonts.Regular,
    fontSize: 8,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  statCount: {
    fontFamily: Fonts.Bold,
    fontSize: 13,
    color: '#ffffff',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 4,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  itemStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  itemStatusText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 10,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  itemDescription: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemCategory: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  priorityText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 10,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  itemDate: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#9ca3af',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 4,
  },
  itemActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
    gap: 4,
  },
  itemResolveButton: {
    backgroundColor: '#FF7722',
  },
  itemReopenButton: {
    backgroundColor: '#06b6d4',
  },
  itemRejectButton: {
    backgroundColor: '#ef4444',
  },
  itemDeleteButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
  },
  itemActionText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: 10,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 12,
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
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  detailModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 20,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  detailHeader: {
    marginBottom: 16,
  },
  detailTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 20,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  detailStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  detailStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailStatusText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  detailPriorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  detailPriorityText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  detailSection: {
    marginBottom: 12,
  },
  detailLabel: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  detailValue: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  detailActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 8,
  },
  detailActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  detailResolveButton: {
    backgroundColor: '#FF7722',
  },
  detailDeleteButton: {
    backgroundColor: '#ef4444',
  },
  detailActionText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});