// screens/workingMember/WorkingMemberClasses.js
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
  Linking,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db, getAuthInstance } from '../../config/firebase';

import { collection, getDocs, query, where, doc, getDoc, onSnapshot, orderBy, addDoc } from 'firebase/firestore';
import { Fonts } from '../../config/fonts';
import { useLanguage } from '../../context/LanguageContext';

export default function WorkingMemberClasses({ navigation }) {
  const { t, counter } = useLanguage();
  
  // Force re-render when language changes
  const renderKey = `working-classes-${counter}`;

  // Get translations - EVERY SINGLE TEXT STRING is mapped to a translation key
  const translations = {
    // Common
    error: t('common.error') || 'Error',
    success: t('common.success') || 'Success',
    loading: t('common.loading') || 'Loading...',
    nA: t('common.nA') || 'N/A',
    close: t('common.close') || 'Close',
    cancel: t('common.cancel') || 'Cancel',
    
    // Header
    onlineClasses: t('onlineClasses.title') || 'Online Classes',
    searchClasses: t('onlineClasses.search') || 'Search classes...',
    
    // Stats
    total: t('common.total') || 'Total',
    upcoming: t('onlineClasses.upcoming') || 'Upcoming',
    live: t('onlineClasses.live') || 'Live',
    completed: t('onlineClasses.completed') || 'Completed',
    
    // Class Card
    noDescription: t('onlineClasses.noDescription') || 'No description',
    registered: t('onlineClasses.registeredLabel') || 'Registered',
    full: t('onlineClasses.full') || 'Full',
    
    // Detail Modal
    classDetails: t('onlineClasses.details') || 'Class Details',
    title: t('common.title') || 'Title',
    description: t('common.description') || 'Description',
    instructor: t('onlineClasses.instructor') || 'Instructor',
    date: t('common.date') || 'Date',
    time: t('common.time') || 'Time',
    level: t('onlineClasses.level') || 'Level',
    googleMeetLink: t('onlineClasses.googleMeetLink') || 'Google Meet Link',
    capacity: t('onlineClasses.capacity') || 'Capacity',
    status: t('common.status') || 'Status',
    notAvailable: t('onlineClasses.notAvailable') || 'Not available',
    registerNow: t('onlineClasses.registerNow') || 'Register Now',
    
    // Levels
    beginner: t('onlineClasses.beginner') || 'beginner',
    intermediate: t('onlineClasses.intermediate') || 'intermediate',
    advanced: t('onlineClasses.advanced') || 'advanced',
    
    // Empty State
    noClassesAvailable: t('onlineClasses.noClassesAvailable') || 'No classes available',
    checkBackLater: t('onlineClasses.checkBackLater') || 'Check back later for new classes',
    
    // Alert
    pleaseLogin: t('common.pleaseLogin') || 'Please login first',
    alreadyRegistered: t('onlineClasses.alreadyRegistered') || 'Already Registered',
    alreadyRegisteredMsg: t('onlineClasses.alreadyRegisteredMsg') || 'You have already registered for this class',
    classFullTitle: t('onlineClasses.classFull') || 'Class Full',
    classFullMsg: t('onlineClasses.classFullMsg') || 'This class has reached maximum capacity',
    registerSuccess: t('onlineClasses.registerSuccess') || 'Registered for class successfully',
    couldNotOpen: t('onlineClasses.couldNotOpen') || 'Could not open the meeting link',
    noLink: t('onlineClasses.noLink') || 'No Link',
    meetNotAvailable: t('onlineClasses.meetNotAvailable') || 'Google Meet link not available for this class',
    loadingClasses: t('onlineClasses.loadingClasses') || 'Loading classes...',
    
    // Status Labels
    statusUpcoming: t('onlineClasses.upcoming') || 'upcoming',
    statusLive: t('onlineClasses.live') || 'live',
    statusCompleted: t('onlineClasses.completed') || 'completed',
    statusCancelled: t('common.cancelled') || 'cancelled',
    
    // Capacity
    registeredCount: t('onlineClasses.registeredCount') || 'registered',
    capacityInfinity: t('onlineClasses.capacityInfinity') || '∞',
  };

  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [registeredClasses, setRegisteredClasses] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setupClassesListener();
    fetchRegisteredClasses();
  }, []);

  const setupClassesListener = () => {
    const q = query(collection(db, 'onlineClasses'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const classesList = [];
      snapshot.forEach((doc) => {
        classesList.push({ id: doc.id, ...doc.data() });
      });
      setClasses(classesList);
      applyFilters(classesList, searchQuery, filterStatus);
      setLoading(false);
    });

    return () => unsubscribe();
  };

  const fetchRegisteredClasses = async () => {

    try {
    const auth = getAuthInstance();

      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const regSnap = await getDocs(query(
        collection(db, 'classRegistrations'),
        where('userId', '==', userId),
        where('status', '==', 'registered')
      ));
      
      const ids = [];
      regSnap.forEach((doc) => {
        ids.push(doc.data().classId);
      });
      setRegisteredClasses(ids);
    } catch (error) {
      console.error('Error fetching registered classes:', error);
    }
  };

  const applyFilters = (data, searchText, status) => {
    let filtered = data;

    if (searchText) {
      filtered = filtered.filter(cls =>
        cls.title?.toLowerCase().includes(searchText.toLowerCase()) ||
        cls.instructor?.toLowerCase().includes(searchText.toLowerCase()) ||
        cls.category?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (status !== 'all') {
      filtered = filtered.filter(cls => cls.status === status);
    }

    setFilteredClasses(filtered);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    applyFilters(classes, text, filterStatus);
  };

  const handleFilterPress = (status) => {
    setFilterStatus(status);
    applyFilters(classes, searchQuery, status);
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'upcoming': return translations.statusUpcoming;
      case 'live': return translations.statusLive;
      case 'completed': return translations.statusCompleted;
      case 'cancelled': return translations.statusCancelled;
      default: return status || translations.statusUpcoming;
    }
  };

  const getLevelLabel = (level) => {
    switch(level) {
      case 'beginner': return translations.beginner;
      case 'intermediate': return translations.intermediate;
      case 'advanced': return translations.advanced;
      default: return level || translations.beginner;
    }
  };

  const handleRegister = async (classItem) => {
  const auth = getAuthInstance();

    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert(translations.error, translations.pleaseLogin);
      return;
    }

    if (registeredClasses.includes(classItem.id)) {
      Alert.alert(translations.alreadyRegistered, translations.alreadyRegisteredMsg);
      return;
    }

    if (classItem.capacity && classItem.registeredCount >= classItem.capacity) {
      Alert.alert(translations.classFullTitle, translations.classFullMsg);
      return;
    }

    try {
      await addDoc(collection(db, 'classRegistrations'), {
        classId: classItem.id,
        userId: userId,
        userName: auth.currentUser?.displayName || 'Working Member',
        userEmail: auth.currentUser?.email,
        className: classItem.title,
        registeredAt: new Date().toISOString(),
        status: 'registered'
      });

      setRegisteredClasses([...registeredClasses, classItem.id]);
      Alert.alert(translations.success, translations.registerSuccess);
      setDetailModalVisible(false);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRegisteredClasses();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'upcoming': return '#8b5cf6';
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

  const StatCard = ({ label, count, icon, color }) => (
    <TouchableOpacity 
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={() => {
        const statusMap = {
          [translations.total]: 'all',
          [translations.upcoming]: 'upcoming',
          [translations.live]: 'live',
          [translations.completed]: 'completed'
        };
        handleFilterPress(statusMap[label] || 'all');
      }}
      activeOpacity={0.7}
    >
      <View style={styles.statIconContainer}>
        <MaterialIcons name={icon} size={18} color={color} />
      </View>
      <View style={styles.statTextContainer}>
        <Text style={styles.statCount}>{count}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </TouchableOpacity>
  );

  const ClassCard = ({ classItem }) => {
    const isRegistered = registeredClasses.includes(classItem.id);
    const statusColor = getStatusColor(classItem.status);
    
    return (
      <TouchableOpacity 
        style={styles.classCard}
        onPress={() => {
          setSelectedClass(classItem);
          setDetailModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.classHeader}>
          <View style={styles.classTitleContainer}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={styles.classTitle} numberOfLines={1}>{classItem.title}</Text>
          </View>
          <View style={[styles.classStatusBadge, { backgroundColor: statusColor + '15' }]}>
            <Text style={[styles.classStatusText, { color: statusColor }]}>
              {getStatusLabel(classItem.status)}
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
              {getLevelLabel(classItem.level)}
            </Text>
          </View>
          <View style={styles.capacityBadge}>
            <MaterialIcons name="people" size={14} color="#6b7280" />
            <Text style={styles.capacityText}>
              {classItem.registeredCount || 0}/{classItem.capacity || translations.capacityInfinity}
            </Text>
          </View>
        </View>

        {isRegistered && (
          <View style={styles.registeredBadge}>
            <MaterialIcons name="check-circle" size={14} color="#10b981" />
            <Text style={styles.registeredBadgeText}>{translations.registered}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer} key={renderKey}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>{translations.loadingClasses}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} key={renderKey}>
      {/* Purple Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{translations.onlineClasses}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder={translations.searchClasses}
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

        {/* Stats */}
        <View style={styles.statsContainer}>
          <StatCard 
            label={translations.total} 
            count={classes.length} 
            icon="video-library" 
            color="#8b5cf6" 
          />
          <StatCard 
            label={translations.upcoming} 
            count={classes.filter(c => c.status === 'upcoming').length} 
            icon="event" 
            color="#8b5cf6" 
          />
          <StatCard 
            label={translations.live} 
            count={classes.filter(c => c.status === 'live').length} 
            icon="video-call" 
            color="#10b981" 
          />
          <StatCard 
            label={translations.completed} 
            count={classes.filter(c => c.status === 'completed').length} 
            icon="check-circle" 
            color="#6b7280" 
          />
        </View>
      </View>

      {/* Class List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8b5cf6']} />
        }
        contentContainerStyle={styles.listContent}
      >
        {filteredClasses.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="video-library" size={44} color="#d1d5db" />
            <Text style={styles.emptyStateText}>{translations.noClassesAvailable}</Text>
            <Text style={styles.emptyStateSubtext}>{translations.checkBackLater}</Text>
          </View>
        ) : (
          filteredClasses.map((item) => (
            <ClassCard key={item.id} classItem={item} />
          ))
        )}
      </ScrollView>

      {/* Class Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            {selectedClass && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{translations.classDetails}</Text>
                  <TouchableOpacity onPress={() => setDetailModalVisible(false)} activeOpacity={0.7}>
                    <MaterialIcons name="close" size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.title}</Text>
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

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.level}</Text>
                  <Text style={[styles.detailValue, { color: getLevelColor(selectedClass.level) }]}>
                    {getLevelLabel(selectedClass.level)}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.googleMeetLink}</Text>
                  <TouchableOpacity onPress={() => openMeetLink(selectedClass.googleMeetLink)} activeOpacity={0.7}>
                    <Text style={[styles.detailValue, styles.linkText]}>
                      {selectedClass.googleMeetLink || translations.notAvailable}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.capacity}</Text>
                  <Text style={styles.detailValue}>
                    {selectedClass.registeredCount || 0} / {selectedClass.capacity || translations.capacityInfinity} {translations.registeredCount}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.status}</Text>
                  <View style={[styles.detailStatusBadge, { backgroundColor: getStatusColor(selectedClass.status) + '15' }]}>
                    <Text style={[styles.detailStatusText, { color: getStatusColor(selectedClass.status) }]}>
                      {getStatusLabel(selectedClass.status)}
                    </Text>
                  </View>
                </View>

                {selectedClass.status !== 'completed' && selectedClass.status !== 'cancelled' && (
                  <TouchableOpacity 
                    style={[
                      styles.registerButton,
                      (registeredClasses.includes(selectedClass.id) || 
                       selectedClass.registeredCount >= selectedClass.capacity) && 
                      styles.registerDisabled
                    ]}
                    onPress={() => handleRegister(selectedClass)}
                    disabled={
                      registeredClasses.includes(selectedClass.id) || 
                      selectedClass.registeredCount >= selectedClass.capacity
                    }
                    activeOpacity={0.7}
                  >
                    <MaterialIcons 
                      name={
                        registeredClasses.includes(selectedClass.id) ? 'check-circle' :
                        selectedClass.registeredCount >= selectedClass.capacity ? 'block' : 'event'
                      } 
                      size={20} 
                      color="#ffffff" 
                    />
                    <Text style={styles.registerText}>
                      {registeredClasses.includes(selectedClass.id) ? translations.registered :
                       selectedClass.registeredCount >= selectedClass.capacity ? translations.full : translations.registerNow}
                    </Text>
                  </TouchableOpacity>
                )}
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
    backgroundColor: '#f8fafc',
  },

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

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 6,
    borderRadius: 10,
    gap: 6,
    borderLeftWidth: 3,
  },
  statIconContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTextContainer: {
    flex: 1,
  },
  statCount: {
    fontFamily: Fonts.Bold,
    fontSize: 14,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  statLabel: {
    fontFamily: Fonts.Regular,
    fontSize: 8,
    color: 'rgba(255,255,255,0.8)',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 4,
  },

  classCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  classTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  classTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  classStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  classStatusText: {
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
  registeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 8,
    gap: 4,
    alignSelf: 'flex-start',
  },
  registeredBadgeText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 11,
    color: '#059669',
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
    color: '#8b5cf6',
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

  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 16,
  },
  registerDisabled: {
    backgroundColor: '#9ca3af',
  },
  registerText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 15,
    color: '#ffffff',
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
    fontSize: 14,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});