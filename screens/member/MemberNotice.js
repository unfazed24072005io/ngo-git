// screens/member/MemberNotice.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal, ActivityIndicator, RefreshControl, FlatList, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db, getAuthInstance } from '../../config/firebase';
import { collection, getDocs, addDoc, doc, query, where, orderBy, onSnapshot, updateDoc } from 'firebase/firestore';
import { Fonts } from '../../config/fonts';
import { useLanguage } from '../../context/LanguageContext';

const { width } = Dimensions.get('window');

export default function MemberNotice({ navigation }) {
  const { t, counter } = useLanguage();
  
  // Force re-render when language changes
  const renderKey = `member-notice-${counter}`;

  // Get translations - EVERY SINGLE TEXT STRING is mapped to a translation key
  const translations = {
    // Common
    error: t('common.error') || 'Error',
    success: t('common.success') || 'Success',
    loading: t('common.loading') || 'Loading...',
    nA: t('common.nA') || 'N/A',
    cancel: t('common.cancel') || 'Cancel',
    close: t('common.close') || 'Close',
    yes: t('common.yes') || 'Yes',
    no: t('common.no') || 'No',
    general: t('common.general') || 'General',
    pending: t('common.pending') || 'Pending',
    active: t('common.active') || 'Active',
    resolved: t('complaints.resolved') || 'Resolved',
    rejected: t('complaints.rejected') || 'Rejected',
    low: t('common.low') || 'Low',
    medium: t('common.medium') || 'Medium',
    high: t('common.high') || 'High',
    
    // Header
    communications: t('notices.title') || 'Communications',
    complaint: t('complaints.title') || 'Complaint',
    suggestion: t('suggestions.title') || 'Suggestion',
    notices: t('notices.title') || 'Notices',
    complaints: t('complaints.title') || 'Complaints',
    suggestions: t('suggestions.title') || 'Suggestions',
    
    // Search
    search: t('common.search') || 'Search...',
    
    // Stats
    total: t('common.total') || 'Total',
    
    // Tabs
    noticesTab: t('notices.title') || 'Notices',
    complaintsTab: t('complaints.title') || 'Complaints',
    suggestionsTab: t('suggestions.title') || 'Suggestions',
    
    // Empty State
    noNotices: t('notices.noNotices') || 'No notices',
    noNoticesSubtext: t('notices.noNoticesSubtext') || 'Check back later for updates',
    noComplaints: t('complaints.noComplaints') || 'No complaints',
    noComplaintsSubtext: t('complaints.noComplaintsSubtext') || 'Submit a complaint to get help',
    noSuggestions: t('suggestions.noSuggestions') || 'No suggestions',
    noSuggestionsSubtext: t('suggestions.noSuggestionsSubtext') || 'Share your suggestions to improve',
    submitComplaint: t('complaints.submit') || 'Submit Complaint',
    submitSuggestion: t('suggestions.submit') || 'Submit Suggestion',
    
    // Modal
    submitComplaintTitle: t('complaints.submit') || 'Submit Complaint',
    submitSuggestionTitle: t('suggestions.submit') || 'Submit Suggestion',
    title: t('common.title') || 'Title',
    description: t('common.description') || 'Description',
    category: t('common.category') || 'Category',
    priority: t('employee.priority') || 'Priority',
    enterTitle: t('notices.enterTitle') || 'Enter title',
    describeIssue: t('notices.describeIssue') || 'Describe your issue or suggestion',
    categoryPlaceholder: 'e.g., General, Technical, Event',
    required: t('common.required') || 'Required',
    submitting: t('notices.submitting') || 'Submitting...',
    submit: t('common.submit') || 'Submit',
    
    // Detail Modal
    details: t('notices.details') || 'Details',
    created: t('common.created') || 'Created',
    status: t('common.status') || 'Status',
    resolution: t('complaints.resolution') || 'Resolution',
    resolvedMessage: t('complaints.resolvedMessage') || 'This issue has been resolved',
    
    // Alerts
    fillRequiredFields: t('notices.fillRequiredFields') || 'Please fill all required fields',
    submittedSuccess: t('notices.submittedSuccess') || 'Your {type} has been submitted',
    submissionFailed: t('notices.submissionFailed') || 'Failed to submit',
  };

  const [activeTab, setActiveTab] = useState('notices');
  const [notices, setNotices] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    type: 'complaint'
  });

  useEffect(() => {
    setupRealtimeListeners();
  }, []);

  const setupRealtimeListeners = () => {
  const auth = getAuthInstance(); // ✅ ADD THIS

    const unsubscribeNotices = onSnapshot(
      query(collection(db, 'notices'), where('status', '==', 'active'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const noticesList = [];
        snapshot.forEach((doc) => {
          noticesList.push({ id: doc.id, ...doc.data() });
        });
        setNotices(noticesList);
        setLoading(false);
      }
    );

    const userId = auth.currentUser?.uid;
    const unsubscribeComplaints = onSnapshot(
      query(collection(db, 'complaints'), where('createdBy', '==', userId), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const complaintsList = [];
        snapshot.forEach((doc) => {
          complaintsList.push({ id: doc.id, ...doc.data() });
        });
        setComplaints(complaintsList);
      }
    );

    const unsubscribeSuggestions = onSnapshot(
      query(collection(db, 'suggestions'), where('createdBy', '==', userId), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const suggestionsList = [];
        snapshot.forEach((doc) => {
          suggestionsList.push({ id: doc.id, ...doc.data() });
        });
        setSuggestions(suggestionsList);
      }
    );

    return () => {
      unsubscribeNotices();
      unsubscribeComplaints();
      unsubscribeSuggestions();
    };
  };

  const handleSubmit = async () => {
  const auth = getAuthInstance(); // ✅ ADD THIS

    if (!formData.title || !formData.description) {
      Alert.alert(translations.error, translations.fillRequiredFields);
      return;
    }

    setLoading(true);
    try {
      const collectionName = formData.type === 'complaint' ? 'complaints' : 'suggestions';
      
      const data = {
        title: formData.title,
        description: formData.description,
        category: formData.category || translations.general,
        priority: formData.priority || 'medium',
        status: 'pending',
        type: formData.type,
        createdBy: auth.currentUser?.uid,
        createdByName: auth.currentUser?.displayName || 'Member',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, collectionName), data);
      
      Alert.alert(translations.success, translations.submittedSuccess.replace('{type}', formData.type));
      setModalVisible(false);
      resetForm();
    } catch (error) {
      Alert.alert(translations.error, error.message || translations.submissionFailed);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      priority: 'medium',
      type: 'complaint'
    });
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
      case 'resolved': return '#3b82f6';
      case 'closed': return '#6b7280';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'active': return translations.active;
      case 'pending': return translations.pending;
      case 'resolved': return translations.resolved;
      case 'rejected': return translations.rejected;
      default: return status || translations.pending;
    }
  };

  const getPriorityLabel = (priority) => {
    switch(priority) {
      case 'high': return translations.high;
      case 'medium': return translations.medium;
      case 'low': return translations.low;
      default: return priority || translations.medium;
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

  const getCurrentItems = () => {
    let items = activeTab === 'notices' ? notices : activeTab === 'complaints' ? complaints : suggestions;
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
        <MaterialIcons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.statType}>{label}</Text>
      <Text style={[styles.statCount, { color }]}>{count}</Text>
    </TouchableOpacity>
  );

  const NoticeCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.noticeCard} 
      onPress={() => { setSelectedItem(item); setDetailModalVisible(true); }}
      activeOpacity={0.7}
    >
      <View style={styles.noticeHeader}>
        <View style={styles.noticeIcon}>
          <MaterialIcons name="announcement" size={18} color="#3b82f6" />
        </View>
        <Text style={styles.noticeTitle} numberOfLines={1}>{item.title}</Text>
      </View>
      <Text style={styles.noticeDescription} numberOfLines={2}>{item.description}</Text>
      <View style={styles.noticeFooter}>
        <View style={styles.metaTag}>
          <MaterialIcons name="folder" size={12} color="#6b7280" />
          <Text style={styles.noticeCategory}>{item.category || translations.general}</Text>
        </View>
        <Text style={styles.noticeDate}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : translations.nA}</Text>
      </View>
    </TouchableOpacity>
  );

  const ComplaintCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.complaintCard} 
      onPress={() => { setSelectedItem(item); setDetailModalVisible(true); }}
      activeOpacity={0.7}
    >
      <View style={styles.complaintHeader}>
        <View style={[styles.complaintIcon, { backgroundColor: getPriorityColor(item.priority) + '15' }]}>
          <MaterialIcons name={item.type === 'complaint' ? 'report-problem' : 'lightbulb'} size={18} color={getPriorityColor(item.priority)} />
        </View>
        <Text style={styles.complaintTitle} numberOfLines={1}>{item.title}</Text>
        <View style={[styles.complaintStatus, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <Text style={[styles.complaintStatusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>
      <Text style={styles.complaintDescription} numberOfLines={2}>{item.description}</Text>
      <View style={styles.complaintFooter}>
        <View style={styles.metaTag}>
          <MaterialIcons name="folder" size={12} color="#6b7280" />
          <Text style={styles.complaintCategory}>{item.category || translations.general}</Text>
        </View>
        <View style={styles.priorityBadge}>
          <MaterialIcons name="flag" size={12} color={getPriorityColor(item.priority)} />
          <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
            {getPriorityLabel(item.priority)}
          </Text>
        </View>
        <Text style={styles.complaintDate}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : translations.nA}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container} key={renderKey}>
      {/* Blue Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{translations.communications}</Text>
          {activeTab !== 'notices' && (
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={() => { resetForm(); setFormData({...formData, type: activeTab === 'complaints' ? 'complaint' : 'suggestion'}); setModalVisible(true); }}
              activeOpacity={0.7}
            >
              <MaterialIcons name="add" size={18} color="#ffffff" />
              <Text style={styles.addButtonText}>{activeTab === 'complaints' ? translations.complaint : translations.suggestion}</Text>
            </TouchableOpacity>
          )}
          {activeTab === 'notices' && <View style={{ width: 32 }} />}
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={18} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder={translations.search}
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          textAlignVertical="center"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
            <MaterialIcons name="close" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'notices' && styles.activeTab]} 
          onPress={() => { setActiveTab('notices'); setFilterStatus('All'); }}
          activeOpacity={0.7}
        >
          <MaterialIcons name="announcement" size={16} color={activeTab === 'notices' ? '#ffffff' : '#6b7280'} />
          <Text style={[styles.tabText, activeTab === 'notices' && styles.activeTabText]}>
            {translations.noticesTab} ({notices.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'complaints' && styles.activeTab]} 
          onPress={() => { setActiveTab('complaints'); setFilterStatus('All'); }}
          activeOpacity={0.7}
        >
          <MaterialIcons name="report-problem" size={16} color={activeTab === 'complaints' ? '#ffffff' : '#6b7280'} />
          <Text style={[styles.tabText, activeTab === 'complaints' && styles.activeTabText]}>
            {translations.complaintsTab} ({complaints.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'suggestions' && styles.activeTab]} 
          onPress={() => { setActiveTab('suggestions'); setFilterStatus('All'); }}
          activeOpacity={0.7}
        >
          <MaterialIcons name="lightbulb" size={16} color={activeTab === 'suggestions' ? '#ffffff' : '#6b7280'} />
          <Text style={[styles.tabText, activeTab === 'suggestions' && styles.activeTabText]}>
            {translations.suggestionsTab} ({suggestions.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stat Cards */}
      <View style={styles.statsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScrollContent}>
          <StatCard 
            label={translations.total} 
            count={getCurrentItems().length} 
            icon="list" 
            color="#6b7280" 
            active={filterStatus === 'All'}
            onPress={() => setFilterStatus('All')}
          />
          <StatCard 
            label={translations.pending} 
            count={getCurrentItems().filter(i => i.status === 'pending').length} 
            icon="pending" 
            color="#f59e0b"
            active={filterStatus === 'Pending'}
            onPress={() => setFilterStatus('Pending')}
          />
          <StatCard 
            label={translations.active} 
            count={getCurrentItems().filter(i => i.status === 'active').length} 
            icon="check-circle" 
            color="#10b981"
            active={filterStatus === 'Active'}
            onPress={() => setFilterStatus('Active')}
          />
          <StatCard 
            label={translations.resolved} 
            count={getCurrentItems().filter(i => i.status === 'resolved').length} 
            icon="done" 
            color="#3b82f6"
            active={filterStatus === 'Resolved'}
            onPress={() => setFilterStatus('Resolved')}
          />
          <StatCard 
            label={translations.rejected} 
            count={getCurrentItems().filter(i => i.status === 'rejected').length} 
            icon="block" 
            color="#ef4444"
            active={filterStatus === 'Rejected'}
            onPress={() => setFilterStatus('Rejected')}
          />
        </ScrollView>
      </View>

      {/* Content */}
      <FlatList
        data={getCurrentItems()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => activeTab === 'notices' ? <NoticeCard item={item} /> : <ComplaintCard item={item} />}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name={activeTab === 'notices' ? 'announcement' : activeTab === 'complaints' ? 'report-problem' : 'lightbulb'} size={44} color="#d1d5db" />
            <Text style={styles.emptyStateText}>
              {activeTab === 'notices' ? translations.noNotices : 
               activeTab === 'complaints' ? translations.noComplaints : translations.noSuggestions}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {activeTab === 'notices' ? translations.noNoticesSubtext : 
               activeTab === 'complaints' ? translations.noComplaintsSubtext : translations.noSuggestionsSubtext}
            </Text>
            {activeTab !== 'notices' && (
              <TouchableOpacity 
                style={styles.emptyButton} 
                onPress={() => { resetForm(); setFormData({...formData, type: activeTab === 'complaints' ? 'complaint' : 'suggestion'}); setModalVisible(true); }}
                activeOpacity={0.7}
              >
                <Text style={styles.emptyButtonText}>
                  {activeTab === 'complaints' ? translations.submitComplaint : translations.submitSuggestion}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Submit Modal - Only for Complaints & Suggestions */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {formData.type === 'complaint' ? translations.submitComplaintTitle : translations.submitSuggestionTitle}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>{translations.title} <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput 
                style={styles.formInput} 
                value={formData.title} 
                onChangeText={(text) => setFormData({...formData, title: text})} 
                placeholder={translations.enterTitle}
                textAlignVertical="center"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>{translations.description} <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput 
                style={[styles.formInput, styles.formTextArea]} 
                value={formData.description} 
                onChangeText={(text) => setFormData({...formData, description: text})} 
                placeholder={translations.describeIssue} 
                multiline 
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>{translations.category}</Text>
              <TextInput 
                style={styles.formInput} 
                value={formData.category} 
                onChangeText={(text) => setFormData({...formData, category: text})} 
                placeholder={translations.categoryPlaceholder}
                textAlignVertical="center"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>{translations.priority}</Text>
              <View style={styles.priorityContainer}>
                {['low', 'medium', 'high'].map((priority) => (
                  <TouchableOpacity 
                    key={priority} 
                    style={[styles.priorityButton, formData.priority === priority && styles.priorityButtonActive]} 
                    onPress={() => setFormData({...formData, priority})}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(priority) }]} />
                    <Text style={[styles.priorityButtonText, formData.priority === priority && styles.priorityButtonTextActive]}>
                      {getPriorityLabel(priority)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading} activeOpacity={0.7}>
              <Text style={styles.submitButtonText}>{loading ? translations.submitting : translations.submit}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal animationType="slide" transparent={true} visible={detailModalVisible} onRequestClose={() => setDetailModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{translations.details}</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)} activeOpacity={0.7}>
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
                        {getStatusLabel(selectedItem.status)}
                      </Text>
                    </View>
                    {selectedItem.priority && (
                      <View style={[styles.detailPriorityBadge, { backgroundColor: getPriorityColor(selectedItem.priority) + '15' }]}>
                        <MaterialIcons name="flag" size={14} color={getPriorityColor(selectedItem.priority)} />
                        <Text style={[styles.detailPriorityText, { color: getPriorityColor(selectedItem.priority) }]}>
                          {getPriorityLabel(selectedItem.priority)}
                        </Text>
                      </View>
                    )}
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
                  <Text style={styles.detailValue}>{selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleString() : translations.nA}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.status}</Text>
                  <View style={[styles.detailStatusBadge, { backgroundColor: getStatusColor(selectedItem.status) + '15' }]}>
                    <Text style={[styles.detailStatusText, { color: getStatusColor(selectedItem.status) }]}>
                      {getStatusLabel(selectedItem.status)}
                    </Text>
                  </View>
                </View>

                {selectedItem.status === 'resolved' && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>{translations.resolution}</Text>
                    <Text style={styles.detailValue}>{translations.resolvedMessage}</Text>
                  </View>
                )}
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
    backgroundColor: '#f8fafc' 
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
    padding: 4 
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  addButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
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

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  tab: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 10, 
    gap: 6 
  },
  activeTab: { 
    backgroundColor: '#3b82f6' 
  },
  tabText: { 
    fontFamily: Fonts.SemiBold,
    fontSize: 12, 
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  activeTabText: { 
    color: '#ffffff' 
  },

  statsWrapper: { 
    marginBottom: 12 
  },
  statsScrollContent: { 
    paddingHorizontal: 16, 
    gap: 10 
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    width: 78,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  statCardActive: { 
    borderColor: '#3b82f6', 
    borderWidth: 2 
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statType: { 
    fontFamily: Fonts.SemiBold,
    fontSize: 11, 
    color: '#6b7280', 
    marginBottom: 2, 
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  statCount: { 
    fontFamily: Fonts.Bold,
    fontSize: 17,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  listContent: { 
    paddingHorizontal: 16, 
    paddingBottom: 20,
    paddingTop: 4,
  },

  noticeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  noticeHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 4 
  },
  noticeIcon: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: '#eff6ff', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  noticeTitle: { 
    fontFamily: Fonts.SemiBold,
    fontSize: 14, 
    color: '#1f2937', 
    flex: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  noticeDescription: { 
    fontFamily: Fonts.Regular,
    fontSize: 13, 
    color: '#6b7280', 
    marginLeft: 40,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  noticeFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 8, 
    marginLeft: 40, 
    paddingTop: 8, 
    borderTopWidth: 1, 
    borderTopColor: '#f3f4f6' 
  },
  metaTag: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4 
  },
  noticeCategory: { 
    fontFamily: Fonts.Regular,
    fontSize: 11, 
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  noticeDate: { 
    fontFamily: Fonts.Regular,
    fontSize: 11, 
    color: '#9ca3af',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  complaintCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  complaintHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 4 
  },
  complaintIcon: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  complaintTitle: { 
    fontFamily: Fonts.SemiBold,
    fontSize: 14, 
    color: '#1f2937', 
    flex: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  complaintStatus: { 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 10 
  },
  complaintStatusText: { 
    fontFamily: Fonts.SemiBold,
    fontSize: 10,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  complaintDescription: { 
    fontFamily: Fonts.Regular,
    fontSize: 13, 
    color: '#6b7280', 
    marginLeft: 40,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  complaintFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 40,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 10,
    flexWrap: 'wrap',
  },
  complaintCategory: { 
    fontFamily: Fonts.Regular,
    fontSize: 11, 
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  priorityBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4 
  },
  priorityText: { 
    fontFamily: Fonts.SemiBold,
    fontSize: 11,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  complaintDate: { 
    fontFamily: Fonts.Regular,
    fontSize: 11, 
    color: '#9ca3af', 
    marginLeft: 'auto',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingTop: 60, 
    gap: 12 
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
  emptyButton: { 
    backgroundColor: '#3b82f6', 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 8 
  },
  emptyButtonText: { 
    fontFamily: Fonts.SemiBold,
    color: '#ffffff', 
    fontSize: 14,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    padding: 16 
  },
  modalContent: { 
    backgroundColor: '#ffffff', 
    borderRadius: 16, 
    padding: 20, 
    maxHeight: '85%' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  modalTitle: { 
    fontFamily: Fonts.Bold,
    fontSize: 20, 
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  formField: { 
    marginBottom: 12 
  },
  formLabel: { 
    fontFamily: Fonts.SemiBold,
    fontSize: 14, 
    color: '#1f2937', 
    marginBottom: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  requiredStar: {
    color: '#ef4444',
  },
  formInput: { 
    borderWidth: 1, 
    borderColor: '#e5e7eb', 
    borderRadius: 8, 
    padding: 10, 
    fontSize: 14, 
    backgroundColor: '#f9fafb',
    fontFamily: Fonts.Regular,
    includeFontPadding: false,
  },
  formTextArea: { 
    height: 100, 
    textAlignVertical: 'top' 
  },

  priorityContainer: { 
    flexDirection: 'row', 
    gap: 8 
  },
  priorityDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4 
  },
  priorityButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 8, 
    borderRadius: 6, 
    borderWidth: 1, 
    borderColor: '#e5e7eb', 
    gap: 6 
  },
  priorityButtonActive: { 
    backgroundColor: '#3b82f6', 
    borderColor: '#3b82f6' 
  },
  priorityButtonText: { 
    fontFamily: Fonts.SemiBold,
    fontSize: 12, 
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  priorityButtonTextActive: { 
    color: '#ffffff' 
  },

  submitButton: { 
    backgroundColor: '#10b981', 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12 
  },
  submitButtonText: { 
    fontFamily: Fonts.SemiBold,
    color: '#ffffff', 
    fontSize: 16,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  detailHeader: { 
    marginBottom: 16 
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
    marginTop: 8 
  },
  detailStatusBadge: { 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12 
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
    gap: 4 
  },
  detailPriorityText: { 
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  detailSection: { 
    marginBottom: 12 
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
});