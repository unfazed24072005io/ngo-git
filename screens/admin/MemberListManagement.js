// screens/admin/MemberListManagement.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, 
  Alert, Modal, Image, ActivityIndicator, Platform, RefreshControl, 
  FlatList, Dimensions 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db } from '../../config/firebase';
import { 
  collection, getDocs, updateDoc, doc, deleteDoc, query, 
  where, orderBy, onSnapshot, getDoc, addDoc, runTransaction
} from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { Fonts } from '../../config/fonts';
import { useLanguage } from '../../context/LanguageContext';
import ViewShot from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Svg, Defs, Pattern, Rect, Image as SvgImage } from 'react-native-svg';

const { width } = Dimensions.get('window');
const FILTERS = ['All', 'Admin', 'Working Member', 'Member'];

export default function MemberListManagement({ navigation }) {
  const { t, counter } = useLanguage();
  
  // Refs for capturing views
  const idCardRef = useRef(null);
  const certificateRefs = useRef({});
  
  // Force re-render when language changes
  const renderKey = `members-${counter}`;

  // Get translations
  const getTranslations = () => ({
    memberList: t('members.title') || 'Member List',
    searchMembers: t('members.search') || 'Search members...',
    all: t('common.all') || 'All',
    active: t('common.active') || 'Active',
    pending: t('common.pending') || 'Pending',
    suspended: t('members.suspended') || 'Suspended',
    admin: t('auth.admin') || 'Admin',
    working: t('members.working') || 'Working',
    member: t('auth.member') || 'Member',
    noMembers: t('members.noMembers') || 'No members found',
    memberDetails: t('members.details') || 'Member Details',
    email: t('common.email') || 'Email',
    phone: t('common.phone') || 'Phone',
    address: t('common.address') || 'Address',
    role: t('common.role') || 'Role',
    joined: t('members.joined') || 'Joined',
    aadhar: t('members.aadhar') || 'Aadhar',
    panCard: t('members.panCard') || 'PAN Card',
    approve: t('members.approve') || 'Approve',
    suspend: t('members.suspend') || 'Suspend',
    reactivate: t('members.reactivate') || 'Reactivate',
    delete: t('common.delete') || 'Delete',
    view: t('common.view') || 'View',
    makeWorking: t('members.makeWorking') || 'Make Working',
    makeMember: t('members.makeMember') || 'Make Member',
    confirmDelete: t('members.confirmDelete') || 'Are you sure you want to delete this member? This action cannot be undone.',
    memberDeleted: t('members.deleted') || 'Member deleted successfully',
    statusUpdated: t('members.statusUpdated') || 'Status updated to {status}',
    roleUpdated: t('members.roleUpdated') || 'Role updated to {role}',
    confirmRoleUpdate: t('members.confirmRoleUpdate') || 'Are you sure you want to change role to {role}?',
    error: t('common.error') || 'Error',
    success: t('common.success') || 'Success',
    cancel: t('common.cancel') || 'Cancel',
    update: t('common.update') || 'Update',
    nA: t('common.nA') || 'N/A',
    unknown: t('common.unknown') || 'Unknown',
    workingMember: t('auth.workingMember') || 'Working Member',
    idCardTitle: 'पहचान पत्र',
    idCardName: 'नाम :',
    idCardFather: 'पिता/पति का नाम :',
    idCardDob: 'जन्म तिथि :',
    idCardAadhar: 'आधार संख्या :',
    idCardMembership: 'सदस्यता स्थिति :',
    idCardMobile: 'मोबाइल नंबर :',
    idCardAddress: 'पता :',
    idCardPhoto: 'फोटो',
    idCardManager: 'प्रबंधक',
    idCardSignature: 'सदस्य हस्ताक्षर',
    idCardSecretary: 'सचिव',
    certificates: t('certificate.certificates') || 'Certificates',
    earned: t('certificate.earned') || 'earned',
    donation: t('certificate.donation') || 'Donation',
    membership: t('certificate.membership') || 'Membership',
    volunteer: t('certificate.volunteer') || 'Volunteer',
    certificateLabel: t('certificate.certificate') || 'Certificate',
    noCertificates: t('certificate.noCertificates') || 'No certificates earned yet',
    download: 'Download',
    downloading: 'Downloading...',
    downloadIdCard: 'Download ID Card',
    downloadCertificate: 'Download Certificate',
    addFee: 'Add Fee',
    registrationFee: 'Registration Fee',
    feeAmount: 'Fee Amount (₹)',
    feeNote: 'Note (Optional)',
    enterFeeAmount: 'Enter amount',
    addNote: 'Add a note',
    feeAlreadyPaid: 'Fee already paid: ₹{amount}',
    confirmAddFee: 'Confirm Registration Fee',
    confirmAddFeeMessage: 'Add ₹{amount} registration fee for {name}?',
    feeAdded: 'Registration fee of ₹{amount} added to {name}',
    feeAddedSuccess: 'Fee added successfully',
    enterValidFee: 'Please enter a valid fee amount',
    feeNotePlaceholder: 'Add a note (optional)',
  });

  const translations = getTranslations();
// Add this with other state declarations
const [registrationFeeDetails, setRegistrationFeeDetails] = useState(null);
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [memberCertificates, setMemberCertificates] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const [downloadingCertId, setDownloadingCertId] = useState(null);
  
  // Fee Modal States
  const [feeModalVisible, setFeeModalVisible] = useState(false);
  const [selectedMemberForFee, setSelectedMemberForFee] = useState(null);
  const [feeAmount, setFeeAmount] = useState('');
  const [feeNote, setFeeNote] = useState('');
  const [addingFee, setAddingFee] = useState(false);

  useEffect(() => {
    setupRealtimeListener();
  }, []);

  const setupRealtimeListener = () => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const membersList = [];
      snapshot.forEach((doc) => {
        membersList.push({ id: doc.id, ...doc.data() });
      });
      setMembers(membersList);
      applyFilters(membersList, search, activeFilter, statusFilter);
      setLoading(false);
    });

    return () => unsubscribe();
  };

  const applyFilters = (data, searchText, filter, status) => {
    let filtered = data;

    if (searchText) {
      filtered = filtered.filter(member =>
        member.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchText.toLowerCase()) ||
        member.phone?.includes(searchText)
      );
    }

    if (filter !== 'All') {
      const roleMap = {
        'Admin': 'admin',
        'Working Member': 'workingMember',
        'Member': 'member'
      };
      filtered = filtered.filter(member => member.role === roleMap[filter]);
    }

    if (status !== 'all') {
      filtered = filtered.filter(member => member.status === status);
    }

    setFilteredMembers(filtered);
  };

  const handleSearch = (text) => {
    setSearch(text);
    applyFilters(members, text, activeFilter, statusFilter);
  };

  const handleFilterPress = (filter) => {
    setActiveFilter(filter);
    applyFilters(members, search, filter, statusFilter);
  };
// Add this function with other fetch functions
const fetchRegistrationFeeDetails = async (memberId) => {
  try {
    const q = query(
      collection(db, 'walletTransactions'),
      where('userId', '==', memberId),
      where('type', '==', 'registration_fee'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0].data();
      setRegistrationFeeDetails({
        paid: true,
        amount: docData.amount || 0,
        method: docData.paymentMethod || 'admin',
        description: docData.description || 'Registration fee',
        date: docData.createdAt || new Date().toISOString(),
        transactionId: docData.transactionId || null
      });
    } else {
      setRegistrationFeeDetails(null);
    }
  } catch (error) {
    console.error('Error fetching registration fee details:', error);
    setRegistrationFeeDetails(null);
  }
};
  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    applyFilters(members, search, activeFilter, status);
  };

  const fetchMemberCertificates = async (memberId) => {
    try {
      const certQuery = query(
        collection(db, 'certificates'),
        where('memberId', '==', memberId),
        where('status', '==', 'issued')
      );
      const certSnap = await getDocs(certQuery);
      const certList = [];
      certSnap.forEach((doc) => {
        certList.push({ id: doc.id, ...doc.data() });
      });
      setMemberCertificates(certList);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setMemberCertificates([]);
    }
  };

  const handleViewMember = async (member) => {
  setSelectedMember(member);
  await fetchMemberCertificates(member.id);
  await fetchRegistrationFeeDetails(member.id); // Add this line
  setModalVisible(true);
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
              await deleteDoc(doc(db, 'users', id));
              Alert.alert(translations.success, translations.memberDeleted);
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
      await updateDoc(doc(db, 'users', id), { 
        status, 
        updatedAt: new Date().toISOString() 
      });
      Alert.alert(translations.success, translations.statusUpdated.replace('{status}', status));
    } catch (error) {
      Alert.alert(translations.error, error.message);
    }
  };

  const handleRoleUpdate = async (id, role) => {
    const roleLabel = role === 'workingMember' ? translations.workingMember : translations.member;
    Alert.alert(
      translations.update,
      translations.confirmRoleUpdate.replace('{role}', roleLabel),
      [
        { text: translations.cancel, style: 'cancel' },
        {
          text: translations.update,
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'users', id), { 
                role, 
                updatedAt: new Date().toISOString() 
              });
              Alert.alert(translations.success, translations.roleUpdated.replace('{role}', roleLabel));
            } catch (error) {
              Alert.alert(translations.error, error.message);
            }
          }
        }
      ]
    );
  };

  // ============ ADD REGISTRATION FEE FUNCTION ============
  const handleAddRegistrationFee = async () => {
  console.log('🔵 handleAddRegistrationFee called');
  console.log('🔵 selectedMemberForFee:', selectedMemberForFee);
  console.log('🔵 feeAmount:', feeAmount);
  
  if (!selectedMemberForFee) {
    console.log('❌ No member selected');
    Alert.alert('Error', 'No member selected');
    return;
  }

  if (!feeAmount || parseFloat(feeAmount) <= 0) {
    console.log('❌ Invalid fee amount:', feeAmount);
    Alert.alert('Error', 'Please enter a valid fee amount');
    return;
  }

  const amount = parseFloat(feeAmount);
  console.log('✅ Amount parsed:', amount);
  
  setAddingFee(true);
  console.log('🔵 addingFee set to true');
  
  try {
    const memberRef = doc(db, 'users', selectedMemberForFee.id);
    
    await updateDoc(memberRef, {
      registrationFeePaid: true,
      registrationFeeAmount: amount,
      registrationFeePaidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const transactionRef = collection(db, 'walletTransactions');
    await addDoc(transactionRef, {
      userId: selectedMemberForFee.id,
      amount: amount,
      type: 'registration_fee',
      status: 'completed',
      paymentMethod: 'admin',
      description: feeNote || `Registration fee for ${selectedMemberForFee.fullName} (Added by Admin)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    Alert.alert(
      'Success',
      `Registration fee of ₹${amount} added to ${selectedMemberForFee.fullName}`
    );
    
    setFeeModalVisible(false);
    setSelectedMemberForFee(null);
    setFeeAmount('');
    setFeeNote('');
    
  } catch (error) {
    console.error('❌ Error adding registration fee:', error);
    Alert.alert('Error', error.message || 'Failed to add registration fee. Please try again.');
  } finally {
    setAddingFee(false);
    console.log('🔵 addingFee set to false');
  }
};
  // ============ DOWNLOAD FUNCTIONS ============
  
  const downloadIDCard = async (member) => {
    if (!idCardRef.current) {
      Alert.alert('Error', 'ID Card not ready');
      return;
    }

    setDownloading(true);
    try {
      const uri = await ViewShot.captureRef(idCardRef, {
        format: 'png',
        quality: 0.9,
        width: 800,
        height: 600,
      });

      const fileName = `ID_Card_${member.fullName || 'Member'}_${Date.now()}.png`;
      
      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(uri);
      } else {
        const newPath = FileSystem.documentDirectory + fileName;
        await FileSystem.copyAsync({
          from: uri,
          to: newPath
        });
        await Sharing.shareAsync(newPath);
      }
      
      Alert.alert('Success', 'ID Card downloaded successfully!');
    } catch (error) {
      console.error('Error downloading ID Card:', error);
      Alert.alert('Error', 'Failed to download ID Card. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const downloadCertificate = async (cert, index) => {
    const refKey = `cert_${cert.id || index}`;
    const certRef = certificateRefs.current[refKey];
    
    if (!certRef) {
      Alert.alert('Error', 'Certificate not ready');
      return;
    }

    setDownloadingCertId(cert.id || index);
    try {
      const uri = await ViewShot.captureRef(certRef, {
        format: 'png',
        quality: 0.9,
        width: 800,
        height: 500,
      });

      const fileName = `Certificate_${cert.title || 'Certificate'}_${Date.now()}.png`;
      
      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(uri);
      } else {
        const newPath = FileSystem.documentDirectory + fileName;
        await FileSystem.copyAsync({
          from: uri,
          to: newPath
        });
        await Sharing.shareAsync(newPath);
      }
      
      Alert.alert('Success', 'Certificate downloaded successfully!');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      Alert.alert('Error', 'Failed to download certificate. Please try again.');
    } finally {
      setDownloadingCertId(null);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'suspended': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'active': return translations.active;
      case 'pending': return translations.pending;
      case 'suspended': return translations.suspended;
      default: return status;
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'admin': return '#FF7722';
      case 'workingMember': return '#f59e0b';
      case 'member': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getRoleLabel = (role) => {
    switch(role) {
      case 'admin': return translations.admin;
      case 'workingMember': return translations.working;
      case 'member': return translations.member;
      default: return role;
    }
  };

  const getFilterCount = (filter) => {
    if (filter === 'All') return members.length;
    const roleMap = {
      'Admin': 'admin',
      'Working Member': 'workingMember',
      'Member': 'member'
    };
    return members.filter(m => m.role === roleMap[filter]).length;
  };

  const getStatusCount = (status) => {
    if (status === 'all') {
      return members.filter(m => m.role === 'member' || m.role === 'workingMember').length;
    }
    return members.filter(m => (m.role === 'member' || m.role === 'workingMember') && m.status === status).length;
  };

  const getCertificateColor = (type) => {
    switch(type) {
      case 'donation': return '#ef4444';
      case 'membership': return '#8b5cf6';
      case 'volunteer': return '#10b981';
      default: return '#f59e0b';
    }
  };

  const getCertificateIcon = (type) => {
    switch(type) {
      case 'donation': return 'favorite';
      case 'membership': return 'verified';
      case 'volunteer': return 'handshake';
      default: return 'verified';
    }
  };

  const getCertificateTypeLabel = (type) => {
    switch(type) {
      case 'donation': return translations.donation;
      case 'membership': return translations.membership;
      case 'volunteer': return translations.volunteer;
      default: return translations.certificateLabel;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  // Render ID Card Component
  const renderIDCard = (member) => (
    <ViewShot ref={idCardRef} options={{ format: 'png', quality: 0.9 }}>
      <View style={styles.idCard}>
        {/* Background Watermark */}
        <View style={styles.watermarkContainer}>
          <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
            <Defs>
              <Pattern id="watermark" patternUnits="userSpaceOnUse" width={100} height={100}>
                <SvgImage
                  href={require('../../assets/watermark.png')}
                  width={100}
                  height={100}
                  opacity={0.08}
                />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#watermark)" />
          </Svg>
        </View>

        {/* Top Section - Logos and Title */}
        <View style={styles.idCardTopSection}>
          <View style={styles.idCardLeftLogo}>
            <Image 
              source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7cLJLLXgddsZygiRpdvi-NzOpYcooRXCS7kd9BK6Fcg&s=10' }}
              style={styles.idCardLogoImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.idCardCenterTitle}>
            <Text style={styles.idCardMainTitle}>कबीर सत धर्म फाउंडेशन (ट्रस्ट)</Text>
            <Text style={styles.idCardSubTitle}>भारत सरकार द्वारा मान्यता प्राप्त</Text>
            <Text style={styles.idCardRegNo}>पंजीकरण संख्या: U8550BR2024NPL067466</Text>
          </View>

          <View style={styles.idCardRightLogo}>
            <Image 
              source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkyFSf2hPLbia_p0WxL6wQmoXFPTGlaWahT0DXI8nJjQ&s=10' }}
              style={styles.idCardLogoImage}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.idCardIdentityTitle}>
          <Text style={styles.idCardIdentityText}>{translations.idCardTitle}</Text>
        </View>

        <View style={styles.idCardBody}>
          <View style={styles.idCardLeftFields}>
            <View style={styles.idCardField}>
              <Text style={styles.idCardFieldLabel}>{translations.idCardName}</Text>
              <Text style={styles.idCardFieldValue} numberOfLines={1}>{member.fullName || translations.nA}</Text>
            </View>
            <View style={styles.idCardField}>
              <Text style={styles.idCardFieldLabel}>{translations.idCardFather}</Text>
              <Text style={styles.idCardFieldValue} numberOfLines={1}>{member.fatherName || translations.nA}</Text>
            </View>
            <View style={styles.idCardField}>
              <Text style={styles.idCardFieldLabel}>{translations.idCardDob}</Text>
              <Text style={styles.idCardFieldValue} numberOfLines={1}>{member.dob || translations.nA}</Text>
            </View>
            <View style={styles.idCardField}>
              <Text style={styles.idCardFieldLabel}>{translations.idCardAadhar}</Text>
              <Text style={styles.idCardFieldValue} numberOfLines={1}>{member.aadharNumber || translations.nA}</Text>
            </View>
            <View style={styles.idCardField}>
              <Text style={styles.idCardFieldLabel}>{translations.idCardMembership}</Text>
              <Text style={[styles.idCardFieldValue, styles.idCardStatusValue]} numberOfLines={1}>
                {member.status === 'active' ? 'सक्रिय' : member.status || translations.nA}
              </Text>
            </View>
            <View style={styles.idCardField}>
              <Text style={styles.idCardFieldLabel}>{translations.idCardMobile}</Text>
              <Text style={styles.idCardFieldValue} numberOfLines={1}>{member.phone || translations.nA}</Text>
            </View>
            <View style={styles.idCardField}>
              <Text style={styles.idCardFieldLabel}>{translations.idCardAddress}</Text>
              <Text style={styles.idCardFieldValue} numberOfLines={2}>{member.address || translations.nA}</Text>
            </View>
          </View>

          <View style={styles.idCardRightPhoto}>
            <View style={styles.idCardPhotoWrapper}>
              {member.profilePhoto ? (
                <Image source={{ uri: member.profilePhoto }} style={styles.idCardPhoto} />
              ) : (
                <View style={styles.idCardPhotoPlaceholder}>
                  <MaterialIcons name="person" size={60} color="#8b5cf6" />
                </View>
              )}
            </View>
            <Text style={styles.idCardPhotoLabel}>{translations.idCardPhoto}</Text>
          </View>
        </View>

        <View style={styles.idCardFooter}>
          <Text style={styles.idCardFooterText}>{translations.idCardManager}</Text>
          <View style={styles.idCardFooterCenter}>
            <View style={styles.idCardSignatureLine} />
            <Text style={styles.idCardSignatureLabel}>{translations.idCardSignature}</Text>
          </View>
          <Text style={styles.idCardFooterText}>{translations.idCardSecretary}</Text>
        </View>
      </View>
    </ViewShot>
  );

  // Render Certificate Item with ViewShot
  const renderCertificateItem = (cert, index) => {
    const refKey = `cert_${cert.id || index}`;
    return (
      <View key={index} style={styles.certItemWrapper}>
        <ViewShot 
          ref={ref => certificateRefs.current[refKey] = ref}
          options={{ format: 'png', quality: 0.9 }}
        >
          <View style={styles.certItem}>
            <View style={[styles.certItemIcon, { backgroundColor: getCertificateColor(cert.type) + '15' }]}>
              <MaterialIcons name={getCertificateIcon(cert.type)} size={16} color={getCertificateColor(cert.type)} />
            </View>
            <View style={styles.certItemContent}>
              <Text style={styles.certItemTitle} numberOfLines={1}>{cert.title || getCertificateTypeLabel(cert.type)}</Text>
              <View style={styles.certItemMeta}>
                <Text style={styles.certItemType} numberOfLines={1}>{getCertificateTypeLabel(cert.type)}</Text>
                <Text style={styles.certItemDate} numberOfLines={1}>
                  {cert.issuedDate ? new Date(cert.issuedDate).toLocaleDateString() : translations.nA}
                </Text>
              </View>
            </View>
            {cert.amount && (
              <Text style={styles.certItemAmount} numberOfLines={1}>₹{cert.amount}</Text>
            )}
          </View>
        </ViewShot>
        
        <TouchableOpacity 
          style={styles.certDownloadButton}
          onPress={() => downloadCertificate(cert, index)}
          disabled={downloadingCertId === (cert.id || index)}
          activeOpacity={0.7}
        >
          <MaterialIcons 
            name={downloadingCertId === (cert.id || index) ? "hourglass-empty" : "download"} 
            size={14} 
            color="#8b5cf6" 
          />
          <Text style={styles.certDownloadText}>
            {downloadingCertId === (cert.id || index) ? translations.downloading : translations.download}
          </Text>
        </TouchableOpacity>
      </View>
    );
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

  const StatusFilterChip = ({ label, count, active, onPress }) => (
    <TouchableOpacity
      style={[styles.statusChip, active && styles.activeStatusChip]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.statusChipText, active && styles.activeStatusChipText]}>
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

  const MemberCard = ({ member }) => (
    <TouchableOpacity 
      style={styles.memberCard}
      onPress={() => handleViewMember(member)}
      activeOpacity={0.7}
    >
      <View style={styles.memberHeader}>
        <View style={styles.memberInfo}>
          <View style={styles.avatarContainer}>
            {member.profilePhoto ? (
              <Image source={{ uri: member.profilePhoto }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {member.fullName?.charAt(0) || '?'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.memberDetails}>
            <Text style={styles.memberName} numberOfLines={1}>{member.fullName || translations.unknown}</Text>
            <Text style={styles.memberEmail} numberOfLines={1}>{member.email}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(member.status) + '15' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(member.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(member.status) }]}>
            {getStatusLabel(member.status)}
          </Text>
        </View>
      </View>

      <View style={styles.memberDetailsRow}>
        <View style={styles.detailItem}>
          <MaterialIcons name="phone" size={14} color="#6b7280" />
          <Text style={styles.detailValue}>{member.phone || translations.nA}</Text>
        </View>
        <View style={styles.detailItem}>
          <MaterialIcons name="person" size={14} color="#6b7280" />
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(member.role) + '15' }]}>
            <Text style={[styles.roleBadgeText, { color: getRoleColor(member.role) }]}>
              {getRoleLabel(member.role)}
            </Text>
          </View>
        </View>
        <View style={styles.detailItem}>
          <MaterialIcons name="calendar-today" size={14} color="#6b7280" />
          <Text style={styles.detailValue}>
            {member.createdAt ? new Date(member.createdAt?.seconds * 1000 || member.createdAt).toLocaleDateString() : translations.nA}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => handleViewMember(member)}
          activeOpacity={0.7}
        >
          <MaterialIcons name="visibility" size={14} color="#ffffff" />
          <Text style={styles.actionButtonText}>{translations.view}</Text>
        </TouchableOpacity>
        {member.role !== 'admin' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.feeButton]}
            onPress={() => {
              setSelectedMemberForFee(member);
              setFeeAmount('');
              setFeeNote('');
              setFeeModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="payments" size={14} color="#ffffff" />
            <Text style={styles.actionButtonText}>{translations.addFee}</Text>
          </TouchableOpacity>
        )}
        {member.status !== 'active' && member.role !== 'admin' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleStatusUpdate(member.id, 'active')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="check-circle" size={14} color="#ffffff" />
            <Text style={styles.actionButtonText}>{translations.approve}</Text>
          </TouchableOpacity>
        )}
        {member.status !== 'suspended' && member.status !== 'active' && member.role !== 'admin' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.suspendButton]}
            onPress={() => handleStatusUpdate(member.id, 'suspended')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="block" size={14} color="#ffffff" />
            <Text style={styles.actionButtonText}>{translations.suspend}</Text>
          </TouchableOpacity>
        )}
        {member.status === 'suspended' && member.role !== 'admin' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.reactivateButton]}
            onPress={() => handleStatusUpdate(member.id, 'active')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="refresh" size={14} color="#ffffff" />
            <Text style={styles.actionButtonText}>{translations.reactivate}</Text>
          </TouchableOpacity>
        )}
        {member.role !== 'admin' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(member.id)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="delete" size={14} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container} key={renderKey}>
      {/* Saffron Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{translations.memberList}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder={translations.searchMembers}
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={handleSearch}
            textAlignVertical="center"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <MaterialIcons name="close" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statusFilterRow}>
          <StatusFilterChip
            label={translations.all}
            count={getStatusCount('all')}
            active={statusFilter === 'all'}
            onPress={() => handleStatusFilter('all')}
          />
          <StatusFilterChip
            label={translations.active}
            count={getStatusCount('active')}
            active={statusFilter === 'active'}
            onPress={() => handleStatusFilter('active')}
          />
          <StatusFilterChip
            label={translations.pending}
            count={getStatusCount('pending')}
            active={statusFilter === 'pending'}
            onPress={() => handleStatusFilter('pending')}
          />
          <StatusFilterChip
            label={translations.suspended}
            count={getStatusCount('suspended')}
            active={statusFilter === 'suspended'}
            onPress={() => handleStatusFilter('suspended')}
          />
        </View>

        <View style={styles.statsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScrollContent}>
            <StatCard 
              label={translations.all} 
              count={members.length} 
              icon="people" 
              color="#ffffff" 
              active={activeFilter === 'All'}
              onPress={() => handleFilterPress('All')}
            />
            <StatCard 
              label={translations.admin} 
              count={getFilterCount('Admin')} 
              icon="shield" 
              color="#ffffff"
              active={activeFilter === 'Admin'}
              onPress={() => handleFilterPress('Admin')}
            />
            <StatCard 
              label={translations.working} 
              count={getFilterCount('Working Member')} 
              icon="work" 
              color="#ffffff"
              active={activeFilter === 'Working Member'}
              onPress={() => navigation.navigate('WorkingMemberList')}
            />
            <StatCard 
              label={translations.member} 
              count={getFilterCount('Member')} 
              icon="person" 
              color="#ffffff"
              active={activeFilter === 'Member'}
              onPress={() => handleFilterPress('Member')}
            />
          </ScrollView>
        </View>
      </View>

      <FlatList
        data={filteredMembers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MemberCard member={item} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF7722']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContent}>
            <MaterialIcons name="people" size={44} color="#D1D5DB" />
            <Text style={styles.emptyText}>{translations.noMembers}</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Member Detail Modal with ID Card and Certificates */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{translations.memberDetails}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedMember && (
              <>
                {/* Profile Section */}
                <View style={styles.modalProfileSection}>
                  {selectedMember.profilePhoto ? (
                    <Image source={{ uri: selectedMember.profilePhoto }} style={styles.modalAvatar} />
                  ) : (
                    <View style={styles.modalAvatarPlaceholder}>
                      <Text style={styles.modalAvatarText}>
                        {selectedMember.fullName?.charAt(0) || '?'}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.modalName}>{selectedMember.fullName || translations.unknown}</Text>
                  <View style={[styles.modalStatusBadge, { backgroundColor: getStatusColor(selectedMember.status) + '15' }]}>
                    <Text style={[styles.modalStatusText, { color: getStatusColor(selectedMember.status) }]}>
                      {getStatusLabel(selectedMember.status)}
                    </Text>
                  </View>
                </View>

                {/* ID Card Section with Download */}
                <View style={styles.modalSection}>
                  <View style={styles.modalSectionHeader}>
                    <Text style={styles.modalSectionTitle}>ID Card</Text>
                    <TouchableOpacity 
                      style={styles.modalDownloadButton}
                      onPress={() => downloadIDCard(selectedMember)}
                      disabled={downloading}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons 
                        name={downloading ? "hourglass-empty" : "download"} 
                        size={16} 
                        color="#8b5cf6" 
                      />
                      <Text style={styles.modalDownloadText}>
                        {downloading ? translations.downloading : translations.downloadIdCard}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {renderIDCard(selectedMember)}
                </View>

                {/* Certificates Section with Download for each */}
                <View style={styles.modalSection}>
                  <View style={styles.modalSectionHeader}>
                    <Text style={styles.modalSectionTitle}>{translations.certificates}</Text>
                    <Text style={styles.modalSectionCount}>
                      {memberCertificates.length} {translations.earned}
                    </Text>
                  </View>

                  {memberCertificates.length > 0 ? (
                    memberCertificates.map((cert, index) => renderCertificateItem(cert, index))
                  ) : (
                    <View style={styles.noCertContainer}>
                      <MaterialIcons name="verified" size={30} color="#d1d5db" />
                      <Text style={styles.noCertText}>{translations.noCertificates}</Text>
                    </View>
                  )}
                </View>

                {/* Member Info Section */}
                <View style={styles.modalInfoSection}>
  <View style={styles.modalInfoItem}>
    <Text style={styles.modalInfoLabel}>{translations.email}</Text>
    <Text style={styles.modalInfoValue}>{selectedMember.email}</Text>
  </View>
  <View style={styles.modalInfoItem}>
    <Text style={styles.modalInfoLabel}>{translations.phone}</Text>
    <Text style={styles.modalInfoValue}>{selectedMember.phone || translations.nA}</Text>
  </View>
  <View style={styles.modalInfoItem}>
    <Text style={styles.modalInfoLabel}>{translations.address}</Text>
    <Text style={styles.modalInfoValue}>{selectedMember.address || translations.nA}</Text>
  </View>
  <View style={styles.modalInfoItem}>
    <Text style={styles.modalInfoLabel}>{translations.role}</Text>
    <View style={[styles.modalRoleBadge, { backgroundColor: getRoleColor(selectedMember.role) + '15' }]}>
      <Text style={[styles.modalRoleText, { color: getRoleColor(selectedMember.role) }]}>
        {getRoleLabel(selectedMember.role)}
      </Text>
    </View>
  </View>
  <View style={styles.modalInfoItem}>
    <Text style={styles.modalInfoLabel}>{translations.joined}</Text>
    <Text style={styles.modalInfoValue}>
      {selectedMember.createdAt ? new Date(selectedMember.createdAt?.seconds * 1000 || selectedMember.createdAt).toLocaleDateString() : translations.nA}
    </Text>
  </View>
  {/* Registration Fee Status */}
  <View style={styles.modalInfoItem}>
    <Text style={styles.modalInfoLabel}>Registration Fee</Text>
    {selectedMember.registrationFeePaid ? (
      <View style={styles.feeStatusContainer}>
        <View style={styles.feePaidBadge}>
          <MaterialIcons name="check-circle" size={16} color="#10b981" />
          <Text style={styles.feePaidText}>Paid</Text>
        </View>
        <Text style={styles.feeAmountText}>₹{selectedMember.registrationFeeAmount || 0}</Text>
        {registrationFeeDetails && (
          <View style={styles.feeMethodContainer}>
            <MaterialIcons 
              name={registrationFeeDetails.paymentMethod === 'razorpay' ? 'payment' : 'admin-panel-settings'} 
              size={14} 
              color={registrationFeeDetails.paymentMethod === 'razorpay' ? '#FF7722' : '#8b5cf6'} 
            />
            <Text style={styles.feeMethodText}>
              Via: {registrationFeeDetails.paymentMethod === 'razorpay' ? 'Razorpay (Online)' : 'Admin (Manual)'}
            </Text>
          </View>
        )}
        {registrationFeeDetails?.transactionId && (
          <Text style={styles.feeTransactionId}>
            TXN: {registrationFeeDetails.transactionId}
          </Text>
        )}
        {registrationFeeDetails?.date && (
          <Text style={styles.feeDateText}>
            Paid on: {new Date(registrationFeeDetails.date).toLocaleDateString()}
          </Text>
        )}
      </View>
    ) : (
      <View style={styles.feeNotPaidBadge}>
        <MaterialIcons name="cancel" size={16} color="#ef4444" />
        <Text style={styles.feeNotPaidText}>Not Paid</Text>
      </View>
    )}
  </View>
</View>

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  {selectedMember.role !== 'admin' && (
                    <>
                      <TouchableOpacity 
                        style={[styles.modalActionButton, styles.modalApproveButton]}
                        onPress={() => {
                          handleStatusUpdate(selectedMember.id, 'active');
                          setModalVisible(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name="check-circle" size={16} color="#ffffff" />
                        <Text style={styles.modalActionText}>{translations.approve}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.modalActionButton, styles.modalRoleButton]}
                        onPress={() => {
                          const newRole = selectedMember.role === 'member' ? 'workingMember' : 'member';
                          handleRoleUpdate(selectedMember.id, newRole);
                          setModalVisible(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name="swap-horiz" size={16} color="#ffffff" />
                        <Text style={styles.modalActionText}>
                          {selectedMember.role === 'member' ? translations.makeWorking : translations.makeMember}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.modalActionButton, styles.modalDeleteButton]}
                        onPress={() => {
                          handleDelete(selectedMember.id);
                          setModalVisible(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name="delete" size={16} color="#ffffff" />
                        <Text style={styles.modalActionText}>{translations.delete}</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Add Registration Fee Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={feeModalVisible}
        onRequestClose={() => {
          setFeeModalVisible(false);
          setSelectedMemberForFee(null);
          setFeeAmount('');
          setFeeNote('');
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { fontSize: 18 }]}>{translations.registrationFee}</Text>
              <TouchableOpacity onPress={() => {
                setFeeModalVisible(false);
                setSelectedMemberForFee(null);
                setFeeAmount('');
                setFeeNote('');
              }}>
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedMemberForFee && (
              <>
                <View style={styles.feeMemberInfo}>
                  <Text style={styles.feeMemberName}>{selectedMemberForFee.fullName}</Text>
                  <Text style={styles.feeMemberEmail}>{selectedMemberForFee.email}</Text>
                  <Text style={styles.feeMemberRole}>
                    Role: {getRoleLabel(selectedMemberForFee.role)}
                  </Text>
                  {selectedMemberForFee.registrationFeePaid && (
                    <View style={styles.feePaidBadge}>
                      <MaterialIcons name="check-circle" size={16} color="#10b981" />
                      <Text style={styles.feePaidText}>
                        {translations.feeAlreadyPaid.replace('{amount}', selectedMemberForFee.registrationFeeAmount)}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.modalInfoItem}>
                  <Text style={[styles.modalInfoLabel, { fontSize: 14 }]}>{translations.feeAmount} *</Text>
                  <TextInput
                    style={[styles.modalInput, { fontSize: 16 }]}
                    value={feeAmount}
                    onChangeText={setFeeAmount}
                    placeholder={translations.enterFeeAmount}
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.modalInfoItem}>
                  <Text style={[styles.modalInfoLabel, { fontSize: 14 }]}>{translations.feeNote}</Text>
                  <TextInput
                    style={[styles.modalInput, styles.textArea, { fontSize: 14 }]}
                    value={feeNote}
                    onChangeText={setFeeNote}
                    placeholder={translations.feeNotePlaceholder}
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                <View style={[styles.modalActions, { marginTop: 8 }]}>
                  <TouchableOpacity 
                    style={[styles.modalActionButton, styles.modalCancelButton, { flex: 1 }]}
                    onPress={() => {
                      setFeeModalVisible(false);
                      setSelectedMemberForFee(null);
                      setFeeAmount('');
                      setFeeNote('');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalCancelText}>{translations.cancel}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
  style={[styles.modalActionButton, styles.modalConfirmButton, { flex: 1 }, addingFee && { opacity: 0.6 }]}
  onPress={() => {
    console.log('🔵 Add Fee button pressed');
    console.log('🔵 selectedMemberForFee:', selectedMemberForFee);
    console.log('🔵 feeAmount:', feeAmount);
    console.log('🔵 feeNote:', feeNote);
    console.log('🔵 addingFee:', addingFee);
    handleAddRegistrationFee();
  }}
  disabled={addingFee}
  activeOpacity={0.7}
>
  {addingFee ? (
    <ActivityIndicator size="small" color="#ffffff" />
  ) : (
    <>
      <MaterialIcons name="payment" size={16} color="#ffffff" />
      <Text style={styles.modalActionText}>{translations.addFee || 'Add Fee'}</Text>
    </>
  )}
</TouchableOpacity>
                </View>
              </>
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

  // Saffron Header
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

  statusFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  statusChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  activeStatusChip: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  statusChipText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  activeStatusChipText: {
    color: '#FF7722',
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

  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: Fonts.Bold,
    fontSize: 18,
    color: '#FF7722',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1F2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  memberEmail: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6B7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  statusBadge: {
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
  statusText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 10,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  memberDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailValue: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6B7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 10,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'flex-end',
    gap: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
    gap: 4,
  },
  viewButton: {
    backgroundColor: '#FF7722',
  },
  feeButton: {
    backgroundColor: '#8b5cf6',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  suspendButton: {
    backgroundColor: '#F59E0B',
  },
  reactivateButton: {
    backgroundColor: '#06B6D4',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
  },
  actionButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#FFFFFF',
    fontSize: 10,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontFamily: Fonts.Regular,
    fontSize: 15,
    color: '#6B7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    width: '100%',
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
    color: '#000',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  modalProfileSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  modalAvatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarText: {
    fontFamily: Fonts.Bold,
    fontSize: 28,
    color: '#FF7722',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  modalName: {
    fontFamily: Fonts.Bold,
    fontSize: 18,
    color: '#1F2937',
    marginTop: 6,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  modalStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
  },
  modalStatusText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 11,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  modalSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalSectionTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 15,
    color: '#1F2937',
  },
  modalSectionCount: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6B7280',
  },
  modalDownloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f5f3ff',
  },
  modalDownloadText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 11,
    color: '#8b5cf6',
  },

  // ID Card Styles
  idCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    position: 'relative',
    overflow: 'hidden',
  },
  watermarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  idCardTopSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  idCardLeftLogo: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  idCardRightLogo: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  idCardLogoImage: {
    width: 40,
    height: 40,
  },
  idCardCenterTitle: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  idCardMainTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 12,
    color: '#1f2937',
    textAlign: 'center',
  },
  idCardSubTitle: {
    fontFamily: Fonts.Regular,
    fontSize: 8,
    color: '#4b5563',
    textAlign: 'center',
    marginTop: 1,
  },
  idCardRegNo: {
    fontFamily: Fonts.Regular,
    fontSize: 7,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 1,
  },
  idCardIdentityTitle: {
    alignItems: 'center',
    marginVertical: 4,
    paddingVertical: 2,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#d1d5db',
  },
  idCardIdentityText: {
    fontFamily: Fonts.Bold,
    fontSize: 14,
    color: '#1f2937',
    letterSpacing: 1,
  },
  idCardBody: {
    flexDirection: 'row',
    marginTop: 4,
    paddingVertical: 2,
  },
  idCardLeftFields: {
    flex: 1,
    paddingRight: 6,
  },
  idCardField: {
    marginBottom: 2,
  },
  idCardFieldLabel: {
    fontFamily: Fonts.SemiBold,
    fontSize: 8,
    color: '#4b5563',
  },
  idCardFieldValue: {
    fontFamily: Fonts.Regular,
    fontSize: 9,
    color: '#1f2937',
    marginLeft: 2,
  },
  idCardStatusValue: {
    color: '#10b981',
    fontFamily: Fonts.SemiBold,
  },
  idCardRightPhoto: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 4,
  },
  idCardPhoto: {
    width: 60,
    height: 70,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  idCardPhotoPlaceholder: {
    width: 60,
    height: 70,
    borderRadius: 3,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  idCardPhotoLabel: {
    fontFamily: Fonts.Regular,
    fontSize: 7,
    color: '#6b7280',
    marginTop: 2,
  },
  idCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  idCardFooterText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 9,
    color: '#4b5563',
  },
  idCardFooterCenter: {
    alignItems: 'center',
  },
  idCardSignatureLine: {
    width: 60,
    height: 1,
    backgroundColor: '#9ca3af',
    marginBottom: 1,
  },
  idCardSignatureLabel: {
    fontFamily: Fonts.Regular,
    fontSize: 7,
    color: '#6b7280',
  },

  // Certificate Styles
  certItemWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 6,
  },
  certItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  certItemIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  certItemContent: {
    flex: 1,
  },
  certItemTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    color: '#1f2937',
  },
  certItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  certItemType: {
    fontFamily: Fonts.Regular,
    fontSize: 9,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  certItemDate: {
    fontFamily: Fonts.Regular,
    fontSize: 9,
    color: '#9ca3af',
  },
  certItemAmount: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    color: '#10b981',
    flexShrink: 0,
  },
  certDownloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 2,
    paddingHorizontal: 6,
    gap: 3,
    alignSelf: 'flex-end',
  },
  certDownloadText: {
    fontFamily: Fonts.Regular,
    color: '#8b5cf6',
    fontSize: 10,
  },

  noCertContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
feeStatusContainer: {
  flex: 1,
  marginTop: 2,
},
feePaidBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#f0fdf4',
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 12,
  gap: 4,
  alignSelf: 'flex-start',
},
feePaidText: {
  fontFamily: Fonts.SemiBold,
  fontSize: 12,
  color: '#10b981',
},
feeAmountText: {
  fontFamily: Fonts.Bold,
  fontSize: 14,
  color: '#1f2937',
  marginTop: 4,
},
feeMethodContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  marginTop: 2,
},
feeMethodText: {
  fontFamily: Fonts.Regular,
  fontSize: 11,
  color: '#6b7280',
},
feeTransactionId: {
  fontFamily: Fonts.Regular,
  fontSize: 10,
  color: '#9ca3af',
  marginTop: 2,
},
feeDateText: {
  fontFamily: Fonts.Regular,
  fontSize: 10,
  color: '#9ca3af',
  marginTop: 1,
},
feeNotPaidBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#fef2f2',
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 12,
  gap: 4,
  alignSelf: 'flex-start',
},
feeNotPaidText: {
  fontFamily: Fonts.SemiBold,
  fontSize: 12,
  color: '#ef4444',
},
  noCertText: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
  },

  modalInfoSection: {
    marginBottom: 12,
  },
  modalInfoItem: {
    marginBottom: 6,
  },
  modalInfoLabel: {
    fontFamily: Fonts.SemiBold,
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  modalInfoValue: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#1F2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  modalRoleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  modalRoleText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 11,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 6,
    flexWrap: 'wrap',
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
    flex: 1,
    minWidth: 70,
  },
  modalApproveButton: {
    backgroundColor: '#10B981',
  },
  modalRoleButton: {
    backgroundColor: '#FF7722',
  },
  modalDeleteButton: {
    backgroundColor: '#EF4444',
  },
  modalCancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flex: 1,
  },
  modalConfirmButton: {
    backgroundColor: '#8b5cf6',
    flex: 1,
  },
  modalActionText: {
    fontFamily: Fonts.SemiBold,
    color: '#FFFFFF',
    fontSize: 11,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  modalCancelText: {
    fontFamily: Fonts.SemiBold,
    color: '#6b7280',
    fontSize: 14,
  },

  // Fee Modal Styles
  feeMemberInfo: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  feeMemberName: {
    fontFamily: Fonts.Bold,
    fontSize: 16,
    color: '#1f2937',
  },
  feeMemberEmail: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  feeMemberRole: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  feePaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    gap: 4,
  },
  feePaidText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    color: '#10b981',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f9fafb',
    fontFamily: Fonts.Regular,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 60,
  },
});