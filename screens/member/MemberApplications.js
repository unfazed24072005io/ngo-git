// screens/member/MemberApplications.js
import React, { useState, useEffect } from 'react';
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

export default function MemberApplications({ navigation }) {
  const { t, counter } = useLanguage();
  
  // Force re-render when language changes
  const renderKey = `member-applications-${counter}`;

  // Get translations - EVERY SINGLE TEXT STRING is mapped to a translation key
  const translations = {
    // Common
    error: t('common.error') || 'Error',
    success: t('common.success') || 'Success',
    loading: t('common.loading') || 'Loading...',
    cancel: t('common.cancel') || 'Cancel',
    close: t('common.close') || 'Close',
    nA: t('common.nA') || 'N/A',
    
    // Header
    applications: t('applications.title') || 'Applications',
    services: t('applications.services') || 'Services',
    myApps: t('applications.myApps') || 'My Apps',
    
    // Tabs
    competitions: t('applications.competitions') || 'Competitions',
    
    // Services
    oldAgeAssistance: t('applications.oldAgeAssistance') || 'Kabir Old Age Assistance Program',
    oldAgeDesc: t('applications.oldAgeDesc') || 'Financial assistance for senior citizens',
    kanyaMarriage: t('applications.kanyaMarriage') || 'Kanya (Girl Child) Marriage Assistance',
    kanyaDesc: t('applications.kanyaDesc') || 'Support for girl child marriage',
    selfEmployment: t('applications.selfEmployment') || 'Self-Employment Assistance Scheme',
    selfEmploymentDesc: t('applications.selfEmploymentDesc') || 'Support for unemployed elderly people',
    deathAssistance: t('applications.deathAssistance') || 'Kabir Antyeshti (Death) Assistance',
    deathDesc: t('applications.deathDesc') || 'Financial support for family of deceased members',
    
    // Form Labels
    oldAgeForm: t('applications.oldAgeForm') || 'Old Age Application Form (Vriddha)',
    kanyaForm: t('applications.kanyaForm') || 'Kanya Vivah (Marriage) Form',
    selfEmpForm: t('applications.selfEmpForm') || 'Self Employment / Singer Form',
    deathForm: t('applications.deathForm') || 'Antyeshti (Death) Claim Form',
    
    // Form Selector
    selectForm: t('applications.selectForm') || 'Select Application Form',
    formSubtext: t('applications.formSubtext') || 'Please ensure you have all the required documents (Aadhar, Bank passbook, Photos) before filling out the form.',
    
    // My Applications
    myApplications: t('applications.myApplications') || 'My Applications',
    applicationsCount: t('applications.applicationsCount') || 'applications',
    noApplications: t('applications.noApplications') || 'No applications yet',
    noApplicationsSubtext: t('applications.noApplicationsSubtext') || 'Apply for services to see them here',
    
    // Status
    pending: t('common.pending') || 'Pending',
    verified: t('applications.verified') || 'Verified',
    funded: t('applications.funded') || 'Funded',
    rejected: t('applications.rejected') || 'Rejected',
    
    // Form Fields
    fullName: t('auth.fullName') || 'Full Name',
    fatherName: t('applications.fatherName') || "Father's Name",
    husbandName: t('applications.husbandName') || "Husband's Name",
    age: t('applications.age') || 'Age',
    gender: t('auth.gender') || 'Gender',
    address: t('common.address') || 'Address',
    phone: t('common.phone') || 'Phone',
    email: t('common.email') || 'Email',
    reason: t('common.reason') || 'Reason',
    amount: t('common.amount') || 'Amount',
    requestedAmount: t('applications.requestedAmount') || 'Requested Amount',
    enterAmount: t('applications.enterAmount') || 'Enter amount',
    detailsReason: t('company.detailsReason') || 'Details / Reason',
    
    // Bank Details
    bankDetails: t('applications.bankDetails') || 'Bank Details',
    bankName: t('applications.bankName') || 'Bank Name',
    accountNumber: t('applications.accountNumber') || 'Account Number',
    ifscCode: t('applications.ifscCode') || 'IFSC Code',
    
    // Documents
    supportingDocs: t('applications.supportingDocs') || 'Supporting Documents',
    aadharCard: t('applications.aadharCard') || 'Aadhar Card No.',
    panCard: t('applications.panCard') || 'PAN Card',
    voterId: t('applications.voterId') || 'Voter ID',
    rationCard: t('applications.rationCard') || 'Ration Card',
    bplCard: t('applications.bplCard') || 'BPL Card',
    yes: t('common.yes') || 'Yes',
    no: t('common.no') || 'No',
    
    // Kanya Form
    memberDetails: t('applications.memberDetails') || 'Member Details',
    memberName: t('applications.memberName') || 'Member Name',
    memberId: t('applications.memberId') || 'Member ID',
    memberPhone: t('applications.memberPhone') || 'Member Phone',
    memberAddress: t('applications.memberAddress') || 'Member Address',
    daughterDetails: t('applications.daughterDetails') || "Kanya (Daughter) Details",
    kanyaName: t('applications.kanyaName') || "Kanya Name",
    girlFather: t('applications.girlFather') || "Father's Name",
    girlMother: t('applications.girlMother') || "Mother's Name",
    dateOfBirth: t('applications.dateOfBirth') || 'Date of Birth',
    education: t('applications.education') || 'Education',
    marriageDetails: t('applications.marriageDetails') || 'Marriage Details',
    weddingDate: t('applications.weddingDate') || 'Wedding Date',
    weddingVenue: t('applications.weddingVenue') || 'Wedding Venue',
    groomName: t('applications.groomName') || "Groom's Name",
    groomFather: t('applications.groomFather') || "Groom's Father",
    groomAddress: t('applications.groomAddress') || "Groom's Address",
    marriageProof: t('applications.marriageProof') || 'Marriage Certificate Available?',
    invitationCard: t('applications.invitationCard') || 'Invitation Card',
    kanyaAadhar: t('applications.kanyaAadhar') || "Kanya's Aadhar",
    passportPhoto: t('applications.passportPhoto') || 'Passport Photo',
    bankPassbook: t('applications.bankPassbook') || 'Bank Passbook',
    
    // Self Employment Form
    applicantCategory: t('applications.applicantCategory') || 'Applicant Category',
    general: t('applications.general') || 'General',
    singer: t('applications.singer') || 'Singer',
    bankEducation: t('applications.bankEducation') || 'Bank & Education',
    educationQualification: t('applications.educationQualification') || 'Education Qualification',
    occupation: t('applications.occupation') || 'Occupation',
    annualIncome: t('applications.annualIncome') || 'Annual Income',
    businessDetails: t('applications.businessDetails') || 'Business/Artist Details',
    
    // Death Form
    deceasedDetails: t('applications.deceasedDetails') || 'Deceased Person Details',
    deceasedName: t('applications.deceasedName') || 'Deceased Name',
    deceasedFather: t('applications.deceasedFather') || "Father's Name",
    deceasedAge: t('applications.deceasedAge') || 'Age',
    deceasedId: t('applications.deceasedId') || 'Member ID',
    deceasedType: t('applications.deceasedType') || 'Member Type',
    deceasedJoinDate: t('applications.deceasedJoinDate') || 'Join Date',
    deceasedPhone: t('applications.deceasedPhone') || 'Phone',
    deceasedAddress: t('applications.deceasedAddress') || 'Address',
    deathDetails: t('applications.deathDetails') || 'Death Details',
    deathDate: t('applications.deathDate') || 'Date of Death',
    deathCause: t('applications.deathCause') || 'Cause of Death',
    deathPlace: t('applications.deathPlace') || 'Place of Death',
    deathProof: t('applications.deathProof') || 'Death Proof Available?',
    claimantDetails: t('applications.claimantDetails') || 'Claimant Details',
    claimantName: t('applications.claimantName') || 'Claimant Name',
    claimantFather: t('applications.claimantFather') || "Father's Name",
    relationship: t('applications.relationship') || 'Relationship',
    claimantAddress: t('applications.claimantAddress') || 'Claimant Address',
    
    // Buttons
    fillApplication: t('applications.fillApplication') || 'Fill Application Form',
    viewDetails: t('applications.viewDetails') || 'View Details',
    submit: t('applications.submit') || 'Submit',
    submitting: t('applications.submitting') || 'Submitting...',
    submitOldAge: t('applications.submitOldAge') || 'Submit Old Age Application',
    submitKanya: t('applications.submitKanya') || 'Submit Kanya Application',
    submitSelfEmp: t('applications.submitSelfEmp') || 'Submit Self Employment Form',
    submitDeath: t('applications.submitDeath') || 'Submit Death Claim Form',
    
    // Competitions
    noCompetitions: t('applications.noCompetitions') || 'No Competitions',
    noCompetitionsSubtext: t('applications.noCompetitionsSubtext') || 'Check back later for upcoming competitions',
    competitionDetails: t('applications.competitionDetails') || 'Competition Details',
    description: t('common.description') || 'Description',
    category: t('common.category') || 'Category',
    prize: t('applications.prize') || 'Prize',
    venue: t('applications.venue') || 'Venue',
    participants: t('applications.participants') || 'Participants',
    winner: t('applications.winner') || 'Winner',
    winnerDeclared: t('applications.winnerDeclared') || 'Winner Declared',
    registered: t('applications.registered') || 'Registered',
    full: t('applications.full') || 'Full',
    registerNow: t('applications.registerNow') || 'Register Now',
    registering: t('applications.registering') || 'Registering...',
    passSent: t('applications.passSent') || 'Pass/Ticket Sent',
    certificateSent: t('applications.certificateSent') || 'Certificate Sent',
    
    // Alerts
    requiredFields: t('applications.requiredFields') || 'Please fill in all required fields (marked with *)',
    applicationExists: t('applications.applicationExists') || 'Application Exists',
    applicationExistsMsg: t('applications.applicationExistsMsg') || 'You already have a {status} application for this service.',
    submitSuccess: t('applications.submitSuccess') || 'Your application has been submitted successfully',
    alreadyRegistered: t('applications.alreadyRegistered') || 'Already Registered',
    alreadyRegisteredMsg: t('applications.alreadyRegisteredMsg') || 'You have already registered for this competition',
    competitionFull: t('applications.competitionFull') || 'Full',
    competitionFullMsg: t('applications.competitionFullMsg') || 'This competition has reached maximum participants',
    registerSuccess: t('applications.registerSuccess') || 'Registered for competition successfully',
    pleaseLogin: t('applications.pleaseLogin') || 'Please login first',
    
    // Detail Modal
    applicationDetails: t('applications.applicationDetails') || 'Application Details',
    formType: t('applications.formType') || 'Form Type',
    name: t('applications.name') || 'Name',
    appliedOn: t('applications.appliedOn') || 'Applied on',
    amountRequested: t('applications.amountRequested') || 'Amount Requested',
  };

  const [activeTab, setActiveTab] = useState('services');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState([]);
  const [applications, setApplications] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [myCompetitions, setMyCompetitions] = useState([]);
  
  // Modals and Forms State
  const [formSelectorModal, setFormSelectorModal] = useState(false);
  const [selectedFormType, setSelectedFormType] = useState(null);
  const [applicationDetailModalVisible, setApplicationDetailModalVisible] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [myApplicationsTab, setMyApplicationsTab] = useState(false);
  
  // Specific Form States based on screenshots
  const [oldAgeForm, setOldAgeForm] = useState({
    fullName: '', fatherName: '', age: '', gender: '', address: '', phone: '', email: '',
    bankName: '', accountNo: '', ifsc: '', aadhar: '', pan: '', voterId: '', rationCard: '',
    bplCard: 'no', reason: '', amount: ''
  });

  const [kanyaForm, setKanyaForm] = useState({
    memberName: '', memberId: '', memberPhone: '', memberAddress: '',
    girlName: '', girlFather: '', girlMother: '', girlDob: '', girlAadhar: '', girlEducation: '',
    weddingDate: '', weddingPlace: '', groomName: '', groomFather: '', groomAddress: '',
    marriageProof: 'no', invitationCard: 'no',
    aadharGirl: '', passportPhoto: '', bankPassbook: '', reason: '', amount: ''
  });

  const [selfEmpForm, setSelfEmpForm] = useState({
    fullName: '', fatherName: '', age: '', gender: '', address: '', phone: '', email: '',
    category: 'general',
    bankName: '', accountNo: '', ifsc: '', aadhar: '', pan: '', voterId: '', 
    education: '', occupation: '', annualIncome: '', businessDetails: '', reason: '', amount: ''
  });

  const [deathForm, setDeathForm] = useState({
    deceasedName: '', deceasedFather: '', deceasedAge: '', deceasedId: '', deceasedType: '', deceasedJoinDate: '', deceasedPhone: '', deceasedAddress: '',
    deathDate: '', deathCause: '', deathPlace: '', deathProof: 'no',
    applicantName: '', applicantFather: '', applicantRelation: '', applicantPhone: '', applicantAddress: '',
    reason: '', amount: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [competitionDetailModalVisible, setCompetitionDetailModalVisible] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [registering, setRegistering] = useState(false);

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
            formLabel: translations.oldAgeForm
          });
        }
        
        if (data.kanyaMarriageAssistance) {
          servicesList.push({
            id: 'kanya',
            title: translations.kanyaMarriage,
            icon: 'child-care',
            description: translations.kanyaDesc,
            type: 'kanya',
            formLabel: translations.kanyaForm
          });
        }
        
        if (data.selfEmploymentAssistance) {
          servicesList.push({
            id: 'selfEmployment',
            title: translations.selfEmployment,
            icon: 'work',
            description: translations.selfEmploymentDesc,
            type: 'selfEmployment',
            formLabel: translations.selfEmpForm
          });
        }

        servicesList.push({
            id: 'death',
            title: translations.deathAssistance,
            icon: 'bed',
            description: translations.deathDesc,
            type: 'death',
            formLabel: translations.deathForm
        });
        
        setServices(servicesList);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const setupApplicationsListener = () => {
const auth = getAuthInstance(); // ✅ ADD THIS
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
    });
    return () => unsubscribe();
  };

const setupCompetitionsListener = () => {
  const auth = getAuthInstance();
  const userId = auth.currentUser?.uid;  // ✅ ADD THIS - userId was undefined!
  
  const compUnsubscribe = onSnapshot(collection(db, 'competitions'), (snapshot) => {
    const comps = [];
    snapshot.forEach((doc) => {
      comps.push({ id: doc.id, ...doc.data() });
    });
    setCompetitions(comps);
    setLoading(false);
  });

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

  const handleApply = async () => {
const auth = getAuthInstance(); // ✅ ADD THIS
    if (!selectedFormType) return;
    
    let formData = {};
    let requiredFieldMissing = false;

    switch(selectedFormType) {
      case 'oldAge':
        formData = { ...oldAgeForm, formType: 'oldAge' };
        if (!formData.fullName || !formData.amount) requiredFieldMissing = true;
        break;
      case 'kanya':
        formData = { ...kanyaForm, formType: 'kanya' };
        if (!formData.girlName || !formData.memberName || !formData.amount) requiredFieldMissing = true;
        break;
      case 'selfEmployment':
        formData = { ...selfEmpForm, formType: 'selfEmployment' };
        if (!formData.fullName || !formData.amount) requiredFieldMissing = true;
        break;
      case 'death':
        formData = { ...deathForm, formType: 'death' };
        if (!formData.deceasedName || !formData.applicantName || !formData.amount) requiredFieldMissing = true;
        break;
      default: requiredFieldMissing = true;
    }

    if (requiredFieldMissing) {
      Alert.alert(translations.error, translations.requiredFields);
      return;
    }

    const existingApp = applications.find(
      app => app.formType === selectedFormType && 
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
      const userId = auth.currentUser?.uid;
      const userEmail = auth.currentUser?.email;

      const payload = {
        userId,
        userEmail: userEmail || '',
        ...formData,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'serviceApplications'), payload);

      Alert.alert(translations.success, translations.submitSuccess);
      resetAllForms();
      setFormSelectorModal(false);
      setSelectedFormType(null);
    } catch (error) {
      Alert.alert(translations.error, error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetAllForms = () => {
    setOldAgeForm({ fullName: '', fatherName: '', age: '', gender: '', address: '', phone: '', email: '', bankName: '', accountNo: '', ifsc: '', aadhar: '', pan: '', voterId: '', rationCard: '', bplCard: 'no', reason: '', amount: '' });
    setKanyaForm({ memberName: '', memberId: '', memberPhone: '', memberAddress: '', girlName: '', girlFather: '', girlMother: '', girlDob: '', girlAadhar: '', girlEducation: '', weddingDate: '', weddingPlace: '', groomName: '', groomFather: '', groomAddress: '', marriageProof: 'no', invitationCard: 'no', aadharGirl: '', passportPhoto: '', bankPassbook: '', reason: '', amount: '' });
    setSelfEmpForm({ fullName: '', fatherName: '', age: '', gender: '', address: '', phone: '', email: '', category: 'general', bankName: '', accountNo: '', ifsc: '', aadhar: '', pan: '', voterId: '', education: '', occupation: '', annualIncome: '', businessDetails: '', reason: '', amount: '' });
    setDeathForm({ deceasedName: '', deceasedFather: '', deceasedAge: '', deceasedId: '', deceasedType: '', deceasedJoinDate: '', deceasedPhone: '', deceasedAddress: '', deathDate: '', deathCause: '', deathPlace: '', deathProof: 'no', applicantName: '', applicantFather: '', applicantRelation: '', applicantPhone: '', applicantAddress: '', reason: '', amount: '' });
  };

  const openForm = (type) => {
const auth = getAuthInstance(); // ✅ ADD THIS
    setSelectedFormType(type);
    setFormSelectorModal(false);
    const user = auth.currentUser;
    if(type === 'oldAge') setOldAgeForm(prev => ({ ...prev, fullName: user?.displayName || '', email: user?.email || '' }));
  };

  const handleRegisterCompetition = async (competition) => {
  const auth = getAuthInstance();
  const userId = auth.currentUser?.uid;  // ✅ Only ONE declaration
  
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

  setRegistering(true);
  try {
    const userName = auth.currentUser?.displayName || 'Member';
    
    await addDoc(collection(db, 'competitionRegistrations'), {
      competitionId: competition.id,
      userId: userId,
      userName: userName,
      userEmail: auth.currentUser?.email,
      registeredAt: new Date().toISOString(),
      status: 'registered',
    });

    const compRef = doc(db, 'competitions', competition.id);
    const participants = competition.participants || [];
    participants.push(userId);
    await updateDoc(compRef, { participants });

    Alert.alert(translations.success, translations.registerSuccess);
    setCompetitionDetailModalVisible(false);
  } catch (error) {
    Alert.alert(translations.error, error.message);
  } finally {
    setRegistering(false);
  }
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
      default: return status || translations.nA;
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

  const getFormTypeLabel = (type) => {
    switch(type) {
      case 'oldAge': return translations.oldAgeAssistance;
      case 'kanya': return translations.kanyaMarriage;
      case 'selfEmployment': return translations.selfEmployment;
      case 'death': return translations.deathAssistance;
      default: return translations.nA;
    }
  };

  const CompetitionCard = ({ competition }) => {
    const isRegistered = myCompetitions.includes(competition.id);
    const isFull = competition.participants?.length >= competition.maxParticipants;

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
          {competition.description || translations.nA}
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
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>{translations.loading}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} key={renderKey}>
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{translations.applications}</Text>
          <TouchableOpacity onPress={() => setMyApplicationsTab(!myApplicationsTab)} activeOpacity={0.7}>
            <Text style={styles.toggleButton}>
              {myApplicationsTab ? translations.services : translations.myApps}
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
            </View>
          ) : (
            applications.map((app) => (
              <TouchableOpacity 
                key={app.id} 
                style={styles.applicationItem}
                onPress={() => {
                  setSelectedApplication(app);
                  setApplicationDetailModalVisible(true);
                }}
              >
                <View style={styles.applicationItemLeft}>
                  <View style={[styles.applicationItemIcon, { backgroundColor: getStatusColor(app.status) + '15' }]}>
                    <MaterialIcons name={getStatusIcon(app.status)} size={18} color={getStatusColor(app.status)} />
                  </View>
                  <View>
                    <Text style={styles.applicationItemTitle}>
                      {getFormTypeLabel(app.formType)}
                    </Text>
                    <Text style={styles.applicationItemSubtitle}>
                      {translations.appliedOn} {new Date(app.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={[styles.applicationItemStatus, { backgroundColor: getStatusColor(app.status) + '15' }]}>
                  <Text style={[styles.applicationItemStatusText, { color: getStatusColor(app.status) }]}>
                    {getStatusLabel(app.status)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      ) : (
        <>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'services' && styles.tabButtonActive]}
              onPress={() => setActiveTab('services')}
            >
              <MaterialIcons name="handshake" size={18} color={activeTab === 'services' ? '#3b82f6' : '#6b7280'} />
              <Text style={[styles.tabText, activeTab === 'services' && styles.tabTextActive]}>{translations.services}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'competitions' && styles.tabButtonActive]}
              onPress={() => setActiveTab('competitions')}
            >
              <MaterialIcons name="emoji-events" size={18} color={activeTab === 'competitions' ? '#3b82f6' : '#6b7280'} />
              <Text style={[styles.tabText, activeTab === 'competitions' && styles.tabTextActive]}>{translations.competitions}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />}
          >
            {activeTab === 'services' ? (
              <View style={styles.servicesContainer}>
                {services.map((service) => {
                  const hasApplied = applications.some(app => app.formType === service.type && (app.status === 'pending' || app.status === 'verified' || app.status === 'funded'));
                  const latestApp = applications.find(app => app.formType === service.type);
                  const status = latestApp?.status || '';

                  return (
                    <View key={service.id} style={styles.serviceCard}>
                      <View style={styles.serviceCardHeader}>
                        <View style={styles.serviceIconContainer}>
                          <MaterialIcons name={service.icon} size={26} color="#3b82f6" />
                        </View>
                        <View style={styles.serviceCardContent}>
                          <Text style={styles.serviceCardTitle}>{service.title}</Text>
                          <Text style={styles.serviceCardDesc}>{service.description}</Text>
                        </View>
                      </View>

                      {hasApplied ? (
                        <View style={styles.applicationStatusContainer}>
                          <View style={[styles.applicationStatusBadge, { backgroundColor: getStatusColor(status) + '15' }]}>
                            <MaterialIcons name={getStatusIcon(status)} size={14} color={getStatusColor(status)} />
                            <Text style={[styles.applicationStatusText, { color: getStatusColor(status) }]}>
                              {getStatusLabel(status)}
                            </Text>
                          </View>
                          <TouchableOpacity style={styles.viewAppButton} onPress={() => { setSelectedApplication(latestApp); setApplicationDetailModalVisible(true); }}>
                            <Text style={styles.viewAppText}>{translations.viewDetails}</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity style={styles.applyButton} onPress={() => { setSelectedFormType(service.type); setFormSelectorModal(true); }}>
                          <MaterialIcons name="send" size={16} color="#ffffff" />
                          <Text style={styles.applyButtonText}>{translations.fillApplication}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
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

      {/* Form Selector Modal */}
      <Modal animationType="fade" transparent visible={formSelectorModal} onRequestClose={() => setFormSelectorModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.selectorContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{translations.selectForm}</Text>
              <TouchableOpacity onPress={() => setFormSelectorModal(false)}><MaterialIcons name="close" size={24} color="#6b7280" /></TouchableOpacity>
            </View>
            <Text style={styles.selectorSubText}>{translations.formSubtext}</Text>
            <TouchableOpacity style={styles.selectorBtn} onPress={() => openForm('oldAge')}>
              <MaterialIcons name="elderly" size={24} color="#3b82f6" />
              <Text style={styles.selectorBtnText}>{translations.oldAgeForm}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.selectorBtn} onPress={() => openForm('kanya')}>
              <MaterialIcons name="child-care" size={24} color="#3b82f6" />
              <Text style={styles.selectorBtnText}>{translations.kanyaForm}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.selectorBtn} onPress={() => openForm('selfEmployment')}>
              <MaterialIcons name="work" size={24} color="#3b82f6" />
              <Text style={styles.selectorBtnText}>{translations.selfEmpForm}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.selectorBtn} onPress={() => openForm('death')}>
              <MaterialIcons name="bed" size={24} color="#3b82f6" />
              <Text style={styles.selectorBtnText}>{translations.deathForm}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setFormSelectorModal(false)}><Text style={styles.cancelBtnText}>{translations.cancel}</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 1. OLD AGE ASSISTANCE FORM MODAL */}
      <Modal animationType="slide" transparent visible={selectedFormType === 'oldAge'} onRequestClose={() => setSelectedFormType(null)}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{translations.oldAgeForm}</Text>
              <TouchableOpacity onPress={() => setSelectedFormType(null)}><MaterialIcons name="close" size={24} color="#6b7280" /></TouchableOpacity>
            </View>
            
            <View style={styles.field}><Text style={styles.label}>{translations.fullName} *</Text><TextInput style={styles.input} value={oldAgeForm.fullName} onChangeText={t => setOldAgeForm({...oldAgeForm, fullName: t})} placeholder={translations.fullName} /></View>
            <View style={styles.rowFields}>
                <View style={[styles.field, {flex:1, marginRight:8}]}><Text style={styles.label}>{translations.fatherName}/{translations.husbandName}</Text><TextInput style={styles.input} value={oldAgeForm.fatherName} onChangeText={t => setOldAgeForm({...oldAgeForm, fatherName: t})} /></View>
                <View style={[styles.field, {flex:1}]}><Text style={styles.label}>{translations.age} *</Text><TextInput style={styles.input} value={oldAgeForm.age} onChangeText={t => setOldAgeForm({...oldAgeForm, age: t})} keyboardType="numeric" /></View>
            </View>
            <View style={styles.field}><Text style={styles.label}>{translations.address}</Text><TextInput style={[styles.input, styles.textArea]} value={oldAgeForm.address} onChangeText={t => setOldAgeForm({...oldAgeForm, address: t})} multiline numberOfLines={2} /></View>
            <View style={styles.rowFields}>
                <View style={[styles.field, {flex:1, marginRight:8}]}><Text style={styles.label}>{translations.phone}</Text><TextInput style={styles.input} value={oldAgeForm.phone} onChangeText={t => setOldAgeForm({...oldAgeForm, phone: t})} keyboardType="phone-pad" /></View>
                <View style={[styles.field, {flex:1}]}><Text style={styles.label}>{translations.email}</Text><TextInput style={styles.input} value={oldAgeForm.email} onChangeText={t => setOldAgeForm({...oldAgeForm, email: t})} keyboardType="email-address" /></View>
            </View>
            <Text style={styles.sectionTitle}>{translations.bankDetails}</Text>
            <View style={styles.field}><Text style={styles.label}>{translations.bankName}</Text><TextInput style={styles.input} value={oldAgeForm.bankName} onChangeText={t => setOldAgeForm({...oldAgeForm, bankName: t})} /></View>
            <View style={styles.rowFields}>
                <View style={[styles.field, {flex:2, marginRight:8}]}><Text style={styles.label}>{translations.accountNumber}</Text><TextInput style={styles.input} value={oldAgeForm.accountNo} onChangeText={t => setOldAgeForm({...oldAgeForm, accountNo: t})} keyboardType="numeric" /></View>
                <View style={[styles.field, {flex:1}]}><Text style={styles.label}>{translations.ifscCode}</Text><TextInput style={styles.input} value={oldAgeForm.ifsc} onChangeText={t => setOldAgeForm({...oldAgeForm, ifsc: t})} /></View>
            </View>
            <Text style={styles.sectionTitle}>{translations.supportingDocs}</Text>
            <View style={styles.field}><Text style={styles.label}>{translations.aadharCard}</Text><TextInput style={styles.input} value={oldAgeForm.aadhar} onChangeText={t => setOldAgeForm({...oldAgeForm, aadhar: t})} keyboardType="numeric" /></View>
            <View style={styles.rowFields}>
                <View style={[styles.field, {flex:1, marginRight:8}]}><Text style={styles.label}>{translations.panCard}</Text><TextInput style={styles.input} value={oldAgeForm.pan} onChangeText={t => setOldAgeForm({...oldAgeForm, pan: t})} /></View>
                <View style={[styles.field, {flex:1}]}><Text style={styles.label}>{translations.voterId}</Text><TextInput style={styles.input} value={oldAgeForm.voterId} onChangeText={t => setOldAgeForm({...oldAgeForm, voterId: t})} /></View>
            </View>
            <View style={styles.field}><Text style={styles.label}>{translations.rationCard}</Text><TextInput style={styles.input} value={oldAgeForm.rationCard} onChangeText={t => setOldAgeForm({...oldAgeForm, rationCard: t})} /></View>
            <View style={styles.field}><Text style={styles.label}>{translations.bplCard}</Text><View style={styles.rowFields}><TouchableOpacity style={[styles.radioBtn, oldAgeForm.bplCard === 'yes' && styles.radioActive]} onPress={() => setOldAgeForm({...oldAgeForm, bplCard: 'yes'})}><Text style={oldAgeForm.bplCard === 'yes' ? styles.radioTextActive : styles.radioText}>{translations.yes}</Text></TouchableOpacity><TouchableOpacity style={[styles.radioBtn, oldAgeForm.bplCard === 'no' && styles.radioActive]} onPress={() => setOldAgeForm({...oldAgeForm, bplCard: 'no'})}><Text style={oldAgeForm.bplCard === 'no' ? styles.radioTextActive : styles.radioText}>{translations.no}</Text></TouchableOpacity></View></View>
            
            <View style={styles.field}><Text style={styles.label}>{translations.detailsReason}</Text><TextInput style={[styles.input, styles.textArea]} value={oldAgeForm.reason} onChangeText={t => setOldAgeForm({...oldAgeForm, reason: t})} multiline numberOfLines={3} /></View>
            <View style={styles.field}><Text style={styles.label}>{translations.requestedAmount} *</Text><TextInput style={styles.input} value={oldAgeForm.amount} onChangeText={t => setOldAgeForm({...oldAgeForm, amount: t})} keyboardType="numeric" placeholder="₹" /></View>

            <TouchableOpacity style={styles.submitButton} onPress={handleApply} disabled={submitting}>
              <Text style={styles.submitButtonText}>{submitting ? translations.submitting : translations.submitOldAge}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* 2. KANYA VIVAH (MARRIAGE) FORM MODAL */}
      <Modal animationType="slide" transparent visible={selectedFormType === 'kanya'} onRequestClose={() => setSelectedFormType(null)}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{translations.kanyaForm}</Text>
              <TouchableOpacity onPress={() => setSelectedFormType(null)}><MaterialIcons name="close" size={24} color="#6b7280" /></TouchableOpacity>
            </View>
            <Text style={styles.sectionTitle}>{translations.memberDetails}</Text>
            <View style={styles.field}><Text style={styles.label}>{translations.memberName} *</Text><TextInput style={styles.input} value={kanyaForm.memberName} onChangeText={t => setKanyaForm({...kanyaForm, memberName: t})} /></View>
            <View style={styles.rowFields}>
                <View style={[styles.field, {flex:1, marginRight:8}]}><Text style={styles.label}>{translations.memberId}</Text><TextInput style={styles.input} value={kanyaForm.memberId} onChangeText={t => setKanyaForm({...kanyaForm, memberId: t})} /></View>
                <View style={[styles.field, {flex:1}]}><Text style={styles.label}>{translations.memberPhone}</Text><TextInput style={styles.input} value={kanyaForm.memberPhone} onChangeText={t => setKanyaForm({...kanyaForm, memberPhone: t})} keyboardType="phone-pad" /></View>
            </View>
            <View style={styles.field}><Text style={styles.label}>{translations.memberAddress}</Text><TextInput style={[styles.input, styles.textArea]} value={kanyaForm.memberAddress} onChangeText={t => setKanyaForm({...kanyaForm, memberAddress: t})} multiline numberOfLines={2} /></View>

            <Text style={styles.sectionTitle}>{translations.daughterDetails}</Text>
            <View style={styles.field}><Text style={styles.label}>{translations.kanyaName} *</Text><TextInput style={styles.input} value={kanyaForm.girlName} onChangeText={t => setKanyaForm({...kanyaForm, girlName: t})} /></View>
            <View style={styles.rowFields}>
                <View style={[styles.field, {flex:1, marginRight:8}]}><Text style={styles.label}>{translations.girlFather}</Text><TextInput style={styles.input} value={kanyaForm.girlFather} onChangeText={t => setKanyaForm({...kanyaForm, girlFather: t})} /></View>
                <View style={[styles.field, {flex:1}]}><Text style={styles.label}>{translations.girlMother}</Text><TextInput style={styles.input} value={kanyaForm.girlMother} onChangeText={t => setKanyaForm({...kanyaForm, girlMother: t})} /></View>
            </View>
            <View style={styles.rowFields}>
                <View style={[styles.field, {flex:1, marginRight:8}]}><Text style={styles.label}>{translations.dateOfBirth}</Text><TextInput style={styles.input} value={kanyaForm.girlDob} onChangeText={t => setKanyaForm({...kanyaForm, girlDob: t})} placeholder="DD/MM/YYYY" /></View>
                <View style={[styles.field, {flex:1}]}><Text style={styles.label}>{translations.aadharCard}</Text><TextInput style={styles.input} value={kanyaForm.girlAadhar} onChangeText={t => setKanyaForm({...kanyaForm, girlAadhar: t})} keyboardType="numeric" /></View>
            </View>
            <View style={styles.field}><Text style={styles.label}>{translations.education}</Text><TextInput style={styles.input} value={kanyaForm.girlEducation} onChangeText={t => setKanyaForm({...kanyaForm, girlEducation: t})} /></View>

            <Text style={styles.sectionTitle}>{translations.marriageDetails}</Text>
            <View style={styles.rowFields}>
                <View style={[styles.field, {flex:1, marginRight:8}]}><Text style={styles.label}>{translations.weddingDate}</Text><TextInput style={styles.input} value={kanyaForm.weddingDate} onChangeText={t => setKanyaForm({...kanyaForm, weddingDate: t})} placeholder="DD/MM/YYYY" /></View>
                <View style={[styles.field, {flex:1}]}><Text style={styles.label}>{translations.weddingVenue}</Text><TextInput style={styles.input} value={kanyaForm.weddingPlace} onChangeText={t => setKanyaForm({...kanyaForm, weddingPlace: t})} /></View>
            </View>
            <View style={styles.field}><Text style={styles.label}>{translations.groomName}</Text><TextInput style={styles.input} value={kanyaForm.groomName} onChangeText={t => setKanyaForm({...kanyaForm, groomName: t})} /></View>
            <View style={styles.rowFields}>
                <View style={[styles.field, {flex:1, marginRight:8}]}><Text style={styles.label}>{translations.groomFather}</Text><TextInput style={styles.input} value={kanyaForm.groomFather} onChangeText={t => setKanyaForm({...kanyaForm, groomFather: t})} /></View>
                <View style={[styles.field, {flex:1}]}><Text style={styles.label}>{translations.groomAddress}</Text><TextInput style={styles.input} value={kanyaForm.groomAddress} onChangeText={t => setKanyaForm({...kanyaForm, groomAddress: t})} /></View>
            </View>
            <View style={styles.field}><Text style={styles.label}>{translations.marriageProof}</Text><View style={styles.rowFields}><TouchableOpacity style={[styles.radioBtn, kanyaForm.marriageProof === 'yes' && styles.radioActive]} onPress={() => setKanyaForm({...kanyaForm, marriageProof: 'yes'})}><Text style={kanyaForm.marriageProof === 'yes' ? styles.radioTextActive : styles.radioText}>{translations.yes}</Text></TouchableOpacity><TouchableOpacity style={[styles.radioBtn, kanyaForm.marriageProof === 'no' && styles.radioActive]} onPress={() => setKanyaForm({...kanyaForm, marriageProof: 'no'})}><Text style={kanyaForm.marriageProof === 'no' ? styles.radioTextActive : styles.radioText}>{translations.no}</Text></TouchableOpacity></View></View>
            <View style={styles.field}><Text style={styles.label}>{translations.invitationCard}</Text><View style={styles.rowFields}><TouchableOpacity style={[styles.radioBtn, kanyaForm.invitationCard === 'yes' && styles.radioActive]} onPress={() => setKanyaForm({...kanyaForm, invitationCard: 'yes'})}><Text style={kanyaForm.invitationCard === 'yes' ? styles.radioTextActive : styles.radioText}>{translations.yes}</Text></TouchableOpacity><TouchableOpacity style={[styles.radioBtn, kanyaForm.invitationCard === 'no' && styles.radioActive]} onPress={() => setKanyaForm({...kanyaForm, invitationCard: 'no'})}><Text style={kanyaForm.invitationCard === 'no' ? styles.radioTextActive : styles.radioText}>{translations.no}</Text></TouchableOpacity></View></View>

            <Text style={styles.sectionTitle}>{translations.supportingDocs}</Text>
            <View style={styles.field}><Text style={styles.label}>{translations.kanyaAadhar}</Text><TextInput style={styles.input} value={kanyaForm.aadharGirl} onChangeText={t => setKanyaForm({...kanyaForm, aadharGirl: t})} /></View>
            <View style={styles.rowFields}><View style={[styles.field, {flex:1, marginRight:8}]}><Text style={styles.label}>{translations.passportPhoto}</Text><TextInput style={styles.input} value={kanyaForm.passportPhoto} onChangeText={t => setKanyaForm({...kanyaForm, passportPhoto: t})} /></View><View style={[styles.field, {flex:1}]}><Text style={styles.label}>{translations.bankPassbook}</Text><TextInput style={styles.input} value={kanyaForm.bankPassbook} onChangeText={t => setKanyaForm({...kanyaForm, bankPassbook: t})} /></View></View>

            <View style={styles.field}><Text style={styles.label}>{translations.reason}</Text><TextInput style={[styles.input, styles.textArea]} value={kanyaForm.reason} onChangeText={t => setKanyaForm({...kanyaForm, reason: t})} multiline numberOfLines={2} /></View>
            <View style={styles.field}><Text style={styles.label}>{translations.requestedAmount} *</Text><TextInput style={styles.input} value={kanyaForm.amount} onChangeText={t => setKanyaForm({...kanyaForm, amount: t})} keyboardType="numeric" placeholder="₹" /></View>

            <TouchableOpacity style={styles.submitButton} onPress={handleApply} disabled={submitting}>
              <Text style={styles.submitButtonText}>{submitting ? translations.submitting : translations.submitKanya}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* 3. SELF EMPLOYMENT / SINGER FORM MODAL */}
      <Modal animationType="slide" transparent visible={selectedFormType === 'selfEmployment'} onRequestClose={() => setSelectedFormType(null)}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{translations.selfEmpForm}</Text>
              <TouchableOpacity onPress={() => setSelectedFormType(null)}><MaterialIcons name="close" size={24} color="#6b7280" /></TouchableOpacity>
            </View>
            <View style={styles.field}><Text style={styles.label}>{translations.applicantCategory}</Text><View style={styles.rowFields}><TouchableOpacity style={[styles.radioBtn, selfEmpForm.category === 'general' && styles.radioActive]} onPress={() => setSelfEmpForm({...selfEmpForm, category: 'general'})}><Text style={selfEmpForm.category === 'general' ? styles.radioTextActive : styles.radioText}>{translations.general}</Text></TouchableOpacity><TouchableOpacity style={[styles.radioBtn, selfEmpForm.category === 'singer' && styles.radioActive]} onPress={() => setSelfEmpForm({...selfEmpForm, category: 'singer'})}><Text style={selfEmpForm.category === 'singer' ? styles.radioTextActive : styles.radioText}>{translations.singer}</Text></TouchableOpacity></View></View>
            <View style={styles.field}><Text style={styles.label}>{translations.fullName} *</Text><TextInput style={styles.input} value={selfEmpForm.fullName} onChangeText={t => setSelfEmpForm({...selfEmpForm, fullName: t})} /></View>
            <View style={styles.rowFields}><View style={[styles.field, {flex:1, marginRight:8}]}><Text style={styles.label}>{translations.fatherName}</Text><TextInput style={styles.input} value={selfEmpForm.fatherName} onChangeText={t => setSelfEmpForm({...selfEmpForm, fatherName: t})} /></View><View style={[styles.field, {flex:1}]}><Text style={styles.label}>{translations.age}</Text><TextInput style={styles.input} value={selfEmpForm.age} onChangeText={t => setSelfEmpForm({...selfEmpForm, age: t})} keyboardType="numeric" /></View></View>
            <View style={styles.field}><Text style={styles.label}>{translations.address}</Text><TextInput style={[styles.input, styles.textArea]} value={selfEmpForm.address} onChangeText={t => setSelfEmpForm({...selfEmpForm, address: t})} multiline numberOfLines={2} /></View>
            <View style={styles.rowFields}><View style={[styles.field, {flex:1, marginRight:8}]}><Text style={styles.label}>{translations.phone}</Text><TextInput style={styles.input} value={selfEmpForm.phone} onChangeText={t => setSelfEmpForm({...selfEmpForm, phone: t})} keyboardType="phone-pad" /></View><View style={[styles.field, {flex:1}]}><Text style={styles.label}>{translations.email}</Text><TextInput style={styles.input} value={selfEmpForm.email} onChangeText={t => setSelfEmpForm({...selfEmpForm, email: t})} keyboardType="email-address" /></View></View>
            
            <Text style={styles.sectionTitle}>{translations.bankEducation}</Text>
            <View style={styles.field}><Text style={styles.label}>{translations.bankName}</Text><TextInput style={styles.input} value={selfEmpForm.bankName} onChangeText={t => setSelfEmpForm({...selfEmpForm, bankName: t})} /></View>
            <View style={styles.rowFields}><View style={[styles.field, {flex:2, marginRight:8}]}><Text style={styles.label}>{translations.accountNumber}</Text><TextInput style={styles.input} value={selfEmpForm.accountNo} onChangeText={t => setSelfEmpForm({...selfEmpForm, accountNo: t})} keyboardType="numeric" /></View><View style={[styles.field, {flex:1}]}><Text style={styles.label}>{translations.ifscCode}</Text><TextInput style={styles.input} value={selfEmpForm.ifsc} onChangeText={t => setSelfEmpForm({...selfEmpForm, ifsc: t})} /></View></View>
            <View style={styles.rowFields}><View style={[styles.field, {flex:1, marginRight:8}]}><Text style={styles.label}>{translations.aadharCard}</Text><TextInput style={styles.input} value={selfEmpForm.aadhar} onChangeText={t => setSelfEmpForm({...selfEmpForm, aadhar: t})} keyboardType="numeric" /></View><View style={[styles.field, {flex:1}]}><Text style={styles.label}>{translations.panCard}</Text><TextInput style={styles.input} value={selfEmpForm.pan} onChangeText={t => setSelfEmpForm({...selfEmpForm, pan: t})} /></View></View>
            <View style={styles.field}><Text style={styles.label}>{translations.educationQualification}</Text><TextInput style={styles.input} value={selfEmpForm.education} onChangeText={t => setSelfEmpForm({...selfEmpForm, education: t})} /></View>
            <View style={styles.rowFields}><View style={[styles.field, {flex:1, marginRight:8}]}><Text style={styles.label}>{translations.occupation}</Text><TextInput style={styles.input} value={selfEmpForm.occupation} onChangeText={t => setSelfEmpForm({...selfEmpForm, occupation: t})} /></View><View style={[styles.field, {flex:1}]}><Text style={styles.label}>{translations.annualIncome}</Text><TextInput style={styles.input} value={selfEmpForm.annualIncome} onChangeText={t => setSelfEmpForm({...selfEmpForm, annualIncome: t})} keyboardType="numeric" /></View></View>
            
            <View style={styles.field}><Text style={styles.label}>{translations.businessDetails}</Text><TextInput style={[styles.input, styles.textArea]} value={selfEmpForm.businessDetails} onChangeText={t => setSelfEmpForm({...selfEmpForm, businessDetails: t})} multiline numberOfLines={2} /></View>
            <View style={styles.field}><Text style={styles.label}>{translations.reason} *</Text><TextInput style={[styles.input, styles.textArea]} value={selfEmpForm.reason} onChangeText={t => setSelfEmpForm({...selfEmpForm, reason: t})} multiline numberOfLines={2} /></View>
            <View style={styles.field}><Text style={styles.label}>{translations.requestedAmount} *</Text><TextInput style={styles.input} value={selfEmpForm.amount} onChangeText={t => setSelfEmpForm({...selfEmpForm, amount: t})} keyboardType="numeric" placeholder="₹" /></View>

            <TouchableOpacity style={styles.submitButton} onPress={handleApply} disabled={submitting}>
              <Text style={styles.submitButtonText}>{submitting ? translations.submitting : translations.submitSelfEmp}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* 4. ANTYESHTI (DEATH) CLAIM FORM MODAL */}
      <Modal animationType="slide" transparent visible={selectedFormType === 'death'} onRequestClose={() => setSelectedFormType(null)}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{translations.deathForm}</Text>
              <TouchableOpacity onPress={() => setSelectedFormType(null)}><MaterialIcons name="close" size={24} color="#6b7280" /></TouchableOpacity>
            </View>
            
            <Text style={styles.sectionTitle}>{translations.deceasedDetails}</Text>
            <View style={styles.field}><Text style={styles.label}>{translations.deceasedName} *</Text><TextInput style={styles.input} value={deathForm.deceasedName} onChangeText={t => setDeathForm({...deathForm, deceasedName: t})} /></View>
            <View style={styles.rowFields}><View style={[styles.field, {flex:1, marginRight:8}]}><Text style={styles.label}>{translations.deceasedFather}</Text><TextInput style={styles.input} value={deathForm.deceasedFather} onChangeText={t => setDeathForm({...deathForm, deceasedFather: t})} /></View><View style={[styles.field, {flex:1}]}><Text style={styles.label}>{translations.deceasedAge}</Text><TextInput style={styles.input} value={deathForm.deceasedAge} onChangeText={t => setDeathForm({...deathForm, deceasedAge: t})} keyboardType="numeric" /></View></View>
            <View style={styles.rowFields}><View style={[styles.field, {flex:1, marginRight:8}]}><Text style={styles.label}>{translations.deceasedId}</Text><TextInput style={styles.input} value={deathForm.deceasedId} onChangeText={t => setDeathForm({...deathForm, deceasedId: t})} /></View><View style={[styles.field, {flex:1}]}><Text style={styles.label}>{translations.deceasedType}</Text><TextInput style={styles.input} value={deathForm.deceasedType} onChangeText={t => setDeathForm({...deathForm, deceasedType: t})} /></View></View>
            <View style={styles.rowFields}><View style={[styles.field, {flex:1, marginRight:8}]}><Text style={styles.label}>{translations.deceasedJoinDate}</Text><TextInput style={styles.input} value={deathForm.deceasedJoinDate} onChangeText={t => setDeathForm({...deathForm, deceasedJoinDate: t})} /></View><View style={[styles.field, {flex:1}]}><Text style={styles.label}>{translations.deceasedPhone}</Text><TextInput style={styles.input} value={deathForm.deceasedPhone} onChangeText={t => setDeathForm({...deathForm, deceasedPhone: t})} keyboardType="phone-pad" /></View></View>
            <View style={styles.field}><Text style={styles.label}>{translations.deceasedAddress}</Text><TextInput style={[styles.input, styles.textArea]} value={deathForm.deceasedAddress} onChangeText={t => setDeathForm({...deathForm, deceasedAddress: t})} multiline numberOfLines={2} /></View>
            
            <Text style={styles.sectionTitle}>{translations.deathDetails}</Text>
            <View style={styles.rowFields}><View style={[styles.field, {flex:1, marginRight:8}]}><Text style={styles.label}>{translations.deathDate}</Text><TextInput style={styles.input} value={deathForm.deathDate} onChangeText={t => setDeathForm({...deathForm, deathDate: t})} placeholder="DD/MM/YYYY" /></View><View style={[styles.field, {flex:1}]}><Text style={styles.label}>{translations.deathCause}</Text><TextInput style={styles.input} value={deathForm.deathCause} onChangeText={t => setDeathForm({...deathForm, deathCause: t})} /></View></View>
            <View style={styles.field}><Text style={styles.label}>{translations.deathPlace}</Text><TextInput style={styles.input} value={deathForm.deathPlace} onChangeText={t => setDeathForm({...deathForm, deathPlace: t})} /></View>
            <View style={styles.field}><Text style={styles.label}>{translations.deathProof}</Text><View style={styles.rowFields}><TouchableOpacity style={[styles.radioBtn, deathForm.deathProof === 'yes' && styles.radioActive]} onPress={() => setDeathForm({...deathForm, deathProof: 'yes'})}><Text style={deathForm.deathProof === 'yes' ? styles.radioTextActive : styles.radioText}>{translations.yes}</Text></TouchableOpacity><TouchableOpacity style={[styles.radioBtn, deathForm.deathProof === 'no' && styles.radioActive]} onPress={() => setDeathForm({...deathForm, deathProof: 'no'})}><Text style={deathForm.deathProof === 'no' ? styles.radioTextActive : styles.radioText}>{translations.no}</Text></TouchableOpacity></View></View>

            <Text style={styles.sectionTitle}>{translations.claimantDetails}</Text>
            <View style={styles.field}><Text style={styles.label}>{translations.claimantName} *</Text><TextInput style={styles.input} value={deathForm.applicantName} onChangeText={t => setDeathForm({...deathForm, applicantName: t})} /></View>
            <View style={styles.rowFields}><View style={[styles.field, {flex:1, marginRight:8}]}><Text style={styles.label}>{translations.claimantFather}</Text><TextInput style={styles.input} value={deathForm.applicantFather} onChangeText={t => setDeathForm({...deathForm, applicantFather: t})} /></View><View style={[styles.field, {flex:1}]}><Text style={styles.label}>{translations.relationship}</Text><TextInput style={styles.input} value={deathForm.applicantRelation} onChangeText={t => setDeathForm({...deathForm, applicantRelation: t})} /></View></View>
            <View style={styles.field}><Text style={styles.label}>{translations.claimantAddress}</Text><TextInput style={[styles.input, styles.textArea]} value={deathForm.applicantAddress} onChangeText={t => setDeathForm({...deathForm, applicantAddress: t})} multiline numberOfLines={2} /></View>

            <View style={styles.field}><Text style={styles.label}>{translations.reason}</Text><TextInput style={[styles.input, styles.textArea]} value={deathForm.reason} onChangeText={t => setDeathForm({...deathForm, reason: t})} multiline numberOfLines={2} /></View>
            <View style={styles.field}><Text style={styles.label}>{translations.requestedAmount} *</Text><TextInput style={styles.input} value={deathForm.amount} onChangeText={t => setDeathForm({...deathForm, amount: t})} keyboardType="numeric" placeholder="₹" /></View>

            <TouchableOpacity style={styles.submitButton} onPress={handleApply} disabled={submitting}>
              <Text style={styles.submitButtonText}>{submitting ? translations.submitting : translations.submitDeath}</Text>
            </TouchableOpacity>
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
                    {selectedCompetition.description || translations.nA}
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

      {/* Application Detail View Modal (Dynamic) */}
      <Modal animationType="slide" transparent visible={applicationDetailModalVisible} onRequestClose={() => setApplicationDetailModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {selectedApplication && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{translations.applicationDetails}</Text>
                  <TouchableOpacity onPress={() => setApplicationDetailModalVisible(false)}><MaterialIcons name="close" size={24} color="#6b7280" /></TouchableOpacity>
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
                  <Text style={styles.detailLabel}>{translations.formType}</Text>
                  <Text style={styles.detailValue}>
                    {getFormTypeLabel(selectedApplication.formType)}
                  </Text>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.name}</Text>
                  <Text style={styles.detailValue}>{selectedApplication.fullName || selectedApplication.memberName || selectedApplication.applicantName || selectedApplication.deceasedName || translations.nA}</Text>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.amountRequested}</Text>
                  <Text style={[styles.detailValue, { color: '#10b981', fontFamily: Fonts.Bold }]}>₹{selectedApplication.amount || 0}</Text>
                </View>
                <TouchableOpacity style={styles.closeDetailBtn} onPress={() => setApplicationDetailModalVisible(false)}><Text style={styles.closeDetailBtnText}>{translations.close}</Text></TouchableOpacity>
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
  },
  toggleButton: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#ffffff',
    padding: 4,
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    borderRadius: 8,
  },
  tabButtonActive: { backgroundColor: '#eff6ff' },
  tabText: { fontFamily: Fonts.SemiBold, fontSize: 13, color: '#6b7280', textAlignVertical: 'center' },
  tabTextActive: { color: '#3b82f6' },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 4 },

  servicesContainer: { paddingVertical: 8 },
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
  serviceCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  serviceIconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  serviceCardContent: { flex: 1 },
  serviceCardTitle: { fontFamily: Fonts.SemiBold, fontSize: 15, color: '#1f2937', textAlignVertical: 'center' },
  serviceCardDesc: { fontFamily: Fonts.Regular, fontSize: 12, color: '#6b7280', marginTop: 2 },

  applicationStatusContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  applicationStatusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
  applicationStatusText: { fontFamily: Fonts.SemiBold, fontSize: 12 },
  viewAppButton: { paddingHorizontal: 12, paddingVertical: 4 },
  viewAppText: { fontFamily: Fonts.SemiBold, fontSize: 12, color: '#3b82f6' },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  applyButtonText: { fontFamily: Fonts.SemiBold, fontSize: 14, color: '#ffffff' },

  myAppsContainer: { flex: 1, padding: 16 },
  myAppsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  myAppsTitle: { fontFamily: Fonts.Bold, fontSize: 18, color: '#1f2937' },
  myAppsCount: { fontFamily: Fonts.Regular, fontSize: 13, color: '#6b7280' },
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
  },
  applicationItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  applicationItemIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  applicationItemTitle: { fontFamily: Fonts.SemiBold, fontSize: 14, color: '#1f2937' },
  applicationItemSubtitle: { fontFamily: Fonts.Regular, fontSize: 11, color: '#6b7280' },
  applicationItemStatus: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  applicationItemStatusText: { fontFamily: Fonts.SemiBold, fontSize: 11 },

  competitionsContainer: { paddingVertical: 8 },

  // Competition Card
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

  /* Modal General */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontFamily: Fonts.Bold, fontSize: 18, color: '#1f2937' },

  /* Form Selection Modal */
  selectorContainer: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20 },
  selectorSubText: { fontFamily: Fonts.Regular, fontSize: 13, color: '#6b7280', marginBottom: 16, textAlign: 'center' },
  selectorBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, marginBottom: 10, gap: 12 },
  selectorBtnText: { fontFamily: Fonts.Medium, fontSize: 15, color: '#1f2937', flex: 1 },
  cancelBtn: { alignItems: 'center', padding: 12, marginTop: 4 },
  cancelBtnText: { fontFamily: Fonts.SemiBold, fontSize: 15, color: '#ef4444' },

  /* Detailed Forms */
  sectionTitle: { fontFamily: Fonts.Bold, fontSize: 16, color: '#1f2937', marginTop: 16, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 6 },
  field: { marginBottom: 12 },
  rowFields: { flexDirection: 'row', marginBottom: 0 },
  label: { fontFamily: Fonts.SemiBold, fontSize: 13, color: '#4b5563', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: '#f9fafb', fontFamily: Fonts.Regular, color: '#1f2937' },
  textArea: { height: 80, textAlignVertical: 'top' },
  radioBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#f3f4f6', marginRight: 8 },
  radioActive: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#3b82f6' },
  radioText: { fontFamily: Fonts.Regular, fontSize: 14, color: '#6b7280' },
  radioTextActive: { fontFamily: Fonts.SemiBold, fontSize: 14, color: '#3b82f6' },

  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 16,
  },
  submitButtonText: { fontFamily: Fonts.SemiBold, fontSize: 16, color: '#ffffff' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyStateText: { fontFamily: Fonts.SemiBold, fontSize: 18, color: '#1f2937' },
  emptyStateSubtext: { fontFamily: Fonts.Regular, fontSize: 14, color: '#9ca3af', textAlign: 'center' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { fontFamily: Fonts.Regular, marginTop: 10, color: '#6b7280', fontSize: 14 },

  /* Competition Detail Modal Styles */
  competitionDetailTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 18,
    color: '#1f2937',
    marginBottom: 8,
    textAlignVertical: 'center',
  },
  competitionDetailStatus: { marginBottom: 12 },
  competitionDetailSection: { marginBottom: 12 },
  competitionDetailLabel: { fontFamily: Fonts.SemiBold, fontSize: 12, color: '#6b7280', marginBottom: 2 },
  competitionDetailValue: { fontFamily: Fonts.Regular, fontSize: 14, color: '#1f2937' },
  competitionDetailRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  competitionDetailItem: { flex: 1 },
  winnerSection: { marginVertical: 10 },
  winnerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, gap: 8 },
  winnerText: { fontFamily: Fonts.SemiBold, fontSize: 14, color: '#d97706' },
  notificationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f3ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginVertical: 4, gap: 6 },
  notificationText: { fontFamily: Fonts.Regular, fontSize: 13, color: '#6b7280' },
  registerCompetitionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3b82f6', paddingVertical: 12, borderRadius: 8, gap: 8, marginTop: 16 },
  registerDisabled: { backgroundColor: '#9ca3af' },
  registerCompetitionText: { fontFamily: Fonts.SemiBold, fontSize: 15, color: '#ffffff' },

  /* Application Detail Modal Styles */
  detailStatusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  detailStatusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 6 },
  detailStatusText: { fontFamily: Fonts.SemiBold, fontSize: 14 },
  detailDate: { fontFamily: Fonts.Regular, fontSize: 12, color: '#6b7280' },
  detailSection: { marginBottom: 12 },
  detailLabel: { fontFamily: Fonts.SemiBold, fontSize: 12, color: '#6b7280', marginBottom: 2 },
  detailValue: { fontFamily: Fonts.Regular, fontSize: 14, color: '#1f2937' },
  closeDetailBtn: { paddingVertical: 12, backgroundColor: '#3b82f6', borderRadius: 8, marginTop: 12 },
  closeDetailBtnText: { textAlign: 'center', color: '#fff', fontFamily: Fonts.Bold },
});