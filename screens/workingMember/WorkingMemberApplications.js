// screens/workingMember/WorkingMemberApplications.js
import React, { useState, useEffect } from 'react';
import { initiateRazorpayPayment } from '../../services/paymentService';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db, getAuthInstance } from '../../config/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  orderBy,
} from 'firebase/firestore';
import { Fonts } from '../../config/fonts';
import { useLanguage } from '../../context/LanguageContext';

export default function WorkingMemberApplications({ navigation }) {
  const { t, counter } = useLanguage();
  
  // Force re-render when language changes
  const renderKey = `working-applications-${counter}`;

  // Get translations - EVERY SINGLE TEXT STRING is mapped to a translation key
  const translations = {
    // Common
    error: t('common.error') || 'Error',
    success: t('common.success') || 'Success',
    loading: t('common.loading') || 'Loading...',
    nA: t('common.nA') || 'N/A',
    close: t('common.close') || 'Close',
    cancel: t('common.cancel') || 'Cancel',
    yes: t('common.yes') || 'Yes',
    no: t('common.no') || 'No',
    pending: t('common.pending') || 'Pending',
    verified: t('applications.verified') || 'Verified',
    funded: t('applications.funded') || 'Funded',
    rejected: t('applications.rejected') || 'Rejected',
    general: t('common.general') || 'General',
    
    // Header
    applications: t('applications.title') || 'Applications',
    apply: t('applications.apply') || 'Apply',
    myApps: t('applications.myApps') || 'My Apps',
    
    // Tabs
    services: t('applications.services') || 'Services',
    competitions: t('applications.competitions') || 'Competitions',
    
    // Services
    oldAgeAssistance: t('applications.oldAgeAssistance') || 'Kabir Old Age Assistance Program',
    oldAgeDesc: t('applications.oldAgeDesc') || 'Financial assistance for senior citizens',
    kanyaMarriage: t('applications.kanyaMarriage') || 'Kanya (Girl Child) Marriage Assistance',
    kanyaDesc: t('applications.kanyaDesc') || 'Support for girl child marriage',
    selfEmployment: t('applications.selfEmployment') || 'Self-Employment Assistance Scheme',
    selfEmploymentDesc: t('applications.selfEmploymentDesc') || 'Support for unemployed elderly people',
    
    // Service Details
    below20: t('company.below20Years') || 'Below 20 years',
    between20to40: t('company.between20to40') || '20 - 40 years',
    between40to60: t('company.between40to60') || '40 - 60 years',
    above60: t('company.above60Years') || '60 years & above',
    below4: t('company.below4Years') || 'Below 4 years',
    between4to8: t('company.between4to8') || '4 - 8 years',
    between8to12: t('company.between8to12') || '8 - 12 years',
    above12: t('company.above12Years') || '12 years & above',
    descriptionLabel: t('common.description') || 'Description',
    availableForUnemployed: t('home.availableForElderly') || 'Available for unemployed elderly people',
    
    // My Applications
    myApplications: t('applications.myApplications') || 'My Applications',
    applicationsCount: t('applications.applicationsCount') || 'applications',
    noApplications: t('applications.noApplications') || 'No applications yet',
    noApplicationsSubtext: t('applications.noApplicationsSubtext') || 'Apply for services to see them here',
    browseServices: 'Browse Services',
    
    // Application Status
    viewDetails: t('applications.viewDetails') || 'View Details',
    applyNow: t('applications.applyNow') || 'Apply Now',
    
    // Competition Card
    noDescription: t('company.noDescription') || 'No description',
    winnerDeclared: t('applications.winnerDeclared') || 'Winner Declared',
    registered: t('applications.registered') || 'Registered',
    full: t('applications.full') || 'Full',
    
    // Apply Modal
    applyForService: t('applications.applyForService') || 'Apply for Service',
    serviceType: t('applications.serviceType') || 'Service Type',
    selectService: 'Select a service',
    fullName: t('auth.fullName') || 'Full Name',
    age: t('applications.age') || 'Age',
    gender: t('auth.gender') || 'Gender',
    phone: t('common.phone') || 'Phone',
    email: t('common.email') || 'Email',
    address: t('common.address') || 'Address',
    occupation: t('applications.occupation') || 'Occupation',
    annualIncome: t('applications.annualIncome') || 'Annual Income',
    idProof: t('applications.idProof') || 'ID Proof Details',
    idProofPlaceholder: 'Aadhar/PAN/Voter ID etc.',
    ageGroup: t('applications.ageGroup') || 'Age Group (if applicable)',
    ageGroupPlaceholder: 'e.g., 20-40 years',
    detailsReason: t('company.detailsReason') || 'Details / Reason',
    detailsPlaceholder: 'Please provide detailed reason for application',
    expectedAmount: t('applications.expectedAmount') || 'Expected Amount (₹)',
    amountPlaceholder: 'Enter expected amount',
    enterFullName: t('common.enterFullName') || 'Enter your full name',
    enterPhone: t('common.enterPhone') || 'Enter phone number',
    enterEmail: t('common.enterEmail') || 'Enter email',
    enterAddress: t('common.enterAddress') || 'Enter your address',
    occupationPlaceholder: 'Occupation',
    incomePlaceholder: 'Annual income',
    genderPlaceholder: 'Male/Female',
    submitting: t('applications.submitting') || 'Submitting...',
    submitApplication: t('applications.submitApplication') || 'Submit Application',
    requiredFields: t('applications.requiredFields') || 'Please fill in all required fields',
    applicationExists: t('applications.applicationExists') || 'Application Exists',
    applicationExistsMsg: t('applications.applicationExistsMsg') || 'You already have a {status} application for this service. You cannot apply again.',
    submitSuccess: t('applications.submitSuccess') || 'Your application has been submitted successfully',
    
    // Application Detail Modal
    applicationDetails: t('applications.applicationDetails') || 'Application Details',
    service: t('applications.service') || 'Service',
    oldAgeLabel: 'Old Age Assistance',
    kanyaLabel: 'Kanya Marriage Assistance',
    selfEmpLabel: 'Self Employment Assistance',
    fullNameLabel: t('auth.fullName') || 'Full Name',
    ageLabel: t('applications.age') || 'Age',
    genderLabel: t('auth.gender') || 'Gender',
    phoneLabel: t('common.phone') || 'Phone',
    emailLabel: t('common.email') || 'Email',
    addressLabel: t('common.address') || 'Address',
    occupationLabel: t('applications.occupation') || 'Occupation',
    annualIncomeLabel: t('applications.annualIncome') || 'Annual Income',
    idProofLabel: t('applications.idProof') || 'ID Proof',
    ageGroupLabel: t('applications.ageGroup') || 'Age Group',
    detailsLabel: t('company.detailsReason') || 'Details / Reason',
    expectedAmountLabel: t('applications.expectedAmount') || 'Expected Amount',
    fundDetails: t('applications.fundDetails') || 'Fund Details',
    amountReleased: t('company.amountReleased') || 'Amount Released',
    remarks: t('company.remarks') || 'Remarks',
    releasedDate: t('company.releasedDate') || 'Released Date',
    
    // Competition Detail Modal
    competitionDetails: t('applications.competitionDetails') || 'Competition Details',
    category: t('common.category') || 'Category',
    prize: t('applications.prize') || 'Prize',
    venue: t('applications.venue') || 'Venue',
    participants: t('applications.participants') || 'Participants',
    winner: t('applications.winner') || 'Winner',
    passSent: t('applications.passSent') || 'Pass/Ticket Sent',
    certificateSent: t('applications.certificateSent') || 'Certificate Sent',
    registerNow: t('applications.registerNow') || 'Register Now',
    registering: t('applications.registering') || 'Registering...',
    registerSuccess: t('applications.registerSuccess') || 'Registered for competition successfully',
    alreadyRegistered: t('applications.alreadyRegistered') || 'Already Registered',
    alreadyRegisteredMsg: t('applications.alreadyRegisteredMsg') || 'You have already registered for this competition',
    competitionFull: t('applications.competitionFull') || 'Full',
    competitionFullMsg: t('applications.competitionFullMsg') || 'This competition has reached maximum participants',
    pleaseLogin: t('common.pleaseLogin') || 'Please login first',
    
    // Empty State
    noCompetitions: t('applications.noCompetitions') || 'No Competitions',
    noCompetitionsSubtext: t('applications.noCompetitionsSubtext') || 'Check back later for upcoming competitions',
    
    // Loading
    loadingText: t('common.loading') || 'Loading...',
    
    // Alert
    failedToLoad: t('common.failedToLoad') || 'Failed to load services',
  };

  const [activeTab, setActiveTab] = useState('services');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState([]);
  const [applications, setApplications] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [myCompetitions, setMyCompetitions] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [applyForm, setApplyForm] = useState({
    serviceType: '',
    fullName: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    occupation: '',
    annualIncome: '',
    idProof: '',
    details: '',
    amount: '',
    ageGroup: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [competitionDetailModalVisible, setCompetitionDetailModalVisible] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [fundStatus, setFundStatus] = useState(null);
  const [applicationDetailModalVisible, setApplicationDetailModalVisible] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [myApplicationsTab, setMyApplicationsTab] = useState(false);

  useEffect(() => {
    fetchServices();
    setupApplicationsListener();
    setupCompetitionsListener();
  }, []);

  const fetchServices = async () => {
    try {
      const docRef = doc(db, 'company', 'profile');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const servicesList = [];
        
        if (data.oldAgeAssistance) {
          servicesList.push({
            id: 'oldAge',
            title: translations.oldAgeAssistance,
            icon: 'elderly',
            description: translations.oldAgeDesc,
            type: 'oldAge',
            details: [
              { label: translations.below20, value: data.oldAgeAssistance.below20 || '0' },
              { label: translations.between20to40, value: data.oldAgeAssistance.between20to40 || '0' },
              { label: translations.between40to60, value: data.oldAgeAssistance.between40to60 || '0' },
              { label: translations.above60, value: data.oldAgeAssistance.above60 || '0' },
            ]
          });
        }
        
        if (data.kanyaMarriageAssistance) {
          servicesList.push({
            id: 'kanya',
            title: translations.kanyaMarriage,
            icon: 'child-care',
            description: translations.kanyaDesc,
            type: 'kanya',
            details: [
              { label: translations.below4, value: data.kanyaMarriageAssistance.below4 || '0' },
              { label: translations.between4to8, value: data.kanyaMarriageAssistance.between4to8 || '0' },
              { label: translations.between8to12, value: data.kanyaMarriageAssistance.between8to12 || '0' },
              { label: translations.above12, value: data.kanyaMarriageAssistance.above12 || '0' },
            ]
          });
        }
        
        if (data.selfEmploymentAssistance) {
          servicesList.push({
            id: 'selfEmployment',
            title: translations.selfEmployment,
            icon: 'work',
            description: translations.selfEmploymentDesc,
            type: 'selfEmployment',
            details: [
              { label: translations.descriptionLabel, value: data.selfEmploymentAssistance || translations.availableForUnemployed }
            ]
          });
        }
        
        setServices(servicesList);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      Alert.alert(translations.error, translations.failedToLoad);
    }
  };

  const setupApplicationsListener = () => {
  const auth = getAuthInstance();

    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const q = query(
      collection(db, 'serviceApplications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = [];
      snapshot.forEach((doc) => {
        apps.push({ id: doc.id, ...doc.data() });
      });
      setApplications(apps);
      setLoading(false);
    });
    return () => unsubscribe();
  };

  const setupCompetitionsListener = () => {
  const auth = getAuthInstance();

    const compUnsubscribe = onSnapshot(collection(db, 'competitions'), (snapshot) => {
      const comps = [];
      snapshot.forEach((doc) => {
        comps.push({ id: doc.id, ...doc.data() });
      });
      setCompetitions(comps);
      setLoading(false);
    });

    const userId = auth.currentUser?.uid;
    if (userId) {
      const regQuery = query(
        collection(db, 'competitionRegistrations'),
        where('userId', '==', userId)
      );
      const regUnsubscribe = onSnapshot(regQuery, (snapshot) => {
        const regs = [];
        snapshot.forEach((doc) => {
          regs.push(doc.data().competitionId);
        });
        setMyCompetitions(regs);
      });
      return () => {
        compUnsubscribe();
        regUnsubscribe();
      };
    }
    return () => compUnsubscribe();
  };

  const getServiceLabel = (type) => {
    switch(type) {
      case 'oldAge': return translations.oldAgeLabel;
      case 'kanya': return translations.kanyaLabel;
      case 'selfEmployment': return translations.selfEmpLabel;
      default: return type || translations.nA;
    }
  };

  const handleApply = async () => {

    if (!applyForm.serviceType || !applyForm.details || !applyForm.fullName) {
      Alert.alert(translations.error, translations.requiredFields);
      return;
    }

    const existingApp = applications.find(
      app => app.serviceType === applyForm.serviceType && 
      (app.status === 'pending' || app.status === 'verified')
    );
    
    if (existingApp) {
      Alert.alert(
        translations.applicationExists,
        translations.applicationExistsMsg.replace('{status}', existingApp.status),
        [{ text: translations.close }]
      );
      return;
    }

    setSubmitting(true);
    try {
    const auth = getAuthInstance();

      const userId = auth.currentUser?.uid;
      const userEmail = auth.currentUser?.email;

      await addDoc(collection(db, 'serviceApplications'), {
        userId: userId,
        userEmail: userEmail || applyForm.email,
        serviceType: applyForm.serviceType,
        fullName: applyForm.fullName,
        age: applyForm.age || '',
        gender: applyForm.gender || '',
        phone: applyForm.phone || '',
        email: applyForm.email || userEmail || '',
        address: applyForm.address || '',
        occupation: applyForm.occupation || '',
        annualIncome: applyForm.annualIncome || '',
        idProof: applyForm.idProof || '',
        details: applyForm.details,
        amount: applyForm.amount || '0',
        ageGroup: applyForm.ageGroup || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      Alert.alert(translations.success, translations.submitSuccess);
      setApplyModalVisible(false);
      setApplyForm({
        serviceType: '',
        fullName: '',
        age: '',
        gender: '',
        phone: '',
        email: '',
        address: '',
        occupation: '',
        annualIncome: '',
        idProof: '',
        details: '',
        amount: '',
        ageGroup: '',
      });
    } catch (error) {
      Alert.alert(translations.error, error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterCompetition = async (competition) => {
  const auth = getAuthInstance();
  
  console.log('🔵 Competition Registration - Competition:', competition.title);
  console.log('🔵 Competition Registration - Auth:', auth ? 'Available' : 'Not available');
  
  if (!auth) {
    Alert.alert(translations.error, 'Authentication service not available');
    return;
  }

  const userId = auth.currentUser?.uid;
  const userEmail = auth.currentUser?.email;
  const displayName = auth.currentUser?.displayName;
  
  console.log('🔵 Competition Registration - User ID:', userId);
  console.log('🔵 Competition Registration - User Email:', userEmail);
  
  if (!userId) {
    Alert.alert(translations.error, translations.pleaseLogin);
    return;
  }

  if (myCompetitions.includes(competition.id)) {
    Alert.alert(translations.alreadyRegistered, translations.alreadyRegisteredMsg);
    return;
  }

  if (competition.participants?.length >= competition.maxParticipants) {
    Alert.alert(translations.competitionFull, translations.competitionFullMsg);
    return;
  }

  const registrationFee = parseFloat(competition.registrationFee) || 0;
  
  if (registrationFee > 0) {
    Alert.alert(
      'Registration Fee Required',
      `This competition requires a registration fee of ₹${registrationFee}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Pay & Register', 
          onPress: async () => {
            try {
              const userDoc = await getDoc(doc(db, 'users', userId));
              const userData = userDoc.exists() ? userDoc.data() : {};
              
              const donorName = displayName || userData.fullName || 'Competition Participant';
              const donorEmail = userEmail || userData.email || 'participant@email.com';
              const donorPhone = userData.phone || '0000000000';
              
              setRegistering(true);
              
              const paymentResult = await initiateRazorpayPayment({
                amount: registrationFee,
                name: donorName,
                email: donorEmail,
                phone: donorPhone,
                description: `Competition Registration: ${competition.title}`,
              });
              
              console.log('📥 Payment result:', paymentResult);
              
              if (paymentResult && paymentResult.paymentId) {
                await completeCompetitionRegistration(competition, userId, displayName, userEmail);
                Alert.alert(translations.success, '✅ Registration successful!');
                setCompetitionDetailModalVisible(false);
                // Refresh competitions
                const compRef = doc(db, 'competitions', competition.id);
                const compSnap = await getDoc(compRef);
                if (compSnap.exists()) {
                  setSelectedCompetition({ id: compSnap.id, ...compSnap.data() });
                }
              } else {
                Alert.alert(translations.error, 'Payment failed. Please try again.');
              }
            } catch (error) {
              console.error('❌ Payment error:', error);
              Alert.alert(translations.error, error.message || 'Payment failed');
            } finally {
              setRegistering(false);
            }
          }
        }
      ]
    );
    return;
  }

  // Free registration
  setRegistering(true);
  try {
    await completeCompetitionRegistration(competition, userId, displayName, userEmail);
    Alert.alert(translations.success, translations.registerSuccess);
    setCompetitionDetailModalVisible(false);
  } catch (error) {
    Alert.alert(translations.error, error.message);
  } finally {
    setRegistering(false);
  }
};

// ✅ Helper function to complete registration
const completeCompetitionRegistration = async (competition, userId, displayName, userEmail) => {
  // Add registration record
  await addDoc(collection(db, 'competitionRegistrations'), {
    competitionId: competition.id,
    userId: userId,
    userName: displayName || 'Participant',
    userEmail: userEmail || '',
    registeredAt: new Date().toISOString(),
    status: 'registered',
  });

  // Update competition participants
  const compRef = doc(db, 'competitions', competition.id);
  const participants = competition.participants || [];
  if (!participants.includes(userId)) {
    participants.push(userId);
    await updateDoc(compRef, { 
      participants,
      updatedAt: new Date().toISOString()
    });
  }

  // Update local state
  setMyCompetitions(prev => [...prev, competition.id]);
};

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchServices();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return '#d97706';
      case 'verified': return '#2563eb';
      case 'funded': return '#059669';
      case 'rejected': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'pending': return translations.pending;
      case 'verified': return translations.verified;
      case 'funded': return translations.funded;
      case 'rejected': return translations.rejected;
      default: return status || translations.pending;
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return 'hourglass-empty';
      case 'verified': return 'check-circle';
      case 'funded': return 'payments';
      case 'rejected': return 'cancel';
      default: return 'info';
    }
  };

  const ServiceCard = ({ service }) => {
    const hasApplied = applications.some(
      app => app.serviceType === service.type && 
      (app.status === 'pending' || app.status === 'verified' || app.status === 'funded')
    );
    const latestApp = applications.find(app => app.serviceType === service.type);
    const status = latestApp?.status || '';

    return (
      <View style={styles.serviceCard}>
        <View style={styles.serviceCardHeader}>
          <View style={styles.serviceIconContainer}>
            <MaterialIcons name={service.icon} size={26} color="#8b5cf6" />
          </View>
          <View style={styles.serviceCardContent}>
            <Text style={styles.serviceCardTitle}>{service.title}</Text>
            <Text style={styles.serviceCardDesc}>{service.description}</Text>
          </View>
        </View>

        {service.details && (
          <View style={styles.serviceDetails}>
            {service.details.map((detail, index) => (
              <View key={index} style={styles.serviceDetailRow}>
                <Text style={styles.serviceDetailLabel}>{detail.label}</Text>
                <Text style={styles.serviceDetailValue}>₹ {detail.value}</Text>
              </View>
            ))}
          </View>
        )}

        {hasApplied ? (
          <View style={styles.applicationStatusContainer}>
            <View style={[styles.applicationStatusBadge, { backgroundColor: getStatusColor(status) + '15' }]}>
              <MaterialIcons name={getStatusIcon(status)} size={14} color={getStatusColor(status)} />
              <Text style={[styles.applicationStatusText, { color: getStatusColor(status) }]}>
                {getStatusLabel(status)}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.viewAppButton}
              onPress={() => {
                setSelectedApplication(latestApp);
                setApplicationDetailModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAppText}>{translations.viewDetails}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={() => {
const auth = getAuthInstance();
              setSelectedService(service);
              const user = auth.currentUser;
              setApplyForm({
                serviceType: service.type,
                fullName: user?.displayName || '',
                age: '',
                gender: '',
                phone: '',
                email: user?.email || '',
                address: '',
                occupation: '',
                annualIncome: '',
                idProof: '',
                details: '',
                amount: '',
                ageGroup: '',
              });
              setApplyModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="send" size={16} color="#ffffff" />
            <Text style={styles.applyButtonText}>{translations.applyNow}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const ApplicationItem = ({ application }) => (
    <TouchableOpacity 
      style={styles.applicationItem}
      onPress={() => {
        setSelectedApplication(application);
        setApplicationDetailModalVisible(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.applicationItemLeft}>
        <View style={[styles.applicationItemIcon, { backgroundColor: getStatusColor(application.status) + '15' }]}>
          <MaterialIcons name={getStatusIcon(application.status)} size={18} color={getStatusColor(application.status)} />
        </View>
        <View>
          <Text style={styles.applicationItemTitle}>
            {getServiceLabel(application.serviceType)}
          </Text>
          <Text style={styles.applicationItemSubtitle}>
            {translations.appliedOn} {new Date(application.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View style={[styles.applicationItemStatus, { backgroundColor: getStatusColor(application.status) + '15' }]}>
        <Text style={[styles.applicationItemStatusText, { color: getStatusColor(application.status) }]}>
          {getStatusLabel(application.status)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const CompetitionCard = ({ competition }) => {
  const isRegistered = myCompetitions.includes(competition.id);
  const isFull = competition.participants?.length >= competition.maxParticipants;
  const registrationFee = competition.registrationFee || 0;

  return (
    <TouchableOpacity 
      style={styles.competitionCard}
      onPress={() => {
        setSelectedCompetition(competition);
        setCompetitionDetailModalVisible(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.competitionHeader}>
        <Text style={styles.competitionTitle} numberOfLines={1}>
          {competition.title}
        </Text>
        <View style={[styles.competitionStatus, { backgroundColor:
          competition.status === 'upcoming' ? '#fef3c7' :
          competition.status === 'live' ? '#dbeafe' : '#d1fae5'
        }]}>
          <Text style={[styles.competitionStatusText, { color:
            competition.status === 'upcoming' ? '#d97706' :
            competition.status === 'live' ? '#2563eb' : '#059669'
          }]}>
            {competition.status?.toUpperCase() || 'UPCOMING'}
          </Text>
        </View>
      </View>

      <Text style={styles.competitionDescription} numberOfLines={2}>
        {competition.description || translations.noDescription}
      </Text>

      <View style={styles.competitionMeta}>
        <View style={styles.competitionMetaItem}>
          <MaterialIcons name="emoji-events" size={14} color="#6b7280" />
          <Text style={styles.competitionMetaText}>₹{competition.prize || '0'}</Text>
        </View>
        <View style={styles.competitionMetaItem}>
          <MaterialIcons name="people" size={14} color="#6b7280" />
          <Text style={styles.competitionMetaText}>
            {competition.participants?.length || 0}/{competition.maxParticipants || '∞'}
          </Text>
        </View>
        {/* ✅ Show Registration Fee */}
        {registrationFee > 0 && (
          <View style={styles.competitionMetaItem}>
            <MaterialIcons name="payments" size={14} color="#10b981" />
            <Text style={[styles.competitionMetaText, { color: '#10b981' }]}>
              ₹{registrationFee} fee
            </Text>
          </View>
        )}
        {competition.winner && (
          <View style={styles.competitionMetaItem}>
            <MaterialIcons name="stars" size={14} color="#f59e0b" />
            <Text style={[styles.competitionMetaText, { color: '#f59e0b' }]}>
              {translations.winnerDeclared}
            </Text>
          </View>
        )}
      </View>

      {isRegistered && (
        <View style={styles.registeredBadge}>
          <MaterialIcons name="check-circle" size={14} color="#10b981" />
          <Text style={styles.registeredBadgeText}>{translations.registered}</Text>
        </View>
      )}

      {isFull && !isRegistered && (
        <View style={styles.fullBadge}>
          <MaterialIcons name="block" size={14} color="#ef4444" />
          <Text style={styles.fullBadgeText}>{translations.full}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

  if (loading) {
    return (
      <View style={styles.loadingContainer} key={renderKey}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>{translations.loadingText}</Text>
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
          <Text style={styles.headerTitle}>{translations.applications}</Text>
          <TouchableOpacity onPress={() => setMyApplicationsTab(!myApplicationsTab)} activeOpacity={0.7}>
            <Text style={styles.toggleButton}>
              {myApplicationsTab ? translations.apply : translations.myApps}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {myApplicationsTab ? (
        // My Applications Tab
        <View style={styles.myAppsContainer}>
          <View style={styles.myAppsHeader}>
            <Text style={styles.myAppsTitle}>{translations.myApplications}</Text>
            <Text style={styles.myAppsCount}>{applications.length} {translations.applicationsCount}</Text>
          </View>
          
          {applications.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="inbox" size={50} color="#d1d5db" />
              <Text style={styles.emptyStateText}>{translations.noApplications}</Text>
              <Text style={styles.emptyStateSubtext}>{translations.noApplicationsSubtext}</Text>
              <TouchableOpacity 
                style={styles.emptyApplyButton}
                onPress={() => setMyApplicationsTab(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.emptyApplyButtonText}>{translations.browseServices}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            applications.map((app) => (
              <ApplicationItem key={app.id} application={app} />
            ))
          )}
        </View>
      ) : (
        // Main Tabs
        <>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'services' && styles.tabButtonActive]}
              onPress={() => setActiveTab('services')}
              activeOpacity={0.7}
            >
              <MaterialIcons 
                name="handshake" 
                size={18} 
                color={activeTab === 'services' ? '#8b5cf6' : '#6b7280'} 
              />
              <Text style={[styles.tabText, activeTab === 'services' && styles.tabTextActive]}>
                {translations.services}
              </Text>
              {applications.filter(a => a.status === 'pending').length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>
                    {applications.filter(a => a.status === 'pending').length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'competitions' && styles.tabButtonActive]}
              onPress={() => setActiveTab('competitions')}
              activeOpacity={0.7}
            >
              <MaterialIcons 
                name="emoji-events" 
                size={18} 
                color={activeTab === 'competitions' ? '#8b5cf6' : '#6b7280'} 
              />
              <Text style={[styles.tabText, activeTab === 'competitions' && styles.tabTextActive]}>
                {translations.competitions}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8b5cf6']} />
            }
          >
            {activeTab === 'services' ? (
              <View style={styles.servicesContainer}>
                {services.map((service, index) => (
                  <ServiceCard key={index} service={service} />
                ))}
              </View>
            ) : (
              <View style={styles.competitionsContainer}>
                {competitions.length === 0 ? (
                  <View style={styles.emptyState}>
                    <MaterialIcons name="emoji-events" size={50} color="#d1d5db" />
                    <Text style={styles.emptyStateText}>{translations.noCompetitions}</Text>
                    <Text style={styles.emptyStateSubtext}>{translations.noCompetitionsSubtext}</Text>
                  </View>
                ) : (
                  competitions.map((competition) => (
                    <CompetitionCard key={competition.id} competition={competition} />
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </>
      )}

      {/* Apply Modal - With More Details */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={applyModalVisible}
        onRequestClose={() => setApplyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{translations.applyForService}</Text>
              <TouchableOpacity onPress={() => setApplyModalVisible(false)} activeOpacity={0.7}>
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{translations.serviceType}</Text>
              <View style={styles.serviceTypeDisplay}>
                <Text style={styles.serviceTypeText}>
                  {selectedService?.title || translations.selectService}
                </Text>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{translations.fullName} *</Text>
              <TextInput
                style={styles.input}
                value={applyForm.fullName}
                onChangeText={(text) => setApplyForm({...applyForm, fullName: text})}
                placeholder={translations.enterFullName}
                placeholderTextColor="#9ca3af"
                textAlignVertical="center"
              />
            </View>

            <View style={styles.rowFields}>
              <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>{translations.age}</Text>
                <TextInput
                  style={styles.input}
                  value={applyForm.age}
                  onChangeText={(text) => setApplyForm({...applyForm, age: text})}
                  placeholder={translations.age}
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  textAlignVertical="center"
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>{translations.gender}</Text>
                <TextInput
                  style={styles.input}
                  value={applyForm.gender}
                  onChangeText={(text) => setApplyForm({...applyForm, gender: text})}
                  placeholder={translations.genderPlaceholder}
                  placeholderTextColor="#9ca3af"
                  textAlignVertical="center"
                />
              </View>
            </View>

            <View style={styles.rowFields}>
              <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>{translations.phone}</Text>
                <TextInput
                  style={styles.input}
                  value={applyForm.phone}
                  onChangeText={(text) => setApplyForm({...applyForm, phone: text})}
                  placeholder={translations.enterPhone}
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  textAlignVertical="center"
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>{translations.email}</Text>
                <TextInput
                  style={styles.input}
                  value={applyForm.email}
                  onChangeText={(text) => setApplyForm({...applyForm, email: text})}
                  placeholder={translations.enterEmail}
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  textAlignVertical="center"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{translations.address}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={applyForm.address}
                onChangeText={(text) => setApplyForm({...applyForm, address: text})}
                placeholder={translations.enterAddress}
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.rowFields}>
              <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>{translations.occupation}</Text>
                <TextInput
                  style={styles.input}
                  value={applyForm.occupation}
                  onChangeText={(text) => setApplyForm({...applyForm, occupation: text})}
                  placeholder={translations.occupationPlaceholder}
                  placeholderTextColor="#9ca3af"
                  textAlignVertical="center"
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>{translations.annualIncome}</Text>
                <TextInput
                  style={styles.input}
                  value={applyForm.annualIncome}
                  onChangeText={(text) => setApplyForm({...applyForm, annualIncome: text})}
                  placeholder={translations.incomePlaceholder}
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  textAlignVertical="center"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{translations.idProof}</Text>
              <TextInput
                style={styles.input}
                value={applyForm.idProof}
                onChangeText={(text) => setApplyForm({...applyForm, idProof: text})}
                placeholder={translations.idProofPlaceholder}
                placeholderTextColor="#9ca3af"
                textAlignVertical="center"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{translations.ageGroup}</Text>
              <TextInput
                style={styles.input}
                value={applyForm.ageGroup}
                onChangeText={(text) => setApplyForm({...applyForm, ageGroup: text})}
                placeholder={translations.ageGroupPlaceholder}
                placeholderTextColor="#9ca3af"
                textAlignVertical="center"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{translations.detailsReason} *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={applyForm.details}
                onChangeText={(text) => setApplyForm({...applyForm, details: text})}
                placeholder={translations.detailsPlaceholder}
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{translations.expectedAmount}</Text>
              <TextInput
                style={styles.input}
                value={applyForm.amount}
                onChangeText={(text) => setApplyForm({...applyForm, amount: text})}
                placeholder={translations.amountPlaceholder}
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                textAlignVertical="center"
              />
            </View>

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleApply}
              disabled={submitting}
              activeOpacity={0.7}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? translations.submitting : translations.submitApplication}
              </Text>
              {!submitting && (
                <MaterialIcons name="arrow-forward" size={20} color="#ffffff" />
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Application Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={applicationDetailModalVisible}
        onRequestClose={() => setApplicationDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {selectedApplication && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{translations.applicationDetails}</Text>
                  <TouchableOpacity onPress={() => setApplicationDetailModalVisible(false)} activeOpacity={0.7}>
                    <MaterialIcons name="close" size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailStatusBar}>
                  <View style={[styles.detailStatusBadge, { backgroundColor: getStatusColor(selectedApplication.status) + '15' }]}>
                    <MaterialIcons name={getStatusIcon(selectedApplication.status)} size={18} color={getStatusColor(selectedApplication.status)} />
                    <Text style={[styles.detailStatusText, { color: getStatusColor(selectedApplication.status) }]}>
                      {getStatusLabel(selectedApplication.status)}
                    </Text>
                  </View>
                  <Text style={styles.detailDate}>
                    {new Date(selectedApplication.createdAt).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.service}</Text>
                  <Text style={styles.detailValue}>
                    {getServiceLabel(selectedApplication.serviceType)}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.fullNameLabel}</Text>
                  <Text style={styles.detailValue}>{selectedApplication.fullName || translations.nA}</Text>
                </View>

                <View style={styles.detailRow}>
                  <View style={[styles.detailSection, { flex: 1 }]}>
                    <Text style={styles.detailLabel}>{translations.ageLabel}</Text>
                    <Text style={styles.detailValue}>{selectedApplication.age || translations.nA}</Text>
                  </View>
                  <View style={[styles.detailSection, { flex: 1 }]}>
                    <Text style={styles.detailLabel}>{translations.genderLabel}</Text>
                    <Text style={styles.detailValue}>{selectedApplication.gender || translations.nA}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={[styles.detailSection, { flex: 1 }]}>
                    <Text style={styles.detailLabel}>{translations.phoneLabel}</Text>
                    <Text style={styles.detailValue}>{selectedApplication.phone || translations.nA}</Text>
                  </View>
                  <View style={[styles.detailSection, { flex: 1 }]}>
                    <Text style={styles.detailLabel}>{translations.emailLabel}</Text>
                    <Text style={styles.detailValue}>{selectedApplication.email || translations.nA}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.addressLabel}</Text>
                  <Text style={styles.detailValue}>{selectedApplication.address || translations.nA}</Text>
                </View>

                <View style={styles.detailRow}>
                  <View style={[styles.detailSection, { flex: 1 }]}>
                    <Text style={styles.detailLabel}>{translations.occupationLabel}</Text>
                    <Text style={styles.detailValue}>{selectedApplication.occupation || translations.nA}</Text>
                  </View>
                  <View style={[styles.detailSection, { flex: 1 }]}>
                    <Text style={styles.detailLabel}>{translations.annualIncomeLabel}</Text>
                    <Text style={styles.detailValue}>₹{selectedApplication.annualIncome || translations.nA}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.idProofLabel}</Text>
                  <Text style={styles.detailValue}>{selectedApplication.idProof || translations.nA}</Text>
                </View>

                {selectedApplication.ageGroup && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>{translations.ageGroupLabel}</Text>
                    <Text style={styles.detailValue}>{selectedApplication.ageGroup}</Text>
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.detailsLabel}</Text>
                  <Text style={styles.detailValue}>{selectedApplication.details || translations.nA}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.expectedAmountLabel}</Text>
                  <Text style={[styles.detailValue, { color: '#10b981', fontFamily: Fonts.Bold }]}>
                    ₹{selectedApplication.amount || '0'}
                  </Text>
                </View>

                {selectedApplication.status === 'funded' && (
                  <View style={styles.fundDetailCard}>
                    <Text style={styles.fundDetailTitle}>{translations.fundDetails}</Text>
                    <View style={styles.fundDetailRow}>
                      <Text style={styles.fundDetailLabel}>{translations.amountReleased}</Text>
                      <Text style={styles.fundDetailValue}>₹{selectedApplication.fundAmount || selectedApplication.amount || '0'}</Text>
                    </View>
                    {selectedApplication.fundRemarks && (
                      <View style={styles.fundDetailRow}>
                        <Text style={styles.fundDetailLabel}>{translations.remarks}</Text>
                        <Text style={styles.fundDetailValue}>{selectedApplication.fundRemarks}</Text>
                      </View>
                    )}
                    <View style={styles.fundDetailRow}>
                      <Text style={styles.fundDetailLabel}>{translations.releasedDate}</Text>
                      <Text style={styles.fundDetailValue}>
                        {selectedApplication.fundReleasedAt ? new Date(selectedApplication.fundReleasedAt).toLocaleDateString() : translations.nA}
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Competition Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={competitionDetailModalVisible}
        onRequestClose={() => setCompetitionDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {selectedCompetition && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{translations.competitionDetails}</Text>
                  <TouchableOpacity onPress={() => setCompetitionDetailModalVisible(false)} activeOpacity={0.7}>
                    <MaterialIcons name="close" size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.competitionDetailTitle}>{selectedCompetition.title}</Text>
                
                <View style={styles.competitionDetailStatus}>
                  <View style={[styles.competitionStatus, { backgroundColor:
                    selectedCompetition.status === 'upcoming' ? '#fef3c7' :
                    selectedCompetition.status === 'live' ? '#dbeafe' : '#d1fae5',
                    alignSelf: 'flex-start'
                  }]}>
                    <Text style={[styles.competitionStatusText, { color:
                      selectedCompetition.status === 'upcoming' ? '#d97706' :
                      selectedCompetition.status === 'live' ? '#2563eb' : '#059669'
                    }]}>
                      {selectedCompetition.status?.toUpperCase() || 'UPCOMING'}
                    </Text>
                  </View>
                </View>

                <View style={styles.competitionDetailSection}>
                  <Text style={styles.competitionDetailLabel}>{translations.description}</Text>
                  <Text style={styles.competitionDetailValue}>
                    {selectedCompetition.description || translations.noDescription}
                  </Text>
                </View>

                <View style={styles.competitionDetailRow}>
                  <View style={styles.competitionDetailItem}>
                    <Text style={styles.competitionDetailLabel}>{translations.category}</Text>
                    <Text style={styles.competitionDetailValue}>
                      {selectedCompetition.category || translations.nA}
                    </Text>
                  </View>
                  <View style={styles.competitionDetailItem}>
                    <Text style={styles.competitionDetailLabel}>{translations.prize}</Text>
                    <Text style={[styles.competitionDetailValue, { color: '#10b981', fontFamily: Fonts.Bold }]}>
                      ₹{selectedCompetition.prize || '0'}
                    </Text>
                  </View>
                </View>
{/* Add this in the competition detail modal after participants */}
<View style={styles.competitionDetailRow}>
  <View style={styles.competitionDetailItem}>
    <Text style={styles.competitionDetailLabel}>Registration Fee</Text>
    <Text style={[styles.competitionDetailValue, { color: '#10b981', fontFamily: Fonts.Bold }]}>
      {selectedCompetition.registrationFee > 0 ? `₹${selectedCompetition.registrationFee}` : 'Free'}
    </Text>
  </View>
  <View style={styles.competitionDetailItem}>
    <Text style={styles.competitionDetailLabel}>Status</Text>
    <Text style={styles.competitionDetailValue}>
      {selectedCompetition.status?.toUpperCase() || 'UPCOMING'}
    </Text>
  </View>
</View>
                <View style={styles.competitionDetailRow}>
                  <View style={styles.competitionDetailItem}>
                    <Text style={styles.competitionDetailLabel}>{translations.venue}</Text>
                    <Text style={styles.competitionDetailValue}>
                      {selectedCompetition.venue || translations.nA}
                    </Text>
                  </View>
                  <View style={styles.competitionDetailItem}>
                    <Text style={styles.competitionDetailLabel}>{translations.participants}</Text>
                    <Text style={styles.competitionDetailValue}>
                      {selectedCompetition.participants?.length || 0}/{selectedCompetition.maxParticipants || '∞'}
                    </Text>
                  </View>
                </View>

                {selectedCompetition.winner && (
                  <View style={styles.winnerSection}>
                    <View style={styles.winnerBadge}>
                      <MaterialIcons name="stars" size={20} color="#f59e0b" />
                      <Text style={styles.winnerText}>{translations.winner}: {selectedCompetition.winnerName}</Text>
                    </View>
                  </View>
                )}

                {selectedCompetition.passSent && (
                  <View style={styles.notificationBadge}>
                    <MaterialIcons name="confirmation-number" size={16} color="#8b5cf6" />
                    <Text style={styles.notificationText}>{translations.passSent}</Text>
                  </View>
                )}

                {selectedCompetition.certificateSent && (
                  <View style={styles.notificationBadge}>
                    <MaterialIcons name="verified" size={16} color="#10b981" />
                    <Text style={styles.notificationText}>{translations.certificateSent}</Text>
                  </View>
                )}

                {selectedCompetition.status !== 'completed' && (
                  <TouchableOpacity 
                    style={[
                      styles.registerCompetitionButton,
                      (myCompetitions.includes(selectedCompetition.id) || 
                       selectedCompetition.participants?.length >= selectedCompetition.maxParticipants) && 
                      styles.registerDisabled
                    ]}
                    onPress={() => handleRegisterCompetition(selectedCompetition)}
                    disabled={
                      registering || 
                      myCompetitions.includes(selectedCompetition.id) || 
                      selectedCompetition.participants?.length >= selectedCompetition.maxParticipants
                    }
                    activeOpacity={0.7}
                  >
                    <MaterialIcons 
                      name={
                        myCompetitions.includes(selectedCompetition.id) ? 'check-circle' :
                        selectedCompetition.participants?.length >= selectedCompetition.maxParticipants ? 'block' : 'event'
                      } 
                      size={20} 
                      color="#ffffff" 
                    />
                    <Text style={styles.registerCompetitionText}>
                      {registering ? translations.registering :
                       myCompetitions.includes(selectedCompetition.id) ? translations.registered :
                       selectedCompetition.participants?.length >= selectedCompetition.maxParticipants ? translations.full : translations.registerNow}
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
  toggleButton: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#ffffff',
    padding: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    borderRadius: 8,
    position: 'relative',
  },
  tabButtonActive: {
    backgroundColor: '#f5f3ff',
  },
  tabText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 13,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  tabTextActive: {
    color: '#8b5cf6',
  },
  tabBadge: {
    position: 'absolute',
    top: 4,
    right: '30%',
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 9,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 4,
  },

  servicesContainer: {
    paddingVertical: 8,
  },

  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  serviceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f3ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceCardContent: {
    flex: 1,
  },
  serviceCardTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 15,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  serviceCardDesc: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  serviceDetails: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  serviceDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  serviceDetailLabel: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  serviceDetailValue: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  applicationStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  applicationStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  applicationStatusText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  viewAppButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  viewAppText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    color: '#8b5cf6',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  applyButtonText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // My Applications
  myAppsContainer: {
    flex: 1,
    padding: 16,
  },
  myAppsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  myAppsTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 18,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  myAppsCount: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  applicationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  applicationItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  applicationItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applicationItemTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  applicationItemSubtitle: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  applicationItemStatus: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  applicationItemStatusText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 11,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Competition Styles
  competitionsContainer: {
    paddingVertical: 8,
  },

  competitionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  competitionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  competitionTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 15,
    color: '#1f2937',
    flex: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  competitionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  competitionStatusText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 10,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  competitionDescription: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  competitionMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  competitionMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  competitionMetaText: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  registeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    gap: 4,
    alignSelf: 'flex-start',
  },
  registeredBadgeText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    color: '#059669',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  fullBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    gap: 4,
    alignSelf: 'flex-start',
  },
  fullBadgeText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    color: '#ef4444',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Modal Styles
  modalOverlay: {
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

  field: {
    marginBottom: 14,
  },
  rowFields: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  label: {
    fontFamily: Fonts.SemiBold,
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  input: {
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  serviceTypeDisplay: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f9fafb',
  },
  serviceTypeText: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  submitButtonText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 15,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Application Detail Modal
  detailStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  detailStatusText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  detailDate: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
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

  fundDetailCard: {
    backgroundColor: '#d1fae5',
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
  },
  fundDetailTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 14,
    color: '#059669',
    marginBottom: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  fundDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  fundDetailLabel: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#047857',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  fundDetailValue: {
    fontFamily: Fonts.SemiBold,
    fontSize: 13,
    color: '#047857',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Competition Detail Modal
  competitionDetailTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 18,
    color: '#1f2937',
    marginBottom: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  competitionDetailStatus: {
    marginBottom: 12,
  },
  competitionDetailSection: {
    marginBottom: 12,
  },
  competitionDetailLabel: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  competitionDetailValue: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  competitionDetailRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  competitionDetailItem: {
    flex: 1,
  },

  winnerSection: {
    marginVertical: 10,
  },
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  winnerText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#d97706',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  notificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginVertical: 4,
    gap: 6,
  },
  notificationText: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  registerCompetitionButton: {
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
  registerCompetitionText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 15,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 18,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  emptyStateSubtext: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  emptyApplyButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyApplyButtonText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
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
    marginTop: 10,
    color: '#6b7280',
    fontSize: 14,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});