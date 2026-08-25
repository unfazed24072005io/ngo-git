// screens/admin/WorkingMemberManagement.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Switch,
  Dimensions,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db, getAuthInstance } from '../../config/firebase';
import { 
  createUserWithEmailAndPassword  // ✅ ADD THIS
} from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  getDoc, 
  setDoc,
  addDoc,
  Timestamp,
  runTransaction,
  increment
} from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { Fonts } from '../../config/fonts';
import { getLevelDetails, getLevelByMemberCount, LEVELS } from '../../config/commissionLevels';
import { WalletService } from '../../services/WalletService';
import { CommissionService } from '../../services/CommissionService';
import { LevelUpdateService } from '../../services/LevelUpdateService';
import ViewShot from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Svg, Defs, Pattern, Rect, Image as SvgImage } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../context/LanguageContext';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;

const FILTERS = ['All', 'Bronze', 'Silver', 'Gold', 'Platinum'];

export default function WorkingMemberManagement() {
  const { t, counter } = useLanguage();
  const navigation = useNavigation();
  
  // Force re-render when language changes
  const renderKey = `workingmembers-${counter}`;

  // Get translations
  const getTranslations = () => ({
    workingMembers: t('workingMembers.title') || 'Working Members',
    searchWorkingMembers: t('workingMembers.search') || 'Search working members...',
    all: t('common.all') || 'All',
    active: t('common.active') || 'Active',
    pending: t('common.pending') || 'Pending',
    suspended: t('workingMembers.suspended') || 'Suspended',
    total: t('common.total') || 'Total',
    noWorkingMembers: t('workingMembers.noWorkingMembers') || 'No working members found',
    noWorkingMembersSubtext: t('workingMembers.noWorkingMembersSubtext') || 'Working members will appear here',
    workingMemberDetails: t('workingMembers.details') || 'Working Member Details',
    performance: t('workingMembers.performance') || 'Performance',
    direct: t('workingMembers.direct') || 'Direct',
    earned: t('workingMembers.earned') || 'Earned',
    pendingCommission: t('workingMembers.pendingCommission') || 'Pending',
    donations: t('workingMembers.donations') || 'Donations',
    commissionRates: t('workingMembers.commissionRates') || 'Commission Rates',
    directCommission: t('workingMembers.directCommission') || 'Direct:',
    secondaryCommission: t('workingMembers.secondaryCommission') || 'Secondary:',
    directMembers: t('workingMembers.directMembers') || 'Direct Members',
    noDirectMembers: t('workingMembers.noDirectMembers') || 'No direct members yet',
    status: t('common.status') || 'Status',
    level: t('common.level') || 'Level',
    nextLevel: t('workingMembers.nextLevel') || 'Next Level',
    donationsReq: t('workingMembers.donationsReq') || 'Donations Req',
    wallet: t('workingMembers.wallet') || 'Wallet',
    promotion: t('workingMembers.promotion') || 'Promotion',
    eligible: t('workingMembers.eligible') || '✅ Eligible',
    moreNeeded: t('workingMembers.moreNeeded') || 'more',
    close: t('common.close') || 'Close',
    promoteWorkingMember: t('workingMembers.promoteWorkingMember') || 'Promote Working Member',
    member: t('common.member') || 'Member',
    currentLevel: t('workingMembers.currentLevel') || 'Current Level',
    newLevel: t('workingMembers.newLevel') || 'New Level',
    confirmPromotion: t('workingMembers.confirmPromotion') || 'Confirm Promotion',
    addCommission: t('workingMembers.addCommission') || 'Add Commission',
    amount: t('workingMembers.amount') || 'Amount',
    type: t('common.type') || 'Type',
    description: t('common.description') || 'Description',
    add: t('common.add') || 'Add',
    commissionHistory: t('workingMembers.commissionHistory') || 'Commission History',
    noCommissionHistory: t('workingMembers.noCommissionHistory') || 'No commission history',
    paid: t('workingMembers.paid') || 'Paid',
    failed: t('workingMembers.failed') || 'Failed',
    walletDetails: t('workingMembers.walletDetails') || 'Wallet Details',
    availableBalance: t('workingMembers.availableBalance') || 'Available Balance',
    withdrawn: t('workingMembers.withdrawn') || 'Withdrawn',
    loadingWorkingMembers: t('workingMembers.loading') || 'Loading Working Members...',
    approve: t('workingMembers.approve') || 'Approve',
    suspend: t('workingMembers.suspend') || 'Suspend',
    view: t('common.view') || 'View',
    history: t('common.history') || 'History',
    promote: t('workingMembers.promote') || 'Promote',
    statusUpdated: t('workingMembers.statusUpdated') || 'Status updated to {status}',
    promotionSuccess: t('workingMembers.promotionSuccess') || '{name} promoted to {level}',
    commissionAdded: t('workingMembers.commissionAdded') || '₹{amount} Commission added for {name}',
    error: t('common.error') || 'Error',
    success: t('common.success') || 'Success',
    cancel: t('common.cancel') || 'Cancel',
    delete: t('common.delete') || 'Delete',
    save: t('common.save') || 'Save',
    nA: t('common.nA') || 'N/A',
    max: t('workingMembers.max') || 'Max',
    registered: t('workingMembers.registered') || 'Registered',
    earning: t('workingMembers.earning') || 'Earning',
    pendingCommissionLabel: t('workingMembers.pendingCommissionLabel') || 'Pending Comm.',
    directComm: t('workingMembers.directComm') || 'Direct Comm.',
    secondaryComm: t('workingMembers.secondaryComm') || 'Secondary Comm.',
    role: t('common.role') || 'Role',
    email: t('common.email') || 'Email',
    phone: t('common.phone') || 'Phone',
    joinDate: t('workingMembers.joinDate') || 'Join Date',
  });

  const translations = getTranslations();

  const [workingMembers, setWorkingMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [search, setSearch] = useState('');
// Add with other state declarations
const [assignModalVisible, setAssignModalVisible] = useState(false);
const [selectedMemberForAssign, setSelectedMemberForAssign] = useState(null);
const [availableSubMembers, setAvailableSubMembers] = useState([]);
const [selectedSubMemberId, setSelectedSubMemberId] = useState(null);
const [selectedSubMemberName, setSelectedSubMemberName] = useState('');
const [searchSubMember, setSearchSubMember] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
// Refs for capturing views
const idCardRef = useRef(null);
const certificateRefs = useRef({});

// Download states
const [memberCertificates, setMemberCertificates] = useState([]);
const [downloading, setDownloading] = useState(false);
const [downloadingCertId, setDownloadingCertId] = useState(null);
const [selectedMemberForDownload, setSelectedMemberForDownload] = useState(null);
const [downloadModalVisible, setDownloadModalVisible] = useState(false);

const isWeb = Platform.OS === 'web';
// Add these with your other state declarations
const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
const [dynamicLevels, setDynamicLevels] = useState([]);
const [newMemberData, setNewMemberData] = useState({
  fullName: '',
  email: '',
  phone: '',
  password: '',
  address: '',
  village: '',
  postOffice: '',
  thana: '',
  district: '',
  state: '',
  pinCode: '',
  gender: '',
  dob: '',
  aadharNumber: '',
  level: 'I',
  status: 'active',
  role: 'working',
  profilePhoto: null,
  parentId: '', // ✅ Add parent ID
});
const [savingMember, setSavingMember] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLevel, setFilterLevel] = useState('All');
// Add with other state declarations
// Add with other state declarations
const [parentMemberId, setParentMemberId] = useState(null);

const [parentMemberName, setParentMemberName] = useState('');
const [showParentSelector, setShowParentSelector] = useState(false);
const [availableParents, setAvailableParents] = useState([]);
const [searchParent, setSearchParent] = useState('');
const [registrationMethod, setRegistrationMethod] = useState('email'); // 'email' or 'phone'
const [showRegistrationMethodModal, setShowRegistrationMethodModal] = useState(false);
const [referralModalVisible, setReferralModalVisible] = useState(false);
const [selectedMemberForReferral, setSelectedMemberForReferral] = useState(null);
const [referralCode, setReferralCode] = useState('');
const [generatingReferral, setGeneratingReferral] = useState(false);
  const [promotionModalVisible, setPromotionModalVisible] = useState(false);
  const [commissionModalVisible, setCommissionModalVisible] = useState(false);
  const [commissionHistoryModalVisible, setCommissionHistoryModalVisible] = useState(false);
  const [commissionHistory, setCommissionHistory] = useState([]);
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  
  const [promotionData, setPromotionData] = useState({
    memberId: '',
    memberName: '',
    currentLevel: '',
    newLevel: '',
    commissionRate: ''
  });
  const [commissionData, setCommissionData] = useState({
    memberId: '',
    memberName: '',
    amount: '',
    type: 'direct',
    description: '',
    status: 'pending'
  });

  useEffect(() => {
    fetchDynamicLevels();
    setupRealtimeListener();
  }, []);

  const fetchDynamicLevels = async () => {
  try {
    const settingsRef = doc(db, 'settings', 'commission');
    const settingsSnap = await getDoc(settingsRef);
    if (settingsSnap.exists()) {
      const settingsData = settingsSnap.data();
      if (settingsData.levels) {
        setDynamicLevels(settingsData.levels);
      }
    }
  } catch (error) {
    console.error('Error fetching dynamic levels:', error);
  }
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
// Fetch available members who can be parents (level higher than selected)
// Fetch available members who can be parents (level HIGHER than selected)
const fetchAvailableParents = async (selectedLevel) => {
  if (!selectedLevel) return;
  
  try {
    const levelsToUse = dynamicLevels.length > 0 ? dynamicLevels : getDefaultLevels();
    const selectedLevelIndex = levelsToUse.findIndex(l => l.id === selectedLevel);
    
    // ✅ Parents must be at HIGHER levels (higher index = higher level)
    const parentLevels = levelsToUse.filter((l, index) => index > selectedLevelIndex);
    const parentLevelIds = parentLevels.map(l => l.id);
    
    if (parentLevelIds.length === 0) {
      setAvailableParents([]);
      return;
    }
    
    const q = query(
      collection(db, 'users'),
      where('role', 'in', ['working', 'workingMember']),
      where('status', '==', 'active')
    );
    const snapshot = await getDocs(q);
    const parents = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (parentLevelIds.includes(data.level)) {
        parents.push({
          id: doc.id,
          fullName: data.fullName || data.name || 'Unknown',
          level: data.level,
          levelName: getLevelLabel(data.level),
          phone: data.phone || '',
          email: data.email || '',
        });
      }
    });
    setAvailableParents(parents);
  } catch (error) {
    console.error('Error fetching parents:', error);
  }
};
// Add this function with other functions
const generateReferralCode = () => {
  // Generate a random 8-character alphanumeric code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const handleGenerateReferral = async () => {
  if (!selectedMemberForReferral) return;
  
  setGeneratingReferral(true);
  try {
    // ✅ Always generate a new code
    const newCode = generateReferralCode();
    setReferralCode(newCode);
    
    // ✅ Save to Firestore
    await updateDoc(doc(db, 'users', selectedMemberForReferral.id), {
      referralCode: newCode,
      referralCodeGeneratedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    Alert.alert(
      'Success', 
      `Referral code generated for ${selectedMemberForReferral.fullName}\n\nCode: ${newCode}`
    );
    
    // ✅ Refresh the list to show updated data
    onRefresh();
    
  } catch (error) {
    console.error('Error generating referral code:', error);
    Alert.alert('Error', 'Failed to generate referral code. Please try again.');
  } finally {
    setGeneratingReferral(false);
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
    
    if (isWeb) {
      const link = document.createElement('a');
      link.href = uri;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      Alert.alert('Success', 'ID Card downloaded successfully!');
    } else {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Save ID Card',
        });
      } else {
        const newPath = FileSystem.documentDirectory + fileName;
        await FileSystem.copyAsync({ from: uri, to: newPath });
        await Sharing.shareAsync(newPath);
      }
      Alert.alert('Success', 'ID Card downloaded successfully!');
    }
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
    
    if (isWeb) {
      const link = document.createElement('a');
      link.href = uri;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      Alert.alert('Success', 'Certificate downloaded successfully!');
    } else {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Save Certificate',
        });
      } else {
        const newPath = FileSystem.documentDirectory + fileName;
        await FileSystem.copyAsync({ from: uri, to: newPath });
        await Sharing.shareAsync(newPath);
      }
      Alert.alert('Success', 'Certificate downloaded successfully!');
    }
  } catch (error) {
    console.error('Error downloading certificate:', error);
    Alert.alert('Error', 'Failed to download certificate. Please try again.');
  } finally {
    setDownloadingCertId(null);
  }
};

const openDownloadModal = (member) => {
  setSelectedMemberForDownload(member);
  // ✅ Load the referral code from the member data
  setReferralCode(member.referralCode || '');
  fetchMemberCertificates(member.id);
  setDownloadModalVisible(true);
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
        <Text style={styles.idCardIdentityText}>पहचान पत्र</Text>
      </View>

      <View style={styles.idCardBody}>
        <View style={styles.idCardLeftFields}>
          <View style={styles.idCardField}>
            <Text style={styles.idCardFieldLabel}>नाम :</Text>
            <Text style={styles.idCardFieldValue} numberOfLines={1}>{member.fullName || translations.nA}</Text>
          </View>
          <View style={styles.idCardField}>
            <Text style={styles.idCardFieldLabel}>पिता/पति का नाम :</Text>
            <Text style={styles.idCardFieldValue} numberOfLines={1}>{member.fatherName || translations.nA}</Text>
          </View>
          <View style={styles.idCardField}>
            <Text style={styles.idCardFieldLabel}>जन्म तिथि :</Text>
            <Text style={styles.idCardFieldValue} numberOfLines={1}>{member.dob || translations.nA}</Text>
          </View>
          <View style={styles.idCardField}>
            <Text style={styles.idCardFieldLabel}>आधार संख्या :</Text>
            <Text style={styles.idCardFieldValue} numberOfLines={1}>{member.aadharNumber || translations.nA}</Text>
          </View>
          <View style={styles.idCardField}>
            <Text style={styles.idCardFieldLabel}>सदस्यता स्थिति :</Text>
            <Text style={[styles.idCardFieldValue, styles.idCardStatusValue]} numberOfLines={1}>
              {member.status === 'active' ? 'सक्रिय' : member.status || translations.nA}
            </Text>
          </View>
          <View style={styles.idCardField}>
            <Text style={styles.idCardFieldLabel}>मोबाइल नंबर :</Text>
            <Text style={styles.idCardFieldValue} numberOfLines={1}>{member.phone || translations.nA}</Text>
          </View>
          <View style={styles.idCardField}>
            <Text style={styles.idCardFieldLabel}>पता :</Text>
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
          <Text style={styles.idCardPhotoLabel}>फोटो</Text>
        </View>
      </View>

      <View style={styles.idCardFooter}>
        <Text style={styles.idCardFooterText}>प्रबंधक</Text>
        <View style={styles.idCardFooterCenter}>
          <View style={styles.idCardSignatureLine} />
          <Text style={styles.idCardSignatureLabel}>सदस्य हस्ताक्षर</Text>
        </View>
        <Text style={styles.idCardFooterText}>सचिव</Text>
      </View>
    </View>
  </ViewShot>
);

// Render Certificate Item
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
          {downloadingCertId === (cert.id || index) ? 'Downloading...' : 'Download'}
        </Text>
      </TouchableOpacity>
    </View>
  );
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
// Fetch members who can be assigned under this member (lower levels)
// Fetch members who can be assigned under this member (LOWER levels)
const fetchAvailableSubMembers = async (parentLevel) => {
  if (!parentLevel) return;
  
  try {
    const levelsToUse = dynamicLevels.length > 0 ? dynamicLevels : getDefaultLevels();
    const parentLevelIndex = levelsToUse.findIndex(l => l.id === parentLevel);
    
    // ✅ Sub-members must be at LOWER levels (lower index = lower level)
    const subLevels = levelsToUse.filter((l, index) => index < parentLevelIndex);
    const subLevelIds = subLevels.map(l => l.id);
    
    if (subLevelIds.length === 0) {
      setAvailableSubMembers([]);
      return;
    }
    
    const q = query(
      collection(db, 'users'),
      where('role', 'in', ['working', 'workingMember']),
      where('status', '==', 'active')
    );
    const snapshot = await getDocs(q);
    const subMembers = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (subLevelIds.includes(data.level)) {
        if (!data.parentId) {
          subMembers.push({
            id: doc.id,
            fullName: data.fullName || data.name || 'Unknown',
            level: data.level,
            levelName: getLevelLabel(data.level),
            phone: data.phone || '',
            email: data.email || '',
          });
        }
      }
    });
    setAvailableSubMembers(subMembers);
  } catch (error) {
    console.error('Error fetching sub-members:', error);
  }
};
// Assign a sub-member to the selected parent
const handleAssignMember = async () => {
  if (!selectedMemberForAssign || !selectedSubMemberId) {
    Alert.alert('Error', 'Please select a member to assign');
    return;
  }

  setSavingMember(true);
  try {
    // Update the sub-member's parent
    const subMemberRef = doc(db, 'users', selectedSubMemberId);
    await updateDoc(subMemberRef, {
      parentId: selectedMemberForAssign.id,
      parentName: selectedMemberForAssign.fullName,
      updatedAt: new Date().toISOString()
    });

    // Update the parent's children list
    const parentRef = doc(db, 'users', selectedMemberForAssign.id);
    const parentDoc = await getDoc(parentRef);
    if (parentDoc.exists()) {
      const parentData = parentDoc.data();
      const currentChildren = parentData.childrenIds || [];
      if (!currentChildren.includes(selectedSubMemberId)) {
        await updateDoc(parentRef, {
          childrenIds: [...currentChildren, selectedSubMemberId],
          updatedAt: new Date().toISOString()
        });
      }
    }

    Alert.alert(
      'Success',
      `${selectedSubMemberName} has been assigned under ${selectedMemberForAssign.fullName}`
    );
    
    setAssignModalVisible(false);
    setSelectedMemberForAssign(null);
    setSelectedSubMemberId(null);
    setSelectedSubMemberName('');
    setAvailableSubMembers([]);
    onRefresh();
    
  } catch (error) {
    console.error('Error assigning member:', error);
    Alert.alert('Error', 'Failed to assign member. Please try again.');
  } finally {
    setSavingMember(false);
  }
};
// Unassign a sub-member from parent
const handleUnassignMember = async (memberId) => {
  Alert.alert(
    'Unassign Member',
    'Are you sure you want to remove this member from their parent?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unassign',
        style: 'destructive',
        onPress: async () => {
          setSavingMember(true);
          try {
            const memberRef = doc(db, 'users', memberId);
            const memberDoc = await getDoc(memberRef);
            if (memberDoc.exists()) {
              const memberData = memberDoc.data();
              const parentId = memberData.parentId;
              
              // Remove parent from member
              await updateDoc(memberRef, {
                parentId: null,
                parentName: null,
                updatedAt: new Date().toISOString()
              });

              // Remove member from parent's children list
              if (parentId) {
                const parentRef = doc(db, 'users', parentId);
                const parentDoc = await getDoc(parentRef);
                if (parentDoc.exists()) {
                  const parentData = parentDoc.data();
                  const currentChildren = parentData.childrenIds || [];
                  const updatedChildren = currentChildren.filter(id => id !== memberId);
                  await updateDoc(parentRef, {
                    childrenIds: updatedChildren,
                    updatedAt: new Date().toISOString()
                  });
                }
              }
            }

            Alert.alert('Success', 'Member unassigned successfully');
            onRefresh();
            
          } catch (error) {
            console.error('Error unassigning member:', error);
            Alert.alert('Error', 'Failed to unassign member');
          } finally {
            setSavingMember(false);
          }
        }
      }
    ]
  );
};
const getCertificateTypeLabel = (type) => {
  switch(type) {
    case 'donation': return 'Donation';
    case 'membership': return 'Membership';
    case 'volunteer': return 'Volunteer';
    default: return 'Certificate';
  }
};
// Add this function
const handleAddWorkingMember = async () => {
  // Validate required fields
  if (!newMemberData.fullName.trim()) {
    Alert.alert('Error', 'Full Name is required');
    return;
  }
  
  // Validate email or phone based on registration method
  if (registrationMethod === 'email') {
    if (!newMemberData.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }
    if (!newMemberData.password || newMemberData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
  } else {
    if (!newMemberData.phone.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return;
    }
    if (!newMemberData.password || newMemberData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
  }

  setSavingMember(true);
  try {
    const auth = getAuthInstance();
    let userCredential;
    
    if (registrationMethod === 'email') {
      // Create with email and password
      userCredential = await createUserWithEmailAndPassword(
        auth,
        newMemberData.email.trim(),
        newMemberData.password
      );
    } else {
      // Create with phone and password
      // Note: Firebase Auth requires phone number with country code
      const phoneNumber = `+91${newMemberData.phone.trim()}`;
      userCredential = await createUserWithEmailAndPassword(
        auth,
        `${phoneNumber}@phone.auth`, // Firebase needs email format for phone auth
        newMemberData.password
      );
    }
    
    const userId = userCredential.user.uid;

    // Get level details for commission rates
    const selectedLevel = dynamicLevels.find(l => l.id === newMemberData.level) || { directCommission: 25, secondaryCommission: 10 };

    // Save user data to Firestore
    const userData = {
      fullName: newMemberData.fullName.trim(),
      email: registrationMethod === 'email' ? newMemberData.email.trim().toLowerCase() : '',
      phone: newMemberData.phone.trim(),
      address: newMemberData.address.trim(),
      village: newMemberData.village,
      postOffice: newMemberData.postOffice,
      thana: newMemberData.thana,
      district: newMemberData.district,
      state: newMemberData.state,
      pinCode: newMemberData.pinCode,
      gender: newMemberData.gender,
      dob: newMemberData.dob,
      aadharNumber: newMemberData.aadharNumber,
      level: newMemberData.level,
      directCommission: selectedLevel.directCommission || 25,
      secondaryCommission: selectedLevel.secondaryCommission || 10,
      role: 'working',
      status: 'active',
      profilePhoto: newMemberData.profilePhoto || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      directReferrals: [],
      registeredBy: auth.currentUser?.uid || 'admin',
      promotionPending: false,
      walletCreated: false,
      // ✅ Add parent relationship
      parentId: parentMemberId || null,
      parentName: parentMemberName || null,
      registrationMethod: registrationMethod,
    };

    await setDoc(doc(db, 'users', userId), userData);

    // ✅ Update parent's children list
    if (parentMemberId) {
      try {
        const parentRef = doc(db, 'users', parentMemberId);
        const parentDoc = await getDoc(parentRef);
        if (parentDoc.exists()) {
          const parentData = parentDoc.data();
          const currentChildren = parentData.childrenIds || [];
          await updateDoc(parentRef, {
            childrenIds: [...currentChildren, userId],
            updatedAt: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error updating parent children:', error);
      }
    }

    // Create wallet
    await setDoc(doc(db, 'wallets', userId), {
      balance: 0,
      totalEarned: 0,
      pendingCommission: 0,
      totalWithdrawn: 0,
      pendingWithdrawals: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    Alert.alert(
      'Success',
      `Working member "${newMemberData.fullName}" added successfully!${parentMemberName ? `\nAttached to: ${parentMemberName}` : ''}`
    );
    
    setAddMemberModalVisible(false);
    setParentMemberId(null);
    setParentMemberName('');
    resetNewMemberForm();
    onRefresh();
    
  } catch (error) {
    console.error('Error adding working member:', error);
    let errorMessage = 'Failed to add working member';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Email already registered. Please use a different email.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email format.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak. Use at least 6 characters.';
    } else if (error.code === 'auth/phone-number-already-exists') {
      errorMessage = 'Phone number already registered.';
    }
    Alert.alert('Error', errorMessage);
  } finally {
    setSavingMember(false);
  }
};
const resetNewMemberForm = () => {
  setNewMemberData({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    village: '',
    postOffice: '',
    thana: '',
    district: '',
    state: '',
    pinCode: '',
    gender: '',
    dob: '',
    aadharNumber: '',
    level: 'I',
    status: 'active',
    role: 'working',
    profilePhoto: null,
    parentId: '',
  });
  setParentMemberId(null);
  setParentMemberName('');
  setSearchParent('');
};

  const setupRealtimeListener = () => {
    const q = query(
      collection(db, 'users'), 
      where('role', 'in', ['working', 'workingMember'])
    );
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const membersList = [];
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const member = { id: doc.id, ...data };
        
        const level = data.level || 'I';
        const levelDetails = getLevelDetails(level);
        member.levelTitle = levelDetails.title;
        member.levelColor = levelDetails.color;
        member.levelBadge = levelDetails.badge;
        member.directCommission = levelDetails.directCommission;
        member.secondaryCommission = levelDetails.secondaryCommission;
        
        const directReferrals = data.directReferrals || [];
        member.directReferralCount = directReferrals.length;
        member.directReferrals = directReferrals;
        
        const registeredQuery = query(
          collection(db, 'users'), 
          where('registeredBy', '==', doc.id)
        );
        const registeredSnap = await getDocs(registeredQuery);
        member.registeredMembers = registeredSnap.size;
        member.registeredMembersList = [];
        registeredSnap.forEach((regDoc) => {
          member.registeredMembersList.push({ id: regDoc.id, ...regDoc.data() });
        });

        try {
          const wallet = await WalletService.getOrCreateWallet(doc.id);
          member.walletBalance = wallet.balance || 0;
          member.totalEarned = wallet.totalEarned || 0;
          member.pendingCommission = wallet.pendingCommission || 0;
        } catch (error) {
          console.error('Error fetching wallet:', error);
          member.walletBalance = 0;
          member.totalEarned = 0;
          member.pendingCommission = 0;
        }

        try {
          const totalDonations = await CommissionService.getTotalDonationsByMember(doc.id);
          member.totalDonations = totalDonations;
        } catch (error) {
          member.totalDonations = 0;
        }

        const levelsToUse = dynamicLevels || getDefaultLevels();
        const currentLevelIndex = levelsToUse.findIndex(l => l.id === level);
        const currentLevelData = currentLevelIndex !== -1 ? levelsToUse[currentLevelIndex] : null;
        
        if (currentLevelData) {
          const donationsRequired = currentLevelData.donationsRequiredForPromotion || 0;
          const isEligible = member.totalDonations >= donationsRequired && donationsRequired > 0;
          member.promotionEligible = isEligible;
          member.membersNeededForPromotion = Math.max(0, donationsRequired - member.totalDonations);
          member.donationsRequired = donationsRequired;
        } else {
          member.promotionEligible = false;
          member.membersNeededForPromotion = 0;
          member.donationsRequired = 0;
        }

        const nextLevelId = getNextLevelId(level);
        member.nextLevel = nextLevelId;
        if (nextLevelId) {
          const nextLevel = getLevelDetails(nextLevelId);
          member.nextLevelTitle = nextLevel.title;
        }

        member.promotionPending = data.promotionPending || false;
        
        const commissionQuery = query(
          collection(db, 'walletTransactions'),
          where('userId', '==', doc.id),
          where('type', 'in', ['direct_commission', 'secondary_commission']),
          orderBy('createdAt', 'desc')
        );
        const commissionSnap = await getDocs(commissionQuery);
        const history = [];
        commissionSnap.forEach((cDoc) => {
          history.push({ id: cDoc.id, ...cDoc.data() });
        });
        member.commissionHistory = history;

        membersList.push(member);
      }
      
      membersList.sort((a, b) => (b.totalEarned || 0) - (a.totalEarned || 0));
      
      setWorkingMembers(membersList);
      applyFilters(membersList, search, filterStatus, filterLevel);
      setLoading(false);
    });

    return () => unsubscribe();
  };

  const getDefaultLevels = () => {
    return [
      { id: 'I', name: 'Customer', directCommission: 25, secondaryCommission: 10, donationsRequiredForPromotion: 10000 },
      { id: 'II', name: 'Executive', directCommission: 35, secondaryCommission: 5, donationsRequiredForPromotion: 25000 },
      { id: 'III', name: 'Manager', directCommission: 40, secondaryCommission: 2.5, donationsRequiredForPromotion: 50000 },
      { id: 'IV', name: 'Coordinator', directCommission: 42.5, secondaryCommission: 1.25, donationsRequiredForPromotion: 100000 },
      { id: 'V', name: 'Guide', directCommission: 43.75, secondaryCommission: 1.25, donationsRequiredForPromotion: 250000 },
      { id: 'VI', name: 'Leader', directCommission: 44.5, secondaryCommission: 0.75, donationsRequiredForPromotion: 500000 },
      { id: 'VII', name: 'Crown', directCommission: 45, secondaryCommission: 0.50, donationsRequiredForPromotion: Infinity }
    ];
  };

  const getNextLevelId = (currentLevelId) => {
    const levels = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
    const currentIndex = levels.indexOf(currentLevelId);
    if (currentIndex < levels.length - 1) {
      return levels[currentIndex + 1];
    }
    return null;
  };

  const applyFilters = (data, searchText, status, level) => {
  let filtered = data;

  if (searchText) {
    filtered = filtered.filter(member =>
      member.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      member.levelTitle?.toLowerCase().includes(searchText.toLowerCase())
    );
  }

  if (status !== 'all') {
    filtered = filtered.filter(member => member.status === status);
  }

  // ✅ Filter by level name (dynamic)
  if (level !== 'All') {
    filtered = filtered.filter(member => {
      // Get the level name from dynamic levels or fallback
      const levelName = getLevelLabel(member.level);
      return levelName.toLowerCase() === level.toLowerCase();
    });
  }

  setFilteredMembers(filtered);
};

  const handleSearch = (text) => {
    setSearch(text);
    applyFilters(workingMembers, text, filterStatus, filterLevel);
  };

  const handleFilterStatus = (status) => {
    setFilterStatus(status);
    applyFilters(workingMembers, search, status, filterLevel);
  };

  const handleFilterLevel = (levelName) => {
  setFilterLevel(levelName);
  applyFilters(workingMembers, search, filterStatus, levelName);
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

  const handlePromotion = async () => {
  if (!promotionData.memberId || !promotionData.newLevel) {
    Alert.alert(translations.error, 'Please select a level');
    return;
  }

  try {
    const auth = getAuthInstance(); // ✅ Moved OUTSIDE the object
    
    const memberRef = doc(db, 'users', promotionData.memberId);
    
    await runTransaction(db, async (transaction) => {
      const memberDoc = await transaction.get(memberRef);
      if (!memberDoc.exists()) {
        throw new Error('Member not found');
      }

      transaction.update(memberRef, {
        level: promotionData.newLevel,
        promotionPending: false,
        promotionDate: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      const promotionRef = doc(collection(db, 'promotions'));
      transaction.set(promotionRef, {
        memberId: promotionData.memberId,
        memberName: promotionData.memberName,
        fromLevel: promotionData.currentLevel,
        toLevel: promotionData.newLevel,
        date: Timestamp.now(),
        approvedBy: auth.currentUser?.uid,        // ✅ Now works
        approvedByName: auth.currentUser?.displayName || 'Admin'  // ✅ Now works
      });
    });

    const levelDetails = getLevelDetails(promotionData.newLevel);
    Alert.alert(translations.success, translations.promotionSuccess
      .replace('{name}', promotionData.memberName)
      .replace('{level}', levelDetails?.title || promotionData.newLevel));
    setPromotionModalVisible(false);
    onRefresh();
  } catch (error) {
    Alert.alert(translations.error, error.message);
  }
};

  const handleAddCommission = async () => {
    if (!commissionData.memberId || !commissionData.amount) {
      Alert.alert(translations.error, 'Please select a member and enter amount');
      return;
    }

    try {
      const amount = parseFloat(commissionData.amount);
      const memberRef = doc(db, 'users', commissionData.memberId);
      const memberDoc = await getDoc(memberRef);
      const memberData = memberDoc.data();

      await WalletService.addCommission(
        commissionData.memberId,
        amount,
        commissionData.type === 'direct' ? 'direct_commission' : 'secondary_commission',
        commissionData.description || `${commissionData.type} commission payment`,
        `admin_${Date.now()}`
      );

      Alert.alert(translations.success, translations.commissionAdded
        .replace('{amount}', commissionData.amount)
        .replace('{name}', commissionData.memberName));
      setCommissionModalVisible(false);
      resetCommissionForm();
      onRefresh();
    } catch (error) {
      Alert.alert(translations.error, error.message);
    }
  };

  const viewCommissionHistory = async (member) => {
    setSelectedMember(member);
    try {
      const q = query(
        collection(db, 'walletTransactions'),
        where('userId', '==', member.id),
        where('type', 'in', ['direct_commission', 'secondary_commission']),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const history = [];
      snapshot.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() });
      });
      setCommissionHistory(history);
      setCommissionHistoryModalVisible(true);
    } catch (error) {
      Alert.alert(translations.error, error.message);
    }
  };

  const viewWallet = async (member) => {
    try {
      const wallet = await WalletService.getOrCreateWallet(member.id);
      setSelectedWallet({
        ...wallet,
        memberName: member.fullName || member.name,
        memberId: member.id
      });
      setWalletModalVisible(true);
    } catch (error) {
      Alert.alert(translations.error, error.message);
    }
  };

  const resetCommissionForm = () => {
    setCommissionData({
      memberId: '',
      memberName: '',
      amount: '',
      type: 'direct',
      description: '',
      status: 'pending'
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDynamicLevels();
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getFilterCount = (levelName) => {
  if (levelName === 'All') return workingMembers.length;
  return workingMembers.filter(m => {
    const memberLevelName = getLevelLabel(m.level);
    return memberLevelName.toLowerCase() === levelName.toLowerCase();
  }).length;
};

  const getStatusCount = (status) => {
    if (status === 'all') return workingMembers.length;
    return workingMembers.filter(m => m.status === status).length;
  };

  const getLevelColor = (levelId) => {
    const details = getLevelDetails(levelId);
    return details.color || '#6b7280';
  };

  const getLevelIcon = (levelId) => {
    const icons = {
      'I': 'grade',
      'II': 'star-half',
      'III': 'star',
      'IV': 'stars',
      'V': 'military-tech',
      'VI': 'workspace-premium',
      'VII': 'emoji-events'
    };
    return icons[levelId] || 'circle';
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

  const getLevelLabel = (levelId) => {
  // First check dynamic levels from Firestore
  if (dynamicLevels && dynamicLevels.length > 0) {
    const dynamicLevel = dynamicLevels.find(l => l.id === levelId);
    if (dynamicLevel) {
      return dynamicLevel.name || levelId;
    }
  }
  // Fallback to hardcoded levels
  const details = getLevelDetails(levelId);
  return details?.title || levelId;
};

  const StatCard = ({ label, count, icon, color, active, onPress }) => (
  <TouchableOpacity 
    style={[styles.statCard, active && styles.statCardActive]} 
    onPress={onPress}
  >
    <Text style={styles.statType}>{label}</Text>
    <Text style={[styles.statCount, { color }]}>{count}</Text>
  </TouchableOpacity>
);

  const StatusFilterChip = ({ label, count, active, onPress }) => (
    <TouchableOpacity
      style={[styles.statusChip, active && styles.activeStatusChip]}
      onPress={onPress}
    >
      <Text style={[
        styles.statusChipText, 
        active && styles.activeStatusChipText,
        { fontSize: isSmallDevice ? 9 : 11 }
      ]}>
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

  const WorkingMemberCard = ({ member }) => {
    const levelColor = getLevelColor(member.level);
    const levelIcon = getLevelIcon(member.level);
    const statusColor = getStatusColor(member.status);
    const levelDetails = getLevelDetails(member.level);
    const statusLabel = getStatusLabel(member.status);
    const levelLabel = getLevelLabel(member.level);

    return (
      <TouchableOpacity 
        style={styles.memberCard}
        onPress={() => {
          setSelectedMember(member);
          setDetailModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.memberInfo}>
            <View style={styles.avatarContainer}>
              {member.profilePhoto ? (
                <Image source={{ uri: member.profilePhoto }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={[styles.avatarText, { fontSize: isSmallDevice ? 16 : 18 }]}>
                    {member.fullName?.charAt(0) || '?'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.memberTextInfo}>
              <Text style={[styles.memberName, { fontSize: isSmallDevice ? 13 : 14 }]} numberOfLines={1}>
                {member.fullName || 'Unknown'}
              </Text>
              <Text style={[styles.memberEmail, { fontSize: isSmallDevice ? 10 : 12 }]} numberOfLines={1}>
                {member.email}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor, fontSize: isSmallDevice ? 9 : 10 }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        <View style={styles.cardStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { fontSize: isSmallDevice ? 14 : 16 }]}>
              {member.directReferralCount || 0}
            </Text>
            <Text style={[styles.statLabel, { fontSize: isSmallDevice ? 9 : 10 }]}>{translations.direct}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { fontSize: isSmallDevice ? 14 : 16 }]}>
              ₹{member.totalEarned?.toLocaleString() || 0}
            </Text>
            <Text style={[styles.statLabel, { fontSize: isSmallDevice ? 9 : 10 }]}>{translations.earned}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { fontSize: isSmallDevice ? 14 : 16 }]}>
              ₹{member.pendingCommission?.toLocaleString() || 0}
            </Text>
            <Text style={[styles.statLabel, { fontSize: isSmallDevice ? 9 : 10 }]}>{translations.pendingCommission}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { fontSize: isSmallDevice ? 14 : 16, color: '#f59e0b' }]}>
              ₹{member.totalDonations?.toLocaleString() || 0}
            </Text>
            <Text style={[styles.statLabel, { fontSize: isSmallDevice ? 9 : 10 }]}>{translations.donations}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.levelBadge, { backgroundColor: levelColor + '15' }]}>
            <MaterialIcons name={levelIcon} size={isSmallDevice ? 10 : 14} color={levelColor} />
            <Text style={[styles.levelBadgeText, { color: levelColor, fontSize: isSmallDevice ? 9 : 11 }]}>
              {levelLabel.substring(0, isSmallDevice ? 4 : 6)}
            </Text>
          </View>
          <View style={styles.commissionInfo}>
            <Text style={[styles.commissionRateText, { fontSize: isSmallDevice ? 9 : 10 }]}>
              {member.directCommission || 0}%/{member.secondaryCommission || 0}%
            </Text>
          </View>
          {member.promotionEligible && (
            <View style={styles.promotionBadge}>
              <MaterialIcons name="stars" size={isSmallDevice ? 8 : 12} color="#10b981" />
              <Text style={[styles.promotionText, { fontSize: isSmallDevice ? 8 : 10 }]}>{translations.eligible}</Text>
            </View>
          )}
          {member.nextLevel && (
            <View style={styles.nextLevelBadge}>
              <Text style={[styles.nextLevelText, { fontSize: isSmallDevice ? 8 : 10 }]}>
                → {getLevelLabel(member.nextLevel).substring(0, isSmallDevice ? 3 : 4)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.commissionButton]}
            onPress={() => {
              setCommissionData({
                memberId: member.id,
                memberName: member.fullName || member.name || 'Unknown',
                amount: '',
                type: 'direct',
                description: '',
                status: 'pending'
              });
              setCommissionModalVisible(true);
            }}
          >
            <MaterialIcons name="attach-money" size={isSmallDevice ? 10 : 14} color="#ffffff" />
            <Text style={[styles.actionButtonText, { fontSize: isSmallDevice ? 7 : 9 }]}>{translations.add}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.historyButton]}
            onPress={() => viewCommissionHistory(member)}
          >
            <MaterialIcons name="history" size={isSmallDevice ? 10 : 14} color="#ffffff" />
            <Text style={[styles.actionButtonText, { fontSize: isSmallDevice ? 7 : 9 }]}>{translations.history}</Text>
          </TouchableOpacity>
<TouchableOpacity 
  style={[styles.actionButton, styles.referralButton]}
  onPress={() => {
    setSelectedMemberForReferral(member);
    setReferralCode(member.referralCode || ''); // ✅ Load existing code
    setReferralModalVisible(true);
  }}
  activeOpacity={0.7}
>
  <MaterialIcons name="share" size={isSmallDevice ? 10 : 14} color="#ffffff" />
  <Text style={[styles.actionButtonText, { fontSize: isSmallDevice ? 7 : 9 }]}>Referral</Text>
</TouchableOpacity>
{/* Add this button in the cardActions section */}
<TouchableOpacity 
  style={[styles.actionButton, styles.assignButton]}
  onPress={() => {
    setSelectedMemberForAssign(member);
    fetchAvailableSubMembers(member.level);
    setSelectedSubMemberId(null);
    setSelectedSubMemberName('');
    setAssignModalVisible(true);
  }}
>
  <MaterialIcons name="group-add" size={isSmallDevice ? 10 : 14} color="#ffffff" />
  <Text style={[styles.actionButtonText, { fontSize: isSmallDevice ? 7 : 9 }]}>Assign</Text>
</TouchableOpacity>
<TouchableOpacity 
  style={[styles.actionButton, styles.downloadButton]}
  onPress={() => openDownloadModal(member)}
  activeOpacity={0.7}
>


  <MaterialIcons name="download" size={isSmallDevice ? 10 : 14} color="#ffffff" />
  <Text style={[styles.actionButtonText, { fontSize: isSmallDevice ? 7 : 9 }]}>Download</Text>
</TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.walletButton]}
            onPress={() => viewWallet(member)}
          >
            <MaterialIcons name="account-balance-wallet" size={isSmallDevice ? 10 : 14} color="#ffffff" />
            <Text style={[styles.actionButtonText, { fontSize: isSmallDevice ? 7 : 9 }]}>{translations.wallet}</Text>
          </TouchableOpacity>
          {member.promotionEligible && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.promoteButton]}
              onPress={() => {
                const nextLevelId = getNextLevelId(member.level);
                setPromotionData({
                  memberId: member.id,
                  memberName: member.fullName,
                  currentLevel: member.level,
                  newLevel: nextLevelId || member.level,
                  commissionRate: ''
                });
                setPromotionModalVisible(true);
              }}
            >
              <MaterialIcons name="stars" size={isSmallDevice ? 10 : 14} color="#ffffff" />
              <Text style={[styles.actionButtonText, { fontSize: isSmallDevice ? 7 : 9 }]}>{translations.promote}</Text>
            </TouchableOpacity>
          )}
          {member.status !== 'active' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleStatusUpdate(member.id, 'active')}
            >
              <MaterialIcons name="check-circle" size={isSmallDevice ? 10 : 14} color="#ffffff" />
              <Text style={[styles.actionButtonText, { fontSize: isSmallDevice ? 7 : 9 }]}>{translations.approve}</Text>
            </TouchableOpacity>
          )}
          {member.status === 'active' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.suspendButton]}
              onPress={() => handleStatusUpdate(member.id, 'suspended')}
            >
              <MaterialIcons name="block" size={isSmallDevice ? 10 : 14} color="#ffffff" />
              <Text style={[styles.actionButtonText, { fontSize: isSmallDevice ? 7 : 9 }]}>{translations.suspend}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => {
              setSelectedMember(member);
              setDetailModalVisible(true);
            }}
          >
            <MaterialIcons name="visibility" size={isSmallDevice ? 10 : 14} color="#ffffff" />
            <Text style={[styles.actionButtonText, { fontSize: isSmallDevice ? 7 : 9 }]}>{translations.view}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const WalletModal = () => {
    if (!selectedWallet) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={walletModalVisible}
        onRequestClose={() => setWalletModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { fontSize: isSmallDevice ? 16 : 18 }]}>{translations.walletDetails}</Text>
              <TouchableOpacity onPress={() => setWalletModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.walletSummary}>
              <Text style={[styles.walletMemberName, { fontSize: isSmallDevice ? 16 : 18 }]}>
                {selectedWallet.memberName}
              </Text>
              <View style={styles.walletBalanceContainer}>
                <Text style={[styles.walletBalanceLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>
                  {translations.availableBalance}
                </Text>
                <Text style={[styles.walletBalance, { fontSize: isSmallDevice ? 28 : 32 }]}>
                  ₹{selectedWallet.balance?.toLocaleString() || 0}
                </Text>
              </View>
              <View style={styles.walletStats}>
                <View style={styles.walletStat}>
                  <Text style={[styles.walletStatValue, { fontSize: isSmallDevice ? 14 : 16 }]}>
                    ₹{selectedWallet.totalEarned?.toLocaleString() || 0}
                  </Text>
                  <Text style={[styles.walletStatLabel, { fontSize: isSmallDevice ? 9 : 11 }]}>{translations.earned}</Text>
                </View>
                <View style={styles.walletStat}>
                  <Text style={[styles.walletStatValue, { fontSize: isSmallDevice ? 14 : 16 }]}>
                    ₹{selectedWallet.pendingCommission?.toLocaleString() || 0}
                  </Text>
                  <Text style={[styles.walletStatLabel, { fontSize: isSmallDevice ? 9 : 11 }]}>{translations.pendingCommission}</Text>
                </View>
                <View style={styles.walletStat}>
                  <Text style={[styles.walletStatValue, { fontSize: isSmallDevice ? 14 : 16 }]}>
                    ₹{selectedWallet.totalWithdrawn?.toLocaleString() || 0}
                  </Text>
                  <Text style={[styles.walletStatLabel, { fontSize: isSmallDevice ? 9 : 11 }]}>{translations.withdrawn}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setWalletModalVisible(false)}
            >
              <Text style={[styles.closeButtonText, { fontSize: isSmallDevice ? 13 : 14 }]}>{translations.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer} key={renderKey}>
        <ActivityIndicator size="large" color="#FF7722" />
        <Text style={[styles.loadingText, { fontSize: isSmallDevice ? 13 : 14 }]}>{translations.loadingWorkingMembers}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']} key={renderKey}>
      <View style={styles.container}>
        {/* Saffron Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { fontSize: isSmallDevice ? 18 : 20 }]}>{translations.workingMembers}</Text>
<View style={styles.headerRight}>
  <TouchableOpacity 
    style={styles.addButton}
    onPress={() => {
      resetNewMemberForm();
      setParentMemberId(null);
      setParentMemberName('');
      setSearchParent('');
      setRegistrationMethod('email');
      // Show registration method selection first
      setShowRegistrationMethodModal(true);
      // Pre-fetch parents for default level
      fetchAvailableParents('I');
    }}
  >
    <MaterialIcons name="add" size={24} color="#ffffff" />
  </TouchableOpacity>
</View>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={onRefresh}
            >
              <MaterialIcons name="refresh" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#9ca3af" />
            <TextInput
              style={[styles.searchInput, { fontSize: isSmallDevice ? 13 : 14 }]}
              placeholder={translations.searchWorkingMembers}
              placeholderTextColor="#9ca3af"
              value={search}
              onChangeText={handleSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <MaterialIcons name="close" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.statusFilterWrapper}>
  <ScrollView 
    horizontal 
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.statusFilterScrollContent}
    style={{ flexGrow: 0 }}
  >
    <StatusFilterChip
      label={translations.all}
      count={getStatusCount('all')}
      active={filterStatus === 'all'}
      onPress={() => handleFilterStatus('all')}
    />
    <StatusFilterChip
      label={translations.active}
      count={getStatusCount('active')}
      active={filterStatus === 'active'}
      onPress={() => handleFilterStatus('active')}
    />
    <StatusFilterChip
      label={translations.pending}
      count={getStatusCount('pending')}
      active={filterStatus === 'pending'}
      onPress={() => handleFilterStatus('pending')}
    />
    <StatusFilterChip
      label={translations.suspended}
      count={getStatusCount('suspended')}
      active={filterStatus === 'suspended'}
      onPress={() => handleFilterStatus('suspended')}
    />
  </ScrollView>
</View>

          <View style={styles.statsWrapper}>
  <ScrollView 
    horizontal 
    showsHorizontalScrollIndicator={false} 
    contentContainerStyle={styles.statsScrollContent}
    style={{ flexGrow: 0 }}
  >
    <StatCard 
      label={translations.all} 
      count={workingMembers.length} 
      icon="people" 
      color="#ffffff" 
      active={filterLevel === 'All'}
      onPress={() => handleFilterLevel('All')}
    />
    
    {dynamicLevels.length > 0 ? (
      dynamicLevels.map((level) => {
        const count = workingMembers.filter(m => m.level === level.id).length;
        const levelName = level.name || level.id;
        return (
          <StatCard 
            key={level.id}
            label={levelName}
            count={count}
            icon="star" 
            color="#ffffff"
            active={filterLevel === levelName}
            onPress={() => handleFilterLevel(levelName)}
          />
        );
      })
    ) : (
      // Fallback to default levels if dynamic levels not loaded
      ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'].map((key) => {
        const level = getLevelDetails(key);
        const count = workingMembers.filter(m => m.level === key).length;
        return (
          <StatCard 
            key={key}
            label={level.title}
            count={count}
            icon="star" 
            color="#ffffff"
            active={filterLevel === level.title}
            onPress={() => handleFilterLevel(level.title)}
          />
        );
      })
    )}
  </ScrollView>
</View>
        </View>

        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <WorkingMemberCard member={item} />}
          showsVerticalScrollIndicator={true}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF7722']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="work" size={44} color="#D1D5DB" />
              <Text style={[styles.emptyStateText, { fontSize: isSmallDevice ? 15 : 16 }]}>
                {translations.noWorkingMembers}
              </Text>
              <Text style={[styles.emptyStateSubtext, { fontSize: isSmallDevice ? 12 : 13 }]}>
                {translations.noWorkingMembersSubtext}
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          style={styles.flatList}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        />
{/* Referral Code Modal */}
<Modal
  animationType="slide"
  transparent={true}
  visible={referralModalVisible}
  onRequestClose={() => {
    setReferralModalVisible(false);
    setSelectedMemberForReferral(null);
  }}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text style={[styles.modalTitle, { fontSize: isSmallDevice ? 16 : 18 }]}>
          Referral Code
        </Text>
        <TouchableOpacity onPress={() => {
          setReferralModalVisible(false);
          setSelectedMemberForReferral(null);
        }}>
          <MaterialIcons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {selectedMemberForReferral && (
        <>
          <View style={styles.referralMemberInfo}>
            <Text style={[styles.referralMemberName, { fontSize: isSmallDevice ? 16 : 18 }]}>
              {selectedMemberForReferral.fullName}
            </Text>
            <Text style={[styles.referralMemberLevel, { fontSize: isSmallDevice ? 12 : 14 }]}>
              Level: {getLevelLabel(selectedMemberForReferral.level)}
            </Text>
          </View>

          <View style={styles.referralCodeContainer}>
            {referralCode ? (
              <>
                <Text style={[styles.referralCodeLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>
                  Your Referral Code
                </Text>
                <View style={styles.referralCodeDisplay}>
                  <Text style={[styles.referralCodeText, { fontSize: isSmallDevice ? 20 : 24 }]}>
                    {referralCode}
                  </Text>
                </View>
                <Text style={[styles.referralCodeNote, { fontSize: isSmallDevice ? 10 : 12 }]}>
                  Share this code with new members to earn commissions
                </Text>
                <TouchableOpacity 
                  style={styles.referralShareButton}
                  onPress={() => {
                    const message = `Join Kabir Sat Dharam Foundation using my referral code: ${referralCode}\n\nDownload the app to get started!`;
                    Alert.alert('Share Code', message);
                  }}
                >
                  <MaterialIcons name="share" size={20} color="#ffffff" />
                  <Text style={[styles.referralShareText, { fontSize: isSmallDevice ? 14 : 16 }]}>
                    Share Code
                  </Text>
                </TouchableOpacity>
                {/* ✅ Add Regenerate button */}
                <TouchableOpacity 
                  style={[styles.referralRegenerateButton, generatingReferral && { opacity: 0.6 }]}
                  onPress={handleGenerateReferral}
                  disabled={generatingReferral}
                >
                  {generatingReferral ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <MaterialIcons name="refresh" size={18} color="#ffffff" />
                      <Text style={[styles.referralGenerateText, { fontSize: isSmallDevice ? 12 : 14 }]}>
                        Generate New Code
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.referralNoCodeText, { fontSize: isSmallDevice ? 14 : 16 }]}>
                  No referral code generated yet
                </Text>
                <Text style={[styles.referralNoCodeSubtext, { fontSize: isSmallDevice ? 12 : 13 }]}>
                  Generate a unique referral code for this member
                </Text>
                <TouchableOpacity 
                  style={[styles.referralGenerateButton, generatingReferral && { opacity: 0.6 }]}
                  onPress={handleGenerateReferral}
                  disabled={generatingReferral}
                >
                  {generatingReferral ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <MaterialIcons name="refresh" size={20} color="#ffffff" />
                      <Text style={[styles.referralGenerateText, { fontSize: isSmallDevice ? 14 : 16 }]}>
                        Generate Referral Code
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => {
              setReferralModalVisible(false);
              setSelectedMemberForReferral(null);
            }}
          >
            <Text style={[styles.closeButtonText, { fontSize: isSmallDevice ? 13 : 14 }]}>Close</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  </View>
</Modal>
{/* Assign Member Modal */}
<Modal
  animationType="slide"
  transparent={true}
  visible={assignModalVisible}
  onRequestClose={() => {
    setAssignModalVisible(false);
    setSelectedMemberForAssign(null);
    setSelectedSubMemberId(null);
    setSelectedSubMemberName('');
  }}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text style={[styles.modalTitle, { fontSize: isSmallDevice ? 16 : 18 }]}>
          Assign Member
        </Text>
        <TouchableOpacity onPress={() => {
          setAssignModalVisible(false);
          setSelectedMemberForAssign(null);
        }}>
          <MaterialIcons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {selectedMemberForAssign && (
        <>
          <View style={styles.assignParentInfo}>
            <Text style={styles.assignLabel}>Parent:</Text>
            <Text style={styles.assignParentName}>{selectedMemberForAssign.fullName}</Text>
            <Text style={styles.assignParentLevel}>
              Level: {getLevelLabel(selectedMemberForAssign.level)}
            </Text>
          </View>

          <View style={styles.assignDivider} />

          <Text style={styles.assignSubtitle}>
            Select a member to assign under {selectedMemberForAssign.fullName}
          </Text>

          <View style={styles.assignSearchContainer}>
            <TextInput
              style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14, flex: 1 }]}
              placeholder="Search member by name..."
              placeholderTextColor="#9ca3af"
              value={searchSubMember}
              onChangeText={setSearchSubMember}
            />
            <TouchableOpacity
              style={styles.parentSearchButton}
              onPress={() => {
                if (searchSubMember.trim()) {
                  const filtered = availableSubMembers.filter(m => 
                    m.fullName.toLowerCase().includes(searchSubMember.toLowerCase())
                  );
                  setAvailableSubMembers(filtered);
                } else {
                  fetchAvailableSubMembers(selectedMemberForAssign.level);
                }
              }}
            >
              <MaterialIcons name="search" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {availableSubMembers.length === 0 ? (
            <View style={styles.assignEmptyState}>
              <MaterialIcons name="people-outline" size={40} color="#d1d5db" />
              <Text style={styles.assignEmptyText}>
                No available members to assign
              </Text>
              <Text style={styles.assignEmptySubtext}>
                All members at lower levels are already assigned
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.assignListContainer}>
              {availableSubMembers.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.assignItem,
                    selectedSubMemberId === member.id && styles.assignItemActive
                  ]}
                  onPress={() => {
                    setSelectedSubMemberId(member.id);
                    setSelectedSubMemberName(member.fullName);
                  }}
                >
                  <View style={styles.assignItemLeft}>
                    <View style={styles.assignItemAvatar}>
                      <Text style={styles.assignItemAvatarText}>
                        {member.fullName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.assignItemName}>{member.fullName}</Text>
                      <Text style={styles.assignItemLevel}>
                        Level: {member.levelName}
                      </Text>
                    </View>
                  </View>
                  {selectedSubMemberId === member.id && (
                    <MaterialIcons name="check-circle" size={24} color="#10b981" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {selectedSubMemberId && (
            <View style={styles.assignSelectedContainer}>
              <MaterialIcons name="link" size={16} color="#10b981" />
              <Text style={styles.assignSelectedText}>
                Assigning: {selectedSubMemberName}
              </Text>
            </View>
          )}

          <View style={styles.assignActions}>
            <TouchableOpacity
              style={[styles.assignButton, styles.assignCancelButton]}
              onPress={() => {
                setAssignModalVisible(false);
                setSelectedMemberForAssign(null);
                setSelectedSubMemberId(null);
                setSelectedSubMemberName('');
              }}
            >
              <Text style={styles.assignCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.assignButton, 
                styles.assignConfirmButton,
                (!selectedSubMemberId || savingMember) && { opacity: 0.6 }
              ]}
              onPress={handleAssignMember}
              disabled={!selectedSubMemberId || savingMember}
            >
              {savingMember ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <MaterialIcons name="check" size={20} color="#ffffff" />
                  <Text style={styles.assignConfirmText}>Assign</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  </View>
</Modal>
{/* Registration Method Selection Modal */}
<Modal
  animationType="slide"
  transparent={true}
  visible={showRegistrationMethodModal}
  onRequestClose={() => setShowRegistrationMethodModal(false)}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text style={[styles.modalTitle, { fontSize: isSmallDevice ? 16 : 18 }]}>
          Registration Method
        </Text>
        <TouchableOpacity onPress={() => setShowRegistrationMethodModal(false)}>
          <MaterialIcons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <Text style={[styles.modalSubText, { fontSize: isSmallDevice ? 12 : 13 }]}>
        Choose how you want to register this working member
      </Text>

      <TouchableOpacity 
        style={[styles.methodCard, registrationMethod === 'email' && styles.methodCardActive]}
        onPress={() => {
          setRegistrationMethod('email');
          setShowRegistrationMethodModal(false);
          setAddMemberModalVisible(true);
          // Reset form
          resetNewMemberForm();
          // Fetch parents for initial level
          fetchAvailableParents(newMemberData.level || 'I');
        }}
      >
        <View style={[styles.methodIcon, { backgroundColor: registrationMethod === 'email' ? '#FF7722' : '#e5e7eb' }]}>
          <MaterialIcons name="email" size={24} color={registrationMethod === 'email' ? '#ffffff' : '#6b7280'} />
        </View>
        <View style={styles.methodContent}>
          <Text style={[styles.methodTitle, registrationMethod === 'email' && styles.methodTitleActive]}>
            Email Registration
          </Text>
          <Text style={styles.methodDescription}>
            Register using email and password
          </Text>
        </View>
        {registrationMethod === 'email' && (
          <MaterialIcons name="check-circle" size={20} color="#FF7722" />
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.methodCard, registrationMethod === 'phone' && styles.methodCardActive]}
        onPress={() => {
          setRegistrationMethod('phone');
          setShowRegistrationMethodModal(false);
          setAddMemberModalVisible(true);
          // Reset form
          resetNewMemberForm();
          fetchAvailableParents(newMemberData.level || 'I');
        }}
      >
        <View style={[styles.methodIcon, { backgroundColor: registrationMethod === 'phone' ? '#10b981' : '#e5e7eb' }]}>
          <MaterialIcons name="phone" size={24} color={registrationMethod === 'phone' ? '#ffffff' : '#6b7280'} />
        </View>
        <View style={styles.methodContent}>
          <Text style={[styles.methodTitle, registrationMethod === 'phone' && styles.methodTitleActive]}>
            Phone Registration
          </Text>
          <Text style={styles.methodDescription}>
            Register using phone number and password
          </Text>
        </View>
        {registrationMethod === 'phone' && (
          <MaterialIcons name="check-circle" size={20} color="#10b981" />
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => setShowRegistrationMethodModal(false)}
      >
        <Text style={[styles.closeButtonText, { fontSize: isSmallDevice ? 13 : 14 }]}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
{/* Add Working Member Modal */}
<Modal
  animationType="slide"
  transparent={true}
  visible={addMemberModalVisible}
  onRequestClose={() => {
    setAddMemberModalVisible(false);
    resetNewMemberForm();
  }}
>
  <TouchableOpacity 
    style={styles.modalContainer} 
    activeOpacity={1} 
    onPress={() => {
      setAddMemberModalVisible(false);
      resetNewMemberForm();
    }}
  >
    <TouchableOpacity 
      style={styles.modalContent} 
      activeOpacity={1} 
      onPress={(e) => e.stopPropagation()}
    >
      <ScrollView 
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* Header with Orange Oval Save Button at Top Right */}
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { fontSize: isSmallDevice ? 16 : 18 }]}>
            Add Working Member
          </Text>
          {/* ✅ Orange Oval Save Button at Top Right */}
          <TouchableOpacity 
            style={[styles.modalSaveButton, savingMember && { opacity: 0.6 }]}
            onPress={handleAddWorkingMember}
            disabled={savingMember}
          >
            {savingMember ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.modalSaveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Personal Information */}
        <View style={styles.formSection}>
          <Text style={[styles.formSectionTitle, { fontSize: isSmallDevice ? 13 : 14 }]}>
            Personal Information
          </Text>
          
          <View style={styles.formField}>
            <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>Full Name *</Text>
            <TextInput
              style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
              value={newMemberData.fullName}
              onChangeText={(text) => setNewMemberData({...newMemberData, fullName: text})}
              placeholder="Enter full name"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.formField}>
            <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>Email *</Text>
            <TextInput
              style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
              value={newMemberData.email}
              onChangeText={(text) => setNewMemberData({...newMemberData, email: text})}
              placeholder="Enter email"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formField}>
            <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>Phone *</Text>
            <TextInput
              style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
              value={newMemberData.phone}
              onChangeText={(text) => setNewMemberData({...newMemberData, phone: text})}
              placeholder="Enter phone number"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>

          <View style={styles.formField}>
            <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>Password * (min 6 chars)</Text>
            <TextInput
              style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
              value={newMemberData.password}
              onChangeText={(text) => setNewMemberData({...newMemberData, password: text})}
              placeholder="Enter password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formField, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>Gender</Text>
              <TextInput
                style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                value={newMemberData.gender}
                onChangeText={(text) => setNewMemberData({...newMemberData, gender: text})}
                placeholder="Male/Female"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={[styles.formField, { flex: 1 }]}>
              <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>Date of Birth</Text>
              <TextInput
                style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                value={newMemberData.dob}
                onChangeText={(text) => setNewMemberData({...newMemberData, dob: text})}
                placeholder="DD/MM/YYYY"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>Aadhar Number</Text>
            <TextInput
              style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
              value={newMemberData.aadharNumber}
              onChangeText={(text) => setNewMemberData({...newMemberData, aadharNumber: text})}
              placeholder="Enter Aadhar number"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              maxLength={12}
            />
          </View>
        </View>

        {/* Address Information */}
        <View style={styles.formSection}>
          <Text style={[styles.formSectionTitle, { fontSize: isSmallDevice ? 13 : 14 }]}>
            Address Information
          </Text>

          <View style={styles.formField}>
            <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>Address</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea, { fontSize: isSmallDevice ? 13 : 14 }]}
              value={newMemberData.address}
              onChangeText={(text) => setNewMemberData({...newMemberData, address: text})}
              placeholder="Enter address"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formField, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>Village</Text>
              <TextInput
                style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                value={newMemberData.village}
                onChangeText={(text) => setNewMemberData({...newMemberData, village: text})}
                placeholder="Village"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={[styles.formField, { flex: 1 }]}>
              <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>Post Office</Text>
              <TextInput
                style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                value={newMemberData.postOffice}
                onChangeText={(text) => setNewMemberData({...newMemberData, postOffice: text})}
                placeholder="Post Office"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formField, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>Thana</Text>
              <TextInput
                style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                value={newMemberData.thana}
                onChangeText={(text) => setNewMemberData({...newMemberData, thana: text})}
                placeholder="Thana"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={[styles.formField, { flex: 1 }]}>
              <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>District</Text>
              <TextInput
                style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                value={newMemberData.district}
                onChangeText={(text) => setNewMemberData({...newMemberData, district: text})}
                placeholder="District"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formField, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>State</Text>
              <TextInput
                style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                value={newMemberData.state}
                onChangeText={(text) => setNewMemberData({...newMemberData, state: text})}
                placeholder="State"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={[styles.formField, { flex: 1 }]}>
              <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>PIN Code</Text>
              <TextInput
                style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                value={newMemberData.pinCode}
                onChangeText={(text) => setNewMemberData({...newMemberData, pinCode: text})}
                placeholder="PIN Code"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                maxLength={6}
              />
            </View>
          </View>
        </View>

        {/* Level Selection */ }
<View style={styles.formSection}>
  <Text style={[styles.formSectionTitle, { fontSize: isSmallDevice ? 13 : 14 }]}>
    Level Assignment
  </Text>

  <View style={styles.formField}>
    <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>Select Level *</Text>
    <View style={styles.levelOptionsGrid}>
      {dynamicLevels.length > 0 ? (
        dynamicLevels.map((level) => {
          const isSelected = newMemberData.level === level.id;
          const levelColor = getLevelColor(level.id);
          return (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.levelOption,
                isSelected && styles.levelOptionActive,
                { borderColor: isSelected ? levelColor : '#e5e7eb' }
              ]}
              onPress={() => {
                setNewMemberData({...newMemberData, level: level.id});
                // Fetch available parents for this level
                fetchAvailableParents(level.id);
                // Reset parent selection
                setParentMemberId(null);
                setParentMemberName('');
              }}
            >
              <MaterialIcons 
                name={getLevelIcon(level.id)} 
                size={isSmallDevice ? 10 : 14} 
                color={isSelected ? '#ffffff' : levelColor} 
              />
              <Text style={[
                styles.levelOptionText,
                isSelected && styles.levelOptionTextActive,
                { fontSize: isSmallDevice ? 9 : 10 }
              ]}>
                {level.id}
              </Text>
              <Text style={[
                styles.levelOptionSubText,
                isSelected && { color: '#ffffff' },
                { fontSize: isSmallDevice ? 7 : 8 }
              ]}>
                {level.directCommission}%/{level.secondaryCommission}%
              </Text>
            </TouchableOpacity>
          );
        })
      ) : (
        <Text style={[styles.emptyText, { fontSize: isSmallDevice ? 12 : 13 }]}>
          Loading levels...
        </Text>
      )}
    </View>
  </View>
  
  {/* Parent Selection - Only show if higher levels exist */}
  {availableParents.length > 0 && (
    <View style={styles.formField}>
      <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>
        Attach to Parent (Optional)
      </Text>
      <Text style={[styles.helperText, { fontSize: isSmallDevice ? 9 : 10 }]}>
        Select a higher-level member to attach this member under them
      </Text>
      
      <View style={styles.parentSearchContainer}>
        <TextInput
          style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14, flex: 1 }]}
          placeholder="Search parent by name..."
          placeholderTextColor="#9ca3af"
          value={searchParent}
          onChangeText={setSearchParent}
        />
        <TouchableOpacity
          style={styles.parentSearchButton}
          onPress={() => {
            if (searchParent.trim()) {
              const filtered = availableParents.filter(p => 
                p.fullName.toLowerCase().includes(searchParent.toLowerCase())
              );
              // Show filtered results in a dropdown or list
              setAvailableParents(filtered);
            } else {
              fetchAvailableParents(newMemberData.level);
            }
          }}
        >
          <MaterialIcons name="search" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.parentListContainer}
        contentContainerStyle={styles.parentListContent}
      >
        <TouchableOpacity
          style={[
            styles.parentChip,
            !parentMemberId && styles.parentChipActive
          ]}
          onPress={() => {
            setParentMemberId(null);
            setParentMemberName('');
          }}
        >
          <Text style={[styles.parentChipText, !parentMemberId && styles.parentChipTextActive]}>
            None
          </Text>
        </TouchableOpacity>
        
        {availableParents.map((parent) => (
          <TouchableOpacity
            key={parent.id}
            style={[
              styles.parentChip,
              parentMemberId === parent.id && styles.parentChipActive
            ]}
            onPress={() => {
              setParentMemberId(parent.id);
              setParentMemberName(parent.fullName);
            }}
          >
            <Text style={[
              styles.parentChipText,
              parentMemberId === parent.id && styles.parentChipTextActive
            ]}>
              {parent.fullName} ({parent.levelName})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {parentMemberId && parentMemberName && (
        <View style={styles.selectedParentContainer}>
          <MaterialIcons name="link" size={16} color="#10b981" />
          <Text style={styles.selectedParentText}>
            Attached to: {parentMemberName}
          </Text>
          <TouchableOpacity onPress={() => {
            setParentMemberId(null);
            setParentMemberName('');
          }}>
            <MaterialIcons name="close" size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  )}
</View>

        {/* ❌ REMOVED BOTTOM BUTTONS - No Cancel/Add buttons at bottom */}
      </ScrollView>
    </TouchableOpacity>
  </TouchableOpacity>
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
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { fontSize: isSmallDevice ? 16 : 18 }]}>
                  {translations.workingMemberDetails}
                </Text>
                <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {selectedMember && (
                <>
                  <View style={styles.detailProfile}>
                    {selectedMember.profilePhoto ? (
                      <Image source={{ uri: selectedMember.profilePhoto }} style={styles.detailAvatar} />
                    ) : (
                      <View style={styles.detailAvatarPlaceholder}>
                        <Text style={[styles.detailAvatarText, { fontSize: isSmallDevice ? 28 : 32 }]}>
                          {selectedMember.fullName?.charAt(0) || '?'}
                        </Text>
                      </View>
                    )}
                    <Text style={[styles.detailName, { fontSize: isSmallDevice ? 18 : 20 }]}>
                      {selectedMember.fullName}
                    </Text>
                    <Text style={[styles.detailEmail, { fontSize: isSmallDevice ? 12 : 14 }]}>
                      {selectedMember.email}
                    </Text>
                    <View style={[styles.detailLevelBadge, { backgroundColor: getLevelColor(selectedMember.level) + '15' }]}>
                      <MaterialIcons name={getLevelIcon(selectedMember.level)} size={14} color={getLevelColor(selectedMember.level)} />
                      <Text style={[styles.detailLevelText, { color: getLevelColor(selectedMember.level), fontSize: isSmallDevice ? 12 : 14 }]}>
                        {getLevelLabel(selectedMember.level).toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={[styles.detailSectionTitle, { fontSize: isSmallDevice ? 13 : 14 }]}>{translations.performance}</Text>
                    <View style={styles.detailStats}>
                      <View style={styles.detailStat}>
                        <Text style={[styles.detailStatValue, { fontSize: isSmallDevice ? 16 : 18 }]}>
                          {selectedMember.directReferralCount || 0}
                        </Text>
                        <Text style={[styles.detailStatLabel, { fontSize: isSmallDevice ? 10 : 11 }]}>{translations.direct}</Text>
                      </View>
                      <View style={styles.detailStat}>
                        <Text style={[styles.detailStatValue, { fontSize: isSmallDevice ? 16 : 18 }]}>
                          ₹{selectedMember.totalEarned?.toLocaleString() || 0}
                        </Text>
                        <Text style={[styles.detailStatLabel, { fontSize: isSmallDevice ? 10 : 11 }]}>{translations.earned}</Text>
                      </View>
                      <View style={styles.detailStat}>
                        <Text style={[styles.detailStatValue, { fontSize: isSmallDevice ? 16 : 18 }]}>
                          ₹{selectedMember.pendingCommission?.toLocaleString() || 0}
                        </Text>
                        <Text style={[styles.detailStatLabel, { fontSize: isSmallDevice ? 10 : 11 }]}>{translations.pendingCommission}</Text>
                      </View>
                      <View style={styles.detailStat}>
                        <Text style={[styles.detailStatValue, { fontSize: isSmallDevice ? 16 : 18, color: '#f59e0b' }]}>
                          ₹{selectedMember.totalDonations?.toLocaleString() || 0}
                        </Text>
                        <Text style={[styles.detailStatLabel, { fontSize: isSmallDevice ? 10 : 11 }]}>{translations.donations}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={[styles.detailSectionTitle, { fontSize: isSmallDevice ? 13 : 14 }]}>{translations.commissionRates}</Text>
                    <View style={styles.detailCommissionRow}>
                      <Text style={[styles.detailLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>{translations.directCommission}</Text>
                      <Text style={[styles.detailValue, { fontSize: isSmallDevice ? 12 : 13 }]}>
                        {selectedMember.directCommission || 0}%
                      </Text>
                    </View>
                    <View style={styles.detailCommissionRow}>
                      <Text style={[styles.detailLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>{translations.secondaryCommission}</Text>
                      <Text style={[styles.detailValue, { fontSize: isSmallDevice ? 12 : 13 }]}>
                        {selectedMember.secondaryCommission || 0}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={[styles.detailSectionTitle, { fontSize: isSmallDevice ? 13 : 14 }]}>{translations.directMembers}</Text>
                    {selectedMember.directReferrals?.length === 0 ? (
                      <Text style={[styles.detailEmptyText, { fontSize: isSmallDevice ? 12 : 13 }]}>
                        {translations.noDirectMembers}
                      </Text>
                    ) : (
                      selectedMember.directReferrals?.map((memberId, index) => (
                        <View key={index} style={styles.registeredMemberItem}>
                          <Text style={[styles.registeredMemberName, { fontSize: isSmallDevice ? 12 : 13 }]}>
                            ID: {memberId.slice(0, 12)}...
                          </Text>
                        </View>
                      ))
                    )}
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={[styles.detailSectionTitle, { fontSize: isSmallDevice ? 13 : 14 }]}>{translations.status}</Text>
                    <View style={styles.detailStatusRow}>
                      <Text style={[styles.detailLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>{translations.status}:</Text>
                      <View style={[styles.detailStatusBadge, { backgroundColor: getStatusColor(selectedMember.status) + '15' }]}>
                        <Text style={[styles.detailStatusText, { color: getStatusColor(selectedMember.status), fontSize: isSmallDevice ? 10 : 11 }]}>
                          {getStatusLabel(selectedMember.status)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.detailStatusRow}>
                      <Text style={[styles.detailLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>{translations.level}:</Text>
                      <Text style={[styles.detailValue, { fontSize: isSmallDevice ? 12 : 13 }]}>
                        {getLevelLabel(selectedMember.level)}
                      </Text>
                    </View>
                    <View style={styles.detailStatusRow}>
                      <Text style={[styles.detailLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>{translations.nextLevel}:</Text>
                      <Text style={[styles.detailValue, { fontSize: isSmallDevice ? 12 : 13 }]}>
                        {selectedMember.nextLevel ? getLevelLabel(selectedMember.nextLevel) : translations.max}
                      </Text>
                    </View>
                    <View style={styles.detailStatusRow}>
                      <Text style={[styles.detailLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>{translations.donationsReq}:</Text>
                      <Text style={[styles.detailValue, { fontSize: isSmallDevice ? 12 : 13, color: '#f59e0b' }]}>
                        ₹{selectedMember.donationsRequired?.toLocaleString() || 0}
                      </Text>
                    </View>
                    <View style={styles.detailStatusRow}>
                      <Text style={[styles.detailLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>{translations.wallet}:</Text>
                      <Text style={[styles.detailValue, { fontSize: isSmallDevice ? 12 : 13, color: '#10b981' }]}>
                        ₹{selectedMember.walletBalance?.toLocaleString() || 0}
                      </Text>
                    </View>
                    {selectedMember.promotionEligible && (
                      <View style={styles.detailStatusRow}>
                        <Text style={[styles.detailLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>{translations.promotion}:</Text>
                        <Text style={[styles.detailValue, { fontSize: isSmallDevice ? 12 : 13, color: '#10b981' }]}>
                          {translations.eligible}
                        </Text>
                      </View>
                    )}
                    {!selectedMember.promotionEligible && selectedMember.donationsRequired > 0 && (
                      <View style={styles.detailStatusRow}>
                        <Text style={[styles.detailLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>{translations.promotion}:</Text>
                        <Text style={[styles.detailValue, { fontSize: isSmallDevice ? 12 : 13, color: '#f59e0b' }]}>
                          ₹{selectedMember.membersNeededForPromotion?.toLocaleString() || 0} {translations.moreNeeded}
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setDetailModalVisible(false)}
                  >
                    <Text style={[styles.closeButtonText, { fontSize: isSmallDevice ? 13 : 14 }]}>{translations.close}</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </Modal>

        {/* Promotion Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={promotionModalVisible}
          onRequestClose={() => setPromotionModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { fontSize: isSmallDevice ? 16 : 18 }]}>{translations.promoteWorkingMember}</Text>
                <TouchableOpacity onPress={() => setPromotionModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.promotionInfo}>
                <Text style={[styles.promotionLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>{translations.member}</Text>
                <Text style={[styles.promotionValue, { fontSize: isSmallDevice ? 14 : 16 }]}>
                  {promotionData.memberName}
                </Text>
              </View>

              <View style={styles.promotionInfo}>
                <Text style={[styles.promotionLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>{translations.currentLevel}</Text>
                <Text style={[styles.promotionValue, { fontSize: isSmallDevice ? 14 : 16 }]}>
                  {getLevelLabel(promotionData.currentLevel)}
                </Text>
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>{translations.newLevel}</Text>
                <View style={styles.levelOptions}>
                  {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'].map((level) => {
                    const levelDetails = getLevelDetails(level);
                    const isActive = promotionData.newLevel === level;
                    return (
                      <TouchableOpacity
                        key={level}
                        style={[styles.levelOption, isActive && styles.levelOptionActive]}
                        onPress={() => setPromotionData({...promotionData, newLevel: level})}
                      >
                        <MaterialIcons 
                          name={getLevelIcon(level)} 
                          size={isSmallDevice ? 12 : 16} 
                          color={isActive ? '#ffffff' : getLevelColor(level)} 
                        />
                        <Text style={[
                          styles.levelOptionText, 
                          isActive && styles.levelOptionTextActive,
                          { fontSize: isSmallDevice ? 10 : 12 }
                        ]}>
                          {levelDetails.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity style={styles.promoteConfirmButton} onPress={handlePromotion}>
                <MaterialIcons name="stars" size={20} color="#ffffff" />
                <Text style={[styles.promoteConfirmText, { fontSize: isSmallDevice ? 14 : 16 }]}>
                  {translations.confirmPromotion}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Commission Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={commissionModalVisible}
          onRequestClose={() => setCommissionModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { fontSize: isSmallDevice ? 16 : 18 }]}>{translations.addCommission}</Text>
                <TouchableOpacity onPress={() => setCommissionModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.commissionInfo}>
                <Text style={[styles.commissionLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>{translations.member}</Text>
                <Text style={[styles.commissionValue, { fontSize: isSmallDevice ? 14 : 16 }]}>
                  {commissionData.memberName}
                </Text>
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>{translations.amount} *</Text>
                <TextInput
                  style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                  value={commissionData.amount}
                  onChangeText={(text) => setCommissionData({...commissionData, amount: text})}
                  placeholder={translations.amount}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>{translations.type}</Text>
                <View style={styles.typeToggle}>
                  <TouchableOpacity
                    style={[styles.typeButton, commissionData.type === 'direct' && styles.typeButtonActive]}
                    onPress={() => setCommissionData({...commissionData, type: 'direct'})}
                  >
                    <Text style={[styles.typeButtonText, commissionData.type === 'direct' && styles.typeButtonTextActive, { fontSize: isSmallDevice ? 10 : 12 }]}>
                      {translations.direct}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeButton, commissionData.type === 'secondary' && styles.typeButtonActive]}
                    onPress={() => setCommissionData({...commissionData, type: 'secondary'})}
                  >
                    <Text style={[styles.typeButtonText, commissionData.type === 'secondary' && styles.typeButtonTextActive, { fontSize: isSmallDevice ? 10 : 12 }]}>
                      {translations.secondary}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>{translations.description}</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea, { fontSize: isSmallDevice ? 13 : 14 }]}
                  value={commissionData.description}
                  onChangeText={(text) => setCommissionData({...commissionData, description: text})}
                  placeholder={translations.description}
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>{translations.status}</Text>
                <View style={styles.statusToggle}>
                  <TouchableOpacity
                    style={[styles.statusButton, commissionData.status === 'pending' && styles.statusButtonActive]}
                    onPress={() => setCommissionData({...commissionData, status: 'pending'})}
                  >
                    <Text style={[styles.statusButtonText, commissionData.status === 'pending' && styles.statusButtonTextActive, { fontSize: isSmallDevice ? 10 : 12 }]}>
                      {translations.pending}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusButton, commissionData.status === 'paid' && styles.statusButtonActive]}
                    onPress={() => setCommissionData({...commissionData, status: 'paid'})}
                  >
                    <Text style={[styles.statusButtonText, commissionData.status === 'paid' && styles.statusButtonTextActive, { fontSize: isSmallDevice ? 10 : 12 }]}>
                      {translations.paid}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleAddCommission}>
                <MaterialIcons name="add" size={20} color="#ffffff" />
                <Text style={[styles.submitButtonText, { fontSize: isSmallDevice ? 14 : 16 }]}>{translations.addCommission}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Commission History Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={commissionHistoryModalVisible}
          onRequestClose={() => setCommissionHistoryModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { fontSize: isSmallDevice ? 16 : 18 }]}>{translations.commissionHistory}</Text>
                <TouchableOpacity onPress={() => setCommissionHistoryModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <Text style={[styles.historyMemberName, { fontSize: isSmallDevice ? 14 : 16 }]}>
                {selectedMember?.fullName}
              </Text>

              {commissionHistory.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="attach-money" size={44} color="#D1D5DB" />
                  <Text style={[styles.emptyText, { fontSize: isSmallDevice ? 12 : 13 }]}>
                    {translations.noCommissionHistory}
                  </Text>
                </View>
              ) : (
                commissionHistory.map((item, index) => {
                  const isDirect = item.type === 'direct_commission';
                  const statusLabel = item.status === 'paid' || item.status === 'completed' ? translations.paid : 
                                      item.status === 'pending' ? translations.pending : translations.failed;
                  return (
                    <View key={index} style={styles.historyItem}>
                      <View style={styles.historyHeader}>
                        <View>
                          <Text style={[styles.historyAmount, { fontSize: isSmallDevice ? 14 : 16 }]}>
                            ₹{item.amount?.toLocaleString() || 0}
                          </Text>
                          <Text style={[styles.historyType, { fontSize: isSmallDevice ? 10 : 11 }]}>
                            {isDirect ? translations.direct : translations.secondary}
                          </Text>
                        </View>
                        <View style={[styles.historyStatus, { 
                          backgroundColor: item.status === 'paid' || item.status === 'completed' ? '#10b981' : 
                                         item.status === 'pending' ? '#f59e0b' : '#ef4444' 
                        }]}>
                          <Text style={[styles.historyStatusText, { fontSize: isSmallDevice ? 8 : 10 }]}>
                            {statusLabel}
                          </Text>
                        </View>
                      </View>
                      {item.description && (
                        <Text style={[styles.historyDescription, { fontSize: isSmallDevice ? 11 : 13 }]}>
                          {item.description}
                        </Text>
                      )}
                      <Text style={[styles.historyDate, { fontSize: isSmallDevice ? 10 : 12 }]}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : translations.nA}
                      </Text>
                    </View>
                  );
                })
              )}

              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setCommissionHistoryModalVisible(false)}
              >
                <Text style={[styles.closeButtonText, { fontSize: isSmallDevice ? 13 : 14 }]}>{translations.close}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Wallet Modal */}
        <WalletModal />
{/* Download ID Card & Certificates Modal */}
<Modal
  animationType="slide"
  transparent={true}
  visible={downloadModalVisible}
  onRequestClose={() => {
    setDownloadModalVisible(false);
    setSelectedMemberForDownload(null);
  }}
>
  <View style={styles.modalContainer}>
    <ScrollView style={[styles.modalContent, { maxHeight: '90%' }]}>
      <View style={styles.modalHeader}>
        <Text style={[styles.modalTitle, { fontSize: isSmallDevice ? 16 : 18 }]}>
          Download Documents
        </Text>
        <TouchableOpacity onPress={() => {
          setDownloadModalVisible(false);
          setSelectedMemberForDownload(null);
        }}>
          <MaterialIcons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {selectedMemberForDownload && (
        <>
          {/* Member Info */}
          <View style={styles.downloadMemberInfo}>
            <Text style={styles.downloadMemberName}>{selectedMemberForDownload.fullName}</Text>
            <Text style={styles.downloadMemberLevel}>
              Level: {getLevelLabel(selectedMemberForDownload.level)}
            </Text>
          </View>

          {/* ID Card Section */}
          <View style={styles.downloadSection}>
            <View style={styles.downloadSectionHeader}>
              <Text style={styles.downloadSectionTitle}>ID Card</Text>
              <TouchableOpacity 
                style={styles.downloadButtonSmall}
                onPress={() => downloadIDCard(selectedMemberForDownload)}
                disabled={downloading}
                activeOpacity={0.7}
              >
                <MaterialIcons 
                  name={downloading ? "hourglass-empty" : "download"} 
                  size={16} 
                  color="#8b5cf6" 
                />
                <Text style={styles.downloadButtonSmallText}>
                  {downloading ? 'Downloading...' : 'Download ID Card'}
                </Text>
              </TouchableOpacity>
            </View>
            {renderIDCard(selectedMemberForDownload)}
          </View>

          {/* Certificates Section */}
          <View style={styles.downloadSection}>
            <View style={styles.downloadSectionHeader}>
              <Text style={styles.downloadSectionTitle}>Certificates</Text>
              <Text style={styles.downloadSectionCount}>
                {memberCertificates.length} earned
              </Text>
            </View>

            {memberCertificates.length > 0 ? (
              memberCertificates.map((cert, index) => renderCertificateItem(cert, index))
            ) : (
              <View style={styles.noCertContainer}>
                <MaterialIcons name="verified" size={30} color="#d1d5db" />
                <Text style={styles.noCertText}>No certificates earned yet</Text>
              </View>
            )}
          </View>

          {/* Close Button */}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => {
              setDownloadModalVisible(false);
              setSelectedMemberForDownload(null);
            }}
          >
            <Text style={[styles.closeButtonText, { fontSize: isSmallDevice ? 13 : 14 }]}>Close</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  </View>
</Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fdf8f3',
  },
  container: {
    flex: 1,
    backgroundColor: '#fdf8f3',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fdf8f3',
  },
  loadingText: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
    marginTop: 10,
  },
  headerCard: {
    backgroundColor: '#FF7722',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 50,
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
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    padding: 4,
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
    color: '#1f2937',
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
    color: 'rgba(255,255,255,0.8)',
  },
  activeStatusChipText: {
    color: '#FF7722',
  },
  statsWrapper: {
    marginBottom: 4,
  },
  statsScrollContent: {
    gap: 10,
    alignItems: 'center',
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 6,
    minWidth: 70,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    height: 55,
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
    marginBottom: 2,
  },
  statType: {
    fontFamily: Fonts.Bold,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontSize: 10
  },
  statCount: {
    fontFamily: Fonts.Bold,
    color: '#ffffff',
    textAlign: 'center',
  },
  flatList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  memberCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberTextInfo: {
    flex: 1,
    marginLeft: 10,
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
    color: '#FF7722',
  },
  memberName: {
    fontFamily: Fonts.SemiBold,
    color: '#1f2937',
  },
  memberEmail: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: Fonts.SemiBold,
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontFamily: Fonts.Bold,
    color: '#1f2937',
  },
  statLabel: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    flexWrap: 'wrap',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  levelBadgeText: {
    fontFamily: Fonts.SemiBold,
  },
  commissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commissionRateText: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
  },
  promotionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  promotionText: {
    fontFamily: Fonts.SemiBold,
    color: '#10b981',
  },
  nextLevelBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  nextLevelText: {
    fontFamily: Fonts.Regular,
    color: '#8b5cf6',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 4,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  promoteButton: {
    backgroundColor: '#f59e0b',
  },
  commissionButton: {
    backgroundColor: '#8b5cf6',
  },
  historyButton: {
    backgroundColor: '#06b6d4',
  },
  walletButton: {
    backgroundColor: '#10b981',
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  suspendButton: {
    backgroundColor: '#ef4444',
  },
  viewButton: {
    backgroundColor: '#FF7722',
  },
  actionButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 12,
    flex: 1,
  },
  emptyStateText: {
    fontFamily: Fonts.SemiBold,
    color: '#1f2937',
  },
  emptyStateSubtext: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
  },
  modalContainer: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'flex-end',  // ✅ CHANGE to flex-end
  padding: 16,
},
modalContent: {
  backgroundColor: '#ffffff',
  borderRadius: 16,
  padding: 20,
  paddingBottom: 60,  // ✅ Add extra bottom padding
  maxHeight: '90%',   // ✅ Increase max height
},
modalButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: 12,
  marginTop: 16,
  paddingBottom: Platform.OS === 'ios' ? 20 : 10,  // ✅ Add safe area
},
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: Fonts.Bold,
    color: '#1f2937',
  },
  detailProfile: {
    alignItems: 'center',
    marginBottom: 16,
  },
  detailAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  detailAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailAvatarText: {
    fontFamily: Fonts.Bold,
    color: '#FF7722',
  },
  detailName: {
    fontFamily: Fonts.Bold,
    color: '#1f2937',
    marginTop: 8,
  },
  detailEmail: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
  },
  detailLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  detailLevelText: {
    fontFamily: Fonts.SemiBold,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontFamily: Fonts.SemiBold,
    color: '#1f2937',
    marginBottom: 8,
  },
  detailStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailStatValue: {
    fontFamily: Fonts.Bold,
    color: '#1f2937',
  },
  detailStatLabel: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
  },
  detailCommissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  registeredMemberItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  registeredMemberName: {
    fontFamily: Fonts.SemiBold,
    color: '#1f2937',
  },
  detailEmptyText: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 10,
  },
  detailStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  detailLabel: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
    width: 100,
  },
  detailValue: {
    fontFamily: Fonts.Regular,
    color: '#1f2937',
    flex: 1,
    textAlign: 'right',
  },
  detailStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailStatusText: {
    fontFamily: Fonts.SemiBold,
  },
  closeButton: {
    backgroundColor: '#6b7280',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
  },
  promotionInfo: {
    marginBottom: 12,
  },
  promotionLabel: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
  },
  promotionValue: {
    fontFamily: Fonts.SemiBold,
    color: '#1f2937',
  },
  formField: {
    marginBottom: 12,
  },
  formLabel: {
    fontFamily: Fonts.SemiBold,
    color: '#1f2937',
    marginBottom: 4,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f9fafb',
    fontFamily: Fonts.Regular,
  },
  formTextArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  levelOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  levelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 4,
  },
  levelOptionActive: {
    backgroundColor: '#FF7722',
    borderColor: '#FF7722',
  },
  levelOptionText: {
    fontFamily: Fonts.SemiBold,
    color: '#6b7280',
  },
  levelOptionTextActive: {
    color: '#ffffff',
  },
  typeToggle: {
    flexDirection: 'row',
    gap: 6,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  typeButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#6b7280',
  },
  typeButtonTextActive: {
    color: '#ffffff',
  },
  statusToggle: {
    flexDirection: 'row',
    gap: 6,
  },
// Add these to your styles

headerRight: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
// Add to styles
referralButton: {
  backgroundColor: '#f59e0b',
},
referralMemberInfo: {
  alignItems: 'center',
  paddingVertical: 12,
  marginBottom: 16,
  backgroundColor: '#f9fafb',
  borderRadius: 8,
},
referralMemberName: {
  fontFamily: Fonts.Bold,
  color: '#1f2937',
},
referralMemberLevel: {
  fontFamily: Fonts.Regular,
  color: '#6b7280',
  marginTop: 2,
},
referralCodeContainer: {
  alignItems: 'center',
  paddingVertical: 20,
  paddingHorizontal: 16,
  backgroundColor: '#f0fdf4',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#bbf7d0',
  marginBottom: 16,
},
referralCodeLabel: {
  fontFamily: Fonts.SemiBold,
  color: '#6b7280',
  marginBottom: 8,
},
referralCodeDisplay: {
  backgroundColor: '#ffffff',
  paddingVertical: 16,
  paddingHorizontal: 32,
  borderRadius: 12,
  borderWidth: 2,
  borderColor: '#10b981',
  marginBottom: 8,
},
referralCodeText: {
  fontFamily: Fonts.Bold,
  color: '#10b981',
  letterSpacing: 4,
},
referralCodeNote: {
  fontFamily: Fonts.Regular,
  color: '#6b7280',
  textAlign: 'center',
  marginVertical: 8,
},
referralShareButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#10b981',
  paddingVertical: 12,
  paddingHorizontal: 24,
  borderRadius: 8,
  gap: 8,
  marginTop: 8,
},
referralShareText: {
  fontFamily: Fonts.SemiBold,
  color: '#ffffff',
},
referralNoCodeText: {
  fontFamily: Fonts.SemiBold,
  color: '#1f2937',
  marginBottom: 4,
},
referralNoCodeSubtext: {
  fontFamily: Fonts.Regular,
  color: '#6b7280',
  textAlign: 'center',
  marginBottom: 16,
},
referralGenerateButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#FF7722',
  paddingVertical: 14,
  paddingHorizontal: 24,
  borderRadius: 8,
  gap: 8,
  width: '100%',
},
referralGenerateText: {
  fontFamily: Fonts.SemiBold,
  color: '#ffffff',
},
addButton: {
  padding: 4,
},
downloadButton: {
  backgroundColor: '#8b5cf6',
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
statusFilterWrapper: {
  marginBottom: 12,
},
statusFilterScrollContent: {
  gap: 8,
  paddingVertical: 4,
  alignItems: 'center',
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

// Download Modal Styles
downloadMemberInfo: {
  alignItems: 'center',
  paddingVertical: 8,
  marginBottom: 12,
  backgroundColor: '#f9fafb',
  borderRadius: 8,
},
downloadMemberName: {
  fontFamily: Fonts.Bold,
  fontSize: 16,
  color: '#1f2937',
},
downloadMemberLevel: {
  fontFamily: Fonts.Regular,
  fontSize: 12,
  color: '#6b7280',
  marginTop: 2,
},
downloadSection: {
  marginBottom: 16,
  paddingBottom: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#f3f4f6',
},
downloadSectionHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 10,
},
downloadSectionTitle: {
  fontFamily: Fonts.SemiBold,
  fontSize: 14,
  color: '#1f2937',
},
downloadSectionCount: {
  fontFamily: Fonts.Regular,
  fontSize: 11,
  color: '#6b7280',
},
downloadButtonSmall: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 6,
  backgroundColor: '#f5f3ff',
},
downloadButtonSmallText: {
  fontFamily: Fonts.SemiBold,
  fontSize: 10,
  color: '#8b5cf6',
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
parentSearchContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginBottom: 8,
},
parentSearchButton: {
  backgroundColor: '#FF7722',
  padding: 10,
  borderRadius: 8,
  justifyContent: 'center',
  alignItems: 'center',
},
parentListContainer: {
  maxHeight: 80,
  marginBottom: 8,
},
parentListContent: {
  gap: 8,
  alignItems: 'center',
},
parentChip: {
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#e5e7eb',
  backgroundColor: '#ffffff',
},
parentChipActive: {
  backgroundColor: '#FF7722',
  borderColor: '#FF7722',
},
parentChipText: {
  fontFamily: Fonts.Regular,
  fontSize: 12,
  color: '#6b7280',
},
parentChipTextActive: {
  color: '#ffffff',
},
selectedParentContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#f0fdf4',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 8,
  gap: 6,
  borderWidth: 1,
  borderColor: '#bbf7d0',
},
selectedParentText: {
  fontFamily: Fonts.SemiBold,
  fontSize: 12,
  color: '#10b981',
  flex: 1,
},
methodCard: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#ffffff',
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
  borderWidth: 2,
  borderColor: '#e5e7eb',
},
methodCardActive: {
  borderColor: '#FF7722',
  backgroundColor: '#fff5eb',
},
methodIcon: {
  width: 44,
  height: 44,
  borderRadius: 22,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 14,
  flexShrink: 0,
},
methodContent: {
  flex: 1,
},
methodTitle: {
  fontFamily: Fonts.SemiBold,
  fontSize: 16,
  color: '#1f2937',
},
methodTitleActive: {
  color: '#FF7722',
},
methodDescription: {
  fontFamily: Fonts.Regular,
  fontSize: 12,
  color: '#6b7280',
},
modalSubText: {
  fontFamily: Fonts.Regular,
  color: '#6b7280',
  textAlign: 'center',
  marginBottom: 16,
},
helperText: {
  fontFamily: Fonts.Regular,
  color: '#6b7280',
  marginBottom: 6,
  marginTop: 2,
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
noCertText: {
  fontFamily: Fonts.Regular,
  fontSize: 13,
  color: '#6b7280',
},
  statusButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#FF7722',
    borderColor: '#FF7722',
  },
  statusButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#6b7280',
  },
  statusButtonTextActive: {
    color: '#ffffff',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  submitButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
  },
  promoteConfirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  promoteConfirmText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
  },
  historyMemberName: {
    fontFamily: Fonts.SemiBold,
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  historyItem: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyAmount: {
    fontFamily: Fonts.Bold,
    color: '#1f2937',
  },
  historyType: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
    marginTop: 2,
  },
  historyStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
// Orange Oval Save Button
modalSaveButton: {
  backgroundColor: '#FF7722',
  paddingHorizontal: 20,
  paddingVertical: 8,
  borderRadius: 20,
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 60,
},
modalSaveButtonText: {
  fontFamily: Fonts.SemiBold,
  fontSize: 14,
  color: '#ffffff',
},
  historyStatusText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
  },
  historyDescription: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
    marginTop: 4,
  },
  historyDate: {
    fontFamily: Fonts.Regular,
    color: '#9ca3af',
    marginTop: 2,
  },
  emptyText: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
    textAlign: 'center',
  },
  walletSummary: {
    padding: 16,
  },
  walletMemberName: {
    fontFamily: Fonts.Bold,
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  walletBalanceContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  walletBalanceLabel: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
  },
  walletBalance: {
    fontFamily: Fonts.Bold,
    color: '#10b981',
    marginTop: 4,
  },
  walletStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  walletStat: {
    alignItems: 'center',
  },
assignButton: {
  backgroundColor: '#8b5cf6',
},
assignParentInfo: {
  backgroundColor: '#f9fafb',
  padding: 12,
  borderRadius: 8,
  marginBottom: 12,
},
assignLabel: {
  fontFamily: Fonts.Regular,
  fontSize: 12,
  color: '#6b7280',
},
assignParentName: {
  fontFamily: Fonts.Bold,
  fontSize: 16,
  color: '#1f2937',
  marginTop: 2,
},
assignParentLevel: {
  fontFamily: Fonts.Regular,
  fontSize: 12,
  color: '#6b7280',
  marginTop: 2,
},
assignDivider: {
  height: 1,
  backgroundColor: '#e5e7eb',
  marginVertical: 12,
},
assignSubtitle: {
  fontFamily: Fonts.Regular,
  fontSize: 14,
  color: '#6b7280',
  marginBottom: 12,
},
assignSearchContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginBottom: 12,
},
assignListContainer: {
  maxHeight: 250,
  marginBottom: 12,
},
assignItem: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: 12,
  backgroundColor: '#f9fafb',
  borderRadius: 8,
  marginBottom: 6,
  borderWidth: 1,
  borderColor: 'transparent',
},
assignItemActive: {
  borderColor: '#8b5cf6',
  backgroundColor: '#f5f3ff',
},
assignItemLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
},
assignItemAvatar: {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: '#8b5cf615',
  justifyContent: 'center',
  alignItems: 'center',
},
assignItemAvatarText: {
  fontFamily: Fonts.Bold,
  fontSize: 14,
  color: '#8b5cf6',
},
assignItemName: {
  fontFamily: Fonts.SemiBold,
  fontSize: 14,
  color: '#1f2937',
},
assignItemLevel: {
  fontFamily: Fonts.Regular,
  fontSize: 11,
  color: '#6b7280',
},
assignEmptyState: {
  alignItems: 'center',
  paddingVertical: 30,
  gap: 4,
},
assignEmptyText: {
  fontFamily: Fonts.SemiBold,
  fontSize: 14,
  color: '#1f2937',
},
assignEmptySubtext: {
  fontFamily: Fonts.Regular,
  fontSize: 12,
  color: '#6b7280',
},
assignSelectedContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#f0fdf4',
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 8,
  gap: 6,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: '#bbf7d0',
},
assignSelectedText: {
  fontFamily: Fonts.SemiBold,
  fontSize: 13,
  color: '#10b981',
  flex: 1,
},
assignActions: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: 12,
  marginTop: 8,
},
assignButton: {
  paddingVertical: 5,
  borderRadius: 8,
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  gap: 6,
backgroundColor: '#8b5cf6',
},
assignCancelButton: {
  backgroundColor: '#f3f4f6',
  borderWidth: 1,
  borderColor: '#e5e7eb',
},
assignConfirmButton: {
  backgroundColor: '#8b5cf6',
},
assignCancelText: {
  fontFamily: Fonts.SemiBold,
  fontSize: 14,
  color: '#6b7280',
},
assignConfirmText: {
  fontFamily: Fonts.SemiBold,
  fontSize: 14,
  color: '#ffffff',
},
  walletStatValue: {
    fontFamily: Fonts.Bold,
    color: '#1f2937',
  },
  walletStatLabel: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
    marginTop: 2,
  },
});