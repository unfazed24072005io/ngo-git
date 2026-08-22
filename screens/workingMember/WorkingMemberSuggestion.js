// screens/workingMember/WorkingMemberSuggestion.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db, getAuthInstance } from '../../config/firebase';

import { collection, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Fonts } from '../../config/fonts';
import { useLanguage } from '../../context/LanguageContext';

export default function WorkingMemberSuggestion({ navigation }) {
  const { t, counter } = useLanguage();
  
  // Force re-render when language changes
  const renderKey = `working-suggestion-${counter}`;

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
    mySuggestions: t('suggestions.title') || 'My Suggestions',
    
    // Empty State
    noSuggestions: t('suggestions.noSuggestions') || 'No suggestions',
    noSuggestionsSubtext: t('suggestions.noSuggestionsSubtext') || 'Share your suggestions to improve',
    submitSuggestion: t('suggestions.submit') || 'Submit Suggestion',
    
    // Suggestion Card
    general: t('common.general') || 'General',
    pending: t('common.pending') || 'Pending',
    active: t('common.active') || 'Active',
    resolved: t('suggestions.resolved') || 'Resolved',
    closed: t('common.closed') || 'Closed',
    rejected: t('suggestions.rejected') || 'Rejected',
    low: t('common.low') || 'Low',
    medium: t('common.medium') || 'Medium',
    high: t('common.high') || 'High',
    
    // Form Modal
    submitSuggestionTitle: t('suggestions.submit') || 'Submit Suggestion',
    title: t('common.title') || 'Title',
    description: t('common.description') || 'Description',
    category: t('common.category') || 'Category',
    priority: t('employee.priority') || 'Priority',
    department: t('employee.department') || 'Department',
    enterTitle: t('suggestions.enterTitle') || 'Enter title',
    describeSuggestion: t('suggestions.describeSuggestion') || 'Describe your suggestion',
    categoryPlaceholder: 'e.g., General, Technical, Event',
    departmentPlaceholder: 'e.g., HR, IT, Operations',
    required: t('common.required') || 'Required',
    submitting: t('suggestions.submitting') || 'Submitting...',
    submit: t('common.submit') || 'Submit',
    
    // Detail Modal
    suggestionDetails: t('suggestions.details') || 'Suggestion Details',
    created: t('common.created') || 'Created',
    status: t('common.status') || 'Status',
    resolution: t('suggestions.resolution') || 'Resolution',
    resolvedMessage: t('suggestions.resolvedMessage') || 'This suggestion has been implemented',
    rejectedMessage: t('suggestions.rejectedMessage') || 'This suggestion has been rejected',
    
    // Alert
    fillRequiredFields: t('suggestions.fillRequiredFields') || 'Please fill all required fields',
    suggestionSubmitted: t('suggestions.suggestionSubmitted') || 'Your suggestion has been submitted',
    workingMember: 'Working Member',
  };

  const [suggestions, setSuggestions] = useState([]);
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
      query(collection(db, 'suggestions'), where('createdBy', '==', userId), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const suggestionsList = [];
        snapshot.forEach((doc) => {
          suggestionsList.push({ id: doc.id, ...doc.data() });
        });
        setSuggestions(suggestionsList);
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
      await addDoc(collection(db, 'suggestions'), {
        title: formData.title,
        description: formData.description,
        category: formData.category || translations.general,
        priority: formData.priority || 'medium',
        department: formData.department || '',
        status: 'pending',
        type: 'suggestion',
        memberType: 'working',
        createdBy: auth.currentUser?.uid,
        createdByName: auth.currentUser?.displayName || translations.workingMember,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      Alert.alert(translations.success, translations.suggestionSubmitted);
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

  const SuggestionCard = ({ item }) => (
    <TouchableOpacity style={styles.suggestionCard} onPress={() => { setSelectedItem(item); setDetailModalVisible(true); }} activeOpacity={0.7}>
      <View style={styles.suggestionHeader}>
        <View style={[styles.suggestionIcon, { backgroundColor: getPriorityColor(item.priority) + '15' }]}>
          <MaterialIcons name="lightbulb" size={20} color={getPriorityColor(item.priority)} />
        </View>
        <Text style={styles.suggestionTitle} numberOfLines={1}>{item.title}</Text>
        <View style={[styles.suggestionStatus, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <Text style={[styles.suggestionStatusText, { color: getStatusColor(item.status) }]} numberOfLines={1}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>
      <Text style={styles.suggestionDescription} numberOfLines={2}>{item.description}</Text>
      <View style={styles.suggestionFooter}>
        <Text style={styles.suggestionCategory} numberOfLines={1}>📂 {item.category || translations.general}</Text>
        {item.department && (
          <View style={styles.departmentBadge}>
            <MaterialIcons name="business" size={12} color="#8b5cf6" />
            <Text style={styles.departmentText} numberOfLines={1}>{item.department}</Text>
          </View>
        )}
        <View style={styles.priorityBadge}>
          <MaterialIcons name="flag" size={12} color={getPriorityColor(item.priority)} />
          <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]} numberOfLines={1}>
            {getPriorityLabel(item.priority)}
          </Text>
        </View>
        <Text style={styles.suggestionDate} numberOfLines={1}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : translations.nA}</Text>
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
          <Text style={styles.headerTitle} numberOfLines={1}>{translations.mySuggestions}</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => { resetForm(); setModalVisible(true); }} activeOpacity={0.7}>
            <MaterialIcons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SuggestionCard item={item} />}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="lightbulb" size={44} color="#d1d5db" />
            <Text style={styles.emptyStateText}>{translations.noSuggestions}</Text>
            <Text style={styles.emptyStateSubtext}>{translations.noSuggestionsSubtext}</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => { resetForm(); setModalVisible(true); }} activeOpacity={0.7}>
              <Text style={styles.emptyButtonText}>{translations.submitSuggestion}</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Submit Suggestion Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>{translations.submitSuggestionTitle}</Text>
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
                placeholderTextColor="#9ca3af"
                textAlignVertical="center"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>{translations.description} <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput 
                style={[styles.formInput, styles.formTextArea]} 
                value={formData.description} 
                onChangeText={(text) => setFormData({...formData, description: text})} 
                placeholder={translations.describeSuggestion} 
                multiline 
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>{translations.category}</Text>
              <TextInput 
                style={styles.formInput} 
                value={formData.category} 
                onChangeText={(text) => setFormData({...formData, category: text})} 
                placeholder={translations.categoryPlaceholder}
                placeholderTextColor="#9ca3af"
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
                placeholderTextColor="#9ca3af"
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
                    <Text style={[styles.priorityButtonText, formData.priority === priority && styles.priorityButtonTextActive]} numberOfLines={1}>
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
              <Text style={styles.modalTitle} numberOfLines={1}>{translations.suggestionDetails}</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)} activeOpacity={0.7}>
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {selectedItem && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle} numberOfLines={2}>{selectedItem.title}</Text>
                  <View style={styles.detailStatusRow}>
                    <View style={[styles.detailStatusBadge, { backgroundColor: getStatusColor(selectedItem.status) + '15' }]}>
                      <Text style={[styles.detailStatusText, { color: getStatusColor(selectedItem.status) }]} numberOfLines={1}>
                        {getStatusLabel(selectedItem.status)}
                      </Text>
                    </View>
                    <View style={[styles.detailPriorityBadge, { backgroundColor: getPriorityColor(selectedItem.priority) + '15' }]}>
                      <Text style={[styles.detailPriorityText, { color: getPriorityColor(selectedItem.priority) }]} numberOfLines={1}>
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

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.status}</Text>
                  <View style={[styles.detailStatusBadge, { backgroundColor: getStatusColor(selectedItem.status) + '15' }]}>
                    <Text style={[styles.detailStatusText, { color: getStatusColor(selectedItem.status) }]} numberOfLines={1}>
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

                {selectedItem.status === 'rejected' && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>{translations.status}</Text>
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
  container: { flex: 1, backgroundColor: '#f8fafc' },

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
  backButton: { padding: 4 },
  headerTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 20,
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  addButton: { padding: 4 },

  listContent: { paddingHorizontal: 16, paddingBottom: 20 },

  suggestionCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: '#e5e7eb' 
  },
  suggestionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 4 
  },
  suggestionIcon: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center',
    flexShrink: 0,
  },
  suggestionTitle: { 
    fontFamily: Fonts.SemiBold,
    fontSize: 14, 
    color: '#1f2937', 
    flex: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  suggestionStatus: { 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 10,
    flexShrink: 0,
  },
  suggestionStatusText: { 
    fontFamily: Fonts.SemiBold,
    fontSize: 10,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  suggestionDescription: { 
    fontFamily: Fonts.Regular,
    fontSize: 13, 
    color: '#6b7280', 
    marginLeft: 40,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  suggestionFooter: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 8, 
    marginLeft: 40, 
    paddingTop: 8, 
    borderTopWidth: 1, 
    borderTopColor: '#f3f4f6', 
    gap: 12,
    flexWrap: 'wrap',
  },
  suggestionCategory: { 
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
    flexShrink: 0,
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
    gap: 4,
    flexShrink: 0,
  },
  priorityText: { 
    fontFamily: Fonts.SemiBold,
    fontSize: 11,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  suggestionDate: { 
    fontFamily: Fonts.Regular,
    fontSize: 11, 
    color: '#9ca3af', 
    marginLeft: 'auto',
    flexShrink: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingTop: 60, 
    gap: 12,
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
    flex: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  formField: { marginBottom: 12 },
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
    color: '#1f2937',
    includeFontPadding: false,
  },
  formTextArea: { height: 100, textAlignVertical: 'top' },

  priorityContainer: { 
    flexDirection: 'row', 
    gap: 8 
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
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  priorityButtonText: { 
    fontFamily: Fonts.SemiBold,
    fontSize: 12, 
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  priorityButtonTextActive: { color: '#ffffff' },

  submitButton: { 
    backgroundColor: '#10b981', 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center', 
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
  detailSection: { marginBottom: 12 },
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
    marginTop: 8,
    flexWrap: 'wrap',
  },
  detailStatusBadge: { 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12,
    flexShrink: 0,
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
    borderRadius: 12,
    flexShrink: 0,
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