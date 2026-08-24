// screens/admin/OnlineClassManagement.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal, ActivityIndicator, RefreshControl, FlatList, Image, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db, getAuthInstance } from '../../config/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Fonts } from '../../config/fonts';
import { useLanguage } from '../../context/LanguageContext';

export default function OnlineClassManagement({ navigation }) {
  const { t, counter } = useLanguage();
  
  // Force re-render when language changes
  const renderKey = `onlineclasses-${counter}`;

  // Get translations
  const getTranslations = () => ({
    onlineClasses: t('onlineClasses.title') || 'Online Classes',
    searchClasses: t('onlineClasses.search') || 'Search classes...',
    total: t('common.total') || 'Total',
    upcoming: t('onlineClasses.upcoming') || 'Upcoming',
    live: t('onlineClasses.live') || 'Live',
    noClasses: t('onlineClasses.noClasses') || 'No classes found',
    createFirstClass: t('onlineClasses.createFirstClass') || 'Create your first online class',
    createClass: t('onlineClasses.createClass') || 'Create Class',
    editClass: t('onlineClasses.editClass') || 'Edit Class',
    classDetails: t('onlineClasses.details') || 'Class Details',
    classTitle: t('onlineClasses.classTitle') || 'Class Title',
    googleMeetLink: t('onlineClasses.googleMeetLink') || 'Google Meet Link',
    meetingId: t('onlineClasses.meetingId') || 'Meeting ID',
    password: t('onlineClasses.password') || 'Password',
    description: t('common.description') || 'Description',
    instructor: t('onlineClasses.instructor') || 'Instructor',
    category: t('common.category') || 'Category',
    date: t('common.date') || 'Date',
    time: t('common.time') || 'Time',
    duration: t('onlineClasses.duration') || 'Duration',
    capacity: t('onlineClasses.capacity') || 'Capacity',
    level: t('onlineClasses.level') || 'Level',
    beginner: t('onlineClasses.beginner') || 'Beginner',
    intermediate: t('onlineClasses.intermediate') || 'Intermediate',
    advanced: t('onlineClasses.advanced') || 'Advanced',
    status: t('common.status') || 'Status',
    prerequisites: t('onlineClasses.prerequisites') || 'Prerequisites',
    recordingLink: t('onlineClasses.recordingLink') || 'Recording Link',
    joinMeet: t('onlineClasses.joinMeet') || 'Join Meet',
    edit: t('common.edit') || 'Edit',
    delete: t('common.delete') || 'Delete',
    saving: t('common.saving') || 'Saving...',
    updateClass: t('onlineClasses.updateClass') || 'Update Class',
    createClassButton: t('onlineClasses.createClassButton') || 'Create Class',
    classCreated: t('onlineClasses.created') || 'Class created successfully',
    classUpdated: t('onlineClasses.updated') || 'Class updated successfully',
    classDeleted: t('onlineClasses.deleted') || 'Class deleted successfully',
    statusUpdated: t('onlineClasses.statusUpdated') || 'Status updated to {status}',
    confirmDelete: t('onlineClasses.confirmDelete') || 'Are you sure you want to delete this class?',
    requiredFields: t('onlineClasses.requiredFields') || 'Please fill all required fields (Title and Google Meet Link)',
    noDescription: t('onlineClasses.noDescription') || 'No description',
    noPrerequisites: t('onlineClasses.noPrerequisites') || 'No prerequisites',
    notAvailable: t('onlineClasses.notAvailable') || 'Not available',
    watchRecording: t('onlineClasses.watchRecording') || 'Watch Recording',
    error: t('common.error') || 'Error',
    success: t('common.success') || 'Success',
    cancel: t('common.cancel') || 'Cancel',
    noLink: t('onlineClasses.noLink') || 'No Link',
    meetNotAvailable: t('onlineClasses.meetNotAvailable') || 'Google Meet link not available for this class',
    couldNotOpen: t('onlineClasses.couldNotOpen') || 'Could not open the meeting link',
    nA: t('common.nA') || 'N/A',
    registered: t('onlineClasses.registered') || 'registered',
    loading: t('common.loading') || 'Loading...',
  });

  const translations = getTranslations();

  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructor: '',
    category: '',
    date: '',
    time: '',
    duration: '',
    googleMeetLink: '',
    meetingId: '',
    password: '',
    capacity: '',
    registeredCount: 0,
    status: 'upcoming',
    image: null,
    recordingLink: '',
    materials: [],
    prerequisites: '',
    level: 'beginner'
  });

  useEffect(() => {
    setupRealtimeListener();
  }, []);

  const setupRealtimeListener = () => {
    const q = query(collection(db, 'onlineClasses'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const classesList = [];
      snapshot.forEach((doc) => {
        classesList.push({ id: doc.id, ...doc.data() });
      });
      setClasses(classesList);
      applyFilters(classesList, searchQuery);
      setLoading(false);
    });

    return () => unsubscribe();
  };

  const applyFilters = (data, searchText) => {
    let filtered = data;
    if (searchText) {
      filtered = filtered.filter(cls =>
        cls.title?.toLowerCase().includes(searchText.toLowerCase()) ||
        cls.instructor?.toLowerCase().includes(searchText.toLowerCase()) ||
        cls.category?.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    setFilteredClasses(filtered);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    applyFilters(classes, text);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.googleMeetLink) {
      Alert.alert(translations.error, translations.requiredFields);
      return;
    }

    setLoading(true);
    try {
      const data = {
        title: formData.title,
        description: formData.description || '',
        instructor: formData.instructor || translations.nA,
        category: formData.category || translations.general,
        date: formData.date || new Date().toISOString().split('T')[0],
        time: formData.time || '10:00 AM',
        duration: formData.duration || '1 hour',
        googleMeetLink: formData.googleMeetLink,
        meetingId: formData.meetingId || '',
        password: formData.password || '',
        capacity: parseInt(formData.capacity) || 0,
        registeredCount: formData.registeredCount || 0,
        status: formData.status || 'upcoming',
        image: formData.image || null,
        recordingLink: formData.recordingLink || '',
        materials: formData.materials || [],
        prerequisites: formData.prerequisites || '',
        level: formData.level || 'beginner',
        updatedAt: new Date().toISOString()
      };

      if (editingClass) {
        await updateDoc(doc(db, 'onlineClasses', editingClass.id), data);
        Alert.alert(translations.success, translations.classUpdated);
      } else {
        const auth = getAuthInstance();
        data.createdAt = new Date().toISOString();
        data.createdBy = auth.currentUser?.uid || 'admin';
        await addDoc(collection(db, 'onlineClasses'), data);
        Alert.alert(translations.success, translations.classCreated);
      }

      setModalVisible(false);
      resetForm();
    } catch (error) {
      Alert.alert(translations.error, error.message);
    } finally {
      setLoading(false);
    }
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
              await deleteDoc(doc(db, 'onlineClasses', id));
              Alert.alert(translations.success, translations.classDeleted);
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
      await updateDoc(doc(db, 'onlineClasses', id), { 
        status, 
        updatedAt: new Date().toISOString() 
      });
      Alert.alert(translations.success, translations.statusUpdated.replace('{status}', status));
    } catch (error) {
      Alert.alert(translations.error, error.message);
    }
  };

  const openMeetLink = (link) => {
    if (link) {
      Linking.openURL(link).catch(() => {
        Alert.alert(translations.error, translations.couldNotOpen);
      });
    } else {
      Alert.alert(translations.noLink, translations.meetNotAvailable);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      instructor: '',
      category: '',
      date: '',
      time: '',
      duration: '',
      googleMeetLink: '',
      meetingId: '',
      password: '',
      capacity: '',
      registeredCount: 0,
      status: 'upcoming',
      image: null,
      recordingLink: '',
      materials: [],
      prerequisites: '',
      level: 'beginner'
    });
    setEditingClass(null);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'upcoming': return '#3b82f6';
      case 'live': return '#10b981';
      case 'completed': return '#6b7280';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getLevelColor = (level) => {
    switch(level) {
      case 'beginner': return '#10b981';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'upcoming': return translations.upcoming;
      case 'live': return translations.live;
      case 'completed': return translations.completed;
      case 'cancelled': return translations.cancelled;
      default: return status;
    }
  };

  const getLevelLabel = (level) => {
    switch(level) {
      case 'beginner': return translations.beginner;
      case 'intermediate': return translations.intermediate;
      case 'advanced': return translations.advanced;
      default: return level;
    }
  };

  // ✅ Updated StatCard - Same as EmployeeManagement
  const StatCard = ({ label, count, icon, color }) => (
    <View style={[styles.statCard, { backgroundColor: color + '15' }]}>
      {/* Icon on top */}
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <MaterialIcons name={icon} size={24} color={color} />
      </View>
      
      {/* Number and Label side by side */}
      <View style={styles.statTextRow}>
        <Text style={[styles.statCount, { color }]}>{count}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );

  const ClassCard = ({ classItem }) => {
    const statusLabel = getStatusLabel(classItem.status);
    const levelLabel = getLevelLabel(classItem.level);
    
    return (
      <TouchableOpacity 
        style={styles.classCard}
        onPress={() => {
          setSelectedClass(classItem);
          setDetailModalVisible(true);
        }}
      >
        <View style={styles.classHeader}>
          <Text style={styles.classTitle} numberOfLines={1}>{classItem.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(classItem.status) + '15' }]}>
            <Text style={[styles.statusBadgeText, { color: getStatusColor(classItem.status) }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        <Text style={styles.classDescription} numberOfLines={2}>
          {classItem.description || translations.noDescription}
        </Text>

        <View style={styles.classDetails}>
          <View style={styles.classDetail}>
            <MaterialIcons name="person" size={14} color="#6b7280" />
            <Text style={styles.classDetailText}>{classItem.instructor}</Text>
          </View>
          <View style={styles.classDetail}>
            <MaterialIcons name="event" size={14} color="#6b7280" />
            <Text style={styles.classDetailText}>{classItem.date}</Text>
          </View>
          <View style={styles.classDetail}>
            <MaterialIcons name="access-time" size={14} color="#6b7280" />
            <Text style={styles.classDetailText}>{classItem.time}</Text>
          </View>
        </View>

        <View style={styles.classFooter}>
          <View style={[styles.levelBadge, { backgroundColor: getLevelColor(classItem.level) + '15' }]}>
            <Text style={[styles.levelBadgeText, { color: getLevelColor(classItem.level) }]}>
              {levelLabel}
            </Text>
          </View>
          <View style={styles.capacityBadge}>
            <MaterialIcons name="people" size={14} color="#6b7280" />
            <Text style={styles.capacityText}>
              {classItem.registeredCount || 0}/{classItem.capacity || '∞'}
            </Text>
          </View>
        </View>

        <View style={styles.classActions}>
          {classItem.googleMeetLink && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.meetButton]}
              onPress={() => openMeetLink(classItem.googleMeetLink)}
            >
              <MaterialIcons name="video-call" size={14} color="#ffffff" />
              <Text style={styles.actionButtonText}>{translations.joinMeet}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => {
              setEditingClass(classItem);
              setFormData(classItem);
              setModalVisible(true);
            }}
          >
            <MaterialIcons name="edit" size={14} color="#ffffff" />
            <Text style={styles.actionButtonText}>{translations.edit}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(classItem.id)}
          >
            <MaterialIcons name="delete" size={14} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer} key={renderKey}>
        <ActivityIndicator size="large" color="#FF7722" />
        <Text style={styles.loadingText}>{translations.loading}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} key={renderKey}>
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{translations.onlineClasses}</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => {
              resetForm();
              setModalVisible(true);
            }}
          >
            <MaterialIcons name="add" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder={translations.searchClasses}
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <MaterialIcons name="close" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statsContainer}>
          <StatCard 
            label={translations.total} 
            count={classes.length} 
            icon="video-library" 
            color="#FF7722" 
          />
          <StatCard 
            label={translations.upcoming} 
            count={classes.filter(c => c.status === 'upcoming').length} 
            icon="event" 
            color="#3b82f6" 
          />
          <StatCard 
            label={translations.live} 
            count={classes.filter(c => c.status === 'live').length} 
            icon="video-call" 
            color="#10b981" 
          />
        </View>
      </View>

      <FlatList
        data={filteredClasses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ClassCard classItem={item} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF7722']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="video-library" size={44} color="#d1d5db" />
            <Text style={styles.emptyStateText}>{translations.noClasses}</Text>
            <Text style={styles.emptyStateSubtext}>{translations.createFirstClass}</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Add/Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingClass ? translations.editClass : translations.createClass}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>{translations.classTitle} *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.title}
                onChangeText={(text) => setFormData({...formData, title: text})}
                placeholder={translations.classTitle}
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>{translations.googleMeetLink} *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.googleMeetLink}
                onChangeText={(text) => setFormData({...formData, googleMeetLink: text})}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formField, styles.formHalf]}>
                <Text style={styles.formLabel}>{translations.meetingId}</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.meetingId}
                  onChangeText={(text) => setFormData({...formData, meetingId: text})}
                  placeholder={translations.meetingId}
                />
              </View>
              <View style={[styles.formField, styles.formHalf]}>
                <Text style={styles.formLabel}>{translations.password}</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.password}
                  onChangeText={(text) => setFormData({...formData, password: text})}
                  placeholder={translations.password}
                />
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>{translations.description}</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({...formData, description: text})}
                placeholder={translations.description}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formField, styles.formHalf]}>
                <Text style={styles.formLabel}>{translations.instructor}</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.instructor}
                  onChangeText={(text) => setFormData({...formData, instructor: text})}
                  placeholder={translations.instructor}
                />
              </View>
              <View style={[styles.formField, styles.formHalf]}>
                <Text style={styles.formLabel}>{translations.category}</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.category}
                  onChangeText={(text) => setFormData({...formData, category: text})}
                  placeholder={translations.category}
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formField, styles.formHalf]}>
                <Text style={styles.formLabel}>{translations.date}</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.date}
                  onChangeText={(text) => setFormData({...formData, date: text})}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              <View style={[styles.formField, styles.formHalf]}>
                <Text style={styles.formLabel}>{translations.time}</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.time}
                  onChangeText={(text) => setFormData({...formData, time: text})}
                  placeholder="10:00 AM"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formField, styles.formHalf]}>
                <Text style={styles.formLabel}>{translations.duration}</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.duration}
                  onChangeText={(text) => setFormData({...formData, duration: text})}
                  placeholder={translations.duration}
                />
              </View>
              <View style={[styles.formField, styles.formHalf]}>
                <Text style={styles.formLabel}>{translations.capacity}</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.capacity}
                  onChangeText={(text) => setFormData({...formData, capacity: text})}
                  placeholder={translations.capacity}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formField, styles.formHalf]}>
                <Text style={styles.formLabel}>{translations.level}</Text>
                <View style={styles.levelContainer}>
                  {['beginner', 'intermediate', 'advanced'].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[styles.levelOption, formData.level === level && styles.levelOptionActive]}
                      onPress={() => setFormData({...formData, level})}
                    >
                      <Text style={[styles.levelOptionText, formData.level === level && styles.levelOptionTextActive]}>
                        {level === 'beginner' ? translations.beginner :
                         level === 'intermediate' ? translations.intermediate : translations.advanced}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={[styles.formField, styles.formHalf]}>
                <Text style={styles.formLabel}>{translations.status}</Text>
                <View style={styles.statusContainer}>
                  {['upcoming', 'live', 'completed', 'cancelled'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[styles.statusOption, formData.status === status && styles.statusOptionActive]}
                      onPress={() => setFormData({...formData, status})}
                    >
                      <Text style={[styles.statusOptionText, formData.status === status && styles.statusOptionTextActive]}>
                        {status === 'upcoming' ? translations.upcoming :
                         status === 'live' ? translations.live :
                         status === 'completed' ? translations.completed : translations.cancelled}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>{translations.prerequisites}</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={formData.prerequisites}
                onChangeText={(text) => setFormData({...formData, prerequisites: text})}
                placeholder={translations.prerequisites}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>{translations.recordingLink}</Text>
              <TextInput
                style={styles.formInput}
                value={formData.recordingLink}
                onChangeText={(text) => setFormData({...formData, recordingLink: text})}
                placeholder={translations.recordingLink}
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSave} disabled={loading}>
              <Text style={styles.submitButtonText}>
                {loading ? translations.saving : editingClass ? translations.updateClass : translations.createClassButton}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent}>
            {selectedClass && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{translations.classDetails}</Text>
                  <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                    <MaterialIcons name="close" size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.classTitle}</Text>
                  <Text style={styles.detailValue}>{selectedClass.title}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.description}</Text>
                  <Text style={styles.detailValue}>{selectedClass.description || translations.noDescription}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.instructor}</Text>
                  <Text style={styles.detailValue}>{selectedClass.instructor}</Text>
                </View>

                <View style={styles.detailRow}>
                  <View style={[styles.detailSection, { flex: 1 }]}>
                    <Text style={styles.detailLabel}>{translations.date}</Text>
                    <Text style={styles.detailValue}>{selectedClass.date}</Text>
                  </View>
                  <View style={[styles.detailSection, { flex: 1 }]}>
                    <Text style={styles.detailLabel}>{translations.time}</Text>
                    <Text style={styles.detailValue}>{selectedClass.time}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={[styles.detailSection, { flex: 1 }]}>
                    <Text style={styles.detailLabel}>{translations.duration}</Text>
                    <Text style={styles.detailValue}>{selectedClass.duration}</Text>
                  </View>
                  <View style={[styles.detailSection, { flex: 1 }]}>
                    <Text style={styles.detailLabel}>{translations.level}</Text>
                    <Text style={[styles.detailValue, { color: getLevelColor(selectedClass.level) }]}>
                      {getLevelLabel(selectedClass.level)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.googleMeetLink}</Text>
                  <TouchableOpacity onPress={() => openMeetLink(selectedClass.googleMeetLink)}>
                    <Text style={[styles.detailValue, styles.linkText]}>
                      {selectedClass.googleMeetLink || translations.notAvailable}
                    </Text>
                  </TouchableOpacity>
                </View>

                {selectedClass.meetingId && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>{translations.meetingId}</Text>
                    <Text style={styles.detailValue}>{selectedClass.meetingId}</Text>
                  </View>
                )}

                {selectedClass.password && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>{translations.password}</Text>
                    <Text style={styles.detailValue}>{selectedClass.password}</Text>
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.capacity}</Text>
                  <Text style={styles.detailValue}>
                    {selectedClass.registeredCount || 0} / {selectedClass.capacity || '∞'} {translations.registered}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.prerequisites}</Text>
                  <Text style={styles.detailValue}>{selectedClass.prerequisites || translations.noPrerequisites}</Text>
                </View>

                {selectedClass.recordingLink && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>{translations.recordingLink}</Text>
                    <TouchableOpacity onPress={() => Linking.openURL(selectedClass.recordingLink)}>
                      <Text style={[styles.detailValue, styles.linkText]}>{translations.watchRecording}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.status}</Text>
                  <View style={[styles.detailStatusBadge, { backgroundColor: getStatusColor(selectedClass.status) + '15' }]}>
                    <Text style={[styles.detailStatusText, { color: getStatusColor(selectedClass.status) }]}>
                      {getStatusLabel(selectedClass.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailActions}>
                  {selectedClass.googleMeetLink && selectedClass.status !== 'completed' && (
                    <TouchableOpacity 
                      style={[styles.detailActionButton, styles.joinMeetButton]}
                      onPress={() => openMeetLink(selectedClass.googleMeetLink)}
                    >
                      <MaterialIcons name="video-call" size={16} color="#ffffff" />
                      <Text style={styles.detailActionText}>{translations.joinMeet}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={[styles.detailActionButton, styles.editDetailButton]}
                    onPress={() => {
                      setDetailModalVisible(false);
                      setEditingClass(selectedClass);
                      setFormData(selectedClass);
                      setModalVisible(true);
                    }}
                  >
                    <MaterialIcons name="edit" size={16} color="#ffffff" />
                    <Text style={styles.detailActionText}>{translations.edit}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
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
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  // ✅ Updated Stats styles - Same as EmployeeManagement
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 4,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
    minHeight: 75,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  statCount: {
    fontFamily: Fonts.Bold,
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
  statLabel: {
    fontFamily: Fonts.Regular,
    fontSize: 9,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  classCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  classTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 10,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  classDescription: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  classDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  classDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  classDetailText: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  classFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  levelBadgeText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 10,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  capacityText: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  classActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  meetButton: {
    backgroundColor: '#10b981',
  },
  editButton: {
    backgroundColor: '#FF7722',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
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
    includeFontPadding: false,
    textAlignVertical: 'center',
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
    marginTop: 10,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
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
    maxHeight: '85%',
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
  formField: {
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formHalf: {
    width: '48%',
  },
  formLabel: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
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
    textAlignVertical: 'center',
  },
  formTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  levelContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  levelOption: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelOptionActive: {
    backgroundColor: '#FF7722',
    borderColor: '#FF7722',
  },
  levelOptionText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 10,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  levelOptionTextActive: {
    color: '#ffffff',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
  },
  statusOptionActive: {
    backgroundColor: '#FF7722',
    borderColor: '#FF7722',
  },
  statusOptionText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 10,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  statusOptionTextActive: {
    color: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  submitButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: 16,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  detailSection: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
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
  linkText: {
    color: '#3b82f6',
    textDecorationLine: 'underline',
  },
  detailStatusBadge: {
    alignSelf: 'flex-start',
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
  detailActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
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
  joinMeetButton: {
    backgroundColor: '#10b981',
  },
  editDetailButton: {
    backgroundColor: '#FF7722',
  },
  detailActionText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});