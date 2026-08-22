// screens/workingMember/WorkingMemberComplaint.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db, getAuthInstance } from '../../config/firebase';

import { collection, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Fonts } from '../../config/fonts';
import { useLanguage } from '../../context/LanguageContext';

export default function WorkingMemberComplaint({ navigation }) {
  const { t, counter } = useLanguage();
  
  // Force re-render when language changes
  const renderKey = `working-complaint-${counter}`;

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
    
    // Header
    myComplaints: t('complaints.title') || 'My Complaints',
    
    // Empty State
    noComplaints: t('complaints.noComplaints') || 'No complaints',
    noComplaintsSubtext: t('complaints.noComplaintsSubtext') || 'Submit a complaint to get help',
    submitComplaint: t('complaints.submit') || 'Submit Complaint',
    
    // Complaint Card
    general: t('common.general') || 'General',
    pending: t('common.pending') || 'Pending',
    active: t('common.active') || 'Active',
    resolved: t('complaints.resolved') || 'Resolved',
    closed: t('common.closed') || 'Closed',
    rejected: t('complaints.rejected') || 'Rejected',
    low: t('common.low') || 'Low',
    medium: t('common.medium') || 'Medium',
    high: t('common.high') || 'High',
    
    // Form Modal
    submitComplaintTitle: t('complaints.submit') || 'Submit Complaint',
    title: t('common.title') || 'Title',
    description: t('common.description') || 'Description',
    category: t('common.category') || 'Category',
    priority: t('employee.priority') || 'Priority',
    department: t('employee.department') || 'Department',
    enterTitle: t('complaints.enterTitle') || 'Enter title',
    describeIssue: t('complaints.describeIssue') || 'Describe your issue',
    categoryPlaceholder: 'e.g., General, Technical, Event',
    departmentPlaceholder: 'e.g., HR, IT, Operations',
    required: t('common.required') || 'Required',
    submitting: t('complaints.submitting') || 'Submitting...',
    submit: t('common.submit') || 'Submit',
    
    // Detail Modal
    complaintDetails: t('complaints.details') || 'Complaint Details',
    created: t('common.created') || 'Created',
    resolution: t('complaints.resolution') || 'Resolution',
    resolvedMessage: t('complaints.resolvedMessage') || 'This complaint has been resolved',
    rejectedMessage: t('complaints.rejectedMessage') || 'This complaint has been rejected',
    statusLabel: t('common.status') || 'Status',
    
    // Alert
    fillRequiredFields: t('complaints.fillRequiredFields') || 'Please fill all required fields',
    complaintSubmitted: t('complaints.complaintSubmitted') || 'Your complaint has been submitted',
    workingMember: 'Working Member',
  };

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    department: ''
  });

  useEffect(() => {
    setupRealtimeListener();
  }, []);

  const setupRealtimeListener = () => {
  const auth = getAuthInstance();

    const userId = auth.currentUser?.uid;
    const unsubscribe = onSnapshot(
      query(collection(db, 'complaints'), where('createdBy', '==', userId), orderBy('createdAt', 'desc')),
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

  const handleSubmit = async () => {
    const auth = getAuthInstance();

    if (!formData.title || !formData.description) {
      Alert.alert(translations.error, translations.fillRequiredFields);
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'complaints'), {
        title: formData.title,
        description: formData.description,
        category: formData.category || translations.general,
        priority: formData.priority || 'medium',
        department: formData.department || '',
        status: 'pending',
        type: 'complaint',
        memberType: 'working',
        createdBy: auth.currentUser?.uid,
        createdByName: auth.currentUser?.displayName || translations.workingMember,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      Alert.alert(translations.success, translations.complaintSubmitted);
      setModalVisible(false);
      resetForm();
    } catch (error) {
      Alert.alert(translations.error, error.message);
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
      department: ''
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
      case 'closed': return translations.closed;
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

  const ComplaintCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.complaintCard} 
      onPress={() => { setSelectedItem(item); setDetailModalVisible(true); }}
      activeOpacity={0.7}
    >
      <View style={styles.complaintHeader}>
        <View style={[styles.complaintIcon, { backgroundColor: getPriorityColor(item.priority) + '15' }]}>
          <MaterialIcons name="report-problem" size={18} color={getPriorityColor(item.priority)} />
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
        <Text style={styles.complaintCategory}>📂 {item.category || translations.general}</Text>
        {item.department && (
          <View style={styles.departmentBadge}>
            <MaterialIcons name="business" size={12} color="#8b5cf6" />
            <Text style={styles.departmentText}>{item.department}</Text>
          </View>
        )}
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
          <Text style={styles.headerTitle}>{translations.myComplaints}</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => { resetForm(); setModalVisible(true); }} activeOpacity={0.7}>
            <MaterialIcons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={complaints}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ComplaintCard item={item} />}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="report-problem" size={44} color="#d1d5db" />
            <Text style={styles.emptyStateText}>{translations.noComplaints}</Text>
            <Text style={styles.emptyStateSubtext}>{translations.noComplaintsSubtext}</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => { resetForm(); setModalVisible(true); }} activeOpacity={0.7}>
              <Text style={styles.emptyButtonText}>{translations.submitComplaint}</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Submit Complaint Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{translations.submitComplaintTitle}</Text>
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
              <Text style={styles.formLabel}>{translations.department}</Text>
              <TextInput 
                style={styles.formInput} 
                value={formData.department} 
                onChangeText={(text) => setFormData({...formData, department: text})} 
                placeholder={translations.departmentPlaceholder}
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
              <Text style={styles.modalTitle}>{translations.complaintDetails}</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)} activeOpacity={0.7}>
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {selectedItem && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle}>{selectedItem.title}</Text>
                  <View style={styles.detailStatusRow}>
                    <View style={[styles.detailStatusBadge, { backgroundColor: getStatusColor(selectedItem.status) + '15' }]}>
                      <Text style={[styles.detailStatusText, { color: getStatusColor(selectedItem.status) }]}>
                        {getStatusLabel(selectedItem.status)}
                      </Text>
                    </View>
                    <View style={[styles.detailPriorityBadge, { backgroundColor: getPriorityColor(selectedItem.priority) + '15' }]}>
                      <Text style={[styles.detailPriorityText, { color: getPriorityColor(selectedItem.priority) }]}>
                        {getPriorityLabel(selectedItem.priority)}
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

                {selectedItem.department && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>{translations.department}</Text>
                    <Text style={styles.detailValue}>{selectedItem.department}</Text>
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.created}</Text>
                  <Text style={styles.detailValue}>{selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleString() : translations.nA}</Text>
                </View>

                {selectedItem.status === 'resolved' && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>{translations.resolution}</Text>
                    <Text style={styles.detailValue}>{translations.resolvedMessage}</Text>
                  </View>
                )}

                {selectedItem.status === 'rejected' && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>{translations.statusLabel}</Text>
                    <Text style={styles.detailValue}>{translations.rejectedMessage}</Text>
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
    padding: 4 
  },

  listContent: { 
    paddingHorizontal: 16, 
    paddingBottom: 20,
    paddingTop: 4,
  },

  complaintCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 10,
    marginTop: 6,
    borderWidth: 1, 
    borderColor: '#e5e7eb' 
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
  departmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  departmentText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 10,
    color: '#8b5cf6',
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

  // Modals
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
    borderRadius: 4,
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
    gap: 6,
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

  // Detail Modal
  detailSection: { 
    marginBottom: 12 
  },
  detailTitle: { 
    fontFamily: Fonts.Bold,
    fontSize: 18, 
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
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12 
  },
  detailPriorityText: { 
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
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