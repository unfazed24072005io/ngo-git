import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, 
  Alert, Modal, ActivityIndicator, RefreshControl, Image, FlatList, 
  Platform, Dimensions 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db, getAuthInstance } from '../../config/firebase';
import { 
  doc, getDoc, setDoc, updateDoc, deleteDoc, 
  collection, query, where, getDocs, addDoc, onSnapshot 
} from 'firebase/firestore';

import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Fonts } from '../../config/fonts';
import { useLanguage } from '../../context/LanguageContext';

// Web-specific drag and drop support
const isWeb = Platform.OS === 'web';
const { width } = Dimensions.get('window');

export default function CompanyManagement({ navigation }) {
  const { t, counter, isHindi } = useLanguage();
  
  // Force re-render when language changes
  const renderKey = `company-${counter}`;

  // ============ Get Translations ============
  const getTranslations = () => ({
    organizationDashboard: t('company.organizationDashboard') || 'Organization Dashboard',
    edit: t('common.edit') || 'Edit',
servicesOffered: t('company.servicesOffered') || 'Services Offered',
  noDetailsConfigured: t('company.noDetailsConfigured') || 'No details configured',
  detailsConfigured: t('company.detailsConfigured') || 'details configured',
  editServiceDetails: t('company.editServiceDetails') || 'Edit Service Details',
  serviceDescription: t('company.serviceDescription') || 'Description',
  serviceDescriptionHi: t('company.serviceDescriptionHi') || 'Description (Hindi)',
  enterDescriptionEnglish: t('company.enterDescriptionEnglish') || 'Enter description in English',
  enterDescriptionHindi: t('company.enterDescriptionHindi') || 'हिंदी में विवरण दर्ज करें',
  serviceDetails: t('company.serviceDetails') || 'Service Details (Amounts)',
  labelEnglish: t('company.labelEnglish') || 'Label (Eng)',
  labelHindi: t('company.labelHindi') || 'Label (Hi)',
  value: t('company.value') || 'Value',
  noDetailsAdded: t('company.noDetailsAdded') || 'No details added yet',
  addDetail: t('company.addDetail') || 'Add Detail',
  editDetail: t('company.editDetail') || 'Edit Detail',
  deleteDetail: t('company.deleteDetail') || 'Delete Detail',
  save: t('common.save') || 'Save',
  cancel: t('common.cancel') || 'Cancel',
  add: t('common.add') || 'Add',
  update: t('common.update') || 'Update',
  details: t('company.details') || 'Details',
    cancel: t('common.cancel') || 'Cancel',
    services: t('company.services') || 'Services',
    applications: t('company.applications') || 'Applications',
    competitions: t('company.competitions') || 'Competitions',
    active: t('common.active') || 'Active',
    details: t('company.details') || 'Details',
    servicesOffered: t('company.servicesOffered') || 'Services Offered',
    oldAgeAssistance: t('company.oldAgeAssistance') || 'Old Age Assistance',
    kanyaMarriageAssistance: t('company.kanyaMarriageAssistance') || 'Kanya Marriage Assistance',
    selfEmploymentAssistance: t('company.selfEmploymentAssistance') || 'Self Employment Assistance',
    below20Years: t('company.below20Years') || 'Below 20 years',
    between20to40: t('company.between20to40') || '20 - 40 years',
    between40to60: t('company.between40to60') || '40 - 60 years',
    above60Years: t('company.above60Years') || '60 years & above',
    below4Years: t('company.below4Years') || 'Below 4 years',
    between4to8: t('company.between4to8') || '4 - 8 years',
    between8to12: t('company.between8to12') || '8 - 12 years',
    above12Years: t('company.above12Years') || '12 years & above',
    serviceApplications: t('company.serviceApplications') || 'Service Applications',
    pending: t('common.pending') || 'Pending',
    noApplications: t('company.noApplications') || 'No applications yet',
    competitionsTitle: t('company.competitionsTitle') || 'Competitions',
    noCompetitions: t('company.noCompetitions') || 'No competitions created',
    createCompetition: t('company.createCompetition') || 'Create Competition',
    companyInformation: t('company.companyInformation') || 'Company Information',
    organizationName: t('company.organizationName') || 'Organization Name',
    cin: t('company.cin') || 'CIN',
    registrationNumber: t('company.registrationNumber') || 'Registration Number',
    address: t('common.address') || 'Address',
    contactNumber: t('common.contactNumber') || 'Contact Number',
    email: t('common.email') || 'Email',
    website: t('company.website') || 'Website',
    establishedYear: t('company.establishedYear') || 'Established Year',
    employeeCount: t('company.employeeCount') || 'Employee Count',
    presidentName: t('company.presidentName') || 'President Name',
    secretaryName: t('company.secretaryName') || 'Secretary Name',
    tagline: t('company.tagline') || 'Tagline',
    description: t('company.description') || 'Description',
    about: t('company.about') || 'About',
    mission: t('company.mission') || 'Mission',
    vision: t('company.vision') || 'Vision',
    socialMedia: t('company.socialMedia') || 'Social Media',
    facebook: t('company.facebook') || 'Facebook',
    instagram: t('company.instagram') || 'Instagram',
    twitter: t('company.twitter') || 'Twitter',
    linkedin: t('company.linkedin') || 'LinkedIn',
    youtube: t('company.youtube') || 'YouTube',
    committees: t('company.committees') || 'Committees',
    noCommittees: t('company.noCommittees') || 'No committees created',
    members: t('common.members') || 'Members',
    noMembers: t('company.noMembers') || 'No members added',
    documents: t('company.documents') || 'Documents',
    noDocuments: t('company.noDocuments') || 'No documents uploaded',
    addCommittee: t('company.addCommittee') || 'Add Committee',
    editCommittee: t('company.editCommittee') || 'Edit Committee',
    addMember: t('company.addMember') || 'Add Member',
    editMember: t('company.editMember') || 'Edit Member',
    addDocument: t('company.addDocument') || 'Add Document',
    committeeName: t('company.committeeName') || 'Committee Name',
    committeeDescription: t('company.committeeDescription') || 'Description',
    committeeType: t('company.committeeType') || 'Committee Type',
    standing: t('company.standing') || 'Standing',
    adHoc: t('company.adHoc') || 'Ad-hoc',
    special: t('company.special') || 'Special',
    displayOrder: t('company.displayOrder') || 'Display Order',
    memberName: t('common.memberName') || 'Name',
    memberRole: t('common.memberRole') || 'Role',
    memberPosition: t('company.memberPosition') || 'Position',
    memberPhone: t('common.phone') || 'Phone',
    memberEmail: t('common.email') || 'Email',
    memberBio: t('common.bio') || 'Bio',
    documentTitle: t('company.documentTitle') || 'Title',
    documentType: t('company.documentType') || 'Document Type',
    fileUrl: t('company.fileUrl') || 'File URL',
    upload: t('company.upload') || 'Upload',
    applicationDetails: t('company.applicationDetails') || 'Application Details',
    applicantName: t('company.applicantName') || 'Applicant Name',
    fullName: t('common.fullName') || 'Full Name',
    age: t('common.age') || 'Age',
    gender: t('common.gender') || 'Gender',
    occupation: t('company.occupation') || 'Occupation',
    annualIncome: t('company.annualIncome') || 'Annual Income',
    idProof: t('company.idProof') || 'ID Proof',
    ageGroup: t('company.ageGroup') || 'Age Group',
    detailsReason: t('company.detailsReason') || 'Details / Reason',
    expectedAmount: t('company.expectedAmount') || 'Expected Amount',
    fundDetails: t('company.fundDetails') || 'Fund Details',
    amountReleased: t('company.amountReleased') || 'Amount Released',
    remarks: t('common.remarks') || 'Remarks',
    releasedDate: t('company.releasedDate') || 'Released Date',
    verify: t('common.verify') || 'Verify',
    releaseFund: t('company.releaseFund') || 'Release Fund',
    verifyApplication: t('company.verifyApplication') || 'Verify Application',
    confirmVerify: t('company.confirmVerify') || 'Are you sure you want to verify this application?',
    confirmReleaseFund: t('company.confirmReleaseFund') || 'Are you sure you want to release the fund?',
    createCompetitionTitle: t('company.createCompetitionTitle') || 'Create Competition',
    competitionTitle: t('company.competitionTitle') || 'Title',
    competitionCategory: t('company.competitionCategory') || 'Category',
    prize: t('company.prize') || 'Prize (₹)',
    venue: t('company.venue') || 'Venue',
    maxParticipants: t('company.maxParticipants') || 'Max Participants',
    status: t('common.status') || 'Status',
    upcoming: t('company.upcoming') || 'Upcoming',
    live: t('company.live') || 'Live',
    completed: t('company.completed') || 'Completed',
    makeLive: t('company.makeLive') || 'Make Live',
    endCompetition: t('company.endCompetition') || 'End Competition',
    sendPass: t('company.sendPass') || 'Send Pass/Ticket',
    sendCertificate: t('company.sendCertificate') || 'Send Certificate',
    participants: t('company.participants') || 'Participants',
    winner: t('company.winner') || 'Winner',
    loading: t('common.loading') || 'Loading...',
    error: t('common.error') || 'Error',
    success: t('common.success') || 'Success',
    saved: t('common.saved') || 'Saved',
    updated: t('common.updated') || 'Updated',
    deleted: t('common.deleted') || 'Deleted',
    failedToLoad: t('common.failedToLoad') || 'Failed to load',
    confirmDelete: t('common.confirmDelete') || 'Are you sure you want to delete this?',
    delete: t('common.delete') || 'Delete',
    uploadImage: 'Upload Image',
    uploadDocument: 'Upload Document',
    dragDropHere: 'Drag & drop files here or click to browse',
memberPhoto: t('company.memberPhoto') || 'Photo',
    chooseFile: 'Choose File',
    uploading: 'Uploading...',
    uploadSuccess: 'Upload successful!',
    uploadFailed: 'Upload failed. Please try again.',
    fileTooLarge: 'File is too large. Maximum size is 5MB.',
    unsupportedFileType: 'Unsupported file type. Please upload PDF, DOC, DOCX, or images.',
    selectImage: 'Select Image',
    takePhoto: 'Take Photo',
    chooseFromGallery: 'Choose from Gallery',
    logo: 'Logo',
    coverImage: 'Cover Image',
    replace: 'Replace',
    remove: 'Remove',
    uploadingProgress: 'Uploading: {progress}%',
    dragDropActive: 'Drop your files here',
    supportedFormats: 'Supported formats: PDF, DOC, DOCX, JPG, PNG, GIF',
    enter: 'Enter',
    isRequired: 'is required',
    and: 'and',
    areRequired: 'are required',
    enterValidAmount: 'Please enter a valid amount',
    amountToPay: 'Amount to Pay',
    created: 'Created',
    update: 'Update',
    add: 'Add',
    noDescription: 'No description',
    unknown: 'Unknown',
    confirm: 'Confirm',
    availableForUnemployed: 'Available for unemployed elderly people.',
    nA: 'N/A',
  });

  const translations = getTranslations();

  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [activeTab, setActiveTab] = useState('services');
  const [applications, setApplications] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [applicationModalVisible, setApplicationModalVisible] = useState(false);
  const [competitionModalVisible, setCompetitionModalVisible] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [competitionDetailModalVisible, setCompetitionDetailModalVisible] = useState(false);
  const [createCompetitionModalVisible, setCreateCompetitionModalVisible] = useState(false);
  const [fundReleaseModalVisible, setFundReleaseModalVisible] = useState(false);
  const [selectedFundApplication, setSelectedFundApplication] = useState(null);
  const [fundAmount, setFundAmount] = useState('');
  const [fundRemarks, setFundRemarks] = useState('');
  const [verifyConfirmModalVisible, setVerifyConfirmModalVisible] = useState(false);
  const [selectedVerifyApplication, setSelectedVerifyApplication] = useState(null);
  const [fundConfirmModalVisible, setFundConfirmModalVisible] = useState(false);
  const [selectedFundConfirm, setSelectedFundConfirm] = useState(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  // Committee Management States
  const [committees, setCommittees] = useState([]);
const [homeServices, setHomeServices] = useState([]);
const [serviceDetails, setServiceDetails] = useState({});
const [editingService, setEditingService] = useState(null);
const [serviceDetailModalVisible, setServiceDetailModalVisible] = useState(false);
const [serviceDetailForm, setServiceDetailForm] = useState({
  description: '',
  descriptionHi: '',
  details: []
});
const [editingDetailIndex, setEditingDetailIndex] = useState(null);
const [detailForm, setDetailForm] = useState({
  label: '',
  labelHi: '',
  value: ''
});
  const [committeeModalVisible, setCommitteeModalVisible] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState(null);
  const [committeeForm, setCommitteeForm] = useState({
    name: '',
    description: '',
    type: 'standing',
    members: [],
    order: 0
  });

  // Committee Member Management States
  const [committeeMemberModalVisible, setCommitteeMemberModalVisible] = useState(false);
  const [editingCommitteeMember, setEditingCommitteeMember] = useState(null);
  const [selectedCommitteeId, setSelectedCommitteeId] = useState(null);
// Subcommittee States
const [subcommitteeModalVisible, setSubcommitteeModalVisible] = useState(false);
const [editingSubcommittee, setEditingSubcommittee] = useState(null);
const [selectedCommitteeForSub, setSelectedCommitteeForSub] = useState(null);
const [subcommitteeForm, setSubcommitteeForm] = useState({
  name: '',
  description: '',
  type: 'standing',
  members: [],
  order: 0
});
const [subcommitteeMemberModalVisible, setSubcommitteeMemberModalVisible] = useState(false);
const [editingSubcommitteeMember, setEditingSubcommitteeMember] = useState(null);
const [selectedSubcommitteeId, setSelectedSubcommitteeId] = useState(null);
const [subcommitteeMemberForm, setSubcommitteeMemberForm] = useState({
  name: '',
  role: '',
  position: '',
  phone: '',
  email: '',
  photo: '',
  bio: '',
  order: 0
});
const committeeIdRef = useRef(null);
  const [committeeMemberForm, setCommitteeMemberForm] = useState({
  name: '',
  role: '',
  position: '',
  phone: '',
  email: '',
  photo: '',
  bio: '',
  order: 0,
  committeeId: null // Add this
});
  
  // Document Upload States
  const [documents, setDocuments] = useState([]);
  const [documentModalVisible, setDocumentModalVisible] = useState(false);
  const [documentForm, setDocumentForm] = useState({
    title: '',
  description: '',
  type: 'pdf',
  fileUrl: '',          // ImgBB URL
  fileUrlDisplay: '',   // Display URL
  deleteUrl: '',        // Delete URL from ImgBB
  imgbbId: '',          // ImgBB ID
  fileName: '',
  fileSize: 0,
  uploadedAt: new Date().toISOString()
  });

  // Member Management States
  const [members, setMembers] = useState([]);
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberForm, setMemberForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    role: 'member',
    joinDate: '',
    status: 'active'
  });

  const [competitionForm, setCompetitionForm] = useState({
  title: '',
  description: '',
  category: '',
  startDate: '',
  endDate: '',
  prize: '',
  venue: '',
  maxParticipants: '',
  image: '',
  status: 'upcoming',
  registrationFee: '', // ✅ ADD THIS
});

  const [formData, setFormData] = useState({
    organizationName: 'Kabir Ban Bhandari Foundation (Trust)',
    cin: 'U85300BR2024NPL067466',
    address: 'Bihar, Kishanganj, Bongaon, Bihar (854101)',
    contactNo: '9470080435',
    email: 'kabirself@gmail.com',
    presidentName: 'Shri Bablu Bhandari',
    secretaryName: 'Shri Ajit Kumar Bhandari',
    tagline: '',
    description: '',
    about: '',
    mission: '',
    vision: '',
    website: '',
    logo: null,
    coverImage: null,
    facebook: '',
    instagram: '',
    twitter: '',
    linkedin: '',
    youtube: '',
    establishedYear: '2024',
    employeeCount: '',
    registrationNumber: 'U85300BR2024NPL067466',
    oldAgeAssistance: {
      below20: '25000',
      between20to40: '15000',
      between40to60: '10000',
      above60: '5000'
    },
    kanyaMarriageAssistance: {
      below4: '25000',
      between4to8: '15000',
      between8to12: '10000',
      above12: '5000'
    },
    selfEmploymentAssistance: 'Available for unemployed elderly people.'
  });
// Add this after your state declarations
const HARDCODED_SERVICES = [
  { 
    id: 'kanya_vivah', 
    icon: 'child-care', 
    title: 'Kanya Vivaha Sahayata Yojna',
    titleHi: 'कन्या विवाह सहायता योजना'
  },
  { 
    id: 'kabir_anteshti', 
    icon: 'church', 
    title: 'Kabir Anteshti Sahayata Yojna',
    titleHi: 'कबीर अंतेष्टि सहायता योजना'
  },
  { 
    id: 'apada_sahayata', 
    icon: 'warning', 
    title: 'Apada Sahayata Yojana',
    titleHi: 'आपदा सहायता योजना'
  },
  { 
    id: 'siksha_sahayata', 
    icon: 'school', 
    title: 'Siksha Sahayata Yojana',
    titleHi: 'शिक्षा सहायता योजना'
  },
  { 
    id: 'swasth_sahayata', 
    icon: 'health-and-safety', 
    title: 'Swasth Sahayata Yojana',
    titleHi: 'स्वास्थ सहायता योजना'
  }
];
// Add these functions

const fetchServiceDetails = async () => {
  try {
    const servicesRef = collection(db, 'company', 'profile', 'services');
    const servicesSnapshot = await getDocs(servicesRef);
    const detailsMap = {};
    servicesSnapshot.forEach((doc) => {
      detailsMap[doc.id] = { ...doc.data(), id: doc.id };
    });
    setServiceDetails(detailsMap);
  } catch (error) {
    console.error('Error fetching service details:', error);
  }
};

const saveServiceDetails = async () => {
  if (!editingService) return;
  
  try {
    const serviceRef = doc(db, 'company', 'profile', 'services', editingService);
    await setDoc(serviceRef, {
      ...serviceDetailForm,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    setServiceDetails({
      ...serviceDetails,
      [editingService]: { ...serviceDetailForm, id: editingService }
    });
    
    setServiceDetailModalVisible(false);
    resetServiceDetailForm();
    Alert.alert(translations.success, translations.saved);
  } catch (error) {
    Alert.alert(translations.error, error.message);
  }
};

const resetServiceDetailForm = () => {
  setServiceDetailForm({
    description: '',
    descriptionHi: '',
    details: []
  });
  setEditingService(null);
  setEditingDetailIndex(null);
};

const openServiceDetailModal = (serviceId) => {
  const existing = serviceDetails[serviceId];
  setEditingService(serviceId);
  setServiceDetailForm({
    description: existing?.description || '',
    descriptionHi: existing?.descriptionHi || '',
    details: existing?.details || []
  });
  setServiceDetailModalVisible(true);
};

const handleAddDetail = () => {
  if (!detailForm.label || !detailForm.value) {
    Alert.alert('Error', 'Label and Value are required');
    return;
  }
  
  const newDetails = [...serviceDetailForm.details];
  if (editingDetailIndex !== null) {
    newDetails[editingDetailIndex] = { ...detailForm };
    setEditingDetailIndex(null);
  } else {
    newDetails.push({ ...detailForm });
  }
  
  setServiceDetailForm({ ...serviceDetailForm, details: newDetails });
  setDetailForm({ label: '', labelHi: '', value: '' });
};

const handleEditDetail = (index) => {
  setEditingDetailIndex(index);
  setDetailForm({ ...serviceDetailForm.details[index] });
};

const handleDeleteDetail = (index) => {
  const newDetails = serviceDetailForm.details.filter((_, i) => i !== index);
  setServiceDetailForm({ ...serviceDetailForm, details: newDetails });
};
  useEffect(() => {
  fetchOrSeedCompanyData();
  setupApplicationsListener();
  setupCompetitionsListener();
  fetchCommittees();
  fetchDocuments();
  fetchMembers();
  fetchServiceDetails(); // Add this line
}, []);

  // ============ FILE UPLOAD FUNCTIONS ============

  const generateFilePath = (folder, fileName) => {
    const timestamp = Date.now();
    const sanitized = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
    return `company/${folder}/${timestamp}_${sanitized}`;
  };

  // ============ BASE64 CONVERSION FUNCTIONS ============

// Replace the convertToBase64 function with this improved version:

const convertToBase64 = async (file) => {
  try {
    // For web File objects
    if (file instanceof File) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
    }
    
    // For web with file property
    if (file?.file instanceof File) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file.file);
      });
    }
    
    // For mobile - uri based
    if (file?.uri) {
      try {
        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return `data:${file.type || 'image/jpeg'};base64,${base64}`;
      } catch (e) {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error converting to base64:', error);
    return null;
  }
};

const handleDocumentUpload = async () => {
  try {
    if (isWeb) {
      // Web - use input element
      const file = await new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif';
        input.onchange = (e) => {
          const selectedFile = e.target.files[0];
          if (selectedFile) {
            if (selectedFile.size > 32 * 1024 * 1024) {
              Alert.alert('Error', 'File is too large. Maximum size is 32MB.');
              resolve(null);
              return;
            }
            resolve(selectedFile);
          } else {
            resolve(null);
          }
        };
        input.click();
      });
      
      if (!file) return;
      
      let docType = 'document';
      if (file.name?.toLowerCase().endsWith('.pdf')) docType = 'pdf';
      else if (file.name?.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)) docType = 'image';
      else if (file.name?.toLowerCase().match(/\.(doc|docx)$/)) docType = 'document';
      
      const reader = new FileReader();
      const base64Data = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
      
      if (!base64Data) {
        Alert.alert('Error', 'Failed to read file');
        return;
      }
      
      setUploading(true);
      setUploadProgress(30);
      
      const uploadResult = await uploadToImgBB(base64Data, file.name);
      
      setUploadProgress(70);
      
      setDocumentForm({
        ...documentForm,
        title: file.name.replace(/\.[^/.]+$/, ''),
        description: '',
        type: docType,
        fileUrl: uploadResult.url,
        fileUrlDisplay: uploadResult.display_url,
        deleteUrl: uploadResult.delete_url,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        imgbbId: uploadResult.id
      });
      
      setUploadProgress(100);
      setUploading(false);
      
      setDocumentModalVisible(true);
      Alert.alert('Success', 'File uploaded to ImgBB successfully! Click Save to add to documents.');
      
    } else {
      // ============ MOBILE - FIXED ============
      // Use ImagePicker for images on mobile (with cropping support)
      // Use DocumentPicker for PDFs and documents
      
      // First, ask user what type of file they want to upload
      Alert.alert(
        'Select File Type',
        'Choose what type of file you want to upload',
        [
          { 
            text: 'Photo/Image', 
            onPress: async () => {
              // Use ImagePicker for images
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Please allow access to your gallery');
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });

              if (!result.canceled) {
                const selected = result.assets[0];
                
                // Get base64 data
                let base64Data = selected.base64;
                if (!base64Data) {
                  // If base64 is not directly available, read from URI
                  try {
                    const response = await fetch(selected.uri);
                    const blob = await response.blob();
                    base64Data = await new Promise((resolve) => {
                      const reader = new FileReader();
                      reader.onload = () => resolve(reader.result);
                      reader.onerror = () => resolve(null);
                      reader.readAsDataURL(blob);
                    });
                  } catch (e) {
                    Alert.alert('Error', 'Failed to read image data');
                    return;
                  }
                }
                
                if (!base64Data) {
                  Alert.alert('Error', 'Failed to read image data');
                  return;
                }
                
                setUploading(true);
                setUploadProgress(30);
                
                const uploadResult = await uploadToImgBB(base64Data, selected.fileName || 'image.jpg');
                
                setUploadProgress(70);
                
                let docType = 'image';
                if (selected.fileName?.toLowerCase().endsWith('.pdf')) docType = 'pdf';
                
                setDocumentForm({
                  ...documentForm,
                  title: selected.fileName?.replace(/\.[^/.]+$/, '') || 'Image',
                  description: '',
                  type: docType,
                  fileUrl: uploadResult.url,
                  fileUrlDisplay: uploadResult.display_url,
                  deleteUrl: uploadResult.delete_url,
                  fileName: selected.fileName || 'image.jpg',
                  fileSize: selected.fileSize || 0,
                  uploadedAt: new Date().toISOString(),
                  imgbbId: uploadResult.id
                });
                
                setUploadProgress(100);
                setUploading(false);
                setDocumentModalVisible(true);
                Alert.alert('Success', 'Image uploaded successfully! Click Save to add.');
              }
            }
          },
          { 
            text: 'Document (PDF, DOC)', 
            onPress: async () => {
              // Use DocumentPicker for documents
              const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                copyToCacheDirectory: true,
              });

              if (result.type === 'cancel') {
                console.log('📄 User cancelled document picker');
                return;
              }

              if (result.type === 'success' || result.uri) {
                // Handle both old and new DocumentPicker API
                const uri = result.uri || result.assets?.[0]?.uri;
                const name = result.name || result.assets?.[0]?.name || 'document';
                const size = result.size || result.assets?.[0]?.size || 0;
                const mimeType = result.mimeType || result.assets?.[0]?.mimeType || 'application/pdf';

                if (size > 32 * 1024 * 1024) {
                  Alert.alert('Error', 'File is too large. Maximum size is 32MB.');
                  return;
                }
                
                // Read file as base64
                try {
                  const base64Data = await FileSystem.readAsStringAsync(uri, {
                    encoding: FileSystem.EncodingType.Base64,
                  });
                  
                  if (!base64Data) {
                    Alert.alert('Error', 'Failed to read file');
                    return;
                  }
                  
                  const fullBase64 = `data:${mimeType};base64,${base64Data}`;
                  
                  setUploading(true);
                  setUploadProgress(30);
                  
                  const uploadResult = await uploadToImgBB(fullBase64, name);
                  
                  setUploadProgress(70);
                  
                  let docType = 'document';
                  if (name?.toLowerCase().endsWith('.pdf')) docType = 'pdf';
                  
                  setDocumentForm({
                    ...documentForm,
                    title: name.replace(/\.[^/.]+$/, ''),
                    description: '',
                    type: docType,
                    fileUrl: uploadResult.url,
                    fileUrlDisplay: uploadResult.display_url,
                    deleteUrl: uploadResult.delete_url,
                    fileName: name,
                    fileSize: size,
                    uploadedAt: new Date().toISOString(),
                    imgbbId: uploadResult.id
                  });
                  
                  setUploadProgress(100);
                  setUploading(false);
                  setDocumentModalVisible(true);
                  Alert.alert('Success', 'Document uploaded successfully! Click Save to add.');
                  
                } catch (readError) {
                  console.error('Error reading file:', readError);
                  Alert.alert('Error', 'Failed to read file');
                  setUploading(false);
                }
              }
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  } catch (error) {
    console.error('Error uploading document:', error);
    Alert.alert('Error', error.message || 'Failed to upload document');
    setUploading(false);
    setUploadProgress(0);
  }
};

  // ============ IMAGE PICKER (Mobile & Web) ============

  const pickImage = async (type = 'image', aspect = [1, 1]) => {
    try {
      if (isWeb) {
        // Web - use input element
        return new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                resolve({
                  uri: event.target.result,
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  file: file
                });
              };
              reader.readAsDataURL(file);
            } else {
              resolve(null);
            }
          };
          input.click();
        });
      } else {
        // Mobile - use ImagePicker
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
          return null;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: aspect,
          quality: 0.8,
        });

        if (!result.canceled) {
          return {
            uri: result.assets[0].uri,
            name: result.assets[0].fileName || 'image.jpg',
            type: result.assets[0].type || 'image/jpeg',
            size: result.assets[0].fileSize || 0,
          };
        }
        return null;
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(translations.error, translations.uploadFailed);
      return null;
    }
  };

  const takePhoto = async () => {
    if (isWeb) {
      Alert.alert('Not Available', 'Camera is not available on web');
      return null;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera permissions to make this work!');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        return {
          uri: result.assets[0].uri,
          name: result.assets[0].fileName || 'photo.jpg',
          type: result.assets[0].type || 'image/jpeg',
          size: result.assets[0].fileSize || 0,
        };
      }
      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert(translations.error, translations.uploadFailed);
      return null;
    }
  };

  // ============ DOCUMENT PICKER (Mobile & Web) ============

  const pickDocument = async () => {
    try {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*'];
      
      if (isWeb) {
        // Web - use input element
        return new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif';
          input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
              // Validate file size (5MB max)
              if (file.size > 5 * 1024 * 1024) {
                Alert.alert(translations.error, translations.fileTooLarge);
                resolve(null);
                return;
              }
              resolve({
                uri: URL.createObjectURL(file),
                name: file.name,
                type: file.type,
                size: file.size,
                file: file
              });
            } else {
              resolve(null);
            }
          };
          input.click();
        });
      } else {
        // Mobile - use DocumentPicker
        const result = await DocumentPicker.getDocumentAsync({
          type: allowedTypes,
          copyToCacheDirectory: true,
        });

        if (result.type === 'success') {
          // Validate file size (5MB max)
          if (result.size > 5 * 1024 * 1024) {
            Alert.alert(translations.error, translations.fileTooLarge);
            return null;
          }
          return {
            uri: result.uri,
            name: result.name,
            type: result.mimeType || 'application/pdf',
            size: result.size || 0,
          };
        }
        return null;
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert(translations.error, translations.uploadFailed);
      return null;
    }
  };

  // ============ UPLOAD HANDLERS ============
// ============ SUBCOMMITTEE MEMBER FUNCTIONS ============

const handleAddSubcommitteeMember = async () => {
  console.log('🔵 handleAddSubcommitteeMember called');
  console.log('🔵 selectedCommitteeForSub:', selectedCommitteeForSub);
  console.log('🔵 selectedSubcommitteeId:', selectedSubcommitteeId);
  console.log('🔵 subcommitteeMemberForm:', subcommitteeMemberForm);
  
  // Validate required fields
  if (!subcommitteeMemberForm.name || !subcommitteeMemberForm.name.trim()) {
    Alert.alert('Error', 'Member Name is required');
    return;
  }
  
  if (!subcommitteeMemberForm.role || !subcommitteeMemberForm.role.trim()) {
    Alert.alert('Error', 'Member Role is required');
    return;
  }

  // Validate committee selection
  if (!selectedCommitteeForSub || !selectedCommitteeForSub.id) {
    Alert.alert('Error', 'No committee selected. Please try again.');
    return;
  }

  // Validate subcommittee selection
  if (!selectedSubcommitteeId) {
    Alert.alert('Error', 'No subcommittee selected. Please try again.');
    return;
  }

  try {
    const committeeRef = doc(db, 'company', 'profile', 'committees', selectedCommitteeForSub.id);
    
    // Get the latest committee data from Firestore
    const committeeDoc = await getDoc(committeeRef);
    if (!committeeDoc.exists()) {
      Alert.alert('Error', 'Committee not found. Please refresh and try again.');
      return;
    }
    
    const committeeData = committeeDoc.data();
    console.log('🔵 Committee data found');

    // Create new member
    const newMember = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 8),
      name: subcommitteeMemberForm.name.trim(),
      role: subcommitteeMemberForm.role.trim(),
      position: subcommitteeMemberForm.position?.trim() || '',
      phone: subcommitteeMemberForm.phone?.trim() || '',
      email: subcommitteeMemberForm.email?.trim() || '',
      photo: subcommitteeMemberForm.photo || '',
      bio: subcommitteeMemberForm.bio?.trim() || '',
      order: parseInt(subcommitteeMemberForm.order) || 0,
      addedAt: new Date().toISOString()
    };
    
    console.log('🔵 New member:', newMember);

    // Find and update the specific subcommittee
    const currentSubcommittees = committeeData.subcommittees || [];
    const updatedSubcommittees = currentSubcommittees.map(sub => {
      if (sub.id === selectedSubcommitteeId) {
        return {
          ...sub,
          members: [...(sub.members || []), newMember]
        };
      }
      return sub;
    });

    // Update Firestore
    await updateDoc(committeeRef, {
      subcommittees: updatedSubcommittees,
      updatedAt: new Date().toISOString()
    });

    console.log('✅ Firestore updated');

    // Update local state
    const updatedCommittees = committees.map(c => {
      if (c.id === selectedCommitteeForSub.id) {
        return { ...c, subcommittees: updatedSubcommittees };
      }
      return c;
    });
    setCommittees(updatedCommittees);

    // Reset and close
    setSubcommitteeMemberModalVisible(false);
    setSubcommitteeMemberForm({
      name: '',
      role: '',
      position: '',
      phone: '',
      email: '',
      photo: '',
      bio: '',
      order: 0
    });
    setEditingSubcommitteeMember(null);
    setSelectedSubcommitteeId(null);
    
    Alert.alert('✅ Success', 'Member added to subcommittee successfully!');
    
  } catch (error) {
    console.error('❌ Error adding subcommittee member:', error);
    Alert.alert('Error', error.message || 'Failed to add member. Please try again.');
  }
};
const handleEditSubcommitteeMember = async () => {
  console.log('🔵 handleEditSubcommitteeMember called');
  console.log('🔵 editingSubcommitteeMember:', editingSubcommitteeMember);
  console.log('🔵 selectedCommitteeForSub:', selectedCommitteeForSub);
  console.log('🔵 selectedSubcommitteeId:', selectedSubcommitteeId);
  console.log('🔵 subcommitteeMemberForm:', subcommitteeMemberForm);
  
  if (!editingSubcommitteeMember || !editingSubcommitteeMember.id) {
    Alert.alert('Error', 'No member selected to edit');
    return;
  }

  if (!selectedCommitteeForSub || !selectedCommitteeForSub.id) {
    Alert.alert('Error', 'No committee selected');
    return;
  }

  if (!selectedSubcommitteeId) {
    Alert.alert('Error', 'No subcommittee selected');
    return;
  }

  if (!subcommitteeMemberForm.name || !subcommitteeMemberForm.name.trim()) {
    Alert.alert('Error', 'Member Name is required');
    return;
  }

  if (!subcommitteeMemberForm.role || !subcommitteeMemberForm.role.trim()) {
    Alert.alert('Error', 'Member Role is required');
    return;
  }

  try {
    const committeeRef = doc(db, 'company', 'profile', 'committees', selectedCommitteeForSub.id);
    
    const committeeDoc = await getDoc(committeeRef);
    if (!committeeDoc.exists()) {
      Alert.alert('Error', 'Committee not found');
      return;
    }
    
    const committeeData = committeeDoc.data();
    const currentSubcommittees = committeeData.subcommittees || [];

    // Update the specific subcommittee member
    const updatedSubcommittees = currentSubcommittees.map(sub => {
      if (sub.id === selectedSubcommitteeId) {
        const updatedMembers = (sub.members || []).map(m => {
          if (m.id === editingSubcommitteeMember.id) {
            return {
              ...m,
              name: subcommitteeMemberForm.name.trim(),
              role: subcommitteeMemberForm.role.trim(),
              position: subcommitteeMemberForm.position?.trim() || '',
              phone: subcommitteeMemberForm.phone?.trim() || '',
              email: subcommitteeMemberForm.email?.trim() || '',
              photo: subcommitteeMemberForm.photo || '',
              bio: subcommitteeMemberForm.bio?.trim() || '',
              order: parseInt(subcommitteeMemberForm.order) || 0,
              updatedAt: new Date().toISOString()
            };
          }
          return m;
        });
        return { ...sub, members: updatedMembers };
      }
      return sub;
    });

    await updateDoc(committeeRef, {
      subcommittees: updatedSubcommittees,
      updatedAt: new Date().toISOString()
    });

    const updatedCommittees = committees.map(c => {
      if (c.id === selectedCommitteeForSub.id) {
        return { ...c, subcommittees: updatedSubcommittees };
      }
      return c;
    });
    setCommittees(updatedCommittees);

    setSubcommitteeMemberModalVisible(false);
    setSubcommitteeMemberForm({
      name: '',
      role: '',
      position: '',
      phone: '',
      email: '',
      photo: '',
      bio: '',
      order: 0
    });
    setEditingSubcommitteeMember(null);
    setSelectedSubcommitteeId(null);
    
    Alert.alert('✅ Success', 'Member updated successfully!');
    
  } catch (error) {
    console.error('❌ Error editing subcommittee member:', error);
    Alert.alert('Error', error.message || 'Failed to update member');
  }
};
  const handleLogoUpload = async () => {
    Alert.alert(
      translations.selectImage,
      '',
      [
        { text: translations.chooseFromGallery, onPress: async () => {
          const image = await pickImage('logo', [1, 1]);
          if (image) {
            await uploadCompanyImage(image, 'logos');
          }
        }},
        { text: translations.takePhoto, onPress: async () => {
          const image = await takePhoto();
          if (image) {
            await uploadCompanyImage(image, 'logos');
          }
        }},
        { text: translations.cancel, style: 'cancel' }
      ]
    );
  };

  const handleCoverUpload = async () => {
    Alert.alert(
      translations.selectImage,
      '',
      [
        { text: translations.chooseFromGallery, onPress: async () => {
          const image = await pickImage('cover', [16, 9]);
          if (image) {
            await uploadCompanyImage(image, 'covers');
          }
        }},
        { text: translations.takePhoto, onPress: async () => {
          const image = await takePhoto();
          if (image) {
            await uploadCompanyImage(image, 'covers');
          }
        }},
        { text: translations.cancel, style: 'cancel' }
      ]
    );
  };
// ============ IMGBB UPLOAD FUNCTION ============

const uploadToImgBB = async (base64Data, fileName) => {
  const API_KEY = '0ed452629e9d25fa979b96951e4c625d'; // Your API key
  
  try {
    // Remove the "data:image/..." prefix if present
    let base64Clean = base64Data;
    if (base64Data.includes(',')) {
      base64Clean = base64Data.split(',')[1];
    }
    
    // Validate base64 data
    if (!base64Clean || base64Clean.length < 10) {
      throw new Error('Invalid image data');
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('key', API_KEY);
    formData.append('image', base64Clean);
    if (fileName) {
      formData.append('name', fileName);
    }
    
    // Optional: Set expiration (e.g., 1 year = 31536000 seconds)
    // formData.append('expiration', '31536000');
    
    console.log('Uploading to ImgBB...');
    
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Upload failed');
    }
    
    console.log('Upload successful:', result.data.url);
    
    // Return the URL of the uploaded image
    return {
      url: result.data.url,
      display_url: result.data.display_url,
      delete_url: result.data.delete_url,
      id: result.data.id,
      title: result.data.title,
      fileName: result.data.image?.filename || fileName,
      size: result.data.size,
      width: result.data.width,
      height: result.data.height
    };
    
  } catch (error) {
    console.error('ImgBB upload error:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};
  const uploadCompanyImage = async (image, folder) => {
  if (!image) {
    Alert.alert('Error', 'No image selected');
    return;
  }

  setUploading(true);
  setUploadProgress(10);
  
  try {
    console.log(`🔵 Uploading ${folder} image...`);
    
    // Convert to base64
    const base64Data = await convertToBase64(image);
    if (!base64Data) {
      Alert.alert('Error', 'Failed to convert image to base64');
      setUploading(false);
      return;
    }
    
    setUploadProgress(40);
    console.log('✅ Image converted to base64');
    
    // Upload to ImgBB
    const fileName = image.name || `${folder}_${Date.now()}.jpg`;
    console.log(`🔵 Uploading to ImgBB: ${fileName}`);
    
    const uploadResult = await uploadToImgBB(base64Data, fileName);
    
    setUploadProgress(80);
    console.log('✅ Uploaded to ImgBB:', uploadResult.url);
    
    // Store the ImgBB URL
    if (folder === 'logos') {
      setFormData(prev => ({ ...prev, logo: uploadResult.url }));
      console.log('✅ Logo URL set:', uploadResult.url);
    } else if (folder === 'covers') {
      setFormData(prev => ({ ...prev, coverImage: uploadResult.url }));
      console.log('✅ Cover URL set:', uploadResult.url);
    }
    
    setUploadProgress(100);
    Alert.alert(translations.success, translations.uploadSuccess);
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    Alert.alert(translations.error, error.message || translations.uploadFailed);
  } finally {
    setUploading(false);
    // Reset progress after a delay
    setTimeout(() => setUploadProgress(0), 1000);
  }
};
  
  const uploadDocumentFile = async (file) => {
  setUploading(true);
  setUploadProgress(50);
  try {
    // Get the actual file object
    let fileToConvert = file;
    if (file.file instanceof File) {
      fileToConvert = file.file;
    }
    
    const base64Data = await convertToBase64(fileToConvert);
    if (base64Data) {
      setDocumentForm(prev => ({
        ...prev,
        fileUrl: base64Data,
        fileName: file.name,
        fileSize: file.size,
      }));
      setUploadProgress(100);
      Alert.alert('Success', 'Upload successful!');
    } else {
      Alert.alert('Error', 'Failed to convert file to base64');
    }
  } catch (error) {
    console.error('Upload error:', error);
    Alert.alert('Error', 'Upload failed. Please try again.');
  } finally {
    setUploading(false);
    setUploadProgress(0);
  }
};
  // ============ DRAG AND DROP HANDLERS (Web) ============

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (!isWeb) return;

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    
    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      Alert.alert(translations.error, translations.fileTooLarge);
      return;
    }

    // Handle image uploads
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageData = {
          uri: event.target.result,
          name: file.name,
          type: file.type,
          size: file.size,
          file: file
        };
        
        // Determine if it's a logo or cover based on aspect ratio
        Alert.alert(
          'Upload Image',
          'Where would you like to upload this image?',
          [
            { text: 'Logo', onPress: () => uploadCompanyImage(imageData, 'logos') },
            { text: 'Cover Image', onPress: () => uploadCompanyImage(imageData, 'covers') },
            { text: translations.cancel, style: 'cancel' }
          ]
        );
      };
      reader.readAsDataURL(file);
    } else {
      // Handle document uploads
      const fileData = {
        uri: URL.createObjectURL(file),
        name: file.name,
        type: file.type,
        size: file.size,
        file: file
      };
      
      // Open document modal with auto-filled data
      let docType = 'document';
      if (file.name.toLowerCase().endsWith('.pdf')) docType = 'pdf';
      else if (file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)) docType = 'image';
      else if (file.name.toLowerCase().match(/\.(doc|docx)$/)) docType = 'document';

      setDocumentForm({
        title: file.name.replace(/\.[^/.]+$/, ''),
        description: '',
        type: docType,
        fileUrl: fileData.uri,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toISOString()
      });
      
      setDocumentModalVisible(true);
      
      // Upload the file
      await uploadDocumentFile(fileData);
    }
  }, [translations]);

  // ============ EXISTING FUNCTIONS ============

  const setupApplicationsListener = () => {
    const q = query(collection(db, 'serviceApplications'), where('status', 'in', ['pending', 'verified', 'funded']));
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
    const unsubscribe = onSnapshot(collection(db, 'competitions'), (snapshot) => {
      const comps = [];
      snapshot.forEach((doc) => {
        comps.push({ id: doc.id, ...doc.data() });
      });
      setCompetitions(comps);
    });
    return () => unsubscribe();
  };

  const fetchCommittees = async () => {
    try {
      const committeesRef = collection(db, 'company', 'profile', 'committees');
      const snapshot = await getDocs(committeesRef);
      const committeeList = [];
      snapshot.forEach((doc) => {
        committeeList.push({ id: doc.id, ...doc.data() });
      });
      setCommittees(committeeList.sort((a, b) => (a.order || 0) - (b.order || 0)));
    } catch (error) {
      console.error('Error fetching committees:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const docsRef = collection(db, 'company', 'profile', 'documents');
      const snapshot = await getDocs(docsRef);
      const docs = [];
      snapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() });
      });
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const membersRef = collection(db, 'members');
      const snapshot = await getDocs(membersRef);
      const memberList = [];
      snapshot.forEach((doc) => {
        memberList.push({ id: doc.id, ...doc.data() });
      });
      setMembers(memberList);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchOrSeedCompanyData = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'company', 'profile');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCompanyData(data);
        setFormData({
          organizationName: data.organizationName || data.companyName || 'Kabir Ban Bhandari Foundation (Trust)',
          cin: data.cin || 'U85300BR2024NPL067466',
          address: data.address || 'Bihar, Kishanganj, Bongaon, Bihar (854101)',
          contactNo: data.contactNo || data.phone || '9470080435',
          email: data.email || 'kabirself@gmail.com',
          presidentName: data.presidentName || 'Shri Bablu Bhandari',
          secretaryName: data.secretaryName || 'Shri Ajit Kumar Bhandari',
          tagline: data.tagline || '',
          description: data.description || '',
          about: data.about || '',
          mission: data.mission || '',
          vision: data.vision || '',
          website: data.website || '',
          logo: data.logo || null,
          coverImage: data.coverImage || null,
          facebook: data.socialMedia?.facebook || '',
          instagram: data.socialMedia?.instagram || '',
          twitter: data.socialMedia?.twitter || '',
          linkedin: data.socialMedia?.linkedin || '',
          youtube: data.socialMedia?.youtube || '',
          establishedYear: data.establishedYear || '2024',
          employeeCount: data.employeeCount || '',
          registrationNumber: data.registrationNumber || 'U85300BR2024NPL067466',
          oldAgeAssistance: data.oldAgeAssistance || {
            below20: '25000',
            between20to40: '15000',
            between40to60: '10000',
            above60: '5000'
          },
          kanyaMarriageAssistance: data.kanyaMarriageAssistance || {
            below4: '25000',
            between4to8: '15000',
            between8to12: '10000',
            above12: '5000'
          },
          selfEmploymentAssistance: data.selfEmploymentAssistance || 'Available for unemployed elderly people.'
        });
      } else {
        setIsFirstRun(true);
        await seedDefaultData();
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
      Alert.alert(translations.error, translations.failedToLoad);
    } finally {
      setLoading(false);
    }
  };

  const seedDefaultData = async () => {
const auth = getAuthInstance(); // ✅ ADD THIS
    try {
      const defaultData = {
        organizationName: 'Kabir Ban Bhandari Foundation (Trust)',
        cin: 'U85300BR2024NPL067466',
        address: 'Bihar, Kishanganj, Bongaon, Bihar (854101)',
        contactNo: '9470080435',
        email: 'kabirself@gmail.com',
        presidentName: 'Shri Bablu Bhandari',
        secretaryName: 'Shri Ajit Kumar Bhandari',
        tagline: 'Empowering Communities, Changing Lives',
        description: 'Kabir Ban Bhandari Foundation is a non-profit organization dedicated to empowering underprivileged communities through education, healthcare, and social welfare programs.',
        about: 'Kabir Ban Bhandari Foundation (Trust) was established with the vision of creating a better world for everyone.',
        mission: 'To empower communities and create sustainable change through education, healthcare, and social welfare programs.',
        vision: 'A world where every individual has access to quality education, healthcare, and opportunities.',
        website: 'https://www.kabirbanbhandari.org',
        establishedYear: '2024',
        employeeCount: '10-20',
        registrationNumber: 'U85300BR2024NPL067466',
        socialMedia: {
          facebook: 'https://facebook.com/kabirbanbhandari',
          instagram: 'https://instagram.com/kabirbanbhandari',
          twitter: 'https://twitter.com/kabirbanbhandari',
          linkedin: 'https://linkedin.com/company/kabirbanbhandari',
          youtube: 'https://youtube.com/kabirbanbhandari'
        },
        oldAgeAssistance: {
          below20: '25000',
          between20to40: '15000',
          between40to60: '10000',
          above60: '5000'
        },
        kanyaMarriageAssistance: {
          below4: '25000',
          between4to8: '15000',
          between8to12: '10000',
          above12: '5000'
        },
        selfEmploymentAssistance: 'Available for unemployed elderly people.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: auth.currentUser?.uid || 'admin'
      };

      await setDoc(doc(db, 'company', 'profile'), defaultData);
      setCompanyData(defaultData);
      setFormData(defaultData);
    } catch (error) {
      console.error('Error seeding default data:', error);
      Alert.alert(translations.error, 'Failed to seed default data');
    }
  };

  const saveCompanyData = async () => {
  setSaving(true);
  try {
    const docRef = doc(db, 'company', 'profile');
    
    // ✅ Ensure logo and coverImage are URLs (not base64)
    const updateData = {
      ...formData,
      // Make sure logo and coverImage are string URLs
      logo: formData.logo || null,
      coverImage: formData.coverImage || null,
      updatedAt: new Date().toISOString()
    };
    
    // Remove any undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    await updateDoc(docRef, updateData);
    setCompanyData(updateData);
    setEditing(false);
    Alert.alert(translations.success, translations.saved);
  } catch (error) {
    console.error('Error saving company data:', error);
    Alert.alert(translations.error, error.message || 'Failed to save company data');
  } finally {
    setSaving(false);
  }
};

  const handleVerifyApplication = async () => {
const auth = getAuthInstance(); // ✅ ADD THIS
    if (!selectedVerifyApplication) return;
    
    try {
      await updateDoc(doc(db, 'serviceApplications', selectedVerifyApplication.id), {
        status: 'verified',
        verifiedAt: new Date().toISOString(),
        verifiedBy: auth.currentUser?.uid
      });
      setVerifyConfirmModalVisible(false);
      setSelectedVerifyApplication(null);
      Alert.alert(translations.success, translations.updated);
    } catch (error) {
      Alert.alert(translations.error, error.message);
    }
  };

  const handleReleaseFund = async () => {
 const auth = getAuthInstance(); // ✅ ADD THIS
    if (!selectedFundConfirm) return;
    
    try {
      await updateDoc(doc(db, 'serviceApplications', selectedFundConfirm.id), {
        status: 'funded',
        fundAmount: parseFloat(fundAmount) || 0,
        fundRemarks: fundRemarks || 'Fund released',
        fundReleasedAt: new Date().toISOString(),
        fundReleasedBy: auth.currentUser?.uid
      });
      
      setFundConfirmModalVisible(false);
      setFundReleaseModalVisible(false);
      setSelectedFundConfirm(null);
      setFundAmount('');
      setFundRemarks('');
      Alert.alert(translations.success, translations.saved);
    } catch (error) {
      Alert.alert(translations.error, error.message);
    }
  };

  const handleCreateCompetition = async () => {
  const auth = getAuthInstance();
  
  if (!competitionForm.title) {
    Alert.alert(translations.error, translations.competitionTitle + ' ' + translations.isRequired);
    return;
  }

  try {
    // Parse registration fee as number, default to 0
    const registrationFee = parseFloat(competitionForm.registrationFee) || 0;

    await addDoc(collection(db, 'competitions'), {
      ...competitionForm,
      registrationFee: registrationFee, // ✅ ADD THIS
      participants: [],
      winners: [],
      createdAt: new Date().toISOString(),
      createdBy: auth.currentUser?.uid,
      status: competitionForm.status || 'upcoming'
    });
    
    setCreateCompetitionModalVisible(false);
    setCompetitionForm({
      title: '',
      description: '',
      category: '',
      startDate: '',
      endDate: '',
      prize: '',
      venue: '',
      maxParticipants: '',
      image: '',
      status: 'upcoming',
      registrationFee: '' // ✅ Reset this too
    });
    Alert.alert(translations.success, translations.created);
  } catch (error) {
    Alert.alert(translations.error, error.message);
  }
};

  const handleCompetitionAction = async (competitionId, action, data = {}) => {
    try {
      const competitionRef = doc(db, 'competitions', competitionId);
      
      if (action === 'makeLive') {
        await updateDoc(competitionRef, { status: 'live' });
        Alert.alert(translations.success, translations.live);
      } else if (action === 'end') {
        await updateDoc(competitionRef, { status: 'completed' });
        Alert.alert(translations.success, translations.completed);
      } else if (action === 'sendPass') {
        await updateDoc(competitionRef, { 
          passSent: true,
          passSentAt: new Date().toISOString()
        });
        Alert.alert(translations.success, translations.sendPass);
      } else if (action === 'sendCertificate') {
        await updateDoc(competitionRef, { 
          certificateSent: true,
          certificateSentAt: new Date().toISOString()
        });
        Alert.alert(translations.success, translations.sendCertificate);
      }
    } catch (error) {
      Alert.alert(translations.error, error.message);
    }
  };

  const handleAddCommittee = async () => {
const auth = getAuthInstance(); // ✅ ADD THIS
    if (!committeeForm.name) {
      Alert.alert(translations.error, translations.committeeName + ' ' + translations.isRequired);
      return;
    }

    try {
      const committeesRef = collection(db, 'company', 'profile', 'committees');
      const docRef = await addDoc(committeesRef, {
        ...committeeForm,
        members: [],
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser?.uid
      });
      
      setCommittees([...committees, { id: docRef.id, ...committeeForm, members: [] }]);
      setCommitteeModalVisible(false);
      resetCommitteeForm();
      Alert.alert(translations.success, translations.added);
    } catch (error) {
      Alert.alert(translations.error, error.message);
    }
  };
// ============ SUBCOMMITTEE FUNCTIONS ============

// ============ SUBCOMMITTEE FUNCTIONS ============




const handleDeleteSubcommittee = async (committeeId, subcommitteeId) => {
  Alert.alert(
    'Delete Subcommittee',
    'Are you sure you want to delete this subcommittee?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const committeeRef = doc(db, 'company', 'profile', 'committees', committeeId);
            const committee = committees.find(c => c.id === committeeId);
            if (!committee) return;

            const updatedSubcommittees = (committee.subcommittees || []).filter(sub => sub.id !== subcommitteeId);

            await updateDoc(committeeRef, {
              subcommittees: updatedSubcommittees,
              updatedAt: new Date().toISOString()
            });

            const updatedCommittees = committees.map(c => {
              if (c.id === committeeId) {
                return { ...c, subcommittees: updatedSubcommittees };
              }
              return c;
            });
            setCommittees(updatedCommittees);

            Alert.alert('Success', 'Subcommittee deleted successfully!');
          } catch (error) {
            console.error('Error deleting subcommittee:', error);
            Alert.alert('Error', error.message || 'Failed to delete subcommittee');
          }
        }
      }
    ]
  );
};

const resetSubcommitteeForm = () => {
  setSubcommitteeForm({
    name: '',
    description: '',
    type: 'standing',
    members: [],
    order: 0
  });
  setEditingSubcommittee(null);
  setSelectedCommitteeForSub(null);
};
// ============ SUBCOMMITTEE MEMBER FUNCTIONS ============

// Replace the handleAddSubcommittee function with this:

const handleAddSubcommittee = async (committee) => {
  console.log('🔵 handleAddSubcommittee called with committee:', committee);
  console.log('🔵 subcommitteeForm:', subcommitteeForm);
  
  const auth = getAuthInstance();
  
  // ✅ Use the committee passed as parameter
  if (!committee || !committee.id) {
    Alert.alert('Error', 'No committee selected. Please try again.');
    console.error('❌ committee is null or invalid');
    return;
  }

  if (!subcommitteeForm.name || !subcommitteeForm.name.trim()) {
    Alert.alert('Error', 'Subcommittee name is required');
    return;
  }

  try {
    console.log('🔵 Updating committee:', committee.id);
    
    const committeeRef = doc(db, 'company', 'profile', 'committees', committee.id);
    const committeeDoc = await getDoc(committeeRef);
    
    if (!committeeDoc.exists()) {
      Alert.alert('Error', 'Committee not found. Please refresh and try again.');
      return;
    }
    
    const committeeData = committeeDoc.data();
    console.log('🔵 Committee data found');

    const newSubcommittee = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 8),
      name: subcommitteeForm.name.trim(),
      description: subcommitteeForm.description?.trim() || '',
      type: subcommitteeForm.type || 'standing',
      members: [],
      order: parseInt(subcommitteeForm.order) || 0,
      createdAt: new Date().toISOString()
    };
    
    console.log('🔵 New subcommittee:', newSubcommittee);

    const currentSubcommittees = committeeData.subcommittees || [];
    console.log('🔵 Current subcommittees:', currentSubcommittees.length);
    
    await updateDoc(committeeRef, {
      subcommittees: [...currentSubcommittees, newSubcommittee],
      updatedAt: new Date().toISOString()
    });

    console.log('✅ Firestore updated');

    // Update local state
    const updatedCommittees = committees.map(c => {
      if (c.id === committee.id) {
        return { 
          ...c, 
          subcommittees: [...(c.subcommittees || []), newSubcommittee],
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    });
    setCommittees(updatedCommittees);

    setSubcommitteeModalVisible(false);
    resetSubcommitteeForm();
    
    Alert.alert('✅ Success', 'Subcommittee added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding subcommittee:', error);
    Alert.alert('Error', error.message || 'Failed to add subcommittee. Please try again.');
  }
};

const handleEditSubcommittee = async (committee, subcommittee) => {
  console.log('🔵 handleEditSubcommittee called');
  console.log('🔵 committee:', committee);
  console.log('🔵 subcommittee:', subcommittee);
  
  if (!subcommittee || !subcommittee.id) {
    Alert.alert('Error', 'No subcommittee selected to edit');
    return;
  }

  if (!committee || !committee.id) {
    Alert.alert('Error', 'No committee selected');
    return;
  }

  if (!subcommitteeForm.name || !subcommitteeForm.name.trim()) {
    Alert.alert('Error', 'Subcommittee name is required');
    return;
  }

  try {
    const committeeRef = doc(db, 'company', 'profile', 'committees', committee.id);
    
    const committeeDoc = await getDoc(committeeRef);
    if (!committeeDoc.exists()) {
      Alert.alert('Error', 'Committee not found');
      return;
    }
    
    const committeeData = committeeDoc.data();
    const currentSubcommittees = committeeData.subcommittees || [];

    const updatedSubcommittees = currentSubcommittees.map(sub => {
      if (sub.id === subcommittee.id) {
        return {
          ...sub,
          name: subcommitteeForm.name.trim(),
          description: subcommitteeForm.description?.trim() || '',
          type: subcommitteeForm.type || 'standing',
          order: parseInt(subcommitteeForm.order) || 0,
          updatedAt: new Date().toISOString()
        };
      }
      return sub;
    });

    await updateDoc(committeeRef, {
      subcommittees: updatedSubcommittees,
      updatedAt: new Date().toISOString()
    });

    const updatedCommittees = committees.map(c => {
      if (c.id === committee.id) {
        return { ...c, subcommittees: updatedSubcommittees };
      }
      return c;
    });
    setCommittees(updatedCommittees);

    setSubcommitteeModalVisible(false);
    resetSubcommitteeForm();
    Alert.alert('✅ Success', 'Subcommittee updated successfully!');
    
  } catch (error) {
    console.error('❌ Error editing subcommittee:', error);
    Alert.alert('Error', error.message || 'Failed to update subcommittee');
  }
};
const handleDeleteSubcommitteeMember = async (committeeId, subcommitteeId, memberId) => {
  Alert.alert(
    'Delete Member',
    'Are you sure you want to remove this member from the subcommittee?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const committeeRef = doc(db, 'company', 'profile', 'committees', committeeId);
            const committee = committees.find(c => c.id === committeeId);
            if (!committee) return;

            const updatedSubcommittees = (committee.subcommittees || []).map(sub => {
              if (sub.id === subcommitteeId) {
                return {
                  ...sub,
                  members: (sub.members || []).filter(m => m.id !== memberId)
                };
              }
              return sub;
            });

            await updateDoc(committeeRef, {
              subcommittees: updatedSubcommittees,
              updatedAt: new Date().toISOString()
            });

            const updatedCommittees = committees.map(c => {
              if (c.id === committeeId) {
                return { ...c, subcommittees: updatedSubcommittees };
              }
              return c;
            });
            setCommittees(updatedCommittees);

            Alert.alert('Success', 'Member removed successfully!');
          } catch (error) {
            console.error('Error deleting subcommittee member:', error);
            Alert.alert('Error', error.message || 'Failed to remove member');
          }
        }
      }
    ]
  );
};

const resetSubcommitteeMemberForm = () => {
  setSubcommitteeMemberForm({
    name: '',
    role: '',
    position: '',
    phone: '',
    email: '',
    photo: '',
    bio: '',
    order: 0
  });
  setEditingSubcommitteeMember(null);
};
  const handleEditCommittee = async () => {
    if (!editingCommittee) return;
    
    try {
      const committeeRef = doc(db, 'company', 'profile', 'committees', editingCommittee.id);
      await updateDoc(committeeRef, {
        ...committeeForm,
        updatedAt: new Date().toISOString()
      });
      
      const updatedCommittees = committees.map(c => 
        c.id === editingCommittee.id ? { ...c, ...committeeForm } : c
      );
      setCommittees(updatedCommittees);
      setCommitteeModalVisible(false);
      resetCommitteeForm();
      Alert.alert(translations.success, translations.updated);
    } catch (error) {
      Alert.alert(translations.error, error.message);
    }
  };

  const handleDeleteCommittee = async (id) => {
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
              await deleteDoc(doc(db, 'company', 'profile', 'committees', id));
              setCommittees(committees.filter(c => c.id !== id));
              Alert.alert(translations.success, translations.deleted);
            } catch (error) {
              Alert.alert(translations.error, error.message);
            }
          }
        }
      ]
    );
  };
// Add this function after handleCoverUpload


// Add this function after handleCommitteeMemberPhotoUpload

// Replace the existing handleCommitteeMemberPhotoUpload with this:

// Replace the existing handleCommitteeMemberPhotoUpload with this:

const handleCommitteeMemberPhotoUpload = async () => {
  try {
    if (isWeb) {
      // Web - use input element (same as document upload)
      const file = await new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const selectedFile = e.target.files[0];
          if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) {
              Alert.alert('Error', 'File is too large. Maximum size is 5MB.');
              resolve(null);
              return;
            }
            resolve(selectedFile);
          } else {
            resolve(null);
          }
        };
        input.click();
      });
      
      if (!file) return;
      
      // Convert to base64
      const reader = new FileReader();
      const base64Data = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
      
      if (!base64Data) {
        Alert.alert('Error', 'Failed to read file');
        return;
      }
      
      // Upload to ImgBB (same as documents)
      setUploading(true);
      setUploadProgress(30);
      
      const uploadResult = await uploadToImgBB(base64Data, file.name);
      
      setUploadProgress(70);
      
      // Update form with ImgBB URL (same as documents)
      setCommitteeMemberForm({
        ...committeeMemberForm,
        photo: uploadResult.url
      });
      
      setUploadProgress(100);
      Alert.alert('Success', 'Photo uploaded successfully!');
      setUploading(false);
      
    } else {
      // Mobile - use ImagePicker (same as document picker pattern)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const selected = result.assets[0];
        
        // Convert to base64 for mobile (same as documents)
        const base64Data = await convertToBase64({
          uri: selected.uri,
          type: selected.type || 'image/jpeg',
          name: selected.fileName || 'photo.jpg',
          size: selected.fileSize || 0
        });
        
        if (base64Data) {
          setUploading(true);
          setUploadProgress(30);
          
          // Upload to ImgBB (same as documents)
          const uploadResult = await uploadToImgBB(base64Data, selected.fileName || 'photo.jpg');
          
          setUploadProgress(70);
          
          // Update form with ImgBB URL (same as documents)
          setCommitteeMemberForm({
            ...committeeMemberForm,
            photo: uploadResult.url
          });
          
          setUploadProgress(100);
          Alert.alert('Success', 'Photo uploaded successfully!');
          setUploading(false);
        }
      }
    }
  } catch (error) {
    console.error('Error uploading photo:', error);
    Alert.alert('Error', error.message || 'Failed to upload photo');
    setUploading(false);
    setUploadProgress(0);
  }
};
  const handleAddCommitteeMember = async () => {
  // Use the ref value if state is null (as fallback)
  const committeeId = selectedCommitteeId || committeeIdRef.current;
  
  console.log('Adding member to committee. Selected ID (state):', selectedCommitteeId);
  console.log('Adding member to committee. Selected ID (ref):', committeeIdRef.current);
  console.log('Using committee ID:', committeeId);
  console.log('Form data:', committeeMemberForm);
  
  // Validate required fields
  if (!committeeMemberForm.name || !committeeMemberForm.role) {
    Alert.alert(
      'Error',
      'Member Name and Role are required'
    );
    return;
  }

  if (!committeeId) {
    Alert.alert('Error', 'No committee selected. Please try again.');
    console.error('Committee ID is null. selectedCommitteeId:', selectedCommitteeId, 'ref:', committeeIdRef.current);
    return;
  }

  try {
    // Find the committee
    const committee = committees.find(c => c.id === committeeId);
    
    if (!committee) {
      Alert.alert('Error', 'Committee not found. Please refresh and try again.');
      console.error('Committee not found with ID:', committeeId);
      console.log('Available committees:', committees.map(c => c.id));
      return;
    }
    
    console.log('Found committee:', committee.name);
    
    // Get current members
    const currentMembers = committee.members || [];
    console.log('Current members count:', currentMembers.length);
    
    // Create new member with unique ID
    const newMember = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
      name: committeeMemberForm.name.trim(),
      role: committeeMemberForm.role.trim(),
      position: committeeMemberForm.position?.trim() || '',
      phone: committeeMemberForm.phone?.trim() || '',
      email: committeeMemberForm.email?.trim() || '',
      photo: committeeMemberForm.photo || '',
      bio: committeeMemberForm.bio?.trim() || '',
      order: parseInt(committeeMemberForm.order) || 0,
      addedAt: new Date().toISOString()
    };
    
    console.log('New member to add:', newMember);
    
    // Reference to the committee document
    const committeeRef = doc(db, 'company', 'profile', 'committees', committeeId);
    
    // Update Firestore
    await updateDoc(committeeRef, {
      members: [...currentMembers, newMember],
      updatedAt: new Date().toISOString()
    });
    
    console.log('Firestore updated successfully');
    
    // Update local state
    const updatedCommittees = committees.map(c => {
      if (c.id === committeeId) {
        return { 
          ...c, 
          members: [...(c.members || []), newMember] 
        };
      }
      return c;
    });
    setCommittees(updatedCommittees);
    
    console.log('Local state updated');
    
    // Close modal and reset form
    setCommitteeMemberModalVisible(false);
    setCommitteeMemberForm({
      name: '',
      role: '',
      position: '',
      phone: '',
      email: '',
      photo: '',
      bio: '',
      order: 0
    });
    setEditingCommitteeMember(null);
    setSelectedCommitteeId(null);
    committeeIdRef.current = null; // Clear the ref
    
    Alert.alert('Success', 'Member added successfully!');
    
  } catch (error) {
    console.error('Error adding committee member:', error);
    Alert.alert('Error', error.message || 'Failed to add member. Please try again.');
  }
};
  const handleEditCommitteeMember = async () => {
  // Use the ref value if state is null
  const committeeId = selectedCommitteeId || committeeIdRef.current;
  
  console.log('Editing member. Committee ID:', committeeId);
  console.log('Editing member:', editingCommitteeMember);
  console.log('Form data:', committeeMemberForm);
  
  if (!editingCommitteeMember || !committeeId) {
    Alert.alert('Error', 'No member or committee selected');
    return;
  }
  
  if (!committeeMemberForm.name || !committeeMemberForm.role) {
    Alert.alert(
      'Error',
      'Member Name and Role are required'
    );
    return;
  }
  
  try {
    const committee = committees.find(c => c.id === committeeId);
    
    if (!committee) {
      Alert.alert('Error', 'Committee not found');
      return;
    }
    
    const currentMembers = committee.members || [];
    const updatedMembers = currentMembers.map(m => {
      if (m.id === editingCommitteeMember.id) {
        return {
          ...m,
          name: committeeMemberForm.name.trim(),
          role: committeeMemberForm.role.trim(),
          position: committeeMemberForm.position?.trim() || '',
          phone: committeeMemberForm.phone?.trim() || '',
          email: committeeMemberForm.email?.trim() || '',
          photo: committeeMemberForm.photo || '',
          bio: committeeMemberForm.bio?.trim() || '',
          order: parseInt(committeeMemberForm.order) || 0,
          updatedAt: new Date().toISOString()
        };
      }
      return m;
    });
    
    const committeeRef = doc(db, 'company', 'profile', 'committees', committeeId);
    
    await updateDoc(committeeRef, {
      members: updatedMembers,
      updatedAt: new Date().toISOString()
    });
    
    const updatedCommittees = committees.map(c => {
      if (c.id === committeeId) {
        return { ...c, members: updatedMembers };
      }
      return c;
    });
    setCommittees(updatedCommittees);
    
    setCommitteeMemberModalVisible(false);
    setCommitteeMemberForm({
      name: '',
      role: '',
      position: '',
      phone: '',
      email: '',
      photo: '',
      bio: '',
      order: 0
    });
    setEditingCommitteeMember(null);
    setSelectedCommitteeId(null);
    committeeIdRef.current = null; // Clear the ref
    
    Alert.alert('Success', 'Member updated successfully!');
    
  } catch (error) {
    console.error('Error updating committee member:', error);
    Alert.alert('Error', error.message || 'Failed to update member');
  }
};
  const handleDeleteCommitteeMember = async (committeeId, memberId) => {
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
              const committeeRef = doc(db, 'company', 'profile', 'committees', committeeId);
              const committee = committees.find(c => c.id === committeeId);
              
              const updatedMembers = committee.members.filter(m => m.id !== memberId);
              
              await updateDoc(committeeRef, {
                members: updatedMembers,
                updatedAt: new Date().toISOString()
              });
              
              const updatedCommittees = committees.map(c => {
                if (c.id === committeeId) {
                  return { ...c, members: updatedMembers };
                }
                return c;
              });
              setCommittees(updatedCommittees);
              
              Alert.alert(translations.success, translations.deleted);
            } catch (error) {
              Alert.alert(translations.error, error.message);
            }
          }
        }
      ]
    );
  };

  const resetCommitteeForm = () => {
    setCommitteeForm({
      name: '',
      description: '',
      type: 'standing',
      members: [],
      order: 0
    });
    setEditingCommittee(null);
  };

  const resetCommitteeMemberForm = () => {
  setCommitteeMemberForm({
    name: '',
    role: '',
    position: '',
    phone: '',
    email: '',
    photo: '',
    bio: '',
    order: 0
  });
  setEditingCommitteeMember(null);
  // Don't reset selectedCommitteeId here - it should be managed separately
};
  const handleAddDocument = async () => {
const auth = getAuthInstance(); // ✅ ADD THIS
  if (!documentForm.title || !documentForm.fileUrl) {
    Alert.alert('Error', 'Title and file are required');
    return;
  }

  try {
    setUploading(true);
    
    // fileUrl is already the ImgBB URL, not Base64!
    const docsRef = collection(db, 'company', 'profile', 'documents');
    const docRef = await addDoc(docsRef, {
      title: documentForm.title,
      description: documentForm.description || '',
      type: documentForm.type,
      fileUrl: documentForm.fileUrl, // ← ImgBB URL (not Base64)
      fileUrlDisplay: documentForm.fileUrlDisplay || documentForm.fileUrl,
      deleteUrl: documentForm.deleteUrl || '',
      imgbbId: documentForm.imgbbId || '',
      fileName: documentForm.fileName || '',
      fileSize: documentForm.fileSize || 0,
      uploadedAt: new Date().toISOString(),
      uploadedBy: auth.currentUser?.uid
    });
    
    // Update local state
    setDocuments([...documents, { 
      id: docRef.id,
      title: documentForm.title,
      description: documentForm.description || '',
      type: documentForm.type,
      fileUrl: documentForm.fileUrl,
      fileUrlDisplay: documentForm.fileUrlDisplay || documentForm.fileUrl,
      deleteUrl: documentForm.deleteUrl || '',
      imgbbId: documentForm.imgbbId || '',
      fileName: documentForm.fileName || '',
      fileSize: documentForm.fileSize || 0,
      uploadedAt: new Date().toISOString()
    }]);
    
    setDocumentModalVisible(false);
    resetDocumentForm();
    
    Alert.alert('Success', 'Document added successfully!');
    
  } catch (error) {
    console.error('Error adding document:', error);
    Alert.alert('Error', error.message || 'Failed to add document');
  } finally {
    setUploading(false);
  }
};
  const handleDeleteDocument = async (id) => {
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
              await deleteDoc(doc(db, 'company', 'profile', 'documents', id));
              setDocuments(documents.filter(d => d.id !== id));
              Alert.alert(translations.success, translations.deleted);
            } catch (error) {
              Alert.alert(translations.error, error.message);
            }
          }
        }
      ]
    );
  };

  const handleAddMember = async () => {
const auth = getAuthInstance(); // ✅ ADD THIS
    if (!memberForm.name || !memberForm.email) {
      Alert.alert(translations.error, translations.memberName + ' ' + translations.and + ' ' + translations.email + ' ' + translations.areRequired);
      return;
    }

    try {
      const membersRef = collection(db, 'members');
      const docRef = await addDoc(membersRef, {
        ...memberForm,
        joinDate: memberForm.joinDate || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser?.uid
      });
      
      setMembers([...members, { id: docRef.id, ...memberForm }]);
      setMemberModalVisible(false);
      resetMemberForm();
      Alert.alert(translations.success, translations.added);
    } catch (error) {
      Alert.alert(translations.error, error.message);
    }
  };

  const handleEditMember = async () => {
    if (!editingMember) return;
    
    try {
      const memberRef = doc(db, 'members', editingMember.id);
      await updateDoc(memberRef, {
        ...memberForm,
        updatedAt: new Date().toISOString()
      });
      
      const updatedMembers = members.map(m => 
        m.id === editingMember.id ? { ...m, ...memberForm } : m
      );
      setMembers(updatedMembers);
      setMemberModalVisible(false);
      resetMemberForm();
      Alert.alert(translations.success, translations.updated);
    } catch (error) {
      Alert.alert(translations.error, error.message);
    }
  };

  const handleDeleteMember = async (id) => {
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
              await deleteDoc(doc(db, 'members', id));
              setMembers(members.filter(m => m.id !== id));
              Alert.alert(translations.success, translations.deleted);
            } catch (error) {
              Alert.alert(translations.error, error.message);
            }
          }
        }
      ]
    );
  };

  const resetMemberForm = () => {
    setMemberForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      role: 'member',
      joinDate: '',
      status: 'active'
    });
    setEditingMember(null);
  };

  const openVerifyModal = (application) => {
    setSelectedVerifyApplication(application);
    setVerifyConfirmModalVisible(true);
  };

  const openFundReleaseModal = (application) => {
    setSelectedFundConfirm(application);
    setFundReleaseModalVisible(true);
  };

  const confirmFundRelease = () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      Alert.alert(translations.error, translations.enterValidAmount);
      return;
    }
    setFundConfirmModalVisible(true);
  };

  const getServiceTypeLabel = (type) => {
    switch(type) {
      case 'oldAge': return translations.oldAgeAssistance;
      case 'kanya': return translations.kanyaMarriageAssistance;
      case 'selfEmployment': return translations.selfEmploymentAssistance;
      default: return type;
    }
  };

  const renderEditableField = (label, value, field, multiline = false) => {
    if (editing) {
      return (
        <View style={styles.field}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={[styles.input, multiline && styles.textArea]}
            value={value || ''}
            onChangeText={(text) => setFormData({...formData, [field]: text})}
            placeholder={`${translations.enter} ${label}`}
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
            textAlignVertical={multiline ? 'top' : 'center'}
          />
        </View>
      );
    }
    return <InfoRow label={label} value={value || translations.nA} multiline={multiline} />;
  };

  const ApplicationCard = ({ application }) => (
    <TouchableOpacity 
      style={styles.applicationCard}
      onPress={() => {
        setSelectedApplication(application);
        setApplicationModalVisible(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.applicationHeader}>
        <View style={styles.applicationUser}>
          <View style={styles.applicationAvatar}>
            <Text style={styles.applicationAvatarText}>
              {application.userName?.charAt(0) || 'U'}
            </Text>
          </View>
          <View>
            <Text style={styles.applicationUserName}>{application.userName || 'Unknown User'}</Text>
            <Text style={styles.applicationService}>{getServiceTypeLabel(application.serviceType)}</Text>
          </View>
        </View>
        <View style={[styles.applicationStatus, { backgroundColor: 
          application.status === 'pending' ? '#fef3c7' : 
          application.status === 'verified' ? '#dbeafe' : '#d1fae5'
        }]}>
          <Text style={[styles.applicationStatusText, { color:
            application.status === 'pending' ? '#d97706' : 
            application.status === 'verified' ? '#2563eb' : '#059669'
          }]}>
            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
          </Text>
        </View>
      </View>
      
      <View style={application.status === 'pending' ? styles.applicationActions : null}>
        {application.status === 'pending' && (
          <TouchableOpacity 
            style={[styles.applicationButton, styles.verifyButton]}
            onPress={() => openVerifyModal(application)}
          >
            <MaterialIcons name="check-circle" size={16} color="#ffffff" />
            <Text style={styles.applicationButtonText}>{translations.verify}</Text>
          </TouchableOpacity>
        )}

        {application.status === 'verified' && (
          <TouchableOpacity 
            style={[styles.applicationButton, styles.fundButton]}
            onPress={() => openFundReleaseModal(application)}
          >
            <MaterialIcons name="payments" size={16} color="#ffffff" />
            <Text style={styles.applicationButtonText}>{translations.releaseFund}</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const CompetitionCard = ({ competition }) => (
  <TouchableOpacity 
    style={styles.competitionCard}
    onPress={() => {
      setSelectedCompetition(competition);
      setCompetitionDetailModalVisible(true);
    }}
    activeOpacity={0.7}
  >
    <View style={styles.competitionHeader}>
      <Text style={styles.competitionTitle} numberOfLines={1}>{competition.title}</Text>
      <View style={[styles.competitionStatus, { backgroundColor:
        competition.status === 'upcoming' ? '#fef3c7' :
        competition.status === 'live' ? '#dbeafe' : '#d1fae5'
      }]}>
        <Text style={[styles.competitionStatusText, { color:
          competition.status === 'upcoming' ? '#d97706' :
          competition.status === 'live' ? '#2563eb' : '#059669'
        }]}>
          {competition.status?.toUpperCase() || translations.upcoming.toUpperCase()}
        </Text>
      </View>
    </View>
    
    <Text style={styles.competitionDescription} numberOfLines={2}>
      {competition.description || translations.noDescription}
    </Text>
    
    <View style={styles.competitionDetails}>
      <View style={styles.competitionDetail}>
        <MaterialIcons name="people" size={16} color="#6b7280" />
        <Text style={styles.competitionDetailText}>
          {competition.participants?.length || 0} {translations.participants}
        </Text>
      </View>
      <View style={styles.competitionDetail}>
        <MaterialIcons name="emoji-events" size={16} color="#6b7280" />
        <Text style={styles.competitionDetailText}>₹{competition.prize || '0'}</Text>
      </View>
      {/* ✅ ADD REGISTRATION FEE DISPLAY */}
      {(competition.registrationFee > 0) && (
        <View style={styles.competitionDetail}>
          <MaterialIcons name="payments" size={16} color="#6b7280" />
          <Text style={[styles.competitionDetailText, { color: '#10b981' }]}>
            ₹{competition.registrationFee} fee
          </Text>
        </View>
      )}
    </View>
    
    {competition.winner && (
      <View style={styles.winnerBadge}>
        <MaterialIcons name="stars" size={14} color="#f59e0b" />
        <Text style={styles.winnerText}>{translations.winner}: {competition.winnerName}</Text>
      </View>
    )}
  </TouchableOpacity>
);

  if (loading) {
    return (
      <View style={styles.loadingContainer} key={renderKey}>
        <ActivityIndicator size="large" color="#FF7722" />
        <Text style={styles.loadingText}>{translations.loading}</Text>
      </View>
    );
  }

  return (
    <View 
      style={styles.container} 
      key={renderKey}
      {...(isWeb ? {
        onDragOver: handleDragOver,
        onDragEnter: handleDragOver,
        onDragLeave: handleDragLeave,
        onDrop: handleDrop,
      } : {})}
    >
      {/* Drag and Drop Overlay (Web only) */}
      {isWeb && isDraggingOver && (
        <View style={styles.dragOverlay}>
          <View style={styles.dragOverlayContent}>
            <MaterialIcons name="cloud-upload" size={60} color="#FF7722" />
            <Text style={styles.dragOverlayText}>{translations.dragDropActive}</Text>
            <Text style={styles.dragOverlaySubtext}>{translations.supportedFormats}</Text>
          </View>
        </View>
      )}

      {/* Upload Progress Overlay */}
      {uploading && (
        <View style={styles.uploadOverlay}>
          <View style={styles.uploadProgressCard}>
            <ActivityIndicator size="large" color="#FF7722" />
            <Text style={styles.uploadProgressText}>
              {translations.uploadingProgress.replace('{progress}', Math.round(uploadProgress))}
            </Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
            </View>
          </View>
        </View>
      )}

      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{translations.organizationDashboard}</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Text style={styles.editButton}>{editing ? translations.cancel : translations.edit}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
  {['services', 'applications', 'competitions', 'details'].map((tab) => (
    <TouchableOpacity
      key={tab}
      style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
      onPress={() => setActiveTab(tab)}
      activeOpacity={0.7}
    >
      <MaterialIcons 
        name={
          tab === 'services' ? 'handshake' :
          tab === 'applications' ? 'people' : 
          tab === 'competitions' ? 'emoji-events' : 'info'
        } 
        size={18} 
        color={activeTab === tab ? '#FF7722' : '#6b7280'} 
      />
      {/* ✅ TEXT REMOVED */}
    </TouchableOpacity>
  ))}
</View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchOrSeedCompanyData} colors={['#FF7722']} />
        }
      >
        {activeTab === 'services' && (
  <View style={styles.card}>
    <View style={styles.sectionHeader}>
      <MaterialIcons name="handshake" size={20} color="#FF7722" />
      <Text style={styles.sectionTitle}>{translations.servicesOffered}</Text>
    </View>
    
    {HARDCODED_SERVICES.map((service) => {
      const details = serviceDetails[service.id];
      const hasDetails = details && details.details && details.details.length > 0;
      
      return (
        <View key={service.id} style={styles.serviceManagementCard}>
          <View style={styles.serviceManagementHeader}>
            <View style={styles.serviceManagementIcon}>
              <MaterialIcons name={service.icon} size={24} color="#FF7722" />
            </View>
            <View style={styles.serviceManagementInfo}>
              <Text style={styles.serviceManagementName}>
                {isHindi ? service.titleHi : service.title}
              </Text>
              {details?.description && (
                <Text style={styles.serviceManagementDesc} numberOfLines={1}>
                  {isHindi && details.descriptionHi ? details.descriptionHi : details.description}
                </Text>
              )}
              <Text style={styles.serviceManagementMeta}>
                {hasDetails 
                  ? `${details.details.length} ${translations.detailsConfigured}` 
                  : translations.noDetailsConfigured}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.editServiceButton}
              onPress={() => openServiceDetailModal(service.id)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="edit" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      );
    })}
  </View>
)}
        {activeTab === 'applications' && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="people" size={20} color="#FF7722" />
              <Text style={styles.sectionTitle}>{translations.serviceApplications}</Text>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>
                  {applications.filter(a => a.status === 'pending').length} {translations.pending}
                </Text>
              </View>
            </View>
            
            {applications.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="inbox" size={40} color="#d1d5db" />
                <Text style={styles.emptyStateText}>{translations.noApplications}</Text>
              </View>
            ) : (
              applications.map((app) => (
                <ApplicationCard key={app.id} application={app} />
              ))
            )}
          </View>
        )}

        {activeTab === 'competitions' && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="emoji-events" size={20} color="#FF7722" />
              <Text style={styles.sectionTitle}>{translations.competitionsTitle}</Text>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={() => setCreateCompetitionModalVisible(true)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="add" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
            
            {competitions.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="emoji-events" size={40} color="#d1d5db" />
                <Text style={styles.emptyStateText}>{translations.noCompetitions}</Text>
                <TouchableOpacity 
                  style={styles.createCompetitionButton}
                  onPress={() => setCreateCompetitionModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.createCompetitionButtonText}>{translations.createCompetition}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              competitions.map((comp) => (
                <CompetitionCard key={comp.id} competition={comp} />
              ))
            )}
          </View>
        )}

        {activeTab === 'details' && (
          <View>
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="business" size={20} color="#FF7722" />
                <Text style={styles.sectionTitle}>{translations.companyInformation}</Text>
                {editing && (
                  <TouchableOpacity 
                    style={[styles.createButton, { backgroundColor: '#10b981' }]}
                    onPress={saveCompanyData}
                    disabled={saving}
                    activeOpacity={0.7}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <MaterialIcons name="save" size={20} color="#ffffff" />
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* Logo Upload Section */}
              <View style={styles.uploadSection}>
                <Text style={styles.uploadSectionTitle}>{translations.logo}</Text>
                <View style={styles.uploadContainer}>
                  {formData.logo ? (
                    <Image source={{ uri: formData.logo }} style={styles.uploadPreview} />
                  ) : (
                    <View style={styles.uploadPlaceholder}>
                      <MaterialIcons name="photo-camera" size={40} color="#9ca3af" />
                      <Text style={styles.uploadPlaceholderText}>{translations.uploadImage}</Text>
                    </View>
                  )}
                  <View style={styles.uploadActions}>
                    <TouchableOpacity 
                      style={[styles.uploadButton, styles.uploadButtonPrimary]}
                      onPress={handleLogoUpload}
                      disabled={uploading}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="file-upload" size={20} color="#ffffff" />
                      <Text style={styles.uploadButtonText}>
                        {formData.logo ? translations.replace : translations.upload}
                      </Text>
                    </TouchableOpacity>
                    {formData.logo && (
                      <TouchableOpacity 
                        style={[styles.uploadButton, styles.uploadButtonDanger]}
                        onPress={() => setFormData({...formData, logo: null})}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name="delete" size={20} color="#ffffff" />
                        <Text style={styles.uploadButtonText}>{translations.remove}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                {isWeb && (
                  <Text style={styles.uploadHelperText}>{translations.dragDropHere}</Text>
                )}
              </View>

              {/* Cover Image Upload Section */}
              <View style={styles.uploadSection}>
                <Text style={styles.uploadSectionTitle}>{translations.coverImage}</Text>
                <View style={styles.uploadContainer}>
                  {formData.coverImage ? (
                    <Image source={{ uri: formData.coverImage }} style={[styles.uploadPreview, styles.coverPreview]} />
                  ) : (
                    <View style={[styles.uploadPlaceholder, styles.coverPlaceholder]}>
                      <MaterialIcons name="image" size={40} color="#9ca3af" />
                      <Text style={styles.uploadPlaceholderText}>{translations.uploadImage}</Text>
                    </View>
                  )}
                  <View style={styles.uploadActions}>
                    <TouchableOpacity 
                      style={[styles.uploadButton, styles.uploadButtonPrimary]}
                      onPress={handleCoverUpload}
                      disabled={uploading}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="file-upload" size={20} color="#ffffff" />
                      <Text style={styles.uploadButtonText}>
                        {formData.coverImage ? translations.replace : translations.upload}
                      </Text>
                    </TouchableOpacity>
                    {formData.coverImage && (
                      <TouchableOpacity 
                        style={[styles.uploadButton, styles.uploadButtonDanger]}
                        onPress={() => setFormData({...formData, coverImage: null})}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name="delete" size={20} color="#ffffff" />
                        <Text style={styles.uploadButtonText}>{translations.remove}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                {isWeb && (
                  <Text style={styles.uploadHelperText}>{translations.dragDropHere}</Text>
                )}
              </View>

              {renderEditableField(translations.organizationName, formData.organizationName, 'organizationName')}
              {renderEditableField(translations.cin, formData.cin, 'cin')}
              {renderEditableField(translations.registrationNumber, formData.registrationNumber, 'registrationNumber')}
              {renderEditableField(translations.address, formData.address, 'address', true)}
              {renderEditableField(translations.contactNumber, formData.contactNo, 'contactNo')}
              {renderEditableField(translations.email, formData.email, 'email')}
              {renderEditableField(translations.website, formData.website, 'website')}
              {renderEditableField(translations.establishedYear, formData.establishedYear, 'establishedYear')}
              {renderEditableField(translations.employeeCount, formData.employeeCount, 'employeeCount')}
              {renderEditableField(translations.presidentName, formData.presidentName, 'presidentName')}
              {renderEditableField(translations.secretaryName, formData.secretaryName, 'secretaryName')}
              {renderEditableField(translations.tagline, formData.tagline, 'tagline')}
              {renderEditableField(translations.description, formData.description, 'description', true)}
              {renderEditableField(translations.about, formData.about, 'about', true)}
              {renderEditableField(translations.mission, formData.mission, 'mission', true)}
              {renderEditableField(translations.vision, formData.vision, 'vision', true)}
              
              <View style={styles.socialMediaSection}>
                <Text style={styles.sectionSubtitle}>{translations.socialMedia}</Text>
                {renderEditableField(translations.facebook, formData.facebook, 'facebook')}
                {renderEditableField(translations.instagram, formData.instagram, 'instagram')}
                {renderEditableField(translations.twitter, formData.twitter, 'twitter')}
                {renderEditableField(translations.linkedin, formData.linkedin, 'linkedin')}
                {renderEditableField(translations.youtube, formData.youtube, 'youtube')}
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="groups" size={20} color="#FF7722" />
                <Text style={styles.sectionTitle}>{translations.committees}</Text>
                <TouchableOpacity 
                  style={styles.createButton}
                  onPress={() => {
                    resetCommitteeForm();
                    setEditingCommittee(null);
                    setCommitteeModalVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="add" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {committees.length === 0 ? (
  <View style={styles.emptyState}>
    <MaterialIcons name="groups" size={40} color="#d1d5db" />
    <Text style={styles.emptyStateText}>{translations.noCommittees}</Text>
  </View>
) : (
  committees.map((committee) => (
    <View key={committee.id} style={styles.committeeCard}>
      <View style={styles.committeeHeader}>
        <View>
          <Text style={styles.committeeName}>{committee.name}</Text>
          {committee.description && (
            <Text style={styles.committeeDescription} numberOfLines={1}>
              {committee.description}
            </Text>
          )}
          <Text style={styles.committeeType}>
            {committee.type?.charAt(0).toUpperCase() + committee.type?.slice(1) || translations.standing}
          </Text>
        </View>
        <View style={styles.committeeActions}>
          {/* Add Subcommittee Button */}
<TouchableOpacity 
  onPress={() => {
    console.log('🔵 Add Subcommittee button clicked for committee:', committee.id, committee.name);
    // Set the editing state to null (for Add mode)
    setEditingSubcommittee(null);
    // Reset form
    setSubcommitteeForm({
      name: '',
      description: '',
      type: 'standing',
      members: [],
      order: 0
    });
    // Open modal with committee passed
    setSelectedCommitteeForSub(committee);
    setSubcommitteeModalVisible(true);
  }}
  style={styles.committeeActionButton}
>
  <MaterialIcons name="layers" size={20} color="#8b5cf6" />
</TouchableOpacity>
          <TouchableOpacity 
            onPress={() => {
              setEditingCommittee(committee);
              setCommitteeForm(committee);
              setCommitteeModalVisible(true);
            }}
            style={styles.committeeActionButton}
          >
            <MaterialIcons name="edit" size={20} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleDeleteCommittee(committee.id)}
            style={styles.committeeActionButton}
          >
            <MaterialIcons name="delete" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Committee Members (Existing) */}
      {committee.members && committee.members.length > 0 && (
        <View style={styles.committeeMembers}>
          <Text style={styles.committeeMembersTitle}>Members</Text>
          {committee.members.map((member, index) => (
            <View key={member.id || index} style={styles.committeeMemberCard}>
              <View style={styles.committeeMemberInfo}>
                {member.photo ? (
                  <Image 
                    source={{ uri: member.photo }} 
                    style={styles.committeeMemberAvatarImage} 
                  />
                ) : (
                  <View style={styles.committeeAvatar}>
                    <Text style={styles.committeeAvatarText}>
                      {member.name?.charAt(0) || 'M'}
                    </Text>
                  </View>
                )}
                <View style={styles.committeeMemberDetails}>
                  <Text style={styles.committeeMemberName}>{member.name}</Text>
                  <Text style={styles.committeeMemberRole}>{member.role}</Text>
                </View>
              </View>
              <View style={styles.committeeMemberActions}>
                <TouchableOpacity 
                  onPress={() => {
                    setSelectedCommitteeId(committee.id);
                    setEditingCommitteeMember(member);
                    setCommitteeMemberForm({
                      name: member.name || '',
                      role: member.role || '',
                      position: member.position || '',
                      phone: member.phone || '',
                      email: member.email || '',
                      photo: member.photo || '',
                      bio: member.bio || '',
                      order: member.order || 0
                    });
                    setCommitteeMemberModalVisible(true);
                  }}
                  style={styles.committeeActionButton}
                >
                  <MaterialIcons name="edit" size={16} color="#3b82f6" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleDeleteCommitteeMember(committee.id, member.id)}
                  style={styles.committeeActionButton}
                >
                  <MaterialIcons name="delete" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ✅ SUBCOMMITTEES SECTION */}
      {committee.subcommittees && committee.subcommittees.length > 0 && (
        <View style={styles.subcommitteesContainer}>
          <View style={styles.subcommitteesHeader}>
            <MaterialIcons name="layers" size={18} color="#8b5cf6" />
            <Text style={styles.subcommitteesTitle}>Subcommittees</Text>
          </View>
          {committee.subcommittees.map((sub) => (
            <View key={sub.id} style={styles.subcommitteeCard}>
              <View style={styles.subcommitteeHeader}>
                <View style={styles.subcommitteeInfo}>
                  <Text style={styles.subcommitteeName}>{sub.name}</Text>
                  {sub.description && (
                    <Text style={styles.subcommitteeDescription} numberOfLines={1}>
                      {sub.description}
                    </Text>
                  )}
                  <Text style={styles.subcommitteeType}>
                    {sub.type?.charAt(0).toUpperCase() + sub.type?.slice(1)}
                  </Text>
                </View>
                <View style={styles.subcommitteeActions}>
                  {/* Add Subcommittee Member Button */}
                  <TouchableOpacity 
                    onPress={() => {
                      setSelectedCommitteeForSub(committee);
                      setSelectedSubcommitteeId(sub.id);
                      resetSubcommitteeMemberForm();
                      setSubcommitteeMemberModalVisible(true);
                    }}
                    style={styles.committeeActionButton}
                  >
                    <MaterialIcons name="person-add" size={18} color="#10b981" />
                  </TouchableOpacity>
                  {/* Edit Subcommittee Button */}
<TouchableOpacity 
  onPress={() => {
    console.log('🔵 Edit Subcommittee button clicked:', sub.id);
    setEditingSubcommittee(sub);
    setSelectedCommitteeForSub(committee);
    setSubcommitteeForm({
      name: sub.name || '',
      description: sub.description || '',
      type: sub.type || 'standing',
      order: sub.order || 0
    });
    setSubcommitteeModalVisible(true);
  }}
  style={styles.committeeActionButton}
>
  <MaterialIcons name="edit" size={18} color="#3b82f6" />
</TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleDeleteSubcommittee(committee.id, sub.id)}
                    style={styles.committeeActionButton}
                  >
                    <MaterialIcons name="delete" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Subcommittee Members */}
              {sub.members && sub.members.length > 0 && (
                <View style={styles.subcommitteeMembers}>
                  {sub.members.map((member, idx) => (
                    <View key={member.id || idx} style={styles.subcommitteeMemberItem}>
                      <View style={styles.committeeMemberInfo}>
                        {member.photo ? (
                          <Image 
                            source={{ uri: member.photo }} 
                            style={[styles.committeeMemberAvatarImage, { width: 28, height: 28 }]} 
                          />
                        ) : (
                          <View style={[styles.committeeAvatar, { width: 28, height: 28 }]}>
                            <Text style={[styles.committeeAvatarText, { fontSize: 12 }]}>
                              {member.name?.charAt(0) || 'M'}
                            </Text>
                          </View>
                        )}
                        <View style={styles.committeeMemberDetails}>
                          <Text style={[styles.committeeMemberName, { fontSize: 12 }]}>{member.name}</Text>
                          <Text style={[styles.committeeMemberRole, { fontSize: 10 }]}>{member.role}</Text>
                        </View>
                      </View>
                      <View style={styles.committeeMemberActions}>
                        <TouchableOpacity 
                          onPress={() => {
                            setSelectedCommitteeForSub(committee);
                            setSelectedSubcommitteeId(sub.id);
                            setEditingSubcommitteeMember(member);
                            setSubcommitteeMemberForm({
                              name: member.name || '',
                              role: member.role || '',
                              position: member.position || '',
                              phone: member.phone || '',
                              email: member.email || '',
                              photo: member.photo || '',
                              bio: member.bio || '',
                              order: member.order || 0
                            });
                            setSubcommitteeMemberModalVisible(true);
                          }}
                          style={styles.committeeActionButton}
                        >
                          <MaterialIcons name="edit" size={14} color="#3b82f6" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => handleDeleteSubcommitteeMember(committee.id, sub.id, member.id)}
                          style={styles.committeeActionButton}
                        >
                          <MaterialIcons name="delete" size={14} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  ))
)}
            </View>

            

            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="attach-file" size={20} color="#FF7722" />
                <Text style={styles.sectionTitle}>{translations.documents}</Text>
                <TouchableOpacity 
                  style={styles.createButton}
                  onPress={handleDocumentUpload}
                  disabled={uploading}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="add" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {/* Drag and Drop Area for Documents (Web only) */}
              {isWeb && (
                <View 
                  style={[styles.dropZone, isDraggingOver && styles.dropZoneActive]}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <MaterialIcons name="cloud-upload" size={40} color="#9ca3af" />
                  <Text style={styles.dropZoneText}>{translations.dragDropHere}</Text>
                  <Text style={styles.dropZoneSubtext}>{translations.supportedFormats}</Text>
                </View>
              )}

              {documents.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="attach-file" size={40} color="#d1d5db" />
                  <Text style={styles.emptyStateText}>{translations.noDocuments}</Text>
                </View>
              ) : (
                documents.map((doc) => (
                  <View key={doc.id} style={styles.documentCard}>
                    <View style={styles.documentInfo}>
                      <MaterialIcons 
                        name={
                          doc.type === 'pdf' ? 'picture-as-pdf' :
                          doc.type === 'image' ? 'image' : 'description'
                        } 
                        size={24} 
                        color="#FF7722" 
                      />
                      <View style={styles.documentDetails}>
                        <Text style={styles.documentTitle}>{doc.title}</Text>
                        {doc.description && (
                          <Text style={styles.documentDescription} numberOfLines={1}>
                            {doc.description}
                          </Text>
                        )}
                        <Text style={styles.documentDate}>
                          {translations.uploaded}: {new Date(doc.uploadedAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      onPress={() => handleDeleteDocument(doc.id)}
                      style={styles.documentDeleteButton}
                    >
                      <MaterialIcons name="delete" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Document Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={documentModalVisible}
        onRequestClose={() => setDocumentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>{translations.addDocument}</Text>
            
            <View style={styles.field}>
              <Text style={styles.label}>{translations.documentTitle} *</Text>
              <TextInput
                style={styles.input}
                value={documentForm.title}
                onChangeText={(text) => setDocumentForm({...documentForm, title: text})}
                placeholder={`${translations.enter} ${translations.documentTitle}`}
                textAlignVertical="center"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{translations.committeeDescription}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={documentForm.description}
                onChangeText={(text) => setDocumentForm({...documentForm, description: text})}
                placeholder={`${translations.enter} ${translations.committeeDescription}`}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{translations.documentType}</Text>
              <View style={styles.statusPicker}>
                {['pdf', 'image', 'document'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.statusOption, documentForm.type === type && styles.statusOptionActive]}
                    onPress={() => setDocumentForm({...documentForm, type})}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.statusOptionText, documentForm.type === type && styles.statusOptionTextActive]}>
                      {type.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{translations.fileUrl} *</Text>
              <View style={styles.urlInputContainer}>
                <TextInput
                  style={[styles.input, styles.urlInput]}
                  value={documentForm.fileUrl}
                  onChangeText={(text) => setDocumentForm({...documentForm, fileUrl: text})}
                  placeholder={`${translations.enter} ${translations.fileUrl}`}
                  textAlignVertical="center"
                  editable={!uploading}
                />
                <TouchableOpacity 
                  style={styles.browseButton}
                  onPress={handleDocumentUpload}
                  disabled={uploading}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="folder-open" size={20} color="#ffffff" />
                  <Text style={styles.browseButtonText}>{translations.chooseFile}</Text>
                </TouchableOpacity>
              </View>
              {documentForm.fileName && (
                <Text style={styles.fileInfo}>
                  {documentForm.fileName} ({(documentForm.fileSize / 1024).toFixed(1)} KB)
                </Text>
              )}
            </View>

            {uploading && (
              <View style={styles.uploadProgressContainer}>
                <Text style={styles.uploadProgressText}>
                  {translations.uploadingProgress.replace('{progress}', Math.round(uploadProgress))}
                </Text>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
                </View>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setDocumentModalVisible(false)}
                disabled={uploading}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>{translations.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleAddDocument}
                disabled={uploading || !documentForm.fileUrl}
                activeOpacity={0.7}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalConfirmText}>{translations.upload}</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
{/* Subcommittee Modal */}
<Modal
  animationType="slide"
  transparent={true}
  visible={subcommitteeModalVisible}
  onRequestClose={() => {
    setSubcommitteeModalVisible(false);
    resetSubcommitteeForm();
  }}
>
  <View style={styles.modalOverlay}>
    <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
      <Text style={styles.modalTitle}>
        {editingSubcommittee ? 'Edit Subcommittee' : 'Add Subcommittee'}
      </Text>
      
      <View style={styles.field}>
        <Text style={styles.label}>Subcommittee Name *</Text>
        <TextInput
          style={styles.input}
          value={subcommitteeForm.name}
          onChangeText={(text) => setSubcommitteeForm({...subcommitteeForm, name: text})}
          placeholder="Enter subcommittee name"
          textAlignVertical="center"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={subcommitteeForm.description}
          onChangeText={(text) => setSubcommitteeForm({...subcommitteeForm, description: text})}
          placeholder="Enter description"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Type</Text>
        <View style={styles.statusPicker}>
          {['standing', 'ad-hoc', 'special'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.statusOption, subcommitteeForm.type === type && styles.statusOptionActive]}
              onPress={() => setSubcommitteeForm({...subcommitteeForm, type})}
              activeOpacity={0.7}
            >
              <Text style={[styles.statusOptionText, subcommitteeForm.type === type && styles.statusOptionTextActive]}>
                {type === 'standing' ? 'Standing' :
                 type === 'ad-hoc' ? 'Ad-hoc' : 'Special'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Display Order</Text>
        <TextInput
          style={styles.input}
          value={String(subcommitteeForm.order || 0)}
          onChangeText={(text) => setSubcommitteeForm({...subcommitteeForm, order: parseInt(text) || 0})}
          placeholder="0"
          keyboardType="numeric"
          textAlignVertical="center"
        />
      </View>

      <View style={styles.modalButtons}>
        <TouchableOpacity 
          style={[styles.modalButton, styles.modalCancelButton]}
          onPress={() => {
            setSubcommitteeModalVisible(false);
            resetSubcommitteeForm();
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.modalCancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
  style={[styles.modalButton, styles.modalConfirmButton]}
  onPress={() => {
    if (editingSubcommittee) {
      handleEditSubcommittee(selectedCommitteeForSub, editingSubcommittee);
    } else {
      handleAddSubcommittee(selectedCommitteeForSub);
    }
  }}
  activeOpacity={0.7}
>
  <Text style={styles.modalConfirmText}>
    {editingSubcommittee ? 'Update' : 'Add'}
  </Text>
</TouchableOpacity>
      </View>
    </ScrollView>
  </View>
</Modal>

{/* Subcommittee Member Modal */}
<Modal
  animationType="slide"
  transparent={true}
  visible={subcommitteeMemberModalVisible}
  onRequestClose={() => {
    setSubcommitteeMemberModalVisible(false);
    resetSubcommitteeMemberForm();
  }}
>
  <View style={styles.modalOverlay}>
    <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
      <Text style={styles.modalTitle}>
        {editingSubcommitteeMember ? 'Edit Subcommittee Member' : 'Add Subcommittee Member'}
      </Text>
      
      <View style={styles.field}>
        <Text style={styles.label}>Member Name *</Text>
        <TextInput
          style={styles.input}
          value={subcommitteeMemberForm.name}
          onChangeText={(text) => setSubcommitteeMemberForm({...subcommitteeMemberForm, name: text})}
          placeholder="Enter member name"
          textAlignVertical="center"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Role *</Text>
        <TextInput
          style={styles.input}
          value={subcommitteeMemberForm.role}
          onChangeText={(text) => setSubcommitteeMemberForm({...subcommitteeMemberForm, role: text})}
          placeholder="Enter role (e.g., Chairperson)"
          textAlignVertical="center"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Position</Text>
        <TextInput
          style={styles.input}
          value={subcommitteeMemberForm.position}
          onChangeText={(text) => setSubcommitteeMemberForm({...subcommitteeMemberForm, position: text})}
          placeholder="Enter position"
          textAlignVertical="center"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={subcommitteeMemberForm.phone}
          onChangeText={(text) => setSubcommitteeMemberForm({...subcommitteeMemberForm, phone: text})}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
          textAlignVertical="center"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={subcommitteeMemberForm.email}
          onChangeText={(text) => setSubcommitteeMemberForm({...subcommitteeMemberForm, email: text})}
          placeholder="Enter email"
          keyboardType="email-address"
          textAlignVertical="center"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={subcommitteeMemberForm.bio}
          onChangeText={(text) => setSubcommitteeMemberForm({...subcommitteeMemberForm, bio: text})}
          placeholder="Enter bio"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.modalButtons}>
        <TouchableOpacity 
          style={[styles.modalButton, styles.modalCancelButton]}
          onPress={() => {
            setSubcommitteeMemberModalVisible(false);
            resetSubcommitteeMemberForm();
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.modalCancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.modalButton, styles.modalConfirmButton]}
          onPress={editingSubcommitteeMember ? handleEditSubcommitteeMember : handleAddSubcommitteeMember}
          activeOpacity={0.7}
        >
          <Text style={styles.modalConfirmText}>
            {editingSubcommitteeMember ? 'Update' : 'Add'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  </View>
</Modal>
{/* Service Detail Modal */}
<Modal
  animationType="slide"
  transparent={true}
  visible={serviceDetailModalVisible}
  onRequestClose={() => {
    setServiceDetailModalVisible(false);
    resetServiceDetailForm();
  }}
>
  <View style={styles.modalOverlay}>
    <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
      <Text style={styles.modalTitle}>
        {translations.editServiceDetails}
      </Text>
      
      {/* Service Name Display */}
      {editingService && (
        <View style={styles.serviceNameDisplay}>
          <MaterialIcons 
            name={HARDCODED_SERVICES.find(s => s.id === editingService)?.icon || 'handshake'} 
            size={24} 
            color="#FF7722" 
          />
          <Text style={styles.serviceNameDisplayText}>
            {isHindi 
              ? HARDCODED_SERVICES.find(s => s.id === editingService)?.titleHi 
              : HARDCODED_SERVICES.find(s => s.id === editingService)?.title}
          </Text>
        </View>
      )}
      
      {/* Description Fields */}
      <View style={styles.field}>
        <Text style={styles.label}>{translations.serviceDescription}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={serviceDetailForm.description}
          onChangeText={(text) => setServiceDetailForm({...serviceDetailForm, description: text})}
          placeholder={translations.enterDescriptionEnglish}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />
      </View>
      
      <View style={styles.field}>
        <Text style={styles.label}>{translations.serviceDescriptionHi}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={serviceDetailForm.descriptionHi}
          onChangeText={(text) => setServiceDetailForm({...serviceDetailForm, descriptionHi: text})}
          placeholder={translations.enterDescriptionHindi}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />
      </View>
      
      {/* Details Section */}
      <View style={styles.detailsSection}>
        <Text style={styles.sectionSubtitle}>{translations.serviceDetails}</Text>
        
        {/* Add Detail Form */}
        <View style={styles.addDetailRow}>
          <TextInput
            style={[styles.input, styles.detailInputSmall]}
            value={detailForm.label}
            onChangeText={(text) => setDetailForm({...detailForm, label: text})}
            placeholder={translations.labelEnglish}
          />
          <TextInput
            style={[styles.input, styles.detailInputSmall]}
            value={detailForm.labelHi}
            onChangeText={(text) => setDetailForm({...detailForm, labelHi: text})}
            placeholder={translations.labelHindi}
          />
          <TextInput
            style={[styles.input, styles.detailInputMedium]}
            value={detailForm.value}
            onChangeText={(text) => setDetailForm({...detailForm, value: text})}
            placeholder={translations.value}
          />
          <TouchableOpacity 
            style={styles.addDetailButton}
            onPress={handleAddDetail}
            activeOpacity={0.7}
          >
            <MaterialIcons 
              name={editingDetailIndex !== null ? 'check' : 'add'} 
              size={24} 
              color="#ffffff" 
            />
          </TouchableOpacity>
        </View>
        
        {/* Details List */}
        {serviceDetailForm.details.length === 0 ? (
          <Text style={styles.emptyDetailsText}>{translations.noDetailsAdded}</Text>
        ) : (
          serviceDetailForm.details.map((detail, index) => (
            <View key={index} style={styles.detailItem}>
              <View style={styles.detailItemContent}>
                <Text style={styles.detailItemLabel}>
                  {isHindi ? detail.labelHi || detail.label : detail.label}
                </Text>
                <Text style={styles.detailItemValue}>{detail.value}</Text>
              </View>
              <View style={styles.detailItemActions}>
                <TouchableOpacity onPress={() => handleEditDetail(index)}>
                  <MaterialIcons name="edit" size={18} color="#3b82f6" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteDetail(index)}>
                  <MaterialIcons name="delete" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
      
      <View style={styles.modalButtons}>
        <TouchableOpacity 
          style={[styles.modalButton, styles.modalCancelButton]}
          onPress={() => {
            setServiceDetailModalVisible(false);
            resetServiceDetailForm();
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.modalCancelText}>{translations.cancel}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.modalButton, styles.modalConfirmButton]}
          onPress={saveServiceDetails}
          activeOpacity={0.7}
        >
          <Text style={styles.modalConfirmText}>{translations.save}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  </View>
</Modal>
      {/* Committee Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={committeeModalVisible}
        onRequestClose={() => {
          setCommitteeModalVisible(false);
          resetCommitteeForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>
              {editingCommittee ? translations.editCommittee : translations.addCommittee}
            </Text>
            
            <View style={styles.field}>
              <Text style={styles.label}>{translations.committeeName} *</Text>
              <TextInput
                style={styles.input}
                value={committeeForm.name}
                onChangeText={(text) => setCommitteeForm({...committeeForm, name: text})}
                placeholder={`${translations.enter} ${translations.committeeName}`}
                textAlignVertical="center"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{translations.committeeDescription}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={committeeForm.description}
                onChangeText={(text) => setCommitteeForm({...committeeForm, description: text})}
                placeholder={`${translations.enter} ${translations.committeeDescription}`}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{translations.committeeType}</Text>
              <View style={styles.statusPicker}>
                {['standing', 'ad-hoc', 'special'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.statusOption, committeeForm.type === type && styles.statusOptionActive]}
                    onPress={() => setCommitteeForm({...committeeForm, type})}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.statusOptionText, committeeForm.type === type && styles.statusOptionTextActive]}>
                      {type === 'standing' ? translations.standing :
                       type === 'ad-hoc' ? translations.adHoc : translations.special}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{translations.displayOrder}</Text>
              <TextInput
                style={styles.input}
                value={String(committeeForm.order || 0)}
                onChangeText={(text) => setCommitteeForm({...committeeForm, order: parseInt(text) || 0})}
                placeholder="0"
                keyboardType="numeric"
                textAlignVertical="center"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setCommitteeModalVisible(false);
                  resetCommitteeForm();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>{translations.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={editingCommittee ? handleEditCommittee : handleAddCommittee}
                activeOpacity={0.7}
              >
                <Text style={styles.modalConfirmText}>
                  {editingCommittee ? translations.update : translations.add}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal
  animationType="slide"
  transparent={true}
  visible={committeeMemberModalVisible}
  onRequestClose={() => {
    setCommitteeMemberModalVisible(false);
    setCommitteeMemberForm({
      name: '',
      role: '',
      position: '',
      phone: '',
      email: '',
      photo: '',
      bio: '',
      order: 0
    });
    setEditingCommitteeMember(null);
    // Don't clear selectedCommitteeId or ref here
  }}
>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>
              {editingCommitteeMember ? translations.editMember : translations.addMember}
            </Text>
            <View style={styles.field}>
  <Text style={styles.label}>{translations.memberPhoto}</Text>
  <View style={styles.photoUploadContainer}>
    {committeeMemberForm.photo ? (
      <View style={styles.photoPreviewContainer}>
        <Image 
          source={{ uri: committeeMemberForm.photo }} 
          style={styles.memberPhotoPreview} 
        />
        <TouchableOpacity 
          style={styles.removePhotoButton}
          onPress={() => setCommitteeMemberForm({...committeeMemberForm, photo: ''})}
        >
          <MaterialIcons name="close" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    ) : (
      <TouchableOpacity 
        style={styles.photoUploadPlaceholder}
        onPress={handleCommitteeMemberPhotoUpload}
        disabled={uploading}
        activeOpacity={0.7}
      >
        {uploading ? (
          <ActivityIndicator size="small" color="#FF7722" />
        ) : (
          <>
            <MaterialIcons name="photo-camera" size={30} color="#9ca3af" />
            <Text style={styles.photoUploadText}>{translations.uploadPhoto}</Text>
          </>
        )}
      </TouchableOpacity>
    )}
    {committeeMemberForm.photo && (
      <TouchableOpacity 
        style={styles.photoUploadButton}
        onPress={handleCommitteeMemberPhotoUpload}
        disabled={uploading}
        activeOpacity={0.7}
      >
        <MaterialIcons name="edit" size={16} color="#FF7722" />
        <Text style={styles.photoUploadButtonText}>{translations.changePhoto}</Text>
      </TouchableOpacity>
    )}
  </View>
  {uploading && (
    <View style={styles.uploadProgressContainer}>
      <Text style={styles.uploadProgressText}>
        {translations.uploadingProgress.replace('{progress}', Math.round(uploadProgress))}
      </Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
      </View>
    </View>
  )}
</View>
            <View style={styles.field}>
              <Text style={styles.label}>{translations.memberName} *</Text>
              <TextInput
                style={styles.input}
                value={committeeMemberForm.name}
                onChangeText={(text) => setCommitteeMemberForm({...committeeMemberForm, name: text})}
                placeholder={`${translations.enter} ${translations.memberName}`}
                textAlignVertical="center"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{translations.memberRole} *</Text>
              <TextInput
                style={styles.input}
                value={committeeMemberForm.role}
                onChangeText={(text) => setCommitteeMemberForm({...committeeMemberForm, role: text})}
                placeholder={`${translations.enter} ${translations.memberRole}`}
                textAlignVertical="center"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{translations.memberPosition}</Text>
              <TextInput
                style={styles.input}
                value={committeeMemberForm.position}
                onChangeText={(text) => setCommitteeMemberForm({...committeeMemberForm, position: text})}
                placeholder={`${translations.enter} ${translations.memberPosition}`}
                textAlignVertical="center"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{translations.memberPhone}</Text>
              <TextInput
                style={styles.input}
                value={committeeMemberForm.phone}
                onChangeText={(text) => setCommitteeMemberForm({...committeeMemberForm, phone: text})}
                placeholder={`${translations.enter} ${translations.memberPhone}`}
                keyboardType="phone-pad"
                textAlignVertical="center"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{translations.memberEmail}</Text>
              <TextInput
                style={styles.input}
                value={committeeMemberForm.email}
                onChangeText={(text) => setCommitteeMemberForm({...committeeMemberForm, email: text})}
                placeholder={`${translations.enter} ${translations.memberEmail}`}
                keyboardType="email-address"
                textAlignVertical="center"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{translations.memberBio}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={committeeMemberForm.bio}
                onChangeText={(text) => setCommitteeMemberForm({...committeeMemberForm, bio: text})}
                placeholder={`${translations.enter} ${translations.memberBio}`}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setCommitteeMemberModalVisible(false);
                  resetCommitteeMemberForm();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>{translations.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={editingCommitteeMember ? handleEditCommitteeMember : handleAddCommitteeMember}
                activeOpacity={0.7}
              >
                <Text style={styles.modalConfirmText}>
                  {editingCommitteeMember ? translations.update : translations.add}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Member Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={memberModalVisible}
        onRequestClose={() => {
          setMemberModalVisible(false);
          resetMemberForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>
              {editingMember ? translations.editMember : translations.addMember}
            </Text>
            
            <View style={styles.field}>
              <Text style={styles.label}>{translations.memberName} *</Text>
              <TextInput
                style={styles.input}
                value={memberForm.name}
                onChangeText={(text) => setMemberForm({...memberForm, name: text})}
                placeholder={`${translations.enter} ${translations.memberName}`}
                textAlignVertical="center"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{translations.memberEmail} *</Text>
              <TextInput
                style={styles.input}
                value={memberForm.email}
                onChangeText={(text) => setMemberForm({...memberForm, email: text})}
                placeholder={`${translations.enter} ${translations.memberEmail}`}
                keyboardType="email-address"
                textAlignVertical="center"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{translations.memberPhone}</Text>
              <TextInput
                style={styles.input}
                value={memberForm.phone}
                onChangeText={(text) => setMemberForm({...memberForm, phone: text})}
                placeholder={`${translations.enter} ${translations.memberPhone}`}
                keyboardType="phone-pad"
                textAlignVertical="center"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{translations.address}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={memberForm.address}
                onChangeText={(text) => setMemberForm({...memberForm, address: text})}
                placeholder={`${translations.enter} ${translations.address}`}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{translations.memberRole}</Text>
              <TextInput
                style={styles.input}
                value={memberForm.role}
                onChangeText={(text) => setMemberForm({...memberForm, role: text})}
                placeholder={`${translations.enter} ${translations.memberRole}`}
                textAlignVertical="center"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{translations.status}</Text>
              <View style={styles.statusPicker}>
                {['active', 'inactive', 'suspended'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[styles.statusOption, memberForm.status === status && styles.statusOptionActive]}
                    onPress={() => setMemberForm({...memberForm, status})}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.statusOptionText, memberForm.status === status && styles.statusOptionTextActive]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setMemberModalVisible(false);
                  resetMemberForm();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>{translations.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={editingMember ? handleEditMember : handleAddMember}
                activeOpacity={0.7}
              >
                <Text style={styles.modalConfirmText}>
                  {editingMember ? translations.update : translations.add}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Application Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={applicationModalVisible}
        onRequestClose={() => setApplicationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            {selectedApplication && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{translations.applicationDetails}</Text>
                  <TouchableOpacity onPress={() => setApplicationModalVisible(false)}>
                    <MaterialIcons name="close" size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailStatusBar}>
                  <View style={[styles.detailStatusBadge, { backgroundColor: 
                    selectedApplication.status === 'pending' ? '#fef3c7' : 
                    selectedApplication.status === 'verified' ? '#dbeafe' : '#d1fae5'
                  }]}>
                    <Text style={[styles.detailStatusText, { color:
                      selectedApplication.status === 'pending' ? '#d97706' : 
                      selectedApplication.status === 'verified' ? '#2563eb' : '#059669'
                    }]}>
                      {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.detailDate}>
                    {new Date(selectedApplication.createdAt?.toDate?.() || selectedApplication.createdAt).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.services}</Text>
                  <Text style={styles.detailValue}>{getServiceTypeLabel(selectedApplication.serviceType)}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.applicantName}</Text>
                  <Text style={styles.detailValue}>{selectedApplication.userName || translations.nA}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.email}</Text>
                  <Text style={styles.detailValue}>{selectedApplication.userEmail || translations.nA}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.fullName}</Text>
                  <Text style={styles.detailValue}>{selectedApplication.fullName || translations.nA}</Text>
                </View>

                <View style={styles.detailRow}>
                  <View style={[styles.detailSection, { flex: 1 }]}>
                    <Text style={styles.detailLabel}>{translations.age}</Text>
                    <Text style={styles.detailValue}>{selectedApplication.age || translations.nA}</Text>
                  </View>
                  <View style={[styles.detailSection, { flex: 1 }]}>
                    <Text style={styles.detailLabel}>{translations.gender}</Text>
                    <Text style={styles.detailValue}>{selectedApplication.gender || translations.nA}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={[styles.detailSection, { flex: 1 }]}>
                    <Text style={styles.detailLabel}>{translations.memberPhone}</Text>
                    <Text style={styles.detailValue}>{selectedApplication.phone || translations.nA}</Text>
                  </View>
                  <View style={[styles.detailSection, { flex: 1 }]}>
                    <Text style={styles.detailLabel}>{translations.email}</Text>
                    <Text style={styles.detailValue}>{selectedApplication.email || translations.nA}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.address}</Text>
                  <Text style={styles.detailValue}>{selectedApplication.address || translations.nA}</Text>
                </View>

                <View style={styles.detailRow}>
                  <View style={[styles.detailSection, { flex: 1 }]}>
                    <Text style={styles.detailLabel}>{translations.occupation}</Text>
                    <Text style={styles.detailValue}>{selectedApplication.occupation || translations.nA}</Text>
                  </View>
                  <View style={[styles.detailSection, { flex: 1 }]}>
                    <Text style={styles.detailLabel}>{translations.annualIncome}</Text>
                    <Text style={styles.detailValue}>₹{selectedApplication.annualIncome || translations.nA}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.idProof}</Text>
                  <Text style={styles.detailValue}>{selectedApplication.idProof || translations.nA}</Text>
                </View>

                {selectedApplication.ageGroup && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>{translations.ageGroup}</Text>
                    <Text style={styles.detailValue}>{selectedApplication.ageGroup}</Text>
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.detailsReason}</Text>
                  <Text style={styles.detailValue}>{selectedApplication.details || translations.nA}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.expectedAmount}</Text>
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

                {selectedApplication.status === 'pending' && (
                  <TouchableOpacity 
                    style={[styles.detailActionButton, styles.verifyButton]}
                    onPress={() => {
                      setApplicationModalVisible(false);
                      openVerifyModal(selectedApplication);
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="check-circle" size={16} color="#ffffff" />
                    <Text style={styles.detailActionText}>{translations.verify}</Text>
                  </TouchableOpacity>
                )}

                {selectedApplication.status === 'verified' && (
                  <TouchableOpacity 
                    style={[styles.detailActionButton, styles.fundButton]}
                    onPress={() => {
                      setApplicationModalVisible(false);
                      openFundReleaseModal(selectedApplication);
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="payments" size={16} color="#ffffff" />
                    <Text style={styles.detailActionText}>{translations.releaseFund}</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Verify Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={verifyConfirmModalVisible}
        onRequestClose={() => setVerifyConfirmModalVisible(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalContent}>
            <View style={styles.confirmModalIcon}>
              <MaterialIcons name="check-circle" size={50} color="#FF7722" />
            </View>
            <Text style={styles.confirmModalTitle}>{translations.verifyApplication}</Text>
            <Text style={styles.confirmModalMessage}>
              {translations.confirmVerify}
              {selectedVerifyApplication && (
                <Text style={styles.confirmModalDetail}>
                  \n\n{translations.applicantName}: {selectedVerifyApplication.userName || translations.unknown}\n
                  {translations.services}: {getServiceTypeLabel(selectedVerifyApplication.serviceType)}\n
                  {translations.expectedAmount}: ₹{selectedVerifyApplication.amount || '0'}
                </Text>
              )}
            </Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity 
                style={[styles.confirmModalButton, styles.confirmCancelButton]}
                onPress={() => setVerifyConfirmModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmCancelText}>{translations.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmModalButton, styles.confirmVerifyButton]}
                onPress={handleVerifyApplication}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmVerifyText}>{translations.verify}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Fund Release Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={fundReleaseModalVisible}
        onRequestClose={() => setFundReleaseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{translations.releaseFund}</Text>
            
            <View style={styles.field}>
              <Text style={styles.label}>{translations.amountToPay} *</Text>
              <TextInput
                style={styles.input}
                value={fundAmount}
                onChangeText={setFundAmount}
                keyboardType="numeric"
                placeholder={`${translations.enter} ${translations.amountToPay}`}
                textAlignVertical="center"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{translations.remarks}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={fundRemarks}
                onChangeText={setFundRemarks}
                placeholder={`${translations.enter} ${translations.remarks}`}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setFundReleaseModalVisible(false);
                  setFundAmount('');
                  setFundRemarks('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>{translations.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={confirmFundRelease}
                disabled={!fundAmount}
                activeOpacity={0.7}
              >
                <Text style={styles.modalConfirmText}>{translations.releaseFund}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Fund Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={fundConfirmModalVisible}
        onRequestClose={() => setFundConfirmModalVisible(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalContent}>
            <View style={styles.confirmModalIcon}>
              <MaterialIcons name="payments" size={50} color="#10b981" />
            </View>
            <Text style={styles.confirmModalTitle}>{translations.confirm}</Text>
            <Text style={styles.confirmModalMessage}>
              {translations.confirmReleaseFund}
              {selectedFundConfirm && (
                <Text style={styles.confirmModalDetail}>
                  \n\n{translations.applicantName}: {selectedFundConfirm.userName || translations.unknown}\n
                  {translations.services}: {getServiceTypeLabel(selectedFundConfirm.serviceType)}\n
                  {translations.amountToPay}: ₹{fundAmount || selectedFundConfirm.amount || '0'}
                  {fundRemarks ? `\n${translations.remarks}: ${fundRemarks}` : ''}
                </Text>
              )}
            </Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity 
                style={[styles.confirmModalButton, styles.confirmCancelButton]}
                onPress={() => {
                  setFundConfirmModalVisible(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmCancelText}>{translations.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmModalButton, styles.confirmFundButton]}
                onPress={handleReleaseFund}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmFundText}>{translations.releaseFund}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Competition Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={createCompetitionModalVisible}
        onRequestClose={() => setCreateCompetitionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>{translations.createCompetitionTitle}</Text>
            
            <View style={styles.field}>
              <Text style={styles.label}>{translations.competitionTitle} *</Text>
              <TextInput
                style={styles.input}
                value={competitionForm.title}
                onChangeText={(text) => setCompetitionForm({...competitionForm, title: text})}
                placeholder={`${translations.enter} ${translations.competitionTitle}`}
                textAlignVertical="center"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{translations.committeeDescription}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={competitionForm.description}
                onChangeText={(text) => setCompetitionForm({...competitionForm, description: text})}
                placeholder={`${translations.enter} ${translations.committeeDescription}`}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{translations.competitionCategory}</Text>
              <TextInput
                style={styles.input}
                value={competitionForm.category}
                onChangeText={(text) => setCompetitionForm({...competitionForm, category: text})}
                placeholder={`${translations.enter} ${translations.competitionCategory}`}
                textAlignVertical="center"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{translations.prize}</Text>
              <TextInput
                style={styles.input}
                value={competitionForm.prize}
                onChangeText={(text) => setCompetitionForm({...competitionForm, prize: text})}
                placeholder={`${translations.enter} ${translations.prize}`}
                keyboardType="numeric"
                textAlignVertical="center"
              />
            </View>
{/* Registration Fee Field - Add after Prize */}
<View style={styles.field}>
  <Text style={styles.label}>Registration Fee (₹)</Text>
  <TextInput
    style={styles.input}
    value={competitionForm.registrationFee}
    onChangeText={(text) => setCompetitionForm({...competitionForm, registrationFee: text})}
    placeholder="Enter registration fee"
    keyboardType="numeric"
    textAlignVertical="center"
  />
  <Text style={styles.helperText}>Leave empty or 0 for free registration</Text>
</View>
            <View style={styles.field}>
              <Text style={styles.label}>{translations.venue}</Text>
              <TextInput
                style={styles.input}
                value={competitionForm.venue}
                onChangeText={(text) => setCompetitionForm({...competitionForm, venue: text})}
                placeholder={`${translations.enter} ${translations.venue}`}
                textAlignVertical="center"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{translations.maxParticipants}</Text>
              <TextInput
                style={styles.input}
                value={competitionForm.maxParticipants}
                onChangeText={(text) => setCompetitionForm({...competitionForm, maxParticipants: text})}
                placeholder={`${translations.enter} ${translations.maxParticipants}`}
                keyboardType="numeric"
                textAlignVertical="center"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{translations.status}</Text>
              <View style={styles.statusPicker}>
                {['upcoming', 'live', 'completed'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[styles.statusOption, competitionForm.status === status && styles.statusOptionActive]}
                    onPress={() => setCompetitionForm({...competitionForm, status})}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.statusOptionText, competitionForm.status === status && styles.statusOptionTextActive]}>
                      {status === 'upcoming' ? translations.upcoming :
                       status === 'live' ? translations.live : translations.completed}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setCreateCompetitionModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>{translations.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleCreateCompetition}
                activeOpacity={0.7}
              >
                <Text style={styles.modalConfirmText}>{translations.create}</Text>
              </TouchableOpacity>
            </View>
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
          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            {selectedCompetition && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedCompetition.title}</Text>
                  <TouchableOpacity onPress={() => setCompetitionDetailModalVisible(false)}>
                    <MaterialIcons name="close" size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.competitionDetailSection}>
                  <Text style={styles.competitionDetailLabel}>{translations.status}</Text>
                  <View style={[styles.competitionStatus, { backgroundColor:
                    selectedCompetition.status === 'upcoming' ? '#fef3c7' :
                    selectedCompetition.status === 'live' ? '#dbeafe' : '#d1fae5',
                    alignSelf: 'flex-start'
                  }]}>
                    <Text style={[styles.competitionStatusText, { color:
                      selectedCompetition.status === 'upcoming' ? '#d97706' :
                      selectedCompetition.status === 'live' ? '#2563eb' : '#059669'
                    }]}>
                      {selectedCompetition.status?.toUpperCase() || translations.upcoming.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.competitionDetailSection}>
                  <Text style={styles.competitionDetailLabel}>{translations.committeeDescription}</Text>
                  <Text style={styles.competitionDetailValue}>{selectedCompetition.description || translations.nA}</Text>
                </View>

                <View style={styles.competitionDetailSection}>
                  <Text style={styles.competitionDetailLabel}>{translations.competitionCategory}</Text>
                  <Text style={styles.competitionDetailValue}>{selectedCompetition.category || translations.nA}</Text>
                </View>

                <View style={styles.competitionDetailSection}>
                  <Text style={styles.competitionDetailLabel}>{translations.prize}</Text>
                  <Text style={styles.competitionDetailValue}>₹{selectedCompetition.prize || '0'}</Text>
                </View>
{/* In the Competition Detail Modal section */}
<View style={styles.competitionDetailSection}>
  <Text style={styles.competitionDetailLabel}>Registration Fee</Text>
  <Text style={styles.competitionDetailValue}>
    {selectedCompetition.registrationFee > 0 ? `₹${selectedCompetition.registrationFee}` : 'Free'}
  </Text>
</View>
                <View style={styles.competitionDetailSection}>
                  <Text style={styles.competitionDetailLabel}>{translations.venue}</Text>
                  <Text style={styles.competitionDetailValue}>{selectedCompetition.venue || translations.nA}</Text>
                </View>

                <View style={styles.competitionDetailSection}>
                  <Text style={styles.competitionDetailLabel}>{translations.participants}</Text>
                  <Text style={styles.competitionDetailValue}>
                    {selectedCompetition.participants?.length || 0} / {selectedCompetition.maxParticipants || '∞'}
                  </Text>
                </View>

                {selectedCompetition.winner && (
                  <View style={styles.competitionDetailSection}>
                    <Text style={styles.competitionDetailLabel}>{translations.winner}</Text>
                    <View style={styles.winnerBadge}>
                      <MaterialIcons name="stars" size={14} color="#f59e0b" />
                      <Text style={styles.winnerText}>{selectedCompetition.winnerName}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.competitionActions}>
                  {selectedCompetition.status === 'upcoming' && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.liveButton]}
                      onPress={() => handleCompetitionAction(selectedCompetition.id, 'makeLive')}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="play-arrow" size={20} color="#ffffff" />
                      <Text style={styles.actionButtonText}>{translations.makeLive}</Text>
                    </TouchableOpacity>
                  )}

                  {selectedCompetition.status === 'live' && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.endButton]}
                      onPress={() => handleCompetitionAction(selectedCompetition.id, 'end')}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="stop" size={20} color="#ffffff" />
                      <Text style={styles.actionButtonText}>{translations.endCompetition}</Text>
                    </TouchableOpacity>
                  )}

                  {selectedCompetition.status === 'completed' && !selectedCompetition.passSent && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.passButton]}
                      onPress={() => handleCompetitionAction(selectedCompetition.id, 'sendPass')}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="confirmation-number" size={20} color="#ffffff" />
                      <Text style={styles.actionButtonText}>{translations.sendPass}</Text>
                    </TouchableOpacity>
                  )}

                  {selectedCompetition.status === 'completed' && !selectedCompetition.certificateSent && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.certificateButton]}
                      onPress={() => handleCompetitionAction(selectedCompetition.id, 'sendCertificate')}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="verified" size={20} color="#ffffff" />
                      <Text style={styles.actionButtonText}>{translations.sendCertificate}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// Helper Components
const ServiceCard = ({ title, icon, children }) => (
  <View style={styles.serviceCard}>
    <View style={styles.serviceHeader}>
      <MaterialIcons name={icon} size={20} color="#FF7722" />
      <Text style={styles.serviceTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const ServiceRow = ({ label, value }) => (
  <View style={styles.serviceRow}>
    <Text style={styles.serviceLabel}>{label}</Text>
    <Text style={styles.serviceValue}>₹ {value}</Text>
  </View>
);

const InfoRow = ({ label, value, multiline }) => (
  <View style={[styles.infoRow, multiline && styles.infoRowMultiline]}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, multiline && styles.infoValueMultiline]}>{value}</Text>
  </View>
);

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
  editButton: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: 14,
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
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#FFF5EB',
  },
  tabText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 11,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  tabTextActive: {
    color: '#FF7722',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 4,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fdf8f3',
  },
  loadingText: {
    fontFamily: Fonts.Regular,
    marginTop: 10,
    color: '#6b7280',
    fontSize: 14,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 16,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  sectionSubtitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 6,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  badgeContainer: {
    backgroundColor: '#FFF5EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#FF7722',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  createButton: {
    backgroundColor: '#FF7722',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  serviceCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  serviceTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  serviceLabel: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  serviceValue: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoRowMultiline: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  infoValue: {
    fontFamily: Fonts.SemiBold,
    fontSize: 13,
    color: '#1f2937',
    flex: 1,
    textAlign: 'right',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  infoValueMultiline: {
    textAlign: 'left',
    marginTop: 4,
  },
  socialMediaSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },

  // Upload Styles
  uploadSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  uploadSectionTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  uploadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  uploadPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  coverPreview: {
    width: 120,
    height: 80,
    borderRadius: 8,
  },
  uploadPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  coverPlaceholder: {
    width: 120,
    height: 80,
  },
  uploadPlaceholderText: {
    fontFamily: Fonts.Regular,
    fontSize: 10,
    color: '#9ca3af',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  uploadActions: {
    flexDirection: 'row',
    gap: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  uploadButtonPrimary: {
    backgroundColor: '#FF7722',
  },
  uploadButtonDanger: {
    backgroundColor: '#ef4444',
  },
  uploadButtonText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  uploadHelperText: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Drag and Drop
  dropZone: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    marginBottom: 12,
  },
  dropZoneActive: {
    borderColor: '#FF7722',
    backgroundColor: '#fff5eb',
  },
  dropZoneText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  dropZoneSubtext: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Drag Overlay (Web)
  dragOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragOverlayContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dragOverlayText: {
    fontFamily: Fonts.Bold,
    fontSize: 20,
    color: '#1f2937',
    marginTop: 16,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  dragOverlaySubtext: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Upload Progress
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 9998,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadProgressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  uploadProgressText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
    color: '#1f2937',
    marginTop: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF7722',
    borderRadius: 4,
  },

  // URL Input
  urlInputContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  urlInput: {
    flex: 1,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF7722',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  browseButtonText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  fileInfo: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  uploadProgressContainer: {
    marginVertical: 8,
  },

  committeeCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  committeeHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 8,
  flexWrap: 'wrap', // ✅ Add this
},
  committeeName: {
    fontFamily: Fonts.Bold,
    fontSize: 16,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  committeeDescription: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  committeeType: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  committeeActions: {
  flexDirection: 'row',
  gap: 4, // ✅ Reduce gap
  flexShrink: 0, // ✅ Prevent shrinking
  alignItems: 'center',
},
committeeActionButton: {
  padding: 4,
  minWidth: 28, // ✅ Ensure minimum touch target
  alignItems: 'center',
  justifyContent: 'center',
},
  committeeMembers: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  committeeMembersTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  committeeMemberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  committeeMemberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  committeeAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  committeeAvatarText: {
    fontFamily: Fonts.Bold,
    fontSize: 14,
    color: '#FF7722',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  committeeMemberDetails: {
    flex: 1,
  },
  committeeMemberName: {
    fontFamily: Fonts.SemiBold,
    fontSize: 13,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  committeeMemberRole: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  committeeMemberPosition: {
    fontFamily: Fonts.Regular,
    fontSize: 10,
    color: '#9ca3af',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  committeeMemberActions: {
    flexDirection: 'row',
    gap: 4,
  },

  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexWrap: 'wrap',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontFamily: Fonts.Bold,
    fontSize: 16,
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
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  memberEmail: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  memberPhone: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#9ca3af',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  memberStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#d1fae5',
    marginHorizontal: 8,
  },
  memberStatusText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 10,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  memberActionButton: {
    padding: 4,
  },

  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentDetails: {
    marginLeft: 12,
    flex: 1,
  },
  documentTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  documentDescription: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  documentDate: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#9ca3af',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  documentDeleteButton: {
    padding: 4,
  },

  applicationCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  applicationUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  applicationAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  applicationAvatarText: {
    fontFamily: Fonts.Bold,
    fontSize: 16,
    color: '#FF7722',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  applicationUserName: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  applicationService: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  applicationStatus: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  applicationStatusText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 11,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  applicationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  verifyButton: {
    backgroundColor: '#FF7722',
  },
  fundButton: {
    backgroundColor: '#10b981',
    marginTop: 4,
  },
  applicationButtonText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 13,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  competitionCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
// Add these styles after your existing styles

// Committee Member Photo Upload
photoUploadContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
},
photoUploadPlaceholder: {
  width: 80,
  height: 80,
  borderRadius: 40,
  backgroundColor: '#f3f4f6',
  borderWidth: 2,
  borderColor: '#e5e7eb',
  borderStyle: 'dashed',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 4,
},
photoUploadText: {
  fontFamily: Fonts.Regular,
  fontSize: 9,
  color: '#9ca3af',
  textAlign: 'center',
},
memberPhotoPreview: {
  width: 80,
  height: 80,
  borderRadius: 40,
  borderWidth: 2,
  borderColor: '#FF7722',
},
photoPreviewContainer: {
  position: 'relative',
},
removePhotoButton: {
  position: 'absolute',
  top: -4,
  right: -4,
  backgroundColor: '#ffffff',
  borderRadius: 10,
  padding: 2,
  borderWidth: 1,
  borderColor: '#ef4444',
},
photoUploadButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 6,
  backgroundColor: '#FFF5EB',
  borderWidth: 1,
  borderColor: '#FF7722',
},
photoUploadButtonText: {
  fontFamily: Fonts.SemiBold,
  fontSize: 11,
  color: '#FF7722',
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
    marginBottom: 6,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  competitionDetails: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  competitionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  competitionDetailText: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
    gap: 4,
  },
// Committee Member Photo Upload
photoUploadContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
},
photoUploadPlaceholder: {
  width: 80,
  height: 80,
  borderRadius: 40,
  backgroundColor: '#f3f4f6',
  borderWidth: 2,
  borderColor: '#e5e7eb',
  borderStyle: 'dashed',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 4,
},
photoUploadText: {
  fontFamily: Fonts.Regular,
  fontSize: 9,
  color: '#9ca3af',
  textAlign: 'center',
},
memberPhotoPreview: {
  width: 80,
  height: 80,
  borderRadius: 40,
  borderWidth: 2,
  borderColor: '#FF7722',
},
photoPreviewContainer: {
  position: 'relative',
},
removePhotoButton: {
  position: 'absolute',
  top: -4,
  right: -4,
  backgroundColor: '#ffffff',
  borderRadius: 10,
  padding: 2,
  borderWidth: 1,
  borderColor: '#ef4444',
},
photoUploadButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 6,
  backgroundColor: '#FFF5EB',
  borderWidth: 1,
  borderColor: '#FF7722',
},
photoUploadButtonText: {
  fontFamily: Fonts.SemiBold,
  fontSize: 11,
  color: '#FF7722',
},
committeeMemberAvatarImage: {
  width: 36,
  height: 36,
  borderRadius: 18,
  marginRight: 10,
  borderWidth: 1,
  borderColor: '#e5e7eb',
},
  winnerText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    color: '#d97706',
    includeFontPadding: false,
    textAlignVertical: 'center',
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
  competitionActions: {
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  liveButton: {
    backgroundColor: '#FF7722',
  },
  endButton: {
    backgroundColor: '#ef4444',
  },
  passButton: {
    backgroundColor: '#8b5cf6',
  },
  certificateButton: {
    backgroundColor: '#10b981',
  },
  actionButtonText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

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
    fontSize: 20,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f3f4f6',
  },
helperText: {
  fontFamily: Fonts.Regular,
  fontSize: 11,
  color: '#9ca3af',
  marginTop: 4,
  includeFontPadding: false,
  textAlignVertical: 'center',
},
  modalCancelText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 15,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  modalConfirmButton: {
    backgroundColor: '#FF7722',
  },
  modalConfirmText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 15,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  field: {
    marginBottom: 12,
  },
  label: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
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
    height: 80,
    textAlignVertical: 'top',
  },

  statusPicker: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOptionActive: {
    backgroundColor: '#FF7722',
  },
  statusOptionText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  statusOptionTextActive: {
    color: '#ffffff',
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyStateText: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#9ca3af',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  createCompetitionButton: {
    backgroundColor: '#FF7722',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createCompetitionButtonText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  detailStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
subcommitteesContainer: {
  marginTop: 12,
  paddingTop: 12,
  borderTopWidth: 1,
  borderTopColor: '#e5e7eb',
},
subcommitteesHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  marginBottom: 8,
},
subcommitteesTitle: {
  fontFamily: Fonts.SemiBold,
  fontSize: 13,
  color: '#6b7280',
},
subcommitteeCard: {
  backgroundColor: '#f3f4f6',
  borderRadius: 8,
  padding: 10,
  marginBottom: 8,
  borderWidth: 1,
  borderColor: '#e5e7eb',
},
subcommitteeHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
},
subcommitteeInfo: {
  flex: 1,
},
subcommitteeName: {
  fontFamily: Fonts.SemiBold,
  fontSize: 14,
  color: '#1f2937',
},
subcommitteeDescription: {
  fontFamily: Fonts.Regular,
  fontSize: 12,
  color: '#6b7280',
},
subcommitteeType: {
  fontFamily: Fonts.Regular,
  fontSize: 10,
  color: '#9ca3af',
  marginTop: 2,
},
subcommitteeActions: {
  flexDirection: 'row',
  gap: 2,
  flexShrink: 0,
  alignItems: 'center',
},
subcommitteeMembers: {
  marginTop: 8,
  paddingTop: 8,
  borderTopWidth: 1,
  borderTopColor: '#e5e7eb',
},
subcommitteeMemberItem: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#ffffff',
  borderRadius: 6,
  padding: 6,
  marginBottom: 4,
  borderWidth: 1,
  borderColor: '#f0f0f0',
},
  detailStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
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
filePreview: {
  marginVertical: 8,
  padding: 8,
  backgroundColor: '#f9fafb',
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#e5e7eb',
  alignItems: 'center',
},
filePreviewImage: {
  width: '100%',
  height: 150,
  borderRadius: 4,
  resizeMode: 'contain',
},
filePreviewIcon: {
  alignItems: 'center',
  padding: 12,
},
filePreviewName: {
  fontFamily: Fonts.Regular,
  fontSize: 12,
  color: '#6b7280',
  marginTop: 4,
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
  detailActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 12,
  },
  detailActionText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#ffffff',
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

  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 380,
    alignItems: 'center',
  },
  confirmModalIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmModalTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 20,
    color: '#1f2937',
    marginBottom: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  confirmModalMessage: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    includeFontPadding: false,
  },
  confirmModalDetail: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 20,
    includeFontPadding: false,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelButton: {
    backgroundColor: '#f3f4f6',
  },
  confirmCancelText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 15,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  confirmVerifyButton: {
    backgroundColor: '#FF7722',
  },
// Add these to your StyleSheet

serviceManagementCard: {
  backgroundColor: '#f8fafc',
  borderRadius: 10,
  padding: 12,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: '#e5e7eb',
},
serviceManagementHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
},
serviceManagementIcon: {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: '#FFF5EB',
  justifyContent: 'center',
  alignItems: 'center',
},
serviceManagementInfo: {
  flex: 1,
},
serviceManagementName: {
  fontFamily: Fonts.SemiBold,
  fontSize: 14,
  color: '#1f2937',
},
serviceManagementDesc: {
  fontFamily: Fonts.Regular,
  fontSize: 12,
  color: '#6b7280',
},
serviceManagementMeta: {
  fontFamily: Fonts.Regular,
  fontSize: 11,
  color: '#9ca3af',
  marginTop: 2,
},
editServiceButton: {
  backgroundColor: '#FF7722',
  width: 36,
  height: 36,
  borderRadius: 18,
  justifyContent: 'center',
  alignItems: 'center',
},
serviceNameDisplay: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  backgroundColor: '#f9fafb',
  padding: 12,
  borderRadius: 8,
  marginBottom: 16,
},
serviceNameDisplayText: {
  fontFamily: Fonts.Bold,
  fontSize: 16,
  color: '#1f2937',
},
detailsSection: {
  marginTop: 12,
  paddingTop: 12,
  borderTopWidth: 1,
  borderTopColor: '#e5e7eb',
},
addDetailRow: {
  flexDirection: 'row',
  gap: 6,
  alignItems: 'center',
  marginBottom: 10,
},
detailInputSmall: {
  flex: 1,
  minWidth: 60,
},
detailInputMedium: {
  flex: 1.5,
  minWidth: 80,
},
addDetailButton: {
  width: 40,
  height: 40,
  borderRadius: 8,
  backgroundColor: '#FF7722',
  justifyContent: 'center',
  alignItems: 'center',
},
detailItem: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#f9fafb',
  padding: 10,
  borderRadius: 8,
  marginBottom: 6,
  borderWidth: 1,
  borderColor: '#f0f0f0',
},
detailItemContent: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  flex: 1,
  marginRight: 8,
},
detailItemLabel: {
  fontFamily: Fonts.Regular,
  fontSize: 13,
  color: '#1f2937',
},
detailItemValue: {
  fontFamily: Fonts.SemiBold,
  fontSize: 13,
  color: '#FF7722',
},
detailItemActions: {
  flexDirection: 'row',
  gap: 8,
},
emptyDetailsText: {
  fontFamily: Fonts.Regular,
  fontSize: 13,
  color: '#9ca3af',
  textAlign: 'center',
  paddingVertical: 12,
},
  confirmVerifyText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 15,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  confirmFundButton: {
    backgroundColor: '#10b981',
  },
  confirmFundText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 15,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});