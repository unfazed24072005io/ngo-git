// screens/member/MemberProfile.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TextInput, TouchableOpacity, Alert, ActivityIndicator, Switch, Dimensions, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db, getAuthInstance } from '../../config/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { signOut } from 'firebase/auth';
import { Fonts } from '../../config/fonts';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../context/LanguageContext';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';

const { width, height } = Dimensions.get('window');

// ============ RESPONSIVE HELPERS ============
const isWeb = Platform.OS === 'web';
const isTablet = width >= 768;
const isMobile = width < 768;

// Base design width (iPhone SE = 375)
const BASE_WIDTH = 375;
const scale = Math.min(width / BASE_WIDTH, 2);

// Responsive functions
const responsiveFont = (size) => {
  // Scale font size based on device width
  let scaledSize = size * scale;
  // Cap for very large screens
  if (isTablet) scaledSize = Math.min(scaledSize, size * 1.5);
  if (isWeb) scaledSize = Math.min(scaledSize, size * 1.8);
  return Math.round(scaledSize);
};

const responsiveWidth = (size) => {
  return (size / BASE_WIDTH) * width;
};

const responsiveHeight = (size) => {
  const baseHeight = 812;
  return (size / baseHeight) * height;
};

const getCardWidth = () => {
  if (isWeb) return Math.min(width * 0.5, 500);
  if (isTablet) return width * 0.7;
  return width - 32;
};

// ============ MAIN COMPONENT ============

export default function MemberProfile({ navigation }) {
  const { t, counter } = useLanguage();
  const cardRef = useRef();
  
  // Force re-render when language changes
  const renderKey = `member-profile-${counter}`;

  // Get translations
  const translations = {
    // Common
    error: t('common.error') || 'Error',
    success: t('common.success') || 'Success',
    loading: t('common.loading') || 'Loading...',
    nA: t('common.nA') || 'N/A',
    cancel: t('common.cancel') || 'Cancel',
    close: t('common.close') || 'Close',
    notProvided: t('common.notProvided') || 'Not provided',
    noBio: t('common.noBio') || 'No bio available',
    active: t('common.active') || 'Active',
    inactive: t('common.inactive') || 'Inactive',
    
    // Header
    memberProfile: t('member.profile') || 'Member Profile',
    edit: t('common.edit') || 'Edit',
    
    // Profile Section
    changePhoto: t('common.tapToChangePhoto') || 'Tap to change photo',
    
    // ID Card
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
    downloadIDCard: 'Download ID Card',
    downloading: 'Downloading...',
    
    // Personal Information
    personalInformation: t('member.personalInformation') || 'Personal Information',
    fullName: t('auth.fullName') || 'Full Name',
    fatherHusbandName: t('auth.fatherHusbandName') || 'Father/Husband Name',
    dateOfBirth: t('auth.dateOfBirth') || 'Date of Birth',
    aadharNumber: t('auth.aadharNumber') || 'Aadhar Number',
    membershipStatus: t('member.membershipStatus') || 'Membership Status',
    email: t('common.email') || 'Email',
    phone: t('common.phone') || 'Phone',
    address: t('common.address') || 'Address',
    bio: t('common.bio') || 'Bio',
    enterFullName: t('common.enterFullName') || 'Enter full name',
    enterFatherName: 'Enter father/husband name',
    enterDob: 'DD/MM/YYYY',
    enterAadhar: 'Enter Aadhar number',
    enterPhone: t('common.enterPhone') || 'Enter phone number',
    enterAddress: t('common.enterAddress') || 'Enter address',
    tellAboutYourself: t('common.tellAboutYourself') || 'Tell us about yourself',
    
    // Employment
    department: t('member.department') || 'Department',
    position: t('member.position') || 'Position',
    memberId: t('member.memberId') || 'Member ID',
    reportingTo: t('member.reportingTo') || 'Reporting To',
    joinedDate: t('common.joinedDate') || 'Joined Date',
    enterDepartment: 'Enter department',
    enterPosition: 'Enter position',
    notAssigned: 'Not assigned',
    member: 'Member',
    
    // Certificates
    certificates: t('certificate.certificates') || 'Certificates',
    earned: t('certificate.earned') || 'earned',
    donation: t('certificate.donation') || 'Donation',
    membership: t('certificate.membership') || 'Membership',
    volunteer: t('certificate.volunteer') || 'Volunteer',
    certificateLabel: t('certificate.certificate') || 'Certificate',
    noCertificates: t('certificate.noCertificates') || 'No certificates earned yet',
    noCertificatesSubtext: t('certificate.earnFirstCertificate') || 'Complete activities to earn certificates',
    viewAll: t('common.viewAll') || 'View All',
    showLess: t('common.showLess') || 'Show Less',
    viewAllCertificates: 'View All {count} Certificates',
    
    // Settings
    settings: t('common.settings') || 'Settings',
    pushNotifications: t('common.pushNotifications') || 'Push Notifications',
    privacyPolicy: t('common.privacyPolicy') || 'Privacy Policy',
    termsConditions: t('common.termsConditions') || 'Terms & Conditions',
    appVersion: t('common.appVersion') || 'App Version',
    
    // More Settings
    moreSettings: t('member.moreSettings') || 'More Settings',
    moreSettingsSubtitle: 'Applications, Classes & Organisation',
    
    // Buttons
    saveChanges: t('common.saveChanges') || 'Save Changes',
    saving: t('common.saving') || 'Saving...',
    logout: t('common.logout') || 'Logout',
    
    // Alerts
    userNotLoggedIn: t('common.userNotLoggedIn') || 'User not logged in',
    failedToLoad: t('common.failedToLoad') || 'Failed to load profile',
    profileUpdated: t('common.profileUpdated') || 'Profile updated successfully',
    permissionRequired: t('common.permissionRequired') || 'Permission Required',
    allowGallery: t('common.allowGallery') || 'Please allow access to your gallery',
    loadingProfile: t('common.loadingProfile') || 'Loading Profile...',
    privacyPolicyContent: 'Privacy policy content goes here',
    termsContent: 'Terms and conditions content goes here',
    appVersionMessage: 'NGO App v1.0.0',
    
    // Status
    activeStatus: t('common.active') || 'Active',
    inactiveStatus: t('common.inactive') || 'Inactive',
    downloadFailed: 'Failed to download ID card',
    idCardDownloaded: 'ID Card downloaded successfully',
  };

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [certificates, setCertificates] = useState([]);
  const [cardId, setCardId] = useState('');
  const [showAllCertificates, setShowAllCertificates] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    profilePhoto: null,
    bio: '',
    joinedDate: '',
    department: '',
    position: '',
    employeeId: '',
    reportingTo: '',
    fatherName: '',
    dob: '',
    aadharNumber: '',
    membershipStatus: 'Active'
  });

  useEffect(() => {
    fetchUserData();
    fetchCertificateData();
    generateCardId();
  }, []);

  const fetchUserData = async () => {
  const auth = getAuthInstance(); // ✅ ADD THIS

    setLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert(translations.error, translations.userNotLoggedIn);
        return;
      }
      
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        setFormData({
          fullName: data.fullName || data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          profilePhoto: data.profilePhoto || null,
          bio: data.bio || 'NGO Member',
          joinedDate: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : translations.nA,
          department: data.department || translations.notAssigned,
          position: data.position || translations.member,
          employeeId: data.employeeId || `MBR-${userId.slice(0, 6).toUpperCase()}`,
          reportingTo: data.reportingTo || translations.nA,
          fatherName: data.fatherName || '',
          dob: data.dob || '',
          aadharNumber: data.aadharNumber || '',
          membershipStatus: data.membershipStatus || translations.active
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert(translations.error, translations.failedToLoad);
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificateData = async () => {
  const auth = getAuthInstance(); // ✅ ADD THIS

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const certQuery = query(
        collection(db, 'certificates'),
        where('memberId', '==', userId),
        where('status', '==', 'issued')
      );
      const certSnap = await getDocs(certQuery);
      const certList = [];
      certSnap.forEach((doc) => {
        certList.push({ id: doc.id, ...doc.data() });
      });
      setCertificates(certList);
    } catch (error) {
      console.error('Error fetching certificate data:', error);
    }
  };

  const generateCardId = () => {
  const auth = getAuthInstance(); // ✅ ADD THIS

    const userId = auth.currentUser?.uid;
    if (userId) {
      setCardId(`MBR-${userId.slice(0, 8).toUpperCase()}`);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(translations.permissionRequired, translations.allowGallery);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const base64Url = `data:image/jpeg;base64,${asset.base64}`;
      setFormData({ ...formData, profilePhoto: base64Url });
    }
  };

  const handleSave = async () => {
  const auth = getAuthInstance(); // ✅ ADD THIS

    setSaving(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      await updateDoc(doc(db, 'users', userId), {
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        bio: formData.bio,
        department: formData.department,
        position: formData.position,
        profilePhoto: formData.profilePhoto,
        fatherName: formData.fatherName,
        dob: formData.dob,
        aadharNumber: formData.aadharNumber,
        membershipStatus: formData.membershipStatus,
        updatedAt: new Date().toISOString()
      });

      Alert.alert(translations.success, translations.profileUpdated);
      setEditing(false);
      fetchUserData();
    } catch (error) {
      Alert.alert(translations.error, error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
  const auth = getAuthInstance(); // ✅ ADD THIS

    try {
      await signOut(auth);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      Alert.alert(translations.error, error.message);
    }
  };

  const handleDownloadIDCard = async () => {
    try {
      setDownloading(true);
      
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'data-uri',
      });
      
      const fileName = `ID-Card-${formData.fullName || 'Member'}-${Date.now()}.png`;
      const filePath = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(filePath, uri.split(',')[1], {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'image/png',
          dialogTitle: 'Share ID Card',
          UTI: 'public.png',
        });
      }
      
      Alert.alert(translations.success, translations.idCardDownloaded);
    } catch (error) {
      console.error('Error downloading ID card:', error);
      Alert.alert(translations.error, translations.downloadFailed);
    } finally {
      setDownloading(false);
    }
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

  const getStatusLabel = (status) => {
    return status === 'Active' || status === 'active' ? translations.activeStatus : translations.inactiveStatus;
  };

  const navigateToCertificates = () => {
    navigation.navigate('MemberCertificate');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer} key={renderKey}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>{translations.loadingProfile}</Text>
      </View>
    );
  }

  const displayedCertificates = showAllCertificates ? certificates : certificates.slice(0, 3);

  return (
    <View style={styles.container} key={renderKey}>
      {/* Purple Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{translations.memberProfile}</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)} activeOpacity={0.7}>
            <Text style={styles.editButton}>{editing ? translations.cancel : translations.edit}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={pickImage} disabled={!editing} activeOpacity={0.7}>
            <View style={styles.profileImageContainer}>
              {formData.profilePhoto ? (
                <Image source={{ uri: formData.profilePhoto }} style={styles.profileImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <MaterialIcons name="person" size={responsiveFont(50)} color="#8b5cf6" />
                </View>
              )}
              {editing && (
                <View style={styles.cameraIcon}>
                  <MaterialIcons name="photo-camera" size={responsiveFont(16)} color="#ffffff" />
                </View>
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.profileName} numberOfLines={1}>{formData.fullName || translations.member}</Text>
          <Text style={styles.profileBio} numberOfLines={1}>{formData.bio || 'NGO Member'}</Text>
          {editing && <Text style={styles.changePhotoText}>{translations.changePhoto}</Text>}
        </View>

        {/* Identity Card - Responsive with PNG Template */}
        <View style={styles.idCardWrapper}>
          <View ref={cardRef} collapsable={false} style={styles.idCardContainer}>
            <View style={styles.idCard}>
              {/* Background PNG Template */}
              <Image 
                source={require('../../assets/images/id-card-template.png')}
                style={styles.idCardTemplateImage}
                resizeMode="stretch"
              />
              
              {/* Overlay Content - Responsive */}
              <View style={styles.idCardOverlay}>
                {/* Personal Details */}
                <View style={styles.idCardDetailsContainer}>
                  <View style={[styles.idCardFieldRow, { marginTop: responsiveHeight(122) }]}>
                    <Text style={styles.idCardFieldValue} numberOfLines={1}>{formData.fullName || translations.nA}</Text>
                  </View>
                  
                  <View style={styles.idCardFieldRow}>
                    <Text style={styles.idCardFieldValue} numberOfLines={1}>{formData.fatherName || translations.nA}</Text>
                  </View>
                  
                  <View style={styles.idCardFieldRow}>
                    <Text style={styles.idCardFieldValue} numberOfLines={1}>{formData.dob || translations.nA}</Text>
                  </View>
                  
                  <View style={styles.idCardFieldRow}>
                    <Text style={styles.idCardFieldValue} numberOfLines={1}>{formData.aadharNumber || translations.nA}</Text>
                  </View>
                  
                  <View style={styles.idCardFieldRow}>
                    <Text style={[styles.idCardFieldValue, styles.idCardStatusValue]} numberOfLines={1}>
                      {getStatusLabel(formData.membershipStatus)}
                    </Text>
                  </View>
                  
                  <View style={styles.idCardFieldRow}>
                    <Text style={styles.idCardFieldValue} numberOfLines={1}>{formData.phone || translations.nA}</Text>
                  </View>
                  
                  <View style={styles.idCardFieldRow}>
                    <Text style={styles.idCardFieldValue} numberOfLines={2}>{formData.address || translations.nA}</Text>
                  </View>
                </View>
                
                {/* Photo - Right Side */}
                <View style={styles.idCardPhotoContainer}>
                  <View style={styles.idCardPhotoWrapper}>
                    {formData.profilePhoto ? (
                      <Image source={{ uri: formData.profilePhoto }} style={styles.idCardPhoto} />
                    ) : (
                      <View style={styles.idCardPhotoPlaceholder}>
                        <MaterialIcons name="person" size={responsiveFont(40)} color="#8b5cf6" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.idCardPhotoLabel}>{translations.idCardPhoto}</Text>
                </View>
                
                {/* Footer */}
                <View style={styles.idCardFooter}>
                  <Text style={styles.idCardFooterText}>{translations.idCardManager}</Text>
                  <View style={styles.idCardSignatureContainer}>
                    <View style={styles.idCardSignatureLine} />
                    <Text style={styles.idCardSignatureLabel}>{translations.idCardSignature}</Text>
                  </View>
                  <Text style={styles.idCardFooterText}>{translations.idCardSecretary}</Text>
                </View>
              </View>
            </View>
          </View>
          
        </View>

        {/* Personal Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{translations.personalInformation}</Text>
          
          <View style={styles.field}>
            <Text style={styles.label}>{translations.fullName}</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={formData.fullName}
                onChangeText={(text) => setFormData({...formData, fullName: text})}
                placeholder={translations.enterFullName}
                placeholderTextColor="#9ca3af"
                textAlignVertical="center"
              />
            ) : (
              <Text style={styles.value} numberOfLines={1}>{formData.fullName || translations.nA}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{translations.fatherHusbandName}</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={formData.fatherName}
                onChangeText={(text) => setFormData({...formData, fatherName: text})}
                placeholder={translations.enterFatherName}
                placeholderTextColor="#9ca3af"
                textAlignVertical="center"
              />
            ) : (
              <Text style={styles.value} numberOfLines={1}>{formData.fatherName || translations.nA}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{translations.dateOfBirth}</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={formData.dob}
                onChangeText={(text) => setFormData({...formData, dob: text})}
                placeholder={translations.enterDob}
                placeholderTextColor="#9ca3af"
                textAlignVertical="center"
              />
            ) : (
              <Text style={styles.value} numberOfLines={1}>{formData.dob || translations.nA}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{translations.aadharNumber}</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={formData.aadharNumber}
                onChangeText={(text) => setFormData({...formData, aadharNumber: text})}
                placeholder={translations.enterAadhar}
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                textAlignVertical="center"
              />
            ) : (
              <Text style={styles.value} numberOfLines={1}>{formData.aadharNumber || translations.nA}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{translations.membershipStatus}</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={formData.membershipStatus}
                onChangeText={(text) => setFormData({...formData, membershipStatus: text})}
                placeholder={translations.activeStatus + '/' + translations.inactiveStatus}
                placeholderTextColor="#9ca3af"
                textAlignVertical="center"
              />
            ) : (
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{getStatusLabel(formData.membershipStatus)}</Text>
              </View>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{translations.email}</Text>
            <Text style={styles.value} numberOfLines={1}>{formData.email}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{translations.phone}</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({...formData, phone: text})}
                keyboardType="phone-pad"
                placeholder={translations.enterPhone}
                placeholderTextColor="#9ca3af"
                textAlignVertical="center"
              />
            ) : (
              <Text style={styles.value} numberOfLines={1}>{formData.phone || translations.notProvided}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{translations.address}</Text>
            {editing ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.address}
                onChangeText={(text) => setFormData({...formData, address: text})}
                multiline
                numberOfLines={3}
                placeholder={translations.enterAddress}
                placeholderTextColor="#9ca3af"
                textAlignVertical="top"
              />
            ) : (
              <Text style={styles.value}>{formData.address || translations.notProvided}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{translations.bio}</Text>
            {editing ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.bio}
                onChangeText={(text) => setFormData({...formData, bio: text})}
                multiline
                numberOfLines={2}
                placeholder={translations.tellAboutYourself}
                placeholderTextColor="#9ca3af"
                textAlignVertical="top"
              />
            ) : (
              <Text style={styles.value}>{formData.bio || translations.noBio}</Text>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.field}>
            <Text style={styles.label}>{translations.department}</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={formData.department}
                onChangeText={(text) => setFormData({...formData, department: text})}
                placeholder={translations.enterDepartment}
                placeholderTextColor="#9ca3af"
                textAlignVertical="center"
              />
            ) : (
              <View style={styles.badgeContainer}>
                <MaterialIcons name="business" size={responsiveFont(16)} color="#8b5cf6" />
                <Text style={styles.value} numberOfLines={1}>{formData.department}</Text>
              </View>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{translations.position}</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={formData.position}
                onChangeText={(text) => setFormData({...formData, position: text})}
                placeholder={translations.enterPosition}
                placeholderTextColor="#9ca3af"
                textAlignVertical="center"
              />
            ) : (
              <View style={styles.badgeContainer}>
                <MaterialIcons name="work" size={responsiveFont(16)} color="#8b5cf6" />
                <Text style={styles.value} numberOfLines={1}>{formData.position}</Text>
              </View>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{translations.memberId}</Text>
            <View style={styles.badgeContainer}>
              <MaterialIcons name="badge" size={responsiveFont(16)} color="#8b5cf6" />
              <Text style={styles.value} numberOfLines={1}>{formData.employeeId}</Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{translations.reportingTo}</Text>
            <View style={styles.badgeContainer}>
              <MaterialIcons name="person" size={responsiveFont(16)} color="#f59e0b" />
              <Text style={styles.value} numberOfLines={1}>{formData.reportingTo}</Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{translations.joinedDate}</Text>
            <View style={styles.dateBadge}>
              <MaterialIcons name="calendar-today" size={responsiveFont(14)} color="#6b7280" />
              <Text style={styles.dateText} numberOfLines={1}>{formData.joinedDate}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.card} onPress={navigateToCertificates} activeOpacity={0.7}>
  <View style={styles.certHeader}>
    <Text style={styles.cardTitle}>{translations.certificates}</Text>
    <View style={styles.certHeaderRight}>
      {certificates.length > 0 && (
        <Text style={styles.certCount} numberOfLines={1}>{certificates.length} {translations.earned}</Text>
      )}
      <MaterialIcons name="chevron-right" size={20} color="#8b5cf6" />
    </View>
  </View>

  {certificates.length > 0 ? (
    <>
      {displayedCertificates.map((cert, index) => (
        <TouchableOpacity 
          key={index} 
          style={styles.certItem}
          onPress={() => navigation.navigate('MemberCertificate', { certificate: cert })}
          activeOpacity={0.7}
        >
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
          <MaterialIcons name="chevron-right" size={20} color="#d1d5db" />
        </TouchableOpacity>
      ))}
      {certificates.length > 3 && (
        <TouchableOpacity 
          style={styles.viewAllCertificates}
          onPress={() => setShowAllCertificates(!showAllCertificates)}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllText} numberOfLines={1}>
            {showAllCertificates ? translations.showLess : translations.viewAllCertificates.replace('{count}', certificates.length)}
          </Text>
          <MaterialIcons 
            name={showAllCertificates ? 'expand-less' : 'expand-more'} 
            size={16} 
            color="#8b5cf6" 
          />
        </TouchableOpacity>
      )}
    </>
  ) : (
    <View style={styles.noCertContainer}>
      <MaterialIcons name="verified" size={30} color="#d1d5db" />
      <Text style={styles.noCertText}>{translations.noCertificates}</Text>
      <Text style={styles.noCertSubtext}>{translations.noCertificatesSubtext}</Text>
    </View>
  )}
</TouchableOpacity>
{/* More Settings Button - Navigates to MemberMoreSettingsTabs */}
<TouchableOpacity 
  style={styles.moreSettingsButton}
  onPress={() => navigation.navigate('MemberMoreSettingsTabs')}
  activeOpacity={0.7}
>
  <View style={styles.moreSettingsLeft}>
    <View style={styles.moreSettingsIcon}>
      <MaterialIcons name="settings" size={responsiveFont(24)} color="#ffffff" />
    </View>
    <View style={styles.moreSettingsTextContainer}>
      <Text style={styles.moreSettingsTitle}>{translations.moreSettings}</Text>
      <Text style={styles.moreSettingsSubtitle}>{translations.moreSettingsSubtitle}</Text>
    </View>
  </View>
  <MaterialIcons name="chevron-right" size={responsiveFont(24)} color="#ffffff" />
</TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <MaterialIcons name="logout" size={responsiveFont(20)} color="#ffffff" />
          <Text style={styles.logoutButtonText}>{translations.logout}</Text>
        </TouchableOpacity>

        <View style={styles.versionContainer}>
          <Text style={styles.versionFooterText}>NGO App v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ============ RESPONSIVE STYLES ============

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  headerCard: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: responsiveWidth(20),
    paddingTop: Platform.OS === 'web' ? 20 : responsiveHeight(50),
    paddingBottom: responsiveHeight(16),
    borderBottomLeftRadius: responsiveWidth(30),
    borderBottomRightRadius: responsiveWidth(30),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: responsiveWidth(4),
  },
  headerTitle: {
    fontFamily: Fonts.Bold,
    fontSize: responsiveFont(20),
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: responsiveWidth(8),
  },
  editButton: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: responsiveFont(14),
    paddingHorizontal: responsiveWidth(4),
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: responsiveWidth(16),
    paddingBottom: responsiveHeight(40),
    ...(isWeb && {
      maxWidth: 800,
      alignSelf: 'center',
      width: '100%',
    }),
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontFamily: Fonts.Regular,
    marginTop: responsiveHeight(10),
    color: '#6b7280',
    fontSize: responsiveFont(14),
  },

  profileSection: {
    alignItems: 'center',
    marginTop: responsiveHeight(16),
    marginBottom: responsiveHeight(24),
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: responsiveWidth(120),
    height: responsiveWidth(120),
    borderRadius: responsiveWidth(60),
    borderWidth: 3,
    borderColor: '#8b5cf6',
  },
  placeholderImage: {
    width: responsiveWidth(120),
    height: responsiveWidth(120),
    borderRadius: responsiveWidth(60),
    backgroundColor: '#f5f3ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#8b5cf6',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#8b5cf6',
    borderRadius: responsiveWidth(20),
    padding: responsiveWidth(8),
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  changePhotoText: {
    fontFamily: Fonts.Regular,
    fontSize: responsiveFont(12),
    color: '#8b5cf6',
    marginTop: responsiveHeight(8),
  },
  profileName: {
    fontFamily: Fonts.Bold,
    fontSize: responsiveFont(20),
    color: '#1f2937',
    marginTop: responsiveHeight(8),
    maxWidth: responsiveWidth(width - 60),
  },
  profileBio: {
    fontFamily: Fonts.Regular,
    fontSize: responsiveFont(14),
    color: '#6b7280',
    maxWidth: responsiveWidth(width - 60),
  },

  // Identity Card - Responsive
  idCardWrapper: {
    marginBottom: responsiveHeight(16),
    alignItems: 'center',
    ...(isWeb && {
      maxWidth: 500,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  idCardContainer: {
    width: isWeb ? 400 : width - 32,
    borderRadius: responsiveWidth(12),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  idCard: {
    width: '100%',
    aspectRatio: 1.6,
    backgroundColor: '#ffffff',
    position: 'relative',
    overflow: 'hidden',
  },
  idCardTemplateImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  idCardOverlay: {
    flex: 1,
    padding: responsiveWidth(16),
    position: 'relative',
    zIndex: 1,
  },
  idCardOrgName: {
    fontFamily: Fonts.Bold,
    fontSize: responsiveFont(16),
    color: '#1f2937',
    textAlign: 'center',
  },
  idCardOrgSub: {
    fontFamily: Fonts.Regular,
    fontSize: responsiveFont(10),
    color: '#4b5563',
    textAlign: 'center',
  },
  idCardRegNo: {
    fontFamily: Fonts.Regular,
    fontSize: responsiveFont(9),
    color: '#6b7280',
    textAlign: 'center',
  },
  idCardTitleContainer: {
    alignItems: 'center',
    marginVertical: responsiveHeight(4),
    paddingVertical: responsiveHeight(2),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#d1d5db',
  },
  idCardTitleText: {
    fontFamily: Fonts.Bold,
    fontSize: responsiveFont(18),
    color: '#1f2937',
    letterSpacing: 2,
  },
  idCardDetailsContainer: {
  flex: 1,
  justifyContent: 'center',
  paddingRight: responsiveWidth(100),  // ← Space for photo
  paddingLeft: responsiveWidth(8),     // ← CHANGE THIS - Increase to move right
  paddingTop: responsiveHeight(4),
  paddingBottom: responsiveHeight(4),
},
  idCardFieldRow: {
    flexDirection: 'row',
    marginBottom: responsiveHeight(2),
    alignItems: 'center',
  },
  idCardFieldLabel: {
    fontFamily: Fonts.SemiBold,
    fontSize: responsiveFont(11),
    color: '#4b5563',
    width: responsiveWidth(75),
  },
  idCardFieldValue: {
    fontFamily: Fonts.Regular,
    fontSize: responsiveFont(10),
marginLeft: responsiveWidth(100),
    color: '#1f2937',
    flex: 1,
  },
  idCardStatusValue: {
    color: '#10b981',
    fontFamily: Fonts.SemiBold,
  },
  idCardPhotoContainer: {
    position: 'absolute',
    right: responsiveWidth(16),
    top: '35%',
    alignItems: 'center',
  },
  idCardPhotoWrapper: {
    width: responsiveWidth(75),
    height: responsiveHeight(95),
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  idCardPhoto: {
    width: '100%',
    height: '100%',
  },
  idCardPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  idCardPhotoLabel: {
    fontFamily: Fonts.Regular,
    fontSize: responsiveFont(8),
    color: '#6b7280',
    marginTop: responsiveHeight(2),
  },
  idCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: responsiveHeight(6),
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  idCardFooterText: {
    fontFamily: Fonts.SemiBold,
    fontSize: responsiveFont(10),
    color: '#4b5563',
  },
  idCardSignatureContainer: {
    alignItems: 'center',
  },
  idCardSignatureLine: {
    width: responsiveWidth(55),
    height: 1,
    backgroundColor: '#9ca3af',
    marginBottom: responsiveHeight(2),
  },
  idCardSignatureLabel: {
    fontFamily: Fonts.Regular,
    fontSize: responsiveFont(8),
    color: '#6b7280',
  },

  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    paddingVertical: responsiveHeight(12),
    paddingHorizontal: responsiveWidth(20),
    borderRadius: 8,
    marginTop: responsiveHeight(12),
    gap: 8,
    width: isWeb ? 500 : '100%',
    alignSelf: 'center',
  },
  downloadButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: responsiveFont(14),
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: responsiveWidth(12),
    padding: responsiveWidth(16),
    marginBottom: responsiveHeight(16),
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    ...(isWeb && {
      maxWidth: 500,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  cardTitle: {
    fontFamily: Fonts.Bold,
    fontSize: responsiveFont(16),
    color: '#1f2937',
    marginBottom: responsiveHeight(12),
  },
  field: {
    marginBottom: responsiveHeight(12),
  },
  label: {
    fontFamily: Fonts.SemiBold,
    fontSize: responsiveFont(12),
    color: '#6b7280',
    marginBottom: responsiveHeight(4),
  },
  value: {
    fontFamily: Fonts.Regular,
    fontSize: responsiveFont(15),
    color: '#1f2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: responsiveWidth(10),
    fontSize: responsiveFont(14),
    backgroundColor: '#f9fafb',
    fontFamily: Fonts.Regular,
    color: '#1f2937',
  },
  textArea: {
    height: responsiveHeight(80),
    textAlignVertical: 'top',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: responsiveHeight(12),
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontFamily: Fonts.Regular,
    fontSize: responsiveFont(15),
    color: '#1f2937',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: responsiveWidth(12),
    paddingVertical: responsiveHeight(4),
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: responsiveWidth(8),
    height: responsiveWidth(8),
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  statusText: {
    fontFamily: Fonts.SemiBold,
    color: '#10b981',
    fontSize: responsiveFont(14),
  },

  // Certificates Section
  certHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsiveHeight(12),
  },
  certHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  certCount: {
    fontFamily: Fonts.Regular,
    fontSize: responsiveFont(12),
    color: '#6b7280',
  },
  viewAllCertificates: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: responsiveHeight(10),
    gap: 4,
  },
  viewAllText: {
    fontFamily: Fonts.SemiBold,
    fontSize: responsiveFont(13),
    color: '#8b5cf6',
  },
  certItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: responsiveHeight(10),
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 10,
  },
  certItemIcon: {
    width: responsiveWidth(32),
    height: responsiveWidth(32),
    borderRadius: responsiveWidth(16),
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  certItemContent: {
    flex: 1,
  },
  certItemTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: responsiveFont(13),
    color: '#1f2937',
  },
  certItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  certItemType: {
    fontFamily: Fonts.Regular,
    fontSize: responsiveFont(10),
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  certItemDate: {
    fontFamily: Fonts.Regular,
    fontSize: responsiveFont(10),
    color: '#9ca3af',
  },
  certItemAmount: {
    fontFamily: Fonts.SemiBold,
    fontSize: responsiveFont(13),
    color: '#10b981',
    flexShrink: 0,
  },
  noCertContainer: {
    alignItems: 'center',
    paddingVertical: responsiveHeight(20),
    gap: 6,
  },
  noCertText: {
    fontFamily: Fonts.SemiBold,
    fontSize: responsiveFont(14),
    color: '#6b7280',
  },
  noCertSubtext: {
    fontFamily: Fonts.Regular,
    fontSize: responsiveFont(12),
    color: '#9ca3af',
  },

  // Settings
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: responsiveHeight(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  settingLabel: {
    fontFamily: Fonts.Regular,
    fontSize: responsiveFont(14),
    color: '#1f2937',
    flexShrink: 1,
  },
  versionText: {
    fontFamily: Fonts.Regular,
    fontSize: responsiveFont(13),
    color: '#6b7280',
  },

  // More Settings Button
  moreSettingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#8b5cf6',
    paddingVertical: responsiveHeight(16),
    paddingHorizontal: responsiveWidth(16),
    borderRadius: responsiveWidth(12),
    marginBottom: responsiveHeight(16),
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    ...(isWeb && {
      maxWidth: 500,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  moreSettingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  moreSettingsTextContainer: {
    flex: 1,
  },
  moreSettingsIcon: {
    width: responsiveWidth(44),
    height: responsiveWidth(44),
    borderRadius: responsiveWidth(22),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  moreSettingsTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: responsiveFont(16),
    color: '#ffffff',
  },
  moreSettingsSubtitle: {
    fontFamily: Fonts.Regular,
    fontSize: responsiveFont(12),
    color: 'rgba(255,255,255,0.8)',
    marginTop: responsiveHeight(2),
  },

  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: responsiveHeight(14),
    borderRadius: 8,
    marginBottom: responsiveHeight(12),
    gap: 8,
    ...(isWeb && {
      maxWidth: 500,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  saveButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: responsiveFont(16),
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: responsiveHeight(14),
    borderRadius: 8,
    marginBottom: responsiveHeight(12),
    gap: 8,
    ...(isWeb && {
      maxWidth: 500,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  logoutButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: responsiveFont(16),
  },
  versionContainer: {
    alignItems: 'center',
    marginBottom: responsiveHeight(20),
  },
  versionFooterText: {
    fontFamily: Fonts.Regular,
    fontSize: responsiveFont(12),
    color: '#9ca3af',
  },
});