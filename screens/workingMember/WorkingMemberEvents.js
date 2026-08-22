// screens/workingMember/WorkingMemberEvents.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image, Modal, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db, getAuthInstance } from '../../config/firebase';

import { collection, getDocs, addDoc, doc, query, where, orderBy, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { Fonts } from '../../config/fonts';
import { useLanguage } from '../../context/LanguageContext';

export default function WorkingMemberEvents({ navigation }) {
  const { t, counter } = useLanguage();
  
  // Force re-render when language changes
  const renderKey = `working-events-${counter}`;

  // Get translations - EVERY SINGLE TEXT STRING is mapped to a translation key
  const translations = {
    // Common
    error: t('common.error') || 'Error',
    success: t('common.success') || 'Success',
    loading: t('common.loading') || 'Loading...',
    nA: t('common.nA') || 'N/A',
    close: t('common.close') || 'Close',
    cancel: t('common.cancel') || 'Cancel',
    no: t('common.no') || 'No',
    yes: t('common.yes') || 'Yes',
    
    // Header
    events: t('events.title') || 'Events',
    searchEvents: t('events.search') || 'Search events...',
    
    // Stats
    total: t('common.total') || 'Total',
    upcoming: t('events.upcoming') || 'Upcoming',
    registered: t('events.registered') || 'Registered',
    assigned: t('events.assigned') || 'Assigned',
    
    // Event Card
    noDescription: t('events.noDescription') || 'No description',
    registeredLabel: t('events.registered') || 'Registered',
    assignedLabel: t('events.assigned') || 'Assigned',
    full: t('events.full') || 'Full',
    featured: t('events.featured') || 'Featured',
    
    // Empty State
    noEventsFound: t('events.noEvents') || 'No events found',
    checkBackLater: 'Check back later for upcoming events',
    
    // Modal
    eventDetails: t('events.details') || 'Event Details',
    description: t('common.description') || 'Description',
    dateTime: t('events.dateTime') || 'Date & Time',
    location: t('events.location') || 'Location',
    venue: t('events.venue') || 'Venue',
    category: t('common.category') || 'Category',
    capacity: t('events.capacity') || 'Capacity',
    organizer: t('events.organizer') || 'Organizer',
    contact: t('events.contact') || 'Contact',
    noDescriptionModal: t('events.noDescription') || 'No description',
    general: t('common.general') || 'General',
    registeredCount: 'registered',
    
    // Buttons
    cancelRegistration: 'Cancel Registration',
    registerNow: t('events.registerNow') || 'Register Now',
    registering: 'Registering...',
    eventFull: 'Event Full',
    viewMyDuty: 'View My Duty',
    
    // Duty Modal
    myDutyDetails: 'My Duty Details',
    eventName: 'Event Name',
    dutyRole: 'Duty Role',
    responsibilities: 'Responsibilities',
    timeSlot: 'Time Slot',
    dutyLocation: 'Location',
    assignedBy: 'Assigned By',
    status: t('common.status') || 'Status',
    noResponsibilities: 'No responsibilities listed',
    
    // Alerts
    pleaseLogin: t('events.pleaseLogin') || 'Please login first',
    alreadyRegistered: 'Already Registered',
    alreadyRegisteredMsg: 'You have already registered for this event',
    eventFullTitle: 'Event Full',
    eventFullMsg: 'This event has reached maximum capacity',
    registerSuccess: 'You have successfully registered for {title}',
    cancelRegistrationTitle: 'Cancel Registration',
    cancelRegistrationMsg: 'Are you sure you want to cancel registration for {title}?',
    cancellationSuccess: 'Registration cancelled',
    noDuty: 'No Duty',
    noDutyMsg: 'You are not assigned to this event',
    
    // Status Labels
    statusUpcoming: t('events.upcoming') || 'upcoming',
    statusOngoing: t('events.ongoing') || 'ongoing',
    statusCompleted: t('events.completed') || 'completed',
    statusCancelled: t('common.cancelled') || 'cancelled',
    
    // Filters
    all: t('common.all') || 'All',
  };

  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [registeredEventIds, setRegisteredEventIds] = useState([]);
  const [assignedEventIds, setAssignedEventIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [dutyModalVisible, setDutyModalVisible] = useState(false);
  const [dutyDetails, setDutyDetails] = useState(null);

  const filters = ['All', 'Upcoming', 'Ongoing', 'Completed', 'Cancelled'];

  useEffect(() => {
    setupRealtimeListener();
    fetchRegisteredEvents();
    fetchAssignedEvents();
    fetchUserProfile();
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

  const setupRealtimeListener = () => {
    const q = query(collection(db, 'events'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        eventsList.push({ 
          id: doc.id, 
          ...data,
          date: data.date?.toDate?.() || new Date(data.date)
        });
      });
      setEvents(eventsList);
      applyFilters(eventsList, searchQuery, selectedFilter);
      setLoading(false);
    });

    return () => unsubscribe();
  };

  const fetchRegisteredEvents = async () => {
    const auth = getAuthInstance();

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const regSnap = await getDocs(query(
        collection(db, 'eventRegistrations'),
        where('memberId', '==', userId),
        where('status', '==', 'confirmed')
      ));
      
      const ids = [];
      regSnap.forEach((doc) => {
        ids.push(doc.data().eventId);
      });
      setRegisteredEventIds(ids);
    } catch (error) {
      console.error('Error fetching registered events:', error);
    }
  };

  const fetchAssignedEvents = async () => {
    const auth = getAuthInstance();

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const assignSnap = await getDocs(query(
        collection(db, 'eventAssignments'),
        where('memberId', '==', userId),
        where('status', '==', 'active')
      ));
      
      const ids = [];
      assignSnap.forEach((doc) => {
        ids.push(doc.data().eventId);
      });
      setAssignedEventIds(ids);
    } catch (error) {
      console.error('Error fetching assigned events:', error);
    }
  };

  const applyFilters = (data, searchText, filter) => {
    let filtered = data;

    if (searchText) {
      filtered = filtered.filter(event =>
        event.title?.toLowerCase().includes(searchText.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchText.toLowerCase()) ||
        event.category?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (filter !== 'All') {
      filtered = filtered.filter(event => event.status === filter.toLowerCase());
    }

    setFilteredEvents(filtered);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    applyFilters(events, text, selectedFilter);
  };

  const handleFilterPress = (filter) => {
    setSelectedFilter(filter);
    applyFilters(events, searchQuery, filter);
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'upcoming': return translations.statusUpcoming;
      case 'ongoing': return translations.statusOngoing;
      case 'completed': return translations.statusCompleted;
      case 'cancelled': return translations.statusCancelled;
      default: return status || translations.statusUpcoming;
    }
  };

  const handleRegister = async (event) => {
  const auth = getAuthInstance();

    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert(translations.error, translations.pleaseLogin);
      return;
    }

    if (registeredEventIds.includes(event.id)) {
      Alert.alert(translations.alreadyRegistered, translations.alreadyRegisteredMsg);
      return;
    }

    if (event.capacity && event.registeredCount >= event.capacity) {
      Alert.alert(translations.eventFullTitle, translations.eventFullMsg);
      return;
    }

    setRegistering(true);
    try {
      await addDoc(collection(db, 'eventRegistrations'), {
        eventId: event.id,
        memberId: userId,
        eventTitle: event.title,
        eventDate: event.date,
        eventLocation: event.location,
        registeredAt: new Date().toISOString(),
        status: 'confirmed',
        memberType: 'working'
      });

      await updateDoc(doc(db, 'events', event.id), {
        registeredCount: (event.registeredCount || 0) + 1
      });

      setRegisteredEventIds([...registeredEventIds, event.id]);
      Alert.alert(translations.success, translations.registerSuccess.replace('{title}', event.title));
      setDetailModalVisible(false);
    } catch (error) {
      Alert.alert(translations.error, error.message);
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregister = async (event) => {

    Alert.alert(
      translations.cancelRegistrationTitle,
      translations.cancelRegistrationMsg.replace('{title}', event.title),
      [
        { text: translations.no, style: 'cancel' },
        {
          text: translations.yes,
          style: 'destructive',
          onPress: async () => {
            try {
        const auth = getAuthInstance();

              const userId = auth.currentUser?.uid;
              const regSnap = await getDocs(query(
                collection(db, 'eventRegistrations'),
                where('eventId', '==', event.id),
                where('memberId', '==', userId)
              ));

              regSnap.forEach(async (doc) => {
                await updateDoc(doc.ref, { status: 'cancelled' });
              });

              setRegisteredEventIds(registeredEventIds.filter(id => id !== event.id));
              await updateDoc(doc(db, 'events', event.id), {
                registeredCount: Math.max((event.registeredCount || 0) - 1, 0)
              });

              Alert.alert(translations.success, translations.cancellationSuccess);
              setDetailModalVisible(false);
            } catch (error) {
              Alert.alert(translations.error, error.message);
            }
          }
        }
      ]
    );
  };

  const handleViewDuty = async (event) => {
    const auth = getAuthInstance();

    try {
      const userId = auth.currentUser?.uid;
      const assignSnap = await getDocs(query(
        collection(db, 'eventAssignments'),
        where('eventId', '==', event.id),
        where('memberId', '==', userId)
      ));

      if (!assignSnap.empty) {
        assignSnap.forEach((doc) => {
          setDutyDetails({ id: doc.id, ...doc.data() });
        });
        setDutyModalVisible(true);
      } else {
        Alert.alert(translations.noDuty, translations.noDutyMsg);
      }
    } catch (error) {
      Alert.alert(translations.error, error.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRegisteredEvents();
    await fetchAssignedEvents();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'upcoming': return '#8b5cf6';
      case 'ongoing': return '#10b981';
      case 'completed': return '#6b7280';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'upcoming': return 'event';
      case 'ongoing': return 'play-circle';
      case 'completed': return 'check-circle';
      case 'cancelled': return 'cancel';
      default: return 'event';
    }
  };

  const EventCard = ({ event }) => {
    const isRegistered = registeredEventIds.includes(event.id);
    const isAssigned = assignedEventIds.includes(event.id);
    const statusColor = getStatusColor(event.status);
    const statusIcon = getStatusIcon(event.status);
    const isFull = event.capacity && event.registeredCount >= event.capacity;

    return (
      <TouchableOpacity 
        style={styles.eventCard}
        onPress={() => {
          setSelectedEvent(event);
          setDetailModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        {event.image ? (
          <Image source={{ uri: event.image }} style={styles.eventImage} />
        ) : (
          <View style={styles.eventImagePlaceholder}>
            <MaterialIcons name="event" size={36} color="#9ca3af" />
          </View>
        )}
        
        <View style={styles.badgesContainer}>
          {isRegistered && (
            <View style={styles.registeredBadge}>
              <MaterialIcons name="check-circle" size={12} color="#ffffff" />
              <Text style={styles.badgeText}>{translations.registeredLabel}</Text>
            </View>
          )}
          {isAssigned && (
            <View style={styles.assignedBadge}>
              <MaterialIcons name="assignment" size={12} color="#ffffff" />
              <Text style={styles.badgeText}>{translations.assignedLabel}</Text>
            </View>
          )}
        </View>

        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
            {event.featured && (
              <View style={styles.featuredBadge}>
                <MaterialIcons name="star" size={14} color="#f59e0b" />
              </View>
            )}
          </View>

          <Text style={styles.eventDescription} numberOfLines={2}>
            {event.description || translations.noDescription}
          </Text>

          <View style={styles.eventDetails}>
            <View style={styles.eventDetailItem}>
              <MaterialIcons name="event" size={14} color="#6b7280" />
              <Text style={styles.eventDetailText}>
                {event.date?.toLocaleDateString?.() || translations.nA}
              </Text>
            </View>
            <View style={styles.eventDetailItem}>
              <MaterialIcons name="location-on" size={14} color="#6b7280" />
              <Text style={styles.eventDetailText}>{event.location || translations.nA}</Text>
            </View>
          </View>

          <View style={styles.eventFooter}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
              <MaterialIcons name={statusIcon} size={12} color={statusColor} />
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                {getStatusLabel(event.status)}
              </Text>
            </View>
            <View style={styles.capacityBadge}>
              <MaterialIcons name="people" size={14} color="#6b7280" />
              <Text style={styles.capacityText}>
                {event.registeredCount || 0}/{event.capacity || '∞'}
                {isFull && <Text style={styles.fullText}> ({translations.full})</Text>}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const StatCard = ({ label, count, icon, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <MaterialIcons name={icon} size={16} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={[styles.statValue, { color }]}>{count}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container} key={renderKey}>
      {/* Purple Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
              <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{translations.events}</Text>
          </View>
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

        {/* Search Bar inside header */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder={translations.searchEvents}
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
          <StatCard label={translations.total} count={events.length} icon="event" color="#ffffff" />
          <StatCard label={translations.upcoming} count={events.filter(e => e.status === 'upcoming').length} icon="event" color="#ffffff" />
          <StatCard label={translations.registered} count={registeredEventIds.length} icon="check-circle" color="#ffffff" />
          <StatCard label={translations.assigned} count={assignedEventIds.length} icon="assignment" color="#ffffff" />
        </ScrollView>
      </View>

      {/* Events List */}
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EventCard event={item} />}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8b5cf6']} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="event-busy" size={44} color="#d1d5db" />
            <Text style={styles.emptyStateText}>{translations.noEventsFound}</Text>
            <Text style={styles.emptyStateSubtext}>{translations.checkBackLater}</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Event Detail Modal */}
      <Modal animationType="slide" transparent={true} visible={detailModalVisible} onRequestClose={() => setDetailModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{translations.eventDetails}</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)} activeOpacity={0.7}>
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {selectedEvent && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedEvent.image && <Image source={{ uri: selectedEvent.image }} style={styles.detailImage} />}

                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle}>{selectedEvent.title}</Text>
                  <View style={styles.detailStatusRow}>
                    <View style={[styles.detailStatusBadge, { backgroundColor: getStatusColor(selectedEvent.status) + '15' }]}>
                      <Text style={[styles.detailStatusText, { color: getStatusColor(selectedEvent.status) }]}>
                        {getStatusLabel(selectedEvent.status)}
                      </Text>
                    </View>
                    {selectedEvent.featured && (
                      <View style={styles.detailFeaturedBadge}>
                        <MaterialIcons name="star" size={14} color="#f59e0b" />
                        <Text style={styles.detailFeaturedText}>{translations.featured}</Text>
                      </View>
                    )}
                    {assignedEventIds.includes(selectedEvent.id) && (
                      <View style={styles.detailAssignedBadge}>
                        <MaterialIcons name="assignment" size={14} color="#8b5cf6" />
                        <Text style={styles.detailAssignedText}>{translations.assignedLabel}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.description}</Text>
                  <Text style={styles.detailValue}>{selectedEvent.description || translations.noDescriptionModal}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.dateTime}</Text>
                  <Text style={styles.detailValue}>
                    {selectedEvent.date?.toLocaleDateString?.() || translations.nA} at {selectedEvent.time || translations.nA}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.location}</Text>
                  <Text style={styles.detailValue}>{selectedEvent.location}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.venue}</Text>
                  <Text style={styles.detailValue}>{selectedEvent.venue || translations.nA}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.category}</Text>
                  <Text style={styles.detailValue}>{selectedEvent.category || translations.general}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.capacity}</Text>
                  <Text style={styles.detailValue}>
                    {selectedEvent.registeredCount || 0} / {selectedEvent.capacity || '∞'} {translations.registeredCount}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.organizer}</Text>
                  <Text style={styles.detailValue}>{selectedEvent.organizer || translations.nA}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.contact}</Text>
                  <Text style={styles.detailValue}>
                    {selectedEvent.contactEmail || translations.nA}
                    {selectedEvent.contactPhone ? ` • ${selectedEvent.contactPhone}` : ''}
                  </Text>
                </View>

                {assignedEventIds.includes(selectedEvent.id) && (
                  <TouchableOpacity 
                    style={styles.viewDutyButton}
                    onPress={() => handleViewDuty(selectedEvent)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="assignment" size={20} color="#ffffff" />
                    <Text style={styles.viewDutyButtonText}>{translations.viewMyDuty}</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.detailActions}>
                  {registeredEventIds.includes(selectedEvent.id) ? (
                    <TouchableOpacity style={[styles.detailActionButton, styles.unregisterButton]} onPress={() => handleUnregister(selectedEvent)} activeOpacity={0.7}>
                      <MaterialIcons name="cancel" size={20} color="#ffffff" />
                      <Text style={styles.detailActionText}>{translations.cancelRegistration}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.detailActionButton, 
                        (selectedEvent.capacity && selectedEvent.registeredCount >= selectedEvent.capacity) 
                          ? styles.disabledButton 
                          : styles.registerButton
                      ]}
                      onPress={() => handleRegister(selectedEvent)}
                      disabled={registering || (selectedEvent.capacity && selectedEvent.registeredCount >= selectedEvent.capacity)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="event" size={20} color="#ffffff" />
                      <Text style={styles.detailActionText}>
                        {registering ? translations.registering : 
                         (selectedEvent.capacity && selectedEvent.registeredCount >= selectedEvent.capacity) 
                          ? translations.eventFull : translations.registerNow}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Duty Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={dutyModalVisible}
        onRequestClose={() => setDutyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{translations.myDutyDetails}</Text>
              <TouchableOpacity onPress={() => setDutyModalVisible(false)} activeOpacity={0.7}>
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {dutyDetails && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.dutySection}>
                  <View style={styles.dutyIconContainer}>
                    <MaterialIcons name="assignment" size={36} color="#8b5cf6" />
                  </View>
                  <Text style={styles.dutyTitle}>{dutyDetails.role || 'Event Duty'}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.eventName}</Text>
                  <Text style={styles.detailValue}>{dutyDetails.eventTitle || translations.nA}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.dutyRole}</Text>
                  <Text style={styles.detailValue}>{dutyDetails.role || translations.nA}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.responsibilities}</Text>
                  <Text style={styles.detailValue}>{dutyDetails.responsibilities || translations.noResponsibilities}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.timeSlot}</Text>
                  <Text style={styles.detailValue}>
                    {dutyDetails.startTime || translations.nA} - {dutyDetails.endTime || translations.nA}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.dutyLocation}</Text>
                  <Text style={styles.detailValue}>{dutyDetails.dutyLocation || translations.nA}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.assignedBy}</Text>
                  <Text style={styles.detailValue}>{dutyDetails.assignedBy || translations.nA}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.status}</Text>
                  <View style={[styles.detailStatusBadge, { backgroundColor: dutyDetails.status === 'active' ? '#10b981' : '#6b7280' }]}>
                    <Text style={styles.detailStatusText}>{dutyDetails.status || 'active'}</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.closeDutyButton}
                  onPress={() => setDutyModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.closeDutyButtonText}>{translations.close}</Text>
                </TouchableOpacity>
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
    borderLeftWidth: 3,
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

  // List
  listContent: { 
    paddingHorizontal: 16, 
    paddingBottom: 20,
    paddingTop: 4,
  },
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    position: 'relative',
    marginTop: 6,
  },
  eventImage: { 
    width: '100%', 
    height: 150, 
    resizeMode: 'cover' 
  },
  eventImagePlaceholder: { 
    width: '100%', 
    height: 150, 
    backgroundColor: '#f3f4f6', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  badgesContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    gap: 4,
    alignItems: 'flex-end',
  },
  registeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  assignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: { 
    fontFamily: Fonts.SemiBold,
    color: '#ffffff', 
    fontSize: 10,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  eventContent: { 
    padding: 14 
  },
  eventHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  eventTitle: { 
    fontFamily: Fonts.SemiBold,
    fontSize: 16, 
    color: '#1f2937', 
    flex: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  featuredBadge: { 
    paddingHorizontal: 4 
  },
  eventDescription: { 
    fontFamily: Fonts.Regular,
    fontSize: 13, 
    color: '#6b7280', 
    marginTop: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  eventDetails: { 
    flexDirection: 'row', 
    marginTop: 8, 
    gap: 16 
  },
  eventDetailItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4 
  },
  eventDetailText: { 
    fontFamily: Fonts.Regular,
    fontSize: 12, 
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  eventFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 8, 
    paddingTop: 8, 
    borderTopWidth: 1, 
    borderTopColor: '#f3f4f6' 
  },
  statusBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 10, 
    paddingVertical: 3, 
    borderRadius: 12, 
    gap: 4 
  },
  statusBadgeText: { 
    fontFamily: Fonts.SemiBold,
    fontSize: 11,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  capacityBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4 
  },
  capacityText: { 
    fontFamily: Fonts.Regular,
    fontSize: 12, 
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  fullText: { 
    color: '#ef4444', 
    fontFamily: Fonts.SemiBold 
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

  // Modal
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
  detailImage: { 
    width: '100%', 
    height: 200, 
    borderRadius: 8, 
    marginBottom: 16, 
    resizeMode: 'cover' 
  },
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
    marginTop: 8, 
    flexWrap: 'wrap' 
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
  detailFeaturedBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fef3c7', 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 12, 
    gap: 4 
  },
  detailFeaturedText: { 
    fontFamily: Fonts.SemiBold,
    fontSize: 11, 
    color: '#f59e0b',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  detailAssignedBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#ede9fe', 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 12, 
    gap: 4 
  },
  detailAssignedText: { 
    fontFamily: Fonts.SemiBold,
    fontSize: 11, 
    color: '#8b5cf6',
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
  detailActions: { 
    marginTop: 16, 
    paddingTop: 16, 
    borderTopWidth: 1, 
    borderTopColor: '#f3f4f6' 
  },
  detailActionButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    borderRadius: 8, 
    gap: 8 
  },
  registerButton: { 
    backgroundColor: '#8b5cf6' 
  },
  unregisterButton: { 
    backgroundColor: '#ef4444' 
  },
  disabledButton: { 
    backgroundColor: '#9ca3af' 
  },
  detailActionText: { 
    fontFamily: Fonts.SemiBold,
    color: '#ffffff', 
    fontSize: 16,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  viewDutyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  viewDutyButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: 14,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Duty Modal
  dutySection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  dutyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  dutyTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 18,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  closeDutyButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  closeDutyButtonText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});