// screens/member/MemberCompany.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Linking, Alert, FlatList 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db } from '../../config/firebase';
import { doc, getDoc, collection, getDocs, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Fonts } from '../../config/fonts';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { getTotalDonations, getDonationCount } from '../../services/paymentService';
import { useLanguage } from '../../context/LanguageContext';

export default function MemberCompany({ navigation }) {
  const { t, counter, isHindi } = useLanguage();
  
  // Force re-render when language changes
  const renderKey = `member-company-${counter}`;

  // State for all dynamic data
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
const [expandedCommittees, setExpandedCommittees] = useState({});
  const [committees, setCommittees] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [partners, setPartners] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
const [selectedQuote, setSelectedQuote] = useState(null);
const [quoteModalVisible, setQuoteModalVisible] = useState(false);
const [downloadingQuote, setDownloadingQuote] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [donationStats, setDonationStats] = useState({
    totalAmount: 0,
    totalDonations: 0,
    totalCampaigns: 0,
  });

  // Get translations
  const translations = {
    // Common
    error: t('common.error') || 'Error',
    loading: t('common.loading') || 'Loading...',
    nA: t('common.nA') || 'N/A',
    notProvided: t('common.notProvided') || 'Not provided',
    active: t('common.active') || 'Active',
    description: t('common.description') || 'Description',
    members: t('common.members') || 'Members',
    
    // Header
    organizationProfile: t('company.organizationDashboard') || 'Organization Profile',
    
    // Cover
    organizationCover: 'Organization Cover',
    
    // Status
    est: t('certificate.est') || 'Est.',
    
    // Donation Stats
    donationImpact: 'Donation Impact',
    totalDonations: t('finances.totalDonations') || 'Total Donations',
    donors: 'Donors',
    campaigns: t('company.competitionsTitle') || 'Campaigns',
    donateNow: t('donation.donateNow') || 'Donate Now',
    
    // Organization Details
    organizationDetails: t('company.details') || 'Organization Details',
    cin: t('company.cin') || 'CIN',
    registrationNumber: t('company.registrationNumber') || 'Registration Number',
    employeeCount: t('company.employeeCount') || 'Employee Count',
    
    // Services
    servicesOffered: t('company.servicesOffered') || 'Services Offered',
    oldAgeAssistance: t('company.oldAgeAssistance') || 'Kabir Old Age Assistance Program',
    kanyaMarriage: t('company.kanyaMarriageAssistance') || 'Kanya (Girl Child) Marriage Assistance Program',
    selfEmployment: t('company.selfEmploymentAssistance') || 'Self-Employment Assistance Scheme',
    below20: t('company.below20Years') || 'Below 20 years',
    between20to40: t('company.between20to40') || '20 - 40 years',
    between40to60: t('company.between40to60') || '40 - 60 years',
    above60: t('company.above60Years') || '60 years & above',
    below4: t('company.below4Years') || 'Below 4 years',
    between4to8: t('company.between4to8') || '4 - 8 years',
    between8to12: t('company.between8to12') || '8 - 12 years',
    above12: t('company.above12Years') || '12 years & above',
    
    // About
    aboutOrganization: t('company.about') || 'About Organization',
    
    // Mission & Vision
    mission: t('company.mission') || 'Mission',
    vision: t('company.vision') || 'Vision',
    
    // Leadership
    leadership: t('home.leadership') || 'Leadership & Committees',
    president: t('home.president') || 'President',
    secretary: t('home.secretary') || 'Secretary',
    committees: t('company.committees') || 'Committees',
    committeeMembers: t('company.members') || 'Committee Members',
    
    // Documents
    documents: t('company.documents') || 'Documents',
    uploaded: t('company.uploaded') || 'Uploaded',
    
    // Events
    events: t('home.events') || 'Upcoming Events',
    register: t('home.register') || 'Register',
    
    // Competitions
    competitions: t('company.competitions') || 'Competitions',
    prize: t('company.prize') || 'Prize',
    venue: t('company.venue') || 'Venue',
    
    // Testimonials
    testimonials: t('home.testimonials') || 'Testimonials',
    
    // FAQ
    faqs: t('home.faqs') || 'Frequently Asked Questions',
    
    // Partners
    partners: t('home.partners') || 'Our Partners',
    
    // Announcements
    announcements: t('home.announcements') || 'Announcements',
    
    // Gallery
    gallery: t('home.gallery') || 'Gallery',
    
    // Contact
    contactInformation: t('company.companyInformation') || 'Contact Information',
    email: t('common.email') || 'Email',
    phone: t('common.phone') || 'Phone',
    address: t('common.address') || 'Address',
    website: 'Website',
    
    // Footer
    allRightsReserved: t('home.allRightsReserved') || 'All rights reserved.',
    
    // Empty state
    noOrganizationData: 'No Organization Data',
    noOrganizationSubtext: 'Please contact the administrator to set up the organization profile.',
    retry: t('common.back') || 'Retry',
    
    // Alert
    failedToLoad: t('common.failedToLoad') || 'Failed to load profile',
    couldNotOpen: 'Could not open link',
    couldNotOpenDialer: 'Could not open dialer',
    couldNotOpenEmail: 'Could not open email',
    
    // Loading
    loadingOrganization: 'Loading Organization Profile...',
    noData: 'No data available',
    noDocuments: 'No documents uploaded',
    noEvents: 'No upcoming events',
    noCompetitions: 'No competitions available',
    noTestimonials: 'No testimonials yet',
    noFaqs: 'No FAQs available',
    noPartners: 'No partners listed',
    noAnnouncements: 'No announcements',
    noGallery: 'No gallery images',
    noCommittee: 'No committees created',
    noMembers: 'No members added',
    viewAll: 'View All',
    // Quotes
    inspirationalQuotes: 'Inspirational Quotes',
    noQuotes: 'No quotes available',
  };

  // Setup real-time listeners
  useEffect(() => {
    fetchCompanyData();
    fetchDonationStats();
    setupCommitteeListener();
    setupDocumentsListener();
    setupMembersListener();
    setupEventsListener();
    setupCompetitionsListener();
    setupTestimonialsListener();
    setupFaqsListener();
    setupPartnersListener();
    setupAnnouncementsListener();
    setupGalleryListener();
    setupQuotesListener();
  }, []);

  // ========== SETUP REAL-TIME LISTENERS ==========
  const toggleCommittee = (committeeId) => {
  console.log('🔵 Toggling committee:', committeeId);
  setExpandedCommittees(prev => {
    const newState = {
      ...prev,
      [committeeId]: !prev[committeeId],
    };
    console.log('🔵 New expanded state:', newState);
    return newState;
  });
};
  const setupCommitteeListener = () => {
    const committeesRef = collection(db, 'company', 'profile', 'committees');
    return onSnapshot(committeesRef, (snapshot) => {
      const committeeList = [];
      snapshot.forEach((doc) => {
        committeeList.push({ id: doc.id, ...doc.data() });
      });
      setCommittees(committeeList.sort((a, b) => (a.order || 0) - (b.order || 0)));
    }, (error) => {
      console.error('Error fetching committees:', error);
    });
  };
const downloadQuoteImage = async (imageUrl, quoteText, author) => {
  if (!imageUrl) {
    Alert.alert('Error', 'No image to share');
    return;
  }

  setDownloadingQuote(true);
  try {
    // For Web
    if (Platform.OS === 'web') {
      // Create shareable text with quote
      const shareText = `"${quoteText}"${author ? ` - ${author}` : ''}`;
      
      // Try to share via Web Share API
      if (navigator.share) {
        try {
          // Fetch image as blob
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const file = new File([blob], `quote_${Date.now()}.jpg`, { type: 'image/jpeg' });
          
          await navigator.share({
            title: 'Inspirational Quote',
            text: shareText,
            files: [file],
          });
          setDownloadingQuote(false);
          return;
        } catch (shareError) {
          if (shareError.name !== 'AbortError') {
            console.error('Share error:', shareError);
          }
          // Fallback: download the image
          const link = document.createElement('a');
          link.href = imageUrl;
          link.download = `quote_${Date.now()}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          Alert.alert('Success', 'Image downloaded successfully!');
        }
      } else {
        // Fallback: download the image
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `quote_${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        Alert.alert('Success', 'Image downloaded successfully!');
      }
      setDownloadingQuote(false);
      return;
    }

    // For Mobile
    const fileName = `quote_${Date.now()}.jpg`;
    const fileUri = FileSystem.documentDirectory + fileName;
    
    // Download image
    const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);
    
    // Check if sharing is available
    if (await Sharing.isAvailableAsync()) {
      // ✅ FIX: Share with both image and text
      const shareText = `"${quoteText}"${author ? ` - ${author}` : ''}`;
      
      await Sharing.shareAsync(downloadResult.uri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Share Quote',
        UTI: 'public.jpeg',
        // ✅ For WhatsApp specifically, use text with image
        // The image will be attached automatically
      });
      
      // ✅ Also share text separately for WhatsApp to show the quote
      // This creates a combined share experience
      Alert.alert(
        'Share Quote',
        `"${quoteText}"${author ? `\n- ${author}` : ''}`,
        [
          { 
            text: 'Share Text Only', 
            onPress: async () => {
              await Sharing.shareAsync(fileUri, {
                mimeType: 'image/jpeg',
                dialogTitle: 'Share Quote Image',
              });
            }
          },
          { 
            text: 'Copy Text', 
            onPress: () => {
              // Copy quote text to clipboard
              const text = `"${quoteText}"${author ? ` - ${author}` : ''}`;
              if (Platform.OS === 'web') {
                navigator.clipboard.writeText(text);
              }
              Alert.alert('Copied!', 'Quote copied to clipboard');
            }
          },
          { text: 'Close', style: 'cancel' }
        ]
      );
    } else {
      // If sharing not available, save to device
      Alert.alert(
        'Image Saved',
        `Quote image saved to: ${fileUri}`,
        [
          { text: 'OK' }
        ]
      );
    }
  } catch (error) {
    console.error('Error sharing quote:', error);
    Alert.alert('Error', 'Failed to share image. Please try again.');
  } finally {
    setDownloadingQuote(false);
  }
};
  const setupDocumentsListener = () => {
    const docsRef = collection(db, 'company', 'profile', 'documents');
    return onSnapshot(docsRef, (snapshot) => {
      const docs = [];
      snapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() });
      });
      setDocuments(docs);
    }, (error) => {
      console.error('Error fetching documents:', error);
    });
  };

  const setupMembersListener = () => {
    const membersRef = collection(db, 'members');
    const q = query(membersRef, where('status', '==', 'active'));
    return onSnapshot(q, (snapshot) => {
      const memberList = [];
      snapshot.forEach((doc) => {
        memberList.push({ id: doc.id, ...doc.data() });
      });
      setMembers(memberList);
    }, (error) => {
      console.error('Error fetching members:', error);
    });
  };

  const setupEventsListener = () => {
    const q = query(
      collection(db, 'events'),
      where('isActive', '==', true),
      orderBy('date', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const eventsList = [];
      snapshot.forEach((doc) => {
        eventsList.push({ id: doc.id, ...doc.data() });
      });
      setEvents(eventsList);
    }, (error) => {
      console.error('Error fetching events:', error);
    });
  };

  const setupCompetitionsListener = () => {
    const q = query(
      collection(db, 'competitions'),
      where('status', 'in', ['upcoming', 'live'])
    );
    return onSnapshot(q, (snapshot) => {
      const comps = [];
      snapshot.forEach((doc) => {
        comps.push({ id: doc.id, ...doc.data() });
      });
      setCompetitions(comps);
    }, (error) => {
      console.error('Error fetching competitions:', error);
    });
  };

  const setupTestimonialsListener = () => {
    const q = query(
      collection(db, 'testimonials'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const testimonialList = [];
      snapshot.forEach((doc) => {
        testimonialList.push({ id: doc.id, ...doc.data() });
      });
      setTestimonials(testimonialList);
    }, (error) => {
      console.error('Error fetching testimonials:', error);
    });
  };

  const setupFaqsListener = () => {
    const q = query(
      collection(db, 'faqs'),
      where('isActive', '==', true),
      orderBy('order', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const faqList = [];
      snapshot.forEach((doc) => {
        faqList.push({ id: doc.id, ...doc.data() });
      });
      setFaqs(faqList);
    }, (error) => {
      console.error('Error fetching FAQs:', error);
    });
  };

  const setupPartnersListener = () => {
    const q = query(
      collection(db, 'partners'),
      where('isActive', '==', true),
      orderBy('order', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const partnerList = [];
      snapshot.forEach((doc) => {
        partnerList.push({ id: doc.id, ...doc.data() });
      });
      setPartners(partnerList);
    }, (error) => {
      console.error('Error fetching partners:', error);
    });
  };

  const setupAnnouncementsListener = () => {
    const q = query(
      collection(db, 'announcements'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const announcementList = [];
      snapshot.forEach((doc) => {
        announcementList.push({ id: doc.id, ...doc.data() });
      });
      setAnnouncements(announcementList);
    }, (error) => {
      console.error('Error fetching announcements:', error);
    });
  };

  const setupGalleryListener = () => {
    const q = query(
      collection(db, 'gallery'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const galleryList = [];
      snapshot.forEach((doc) => {
        galleryList.push({ id: doc.id, ...doc.data() });
      });
      setGallery(galleryList);
    }, (error) => {
      console.error('Error fetching gallery:', error);
    });
  };

  const setupQuotesListener = () => {
  console.log('🔍 [QUOTES] Setting up quotes listener...');
  
  const q = query(
    collection(db, 'quotes'),
    where('isActive', '==', true)
    // ✅ REMOVED orderBy temporarily
  );
  
  return onSnapshot(q, (snapshot) => {
    console.log('🔍 [QUOTES] Snapshot received! Docs count:', snapshot.docs.length);
    
    const quotesList = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // ✅ REMOVE DATE FILTER - Show all active quotes
      if (data.isActive !== false) {
        quotesList.push({ 
          id: doc.id, 
          ...data,
        });
      }
    });
    
    console.log('🔍 [QUOTES] Final quotesList length:', quotesList.length);
    setQuotes(quotesList);
  }, (error) => {
    console.error('🔍 [QUOTES] Error fetching quotes:', error);
  });
};

  // ========== FETCH DATA ==========
  
  const fetchCompanyData = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'company', 'profile');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('✅ Company Data:', data);
        setCompanyData(data);
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
      Alert.alert(translations.error, translations.failedToLoad);
    } finally {
      setLoading(false);
    }
  };

  const fetchDonationStats = async () => {
    try {
      const donationsSnap = await getDocs(query(
        collection(db, 'donations'),
        where('status', '==', 'completed')
      ));
      
      let totalAmount = 0;
      let totalDonations = 0;
      donationsSnap.forEach(doc => {
        const data = doc.data();
        totalAmount += data.amount || 0;
        totalDonations++;
      });

      const razorpayTotal = getTotalDonations();
      const razorpayCount = getDonationCount();

      const campaignsSnap = await getDocs(collection(db, 'campaigns'));
      const campaignsCount = campaignsSnap.size;

      setDonationStats({
        totalAmount: totalAmount + razorpayTotal,
        totalDonations: totalDonations + razorpayCount,
        totalCampaigns: campaignsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching donation stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCompanyData();
    await fetchDonationStats();
    setRefreshing(false);
  };

  // ========== TRANSLATION HELPERS ==========
  
  const getTranslatedField = (field, fallback = translations.notProvided) => {
    if (!companyData) return fallback;
    const keys = field.split('.');
    let value = companyData;
    for (const key of keys) {
      if (value && value[key] !== undefined) {
        value = value[key];
      } else {
        return fallback;
      }
    }
    return value || fallback;
  };

  const getTranslatedOrgName = () => {
    const name = getTranslatedField('organizationName', 'NGO Organization');
    if (isHindi && companyData?.organizationNameHi) {
      return companyData.organizationNameHi;
    }
    return name;
  };

  const getTranslatedAddress = () => {
    const address = getTranslatedField('address', translations.notProvided);
    if (isHindi && companyData?.addressHi) {
      return companyData.addressHi;
    }
    return address;
  };

  const getTranslatedAbout = () => {
    const about = getTranslatedField('about', '');
    if (isHindi && companyData?.aboutHi) {
      return companyData.aboutHi;
    }
    return about;
  };

  const getTranslatedTagline = () => {
    const tagline = getTranslatedField('tagline', '');
    if (isHindi && companyData?.taglineHi) {
      return companyData.taglineHi;
    }
    return tagline;
  };
const shareToWhatsApp = async (imageUrl, quoteText, author) => {
  setDownloadingQuote(true);
  try {
    const shareText = `"${quoteText}"${author ? ` - ${author}` : ''}`;
    
    // For mobile - use Linking to open WhatsApp with pre-filled text
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(shareText)}`;
    
    // Download and share image separately
    const fileName = `quote_${Date.now()}.jpg`;
    const fileUri = FileSystem.documentDirectory + fileName;
    
    const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);
    
    // Share the image
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(downloadResult.uri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Share Quote Image',
      });
    }
    
    // Also try to open WhatsApp with text
    try {
      await Linking.openURL(whatsappUrl);
    } catch (e) {
      // WhatsApp not installed, just share normally
    }
    
  } catch (error) {
    console.error('Error sharing to WhatsApp:', error);
    Alert.alert('Error', 'Failed to share to WhatsApp');
  } finally {
    setDownloadingQuote(false);
  }
};
  const getTranslatedMission = () => {
    const mission = getTranslatedField('mission', '');
    if (isHindi && companyData?.missionHi) {
      return companyData.missionHi;
    }
    return mission;
  };

  const getTranslatedVision = () => {
    const vision = getTranslatedField('vision', '');
    if (isHindi && companyData?.visionHi) {
      return companyData.visionHi;
    }
    return vision;
  };

  const getTranslatedCommitteeName = (committee) => {
    if (isHindi && committee.nameHi) {
      return committee.nameHi;
    }
    return committee.name || 'Committee';
  };

  const getTranslatedCommitteeDesc = (committee) => {
    if (isHindi && committee.descriptionHi) {
      return committee.descriptionHi;
    }
    return committee.description || '';
  };

  const getTranslatedMemberName = (member) => {
    if (isHindi && member.nameHi) {
      return member.nameHi;
    }
    return member.name || 'Member';
  };

  const getTranslatedMemberRole = (member) => {
    if (isHindi && member.roleHi) {
      return member.roleHi;
    }
    return member.role || '';
  };

  const getTranslatedEventName = (event) => {
    if (isHindi && event.nameHi) {
      return event.nameHi;
    }
    return event.name || 'Event';
  };

  const getTranslatedEventDesc = (event) => {
    if (isHindi && event.descriptionHi) {
      return event.descriptionHi;
    }
    return event.description || '';
  };

  const getTranslatedCompetitionTitle = (competition) => {
    if (isHindi && competition.titleHi) {
      return competition.titleHi;
    }
    return competition.title || 'Competition';
  };

  const getTranslatedAnnouncement = (announcement) => {
    if (isHindi && announcement.contentHi) {
      return announcement.contentHi;
    }
    return announcement.content || '';
  };

  const getTranslatedTestimonial = (testimonial) => {
    if (isHindi && testimonial.contentHi) {
      return testimonial.contentHi;
    }
    return testimonial.content || '';
  };

  const getTranslatedFaqQuestion = (faq) => {
    if (isHindi && faq.questionHi) {
      return faq.questionHi;
    }
    return faq.question || '';
  };

  const getTranslatedFaqAnswer = (faq) => {
    if (isHindi && faq.answerHi) {
      return faq.answerHi;
    }
    return faq.answer || '';
  };

  const getTranslatedPartnerName = (partner) => {
    if (isHindi && partner.nameHi) {
      return partner.nameHi;
    }
    return partner.name || 'Partner';
  };

  const getTranslatedGalleryTitle = (item) => {
    if (isHindi && item.titleHi) {
      return item.titleHi;
    }
    return item.title || '';
  };

  const getTranslatedQuoteText = (quote) => {
    if (isHindi && quote.textHi) {
      return quote.textHi;
    }
    return quote.text || '';
  };

  // ========== HANDLERS ==========

  const openLink = (url) => {
    if (url && url !== translations.notProvided) {
      Linking.openURL(url).catch(() => {
        Alert.alert(translations.error, translations.couldNotOpen);
      });
    }
  };

  const callPhone = (phone) => {
    if (phone && phone !== translations.notProvided) {
      Linking.openURL(`tel:${phone}`).catch(() => {
        Alert.alert(translations.error, translations.couldNotOpenDialer);
      });
    }
  };

  const sendEmail = (email) => {
    if (email && email !== translations.notProvided) {
      Linking.openURL(`mailto:${email}`).catch(() => {
        Alert.alert(translations.error, translations.couldNotOpenEmail);
      });
    }
  };

  const handleDocumentPress = (document) => {
    if (!document.fileUrl) return;
    
    // Check if it's an image (ImgBB URL, Base64, or image extension)
    const isImageUrl = document.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) || 
                       document.fileUrl.includes('i.ibb.co') ||
                       document.fileUrl.includes('imgbb.com') ||
                       document.fileUrl.startsWith('data:image');
    
    if (isImageUrl) {
      // Open image in modal
      setSelectedDocument(document);
      setModalVisible(true);
    } 
    // Check if it's a PDF or document URL
    else if (document.fileUrl.match(/\.(pdf|doc|docx)$/i)) {
      Linking.openURL(document.fileUrl);
    }
    // Regular URL - open in browser
    else if (document.fileUrl.startsWith('http')) {
      Linking.openURL(document.fileUrl);
    }
    // Base64 other than image
    else if (document.fileUrl.startsWith('data:')) {
      Alert.alert(
        document.title || 'Document',
        'This document cannot be previewed directly.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleEventPress = (event) => {
    Alert.alert(
      getTranslatedEventName(event) || 'Event',
      translations.register + ' ' + translations.events,
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        { text: translations.register || 'Register', onPress: () => {
          if (event.registrationLink) {
            openLink(event.registrationLink);
          }
        }}
      ]
    );
  };

  const handleCompetitionPress = (competition) => {
    Alert.alert(
      getTranslatedCompetitionTitle(competition) || 'Competition',
      translations.register + ' ' + translations.competitions,
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        { text: translations.register || 'Register', onPress: () => {
          if (competition.registrationLink) {
            openLink(competition.registrationLink);
          }
        }}
      ]
    );
  };

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const getField = (field, fallback = translations.notProvided) => {
    if (!companyData) return fallback;
    const keys = field.split('.');
    let value = companyData;
    for (const key of keys) {
      if (value && value[key] !== undefined) {
        value = value[key];
      } else {
        return fallback;
      }
    }
    return value || fallback;
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === translations.notProvided) return translations.nA;
    return `₹ ${parseInt(amount).toLocaleString('en-IN')}`;
  };

  // ========== RENDER HELPERS ==========

  const ServiceCard = ({ title, icon, children }) => (
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <MaterialIcons name={icon} size={20} color="#3b82f6" />
        <Text style={styles.serviceTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const ServiceRow = ({ label, value }) => (
    <View style={styles.serviceRow}>
      <Text style={styles.serviceLabel}>{label}</Text>
      <Text style={styles.serviceValue}>{formatCurrency(value)}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer} key={renderKey}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>{translations.loadingOrganization}</Text>
      </View>
    );
  }

  if (!companyData) {
    return (
      <View style={styles.emptyContainer} key={renderKey}>
        <MaterialIcons name="business" size={60} color="#d1d5db" />
        <Text style={styles.emptyTitle}>{translations.noOrganizationData}</Text>
        <Text style={styles.emptySubtext}>{translations.noOrganizationSubtext}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCompanyData} activeOpacity={0.7}>
          <Text style={styles.retryButtonText}>{translations.retry}</Text>
        </TouchableOpacity>
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
          <Text style={styles.headerTitle}>{translations.organizationProfile}</Text>
          <View style={{ width: 32 }} />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Cover Image */}
        <View style={styles.coverSection}>
          {getField('coverImage') && getField('coverImage') !== translations.notProvided ? (
            <Image source={{ uri: getField('coverImage') }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <MaterialIcons name="image" size={40} color="#9ca3af" />
              <Text style={styles.coverPlaceholderText}>{translations.organizationCover}</Text>
            </View>
          )}
        </View>

        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            {getField('logo') && getField('logo') !== translations.notProvided ? (
              <Image source={{ uri: getField('logo') }} style={styles.logoImage} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoText}>
                  {getTranslatedOrgName().charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Organization Info */}
        <View style={styles.card}>
          <Text style={styles.companyName}>{getTranslatedOrgName()}</Text>
          {getTranslatedTagline() && (
            <Text style={styles.tagline}>{getTranslatedTagline()}</Text>
          )}
          <View style={styles.statusContainer}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{translations.active}</Text>
            </View>
            {getField('establishedYear') && getField('establishedYear') !== translations.notProvided && (
              <Text style={styles.establishedText}>{translations.est} {getField('establishedYear')}</Text>
            )}
          </View>
          {getField('description') && getField('description') !== translations.notProvided && (
            <Text style={styles.description}>{getField('description')}</Text>
          )}
        </View>

        {/* Donation Stats Section */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="favorite" size={20} color="#ef4444" />
            <Text style={styles.sectionTitle}>{translations.donationImpact}</Text>
          </View>

          <View style={styles.donationStatsContainer}>
            <View style={styles.donationStatItem}>
              <Text style={styles.donationStatValue}>₹{donationStats.totalAmount.toLocaleString()}</Text>
              <Text style={styles.donationStatLabel}>{translations.totalDonations}</Text>
            </View>
            <View style={styles.donationStatDivider} />
            <View style={styles.donationStatItem}>
              <Text style={styles.donationStatValue}>{donationStats.totalDonations}</Text>
              <Text style={styles.donationStatLabel}>{translations.donors}</Text>
            </View>
            <View style={styles.donationStatDivider} />
            <View style={styles.donationStatItem}>
              <Text style={styles.donationStatValue}>{donationStats.totalCampaigns}</Text>
              <Text style={styles.donationStatLabel}>{translations.campaigns}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.donateNowButton}
            onPress={() => navigation.navigate('DonationScreen')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="favorite" size={20} color="#ffffff" />
            <Text style={styles.donateNowText}>{translations.donateNow}</Text>
          </TouchableOpacity>
        </View>

        {/* Announcements */}
        {announcements.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="campaign" size={20} color="#f59e0b" />
              <Text style={styles.sectionTitle}>{translations.announcements}</Text>
            </View>
            {announcements.slice(0, 3).map((announcement) => (
              <View key={announcement.id} style={styles.announcementItem}>
                <MaterialIcons name="announcement" size={16} color="#f59e0b" />
                <Text style={styles.announcementText}>
                  {getTranslatedAnnouncement(announcement)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Organization Details */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="info" size={20} color="#3b82f6" />
            <Text style={styles.sectionTitle}>{translations.organizationDetails}</Text>
          </View>

          {getField('cin') && getField('cin') !== translations.notProvided && (
            <View style={styles.detailRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#eff6ff' }]}>
                <MaterialIcons name="verified" size={18} color="#3b82f6" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{translations.cin}</Text>
                <Text style={styles.detailValue}>{getField('cin')}</Text>
              </View>
            </View>
          )}

          {getField('registrationNumber') && getField('registrationNumber') !== translations.notProvided && (
            <View style={styles.detailRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#f3f4f6' }]}>
                <MaterialIcons name="assignment" size={18} color="#6b7280" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{translations.registrationNumber}</Text>
                <Text style={styles.detailValue}>{getField('registrationNumber')}</Text>
              </View>
            </View>
          )}

          {getField('employeeCount') && getField('employeeCount') !== translations.notProvided && (
            <View style={styles.detailRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#d1fae5' }]}>
                <MaterialIcons name="people" size={18} color="#10b981" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{translations.employeeCount}</Text>
                <Text style={styles.detailValue}>{getField('employeeCount')}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Services Offered Section */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="handshake" size={20} color="#3b82f6" />
            <Text style={styles.sectionTitle}>{translations.servicesOffered}</Text>
          </View>

          {getField('oldAgeAssistance') && getField('oldAgeAssistance') !== translations.notProvided && (
            <ServiceCard title={translations.oldAgeAssistance} icon="elderly">
              <ServiceRow 
                label={translations.below20} 
                value={getField('oldAgeAssistance.below20')} 
              />
              <ServiceRow 
                label={translations.between20to40} 
                value={getField('oldAgeAssistance.between20to40')} 
              />
              <ServiceRow 
                label={translations.between40to60} 
                value={getField('oldAgeAssistance.between40to60')} 
              />
              <ServiceRow 
                label={translations.above60} 
                value={getField('oldAgeAssistance.above60')} 
              />
            </ServiceCard>
          )}

          {getField('kanyaMarriageAssistance') && getField('kanyaMarriageAssistance') !== translations.notProvided && (
            <ServiceCard title={translations.kanyaMarriage} icon="child-care">
              <ServiceRow 
                label={translations.below4} 
                value={getField('kanyaMarriageAssistance.below4')} 
              />
              <ServiceRow 
                label={translations.between4to8} 
                value={getField('kanyaMarriageAssistance.between4to8')} 
              />
              <ServiceRow 
                label={translations.between8to12} 
                value={getField('kanyaMarriageAssistance.between8to12')} 
              />
              <ServiceRow 
                label={translations.above12} 
                value={getField('kanyaMarriageAssistance.above12')} 
              />
            </ServiceCard>
          )}

          {getField('selfEmploymentAssistance') && getField('selfEmploymentAssistance') !== translations.notProvided && (
            <ServiceCard title={translations.selfEmployment} icon="work">
              <View style={styles.serviceRow}>
                <Text style={styles.serviceLabel}>{translations.description}</Text>
                <Text style={[styles.serviceValue, styles.serviceDescription]}>
                  {getField('selfEmploymentAssistance')}
                </Text>
              </View>
            </ServiceCard>
          )}
        </View>

        {/* About Organization */}
        {getTranslatedAbout() && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="article" size={20} color="#3b82f6" />
              <Text style={styles.sectionTitle}>{translations.aboutOrganization}</Text>
            </View>
            <Text style={styles.aboutText}>{getTranslatedAbout()}</Text>
          </View>
        )}

        {/* Mission & Vision */}
        {(getTranslatedMission() || getTranslatedVision()) && (
          <View style={styles.card}>
            <View style={styles.missionVisionContainer}>
              {getTranslatedMission() && (
                <View style={styles.mvItem}>
                  <View style={[styles.mvIcon, { backgroundColor: '#eff6ff' }]}>
                    <MaterialIcons name="flag" size={20} color="#3b82f6" />
                  </View>
                  <View style={styles.mvContent}>
                    <Text style={styles.mvTitle}>{translations.mission}</Text>
                    <Text style={styles.mvText}>{getTranslatedMission()}</Text>
                  </View>
                </View>
              )}

              {getTranslatedVision() && (
                <View style={[styles.mvItem, getTranslatedMission() && styles.mvItemBorder]}>
                  <View style={[styles.mvIcon, { backgroundColor: '#d1fae5' }]}>
                    <MaterialIcons name="visibility" size={20} color="#10b981" />
                  </View>
                  <View style={styles.mvContent}>
                    <Text style={styles.mvTitle}>{translations.vision}</Text>
                    <Text style={styles.mvText}>{getTranslatedVision()}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

{/* Leadership/Committees Section */}
{committees.length > 0 && (
  <View style={styles.card}>
    <View style={styles.sectionHeader}>
      <MaterialIcons name="groups" size={22} color="#FF7722" />
      <Text style={styles.sectionTitle}>{t('home.leadership') || 'Leadership & Committees'}</Text>
    </View>
    
    {committees.map((committee) => {
      const isExpanded = expandedCommittees[committee.id];
      const memberCount = committee.members?.length || 0;
      const subcommitteeCount = committee.subcommittees?.length || 0;

      return (
        <View key={committee.id} style={styles.committeeCard}>
          {/* Committee Header - Always Visible */}
          <TouchableOpacity
            style={styles.committeeHeaderRow}
            onPress={() => toggleCommittee(committee.id)}
            activeOpacity={0.7}
          >
            <View style={styles.committeeHeaderLeft}>
              <View style={styles.committeeIconContainer}>
                <MaterialIcons name="groups" size={22} color="#FF7722" />
              </View>
              <View style={styles.committeeHeaderInfo}>
                <Text style={styles.committeeName}>
                  {getTranslatedCommitteeName(committee)}
                </Text>
                <View style={styles.committeeBadges}>
                  {memberCount > 0 && (
                    <Text style={styles.committeeMemberCount}>
                      {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
                    </Text>
                  )}
                  {subcommitteeCount > 0 && (
                    <Text style={styles.subcommitteeCount}>
                      {subcommitteeCount} {subcommitteeCount === 1 ? 'Subcommittee' : 'Subcommittees'}
                    </Text>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.committeeHeaderRight}>
              {committee.description && (
                <MaterialIcons name="info-outline" size={18} color="#9ca3af" style={styles.committeeInfoIcon} />
              )}
              <MaterialIcons 
                name={isExpanded ? 'expand-less' : 'expand-more'} 
                size={28} 
                color="#6b7280" 
              />
            </View>
          </TouchableOpacity>

          {/* Committee Description */}
          {committee.description && (
            <Text style={styles.committeeDescription}>
              {getTranslatedCommitteeDesc(committee)}
            </Text>
          )}

          {/* Committee Members - Expandable */}
          {isExpanded && memberCount > 0 && (
            <View style={styles.committeeMembersList}>
              <Text style={styles.membersListTitle}>Members</Text>
              <View style={styles.membersGrid}>
                {committee.members.map((member, index) => (
                  <View key={member.id || index} style={styles.committeeMemberCard}>
                    {member.photo ? (
                      <Image 
                        source={{ uri: member.photo }} 
                        style={styles.committeeMemberPhoto} 
                      />
                    ) : (
                      <View style={[styles.leaderIcon, { backgroundColor: '#FF7722' }]}>
                        <Text style={styles.leaderInitial}>
                          {getTranslatedMemberName(member).charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.leaderContent}>
                      <Text style={styles.leaderName}>
                        {getTranslatedMemberName(member)}
                      </Text>
                      <Text style={styles.leaderRole}>
                        {getTranslatedMemberRole(member)}
                      </Text>
                      {member.position && (
                        <Text style={styles.leaderPosition}>
                          {member.position}
                        </Text>
                      )}
                      <View style={styles.leaderContacts}>
                        {member.phone && (
                          <TouchableOpacity 
                            style={styles.leaderContactBtn}
                            onPress={() => handleCallPress(member.phone)}
                            activeOpacity={0.7}
                          >
                            <MaterialIcons name="phone" size={12} color="#6b7280" />
                            <Text style={styles.leaderContactText}>{member.phone}</Text>
                          </TouchableOpacity>
                        )}
                        {member.email && (
                          <TouchableOpacity 
                            style={styles.leaderContactBtn}
                            onPress={() => handleEmailPress(member.email)}
                            activeOpacity={0.7}
                          >
                            <MaterialIcons name="email" size={12} color="#6b7280" />
                            <Text style={styles.leaderContactText}>{member.email}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      {member.bio && (
                        <Text style={styles.leaderBio} numberOfLines={2}>
                          {member.bio}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* SUBCOMMITTEES SECTION */}
          {isExpanded && subcommitteeCount > 0 && (
            <View style={styles.subcommitteesContainer}>
              <View style={styles.subcommitteesHeader}>
                <MaterialIcons name="layers" size={18} color="#8b5cf6" />
                <Text style={styles.subcommitteesTitle}>Subcommittees</Text>
              </View>
              {committee.subcommittees.map((sub) => {
                const subMemberCount = sub.members?.length || 0;
                return (
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
                        {subMemberCount > 0 && (
                          <Text style={styles.subcommitteeMemberCount}>
                            {subMemberCount} {subMemberCount === 1 ? 'Member' : 'Members'}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Subcommittee Members */}
                    {sub.members && sub.members.length > 0 && (
                      <View style={styles.subcommitteeMembers}>
                        {sub.members.map((member, idx) => (
                          <View key={member.id || idx} style={styles.subcommitteeMemberItem}>
                            {member.photo ? (
                              <Image 
                                source={{ uri: member.photo }} 
                                style={[styles.committeeMemberPhoto, { width: 32, height: 32, marginRight: 8 }]} 
                              />
                            ) : (
                              <View style={[styles.leaderIcon, { width: 32, height: 32, marginRight: 8 }]}>
                                <Text style={[styles.leaderInitial, { fontSize: 12 }]}>
                                  {member.name?.charAt(0) || 'M'}
                                </Text>
                              </View>
                            )}
                            <View style={styles.subcommitteeMemberInfo}>
                              <Text style={styles.subcommitteeMemberName}>{member.name}</Text>
                              <Text style={styles.subcommitteeMemberRole}>{member.role}</Text>
                              {member.position && (
                                <Text style={styles.subcommitteeMemberPosition}>{member.position}</Text>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* No Members Message */}
          {isExpanded && memberCount === 0 && subcommitteeCount === 0 && (
            <View style={styles.noMembersContainer}>
              <MaterialIcons name="people-outline" size={24} color="#d1d5db" />
              <Text style={styles.noMembersText}>{t('company.noMembers') || 'No members or subcommittees added yet'}</Text>
            </View>
          )}
        </View>
      );
    })}
  </View>
)}
        {/* Team Members */}
        {members.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="people" size={20} color="#3b82f6" />
              <Text style={styles.sectionTitle}>{translations.members}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {members.map((member) => (
                <View key={member.id} style={styles.memberCard}>
                  <View style={styles.memberAvatarLarge}>
                    {member.photo ? (
                      <Image source={{ uri: member.photo }} style={styles.memberPhoto} />
                    ) : (
                      <Text style={styles.memberAvatarText}>
                        {getTranslatedMemberName(member).charAt(0)}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.memberNameText}>
                    {getTranslatedMemberName(member)}
                  </Text>
                  <Text style={styles.memberRoleText}>
                    {getTranslatedMemberRole(member)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Documents Section - LIKE HOMESCREEN */}
        {documents.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="attach-file" size={20} color="#3b82f6" />
              <Text style={styles.sectionTitle}>{translations.documents}</Text>
            </View>
            {documents.slice(0, 5).map((doc) => (
              <TouchableOpacity
                key={doc.id}
                style={styles.documentItem}
                onPress={() => handleDocumentPress(doc)}
                activeOpacity={0.7}
              >
                {/* Show image thumbnail if it's an image */}
                {doc.type === 'image' && doc.fileUrl && (
                  <Image 
                    source={{ uri: doc.fileUrl }} 
                    style={styles.documentThumbnail}
                    resizeMode="cover"
                  />
                )}
                {doc.type !== 'image' && (
                  <MaterialIcons 
                    name={
                      doc.type === 'pdf' ? 'picture-as-pdf' :
                      doc.type === 'document' ? 'description' : 'insert-drive-file'
                    } 
                    size={24} 
                    color="#3b82f6" 
                  />
                )}
                <View style={styles.documentInfo}>
                  <Text style={styles.documentTitle}>{doc.title}</Text>
                  {doc.description && (
                    <Text style={styles.documentDesc} numberOfLines={1}>
                      {doc.description}
                    </Text>
                  )}
                  <View style={styles.documentMeta}>
                    <Text style={styles.documentMetaText}>
                      {doc.type?.toUpperCase() || 'FILE'}
                    </Text>
                    {doc.fileSize && (
                      <Text style={styles.documentMetaText}>
                        {(doc.fileSize / 1024).toFixed(1)} KB
                      </Text>
                    )}
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#d1d5db" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Events */}
        {events.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="event" size={20} color="#3b82f6" />
              <Text style={styles.sectionTitle}>{translations.events}</Text>
            </View>
            {events.slice(0, 3).map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.eventItem}
                onPress={() => handleEventPress(event)}
                activeOpacity={0.7}
              >
                <View style={styles.eventDateBadge}>
                  <Text style={styles.eventDay}>
                    {event.date ? new Date(event.date).getDate() : '--'}
                  </Text>
                  <Text style={styles.eventMonth}>
                    {event.date ? new Date(event.date).toLocaleString('default', { month: 'short' }) : '---'}
                  </Text>
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventName}>{getTranslatedEventName(event)}</Text>
                  <Text style={styles.eventDesc} numberOfLines={2}>
                    {getTranslatedEventDesc(event)}
                  </Text>
                  {event.venue && (
                    <Text style={styles.eventVenue}>
                      📍 {event.venue}
                    </Text>
                  )}
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#d1d5db" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Competitions */}
        {competitions.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="emoji-events" size={20} color="#f59e0b" />
              <Text style={styles.sectionTitle}>{translations.competitions}</Text>
            </View>
            {competitions.slice(0, 3).map((competition) => (
              <TouchableOpacity
                key={competition.id}
                style={styles.competitionItem}
                onPress={() => handleCompetitionPress(competition)}
                activeOpacity={0.7}
              >
                <View style={styles.competitionHeader}>
                  <Text style={styles.competitionTitle}>
                    {getTranslatedCompetitionTitle(competition)}
                  </Text>
                  <View style={[
                    styles.competitionStatus,
                    { backgroundColor: competition.status === 'live' ? '#dbeafe' : '#fef3c7' }
                  ]}>
                    <Text style={[
                      styles.competitionStatusText,
                      { color: competition.status === 'live' ? '#2563eb' : '#d97706' }
                    ]}>
                      {competition.status?.toUpperCase() || 'UPCOMING'}
                    </Text>
                  </View>
                </View>
                {competition.prize && (
                  <Text style={styles.competitionPrize}>
                    🏆 {translations.prize}: ₹{competition.prize}
                  </Text>
                )}
                {competition.venue && (
                  <Text style={styles.competitionVenue}>
                    📍 {translations.venue}: {competition.venue}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Testimonials */}
        {testimonials.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="star" size={20} color="#f59e0b" />
              <Text style={styles.sectionTitle}>{translations.testimonials}</Text>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={testimonials}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.testimonialItem}>
                  <View style={styles.testimonialHeader}>
                    <View style={styles.testimonialAvatar}>
                      <Text style={styles.testimonialAvatarText}>
                        {item.name?.charAt(0) || 'U'}
                      </Text>
                    </View>
                    <View style={styles.testimonialAuthorInfo}>
                      <Text style={styles.testimonialName}>{item.name || 'Anonymous'}</Text>
                      {item.role && (
                        <Text style={styles.testimonialRole}>{item.role}</Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.testimonialContent}>
                    {getTranslatedTestimonial(item)}
                  </Text>
                  <View style={styles.testimonialStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <MaterialIcons 
                        key={star} 
                        name="star" 
                        size={16} 
                        color={star <= (item.rating || 5) ? '#f59e0b' : '#e5e7eb'} 
                      />
                    ))}
                  </View>
                </View>
              )}
            />
          </View>
        )}

        {/* Partners */}
        {partners.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="handshake" size={20} color="#3b82f6" />
              <Text style={styles.sectionTitle}>{translations.partners}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {partners.map((partner) => (
                <View key={partner.id} style={styles.partnerItem}>
                  {partner.logo ? (
                    <Image source={{ uri: partner.logo }} style={styles.partnerLogo} />
                  ) : (
                    <View style={styles.partnerLogoPlaceholder}>
                      <MaterialIcons name="business" size={30} color="#3b82f6" />
                    </View>
                  )}
                  <Text style={styles.partnerName}>
                    {getTranslatedPartnerName(partner)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* FAQs */}
        {faqs.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="help" size={20} color="#3b82f6" />
              <Text style={styles.sectionTitle}>{translations.faqs}</Text>
            </View>
            {faqs.slice(0, 5).map((faq) => (
              <TouchableOpacity
                key={faq.id}
                style={styles.faqItem}
                onPress={() => toggleFaq(faq.id)}
                activeOpacity={0.7}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>
                    {getTranslatedFaqQuestion(faq)}
                  </Text>
                  <MaterialIcons 
                    name={expandedFaq === faq.id ? 'expand-less' : 'expand-more'} 
                    size={24} 
                    color="#6b7280" 
                  />
                </View>
                {expandedFaq === faq.id && (
                  <Text style={styles.faqAnswer}>
                    {getTranslatedFaqAnswer(faq)}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Gallery */}
        {gallery.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="photo-library" size={20} color="#3b82f6" />
              <Text style={styles.sectionTitle}>{translations.gallery}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {gallery.slice(0, 10).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.galleryItem}
                  onPress={() => {
                    if (item.imageUrl) {
                      Alert.alert(
                        getTranslatedGalleryTitle(item) || 'Image',
                        translations.viewAll || 'View full image'
                      );
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Image 
                    source={{ uri: item.imageUrl || 'https://via.placeholder.com/150/3b82f6/ffffff?text=Image' }} 
                    style={styles.galleryImage}
                  />
                  {getTranslatedGalleryTitle(item) && (
                    <View style={styles.galleryOverlay}>
                      <Text style={styles.galleryTitle} numberOfLines={1}>
                        {getTranslatedGalleryTitle(item)}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Quotes Section */}
{quotes.length > 0 && (
  <View style={styles.card}>
    <View style={styles.sectionHeader}>
      <MaterialIcons name="format-quote" size={20} color="#8b5cf6" />
      <Text style={styles.sectionTitle}>{translations.inspirationalQuotes}</Text>
    </View>
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={quotes}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.quoteItem}
          onPress={() => {
            setSelectedQuote(item);
            setQuoteModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          {item.imageUrl && (
            <Image 
              source={{ uri: item.imageUrl }} 
              style={styles.quoteImage}
              resizeMode="cover"
            />
          )}
          <View style={styles.quoteContent}>
            <MaterialIcons name="format-quote" size={20} color="#8b5cf6" style={styles.quoteIcon} />
            <Text style={styles.quoteText} numberOfLines={3}>
              "{getTranslatedQuoteText(item)}"
            </Text>
            {item.author && (
              <Text style={styles.quoteAuthor}>— {item.author}</Text>
            )}
          </View>
        </TouchableOpacity>
      )}
    />
  </View>
)}

        {/* Contact Information */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="contact-phone" size={20} color="#ef4444" />
            <Text style={styles.sectionTitle}>{translations.contactInformation}</Text>
          </View>

          {getField('email') && getField('email') !== translations.notProvided && (
            <TouchableOpacity style={styles.contactItem} onPress={() => sendEmail(getField('email'))} activeOpacity={0.7}>
              <View style={[styles.contactIcon, { backgroundColor: '#eff6ff' }]}>
                <MaterialIcons name="email" size={20} color="#3b82f6" />
              </View>
              <Text style={styles.contactText} numberOfLines={1}>{getField('email')}</Text>
              <MaterialIcons name="chevron-right" size={20} color="#d1d5db" />
            </TouchableOpacity>
          )}

          {getField('contactNo') && getField('contactNo') !== translations.notProvided && (
            <TouchableOpacity style={styles.contactItem} onPress={() => callPhone(getField('contactNo'))} activeOpacity={0.7}>
              <View style={[styles.contactIcon, { backgroundColor: '#d1fae5' }]}>
                <MaterialIcons name="phone" size={20} color="#10b981" />
              </View>
              <Text style={styles.contactText}>{getField('contactNo')}</Text>
              <MaterialIcons name="chevron-right" size={20} color="#d1d5db" />
            </TouchableOpacity>
          )}

          {getTranslatedAddress() && getTranslatedAddress() !== translations.notProvided && (
            <View style={styles.contactItem}>
              <View style={[styles.contactIcon, { backgroundColor: '#fef2f2' }]}>
                <MaterialIcons name="location-on" size={20} color="#ef4444" />
              </View>
              <Text style={styles.contactText} numberOfLines={2}>{getTranslatedAddress()}</Text>
            </View>
          )}

          {getField('website') && getField('website') !== translations.notProvided && (
            <TouchableOpacity style={styles.contactItem} onPress={() => openLink(getField('website'))} activeOpacity={0.7}>
              <View style={[styles.contactIcon, { backgroundColor: '#f3e8ff' }]}>
                <MaterialIcons name="language" size={20} color="#3b82f6" />
              </View>
              <Text style={[styles.contactText, styles.linkText]} numberOfLines={1}>{getField('website')}</Text>
              <MaterialIcons name="chevron-right" size={20} color="#d1d5db" />
            </TouchableOpacity>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} {getTranslatedOrgName()}. {translations.allRightsReserved}
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
{/* Quote Modal - Updated with Share Options */}
{quoteModalVisible && selectedQuote && (
  <View style={styles.quoteModalOverlay}>
    <TouchableOpacity 
      style={styles.quoteModalOverlayTouch}
      activeOpacity={1}
      onPress={() => {
        setQuoteModalVisible(false);
        setSelectedQuote(null);
      }}
    >
      <View style={styles.quoteModalContainer}>
        {/* Header */}
        <View style={styles.quoteModalHeader}>
          <Text style={styles.quoteModalTitle}>Inspirational Quote</Text>
          <TouchableOpacity
            onPress={() => {
              setQuoteModalVisible(false);
              setSelectedQuote(null);
            }}
            style={styles.quoteModalCloseBtn}
          >
            <MaterialIcons name="close" size={28} color="#1f2937" />
          </TouchableOpacity>
        </View>

        {/* Image */}
        {selectedQuote.imageUrl ? (
          <Image
            source={{ uri: selectedQuote.imageUrl }}
            style={styles.quoteModalImage}
            resizeMode="contain"
            onError={(e) => {
              Alert.alert('Error', 'Failed to load image');
            }}
          />
        ) : (
          <View style={styles.quoteModalNoImage}>
            <MaterialIcons name="image" size={60} color="#d1d5db" />
            <Text style={styles.quoteModalNoImageText}>No image available</Text>
          </View>
        )}

        {/* Quote Text */}
        <View style={styles.quoteModalContent}>
          <MaterialIcons name="format-quote" size={32} color="#8b5cf6" style={styles.quoteModalIcon} />
          <Text style={styles.quoteModalText}>
            "{getTranslatedQuoteText(selectedQuote)}"
          </Text>
          {selectedQuote.author && (
            <Text style={styles.quoteModalAuthor}>— {selectedQuote.author}</Text>
          )}
        </View>

        {/* ✅ Share Buttons */}
        <View style={styles.quoteModalButtonRow}>
          {/* Share Button */}
          <TouchableOpacity
            style={[styles.quoteModalDownloadBtn, { backgroundColor: '#25D366' }]}
            onPress={() => {
              downloadQuoteImage(
                selectedQuote.imageUrl,
                getTranslatedQuoteText(selectedQuote),
                selectedQuote.author
              );
            }}
            disabled={downloadingQuote}
          >
            {downloadingQuote ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <MaterialIcons name="share" size={20} color="#ffffff" />
                <Text style={styles.quoteModalDownloadBtnText}>Share</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Download Button */}
          <TouchableOpacity
            style={styles.quoteModalDownloadBtn}
            onPress={() => {
              downloadQuoteImage(
                selectedQuote.imageUrl,
                getTranslatedQuoteText(selectedQuote),
                selectedQuote.author
              );
            }}
            disabled={downloadingQuote}
          >
            {downloadingQuote ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <MaterialIcons name="download" size={20} color="#ffffff" />
                <Text style={styles.quoteModalDownloadBtnText}>Download</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Close Button */}
        <TouchableOpacity
          style={styles.quoteModalCloseBtnBottom}
          onPress={() => {
            setQuoteModalVisible(false);
            setSelectedQuote(null);
          }}
        >
          <Text style={styles.quoteModalCloseBtnBottomText}>Close</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  </View>
)}
      {/* Image Modal - Same as HomeScreen */}
      {modalVisible && selectedDocument && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalOverlayTouch}
            activeOpacity={1}
            onPress={() => {
              setModalVisible(false);
              setSelectedDocument(null);
            }}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>
                  {selectedDocument.title || 'Document'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    setSelectedDocument(null);
                  }}
                  style={styles.modalCloseBtn}
                >
                  <MaterialIcons name="close" size={28} color="#1f2937" />
                </TouchableOpacity>
              </View>
              
              <Image
                source={{ uri: selectedDocument.fileUrl }}
                style={styles.modalImage}
                resizeMode="contain"
                onError={(e) => {
                  Alert.alert(
                    'Error',
                    'Failed to load image. The URL may be invalid.',
                    [{ text: 'OK' }]
                  );
                }}
              />
              
              {selectedDocument.description && (
                <Text style={styles.modalDescription}>
                  {selectedDocument.description}
                </Text>
              )}
              
              {selectedDocument.fileSize && (
                <Text style={styles.modalFileSize}>
                  Size: {(selectedDocument.fileSize / 1024).toFixed(1)} KB
                </Text>
              )}

              {/* Open in Browser Button */}
              {selectedDocument.fileUrl && !selectedDocument.fileUrl.startsWith('data:') && (
                <TouchableOpacity
                  style={styles.modalOpenButton}
                  onPress={() => {
                    Linking.openURL(selectedDocument.fileUrl);
                  }}
                >
                  <MaterialIcons name="open-in-new" size={18} color="#3b82f6" />
                  <Text style={styles.modalOpenButtonText}>
                    Open in Browser
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  // Header
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

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
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

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 30,
  },
  emptyTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 20,
    color: '#1f2937',
    marginTop: 16,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  emptySubtext: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: 16,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Cover
  coverSection: {
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    height: 160,
  },
  coverImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    gap: 8,
  },
  coverPlaceholderText: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#9ca3af',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Logo
  logoSection: {
    alignItems: 'center',
    marginTop: -40,
  },
  logoContainer: {
    padding: 4,
    backgroundColor: '#ffffff',
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontFamily: Fonts.Bold,
    fontSize: 36,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },

  // Organization Info
  companyName: {
    fontFamily: Fonts.Bold,
    fontSize: 22,
    color: '#1f2937',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  tagline: {
    fontFamily: Fonts.Italic,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  description: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Status
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  statusText: {
    fontFamily: Fonts.SemiBold,
    color: '#10b981',
    fontSize: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  establishedText: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Announcements
  announcementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  announcementText: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#4b5563',
    flex: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Detail Row
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  detailValue: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Services
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
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  serviceLabel: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
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
  serviceDescription: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
  },

  // About
  aboutText: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 24,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Mission & Vision
  missionVisionContainer: {
    gap: 12,
  },
  mvItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  mvItemBorder: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  mvIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mvContent: {
    flex: 1,
  },
  mvTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 13,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  mvText: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
    marginTop: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Leadership - LIKE HOMESCREEN
  committeeCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  committeeName: {
    fontFamily: Fonts.Bold,
    fontSize: 15,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  committeeDesc: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  committeeMembersList: {
    marginTop: 8,
  },
  committeeMemberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  leaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaderInitial: {
    fontFamily: Fonts.Bold,
    fontSize: 16,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  leaderContent: {
    flex: 1,
  },
  leaderName: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  leaderRole: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  moreMembersText: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Members
  memberCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
quoteModalButtonRow: {
  flexDirection: 'row',
  gap: 12,
  paddingHorizontal: 20,
  marginBottom: 8,
},
quoteModalDownloadBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#8b5cf6',
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 8,
  gap: 8,
  flex: 1,
},
  memberAvatarLarge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  memberPhoto: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  memberAvatarText: {
    fontFamily: Fonts.Bold,
    fontSize: 28,
    color: '#3b82f6',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  memberNameText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    color: '#1f2937',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  memberRoleText: {
    fontFamily: Fonts.Regular,
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Documents - LIKE HOMESCREEN
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  documentThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  documentDesc: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  documentMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
  },
  documentMetaText: {
    fontFamily: Fonts.Regular,
    fontSize: 10,
    color: '#9ca3af',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Events
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  eventDateBadge: {
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 44,
  },
  eventDay: {
    fontFamily: Fonts.Bold,
    fontSize: 16,
    color: '#3b82f6',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  eventMonth: {
    fontFamily: Fonts.Regular,
    fontSize: 10,
    color: '#3b82f6',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  eventDesc: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  eventVenue: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Competitions
  competitionItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  competitionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  competitionTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
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
  competitionPrize: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#059669',
    marginTop: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  competitionVenue: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Testimonials
  testimonialItem: {
    width: 280,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  testimonialAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testimonialAvatarText: {
    fontFamily: Fonts.Bold,
    fontSize: 18,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  testimonialAuthorInfo: {
    flex: 1,
  },
  testimonialName: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  testimonialRole: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  testimonialContent: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  testimonialStars: {
    flexDirection: 'row',
    gap: 2,
  },

  // Partners
  partnerItem: {
    alignItems: 'center',
    marginRight: 20,
    width: 80,
  },
  partnerLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  partnerLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  partnerName: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // FAQ
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 10,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  faqAnswer: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Gallery
  galleryItem: {
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryImage: {
    width: 120,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  galleryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 4,
  },
  galleryTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 10,
    color: '#ffffff',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Quotes
  quoteItem: {
    width: 280,
    backgroundColor: '#f5f3ff',
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ede9fe',
  },
  quoteImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#ede9fe',
  },
  quoteContent: {
    padding: 14,
    position: 'relative',
  },
  quoteIcon: {
    position: 'absolute',
    top: 8,
    left: 10,
    opacity: 0.3,
  },
  quoteText: {
    fontFamily: Fonts.Italic,
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 22,
    paddingLeft: 20,
    paddingTop: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
committeeIconContainer: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: '#FFF5EB',
  justifyContent: 'center',
  alignItems: 'center',
},
committeeHeaderInfo: {
  flex: 1,
},
committeeBadges: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 6,
  marginTop: 2,
},
committeeMemberCount: {
  fontFamily: Fonts.Regular,
  fontSize: 12,
  color: '#6b7280',
},
subcommitteeCount: {
  fontFamily: Fonts.Regular,
  fontSize: 11,
  color: '#8b5cf6',
  backgroundColor: '#f5f3ff',
  paddingHorizontal: 8,
  paddingVertical: 1,
  borderRadius: 10,
},
committeeHeaderRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 4,
},
committeeHeaderLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
  gap: 10,
},
committeeHeaderRight: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
},
committeeInfoIcon: {
  marginRight: 2,
},
membersGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 10,
  paddingTop: 4,
},
committeeMemberCard: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  backgroundColor: '#ffffff',
  borderRadius: 10,
  padding: 12,
  width: '100%',
  borderWidth: 1,
  borderColor: '#f0f0f0',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.03,
  shadowRadius: 2,
  elevation: 1,
},
committeeMemberPhoto: {
  width: 50,
  height: 50,
  borderRadius: 25,
  marginRight: 12,
  borderWidth: 2,
  borderColor: '#FF7722',
  backgroundColor: '#f3f4f6',
},
leaderContacts: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 4,
},
leaderContactBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  backgroundColor: '#f9fafb',
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 4,
},
leaderContactText: {
  fontFamily: Fonts.Regular,
  fontSize: 11,
  color: '#6b7280',
},
leaderPosition: {
  fontFamily: Fonts.Regular,
  fontSize: 12,
  color: '#9ca3af',
  marginTop: 1,
},
leaderBio: {
  fontFamily: Fonts.Regular,
  fontSize: 12,
  color: '#6b7280',
  lineHeight: 18,
  marginTop: 4,
},
committeeDescription: {
  fontFamily: Fonts.Regular,
  fontSize: 13,
  color: '#4b5563',
  lineHeight: 20,
  marginTop: 4,
  marginBottom: 4,
  paddingLeft: 48,
},
committeeMembersList: {
  marginTop: 8,
  paddingTop: 8,
  borderTopWidth: 1,
  borderTopColor: '#f0f0f0',
  paddingLeft: 46,
},
noMembersContainer: {
  paddingVertical: 12,
  alignItems: 'center',
  paddingLeft: 46,
},
noMembersText: {
  fontFamily: Fonts.Regular,
  fontSize: 13,
  color: '#9ca3af',
  fontStyle: 'italic',
},
membersListTitle: {
  fontFamily: Fonts.SemiBold,
  fontSize: 13,
  color: '#6b7280',
  marginBottom: 8,
},
// Add these to your StyleSheet

// ========== LEADERSHIP/COMMITTEE STYLES (FROM HOMESCREEN) ==========

leadershipContainer: {
  backgroundColor: '#ffffff',
  padding: 16,
  marginHorizontal: 16,
  marginTop: 14,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#f0f0f0',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
},
committeeCard: {
  backgroundColor: '#f9fafb',
  borderRadius: 10,
  padding: 12,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: '#f0f0f0',
},
committeeHeaderRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 4,
},
committeeHeaderLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
  gap: 10,
},
committeeIconContainer: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: '#FFF5EB',
  justifyContent: 'center',
  alignItems: 'center',
},
committeeHeaderInfo: {
  flex: 1,
},
committeeName: {
  fontFamily: Fonts.Bold,
  fontSize: 16,
  color: '#1f2937',
},
committeeBadges: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 6,
  marginTop: 2,
},
committeeMemberCount: {
  fontFamily: Fonts.Regular,
  fontSize: 12,
  color: '#6b7280',
},
subcommitteeCount: {
  fontFamily: Fonts.Regular,
  fontSize: 11,
  color: '#8b5cf6',
  backgroundColor: '#f5f3ff',
  paddingHorizontal: 8,
  paddingVertical: 1,
  borderRadius: 10,
},
committeeHeaderRight: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
},
committeeInfoIcon: {
  marginRight: 2,
},
committeeDescription: {
  fontFamily: Fonts.Regular,
  fontSize: 13,
  color: '#4b5563',
  lineHeight: 20,
  marginTop: 4,
  marginBottom: 4,
  paddingLeft: 48,
},
committeeMembersList: {
  marginTop: 8,
  paddingTop: 8,
  borderTopWidth: 1,
  borderTopColor: '#f0f0f0',
  paddingLeft: 46,
},
membersListTitle: {
  fontFamily: Fonts.SemiBold,
  fontSize: 13,
  color: '#6b7280',
  marginBottom: 8,
},
membersGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 10,
  paddingTop: 4,
},
committeeMemberCard: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  backgroundColor: '#ffffff',
  borderRadius: 10,
  padding: 12,
  width: '100%',
  borderWidth: 1,
  borderColor: '#f0f0f0',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.03,
  shadowRadius: 2,
  elevation: 1,
},
committeeMemberPhoto: {
  width: 50,
  height: 50,
  borderRadius: 25,
  marginRight: 12,
  borderWidth: 2,
  borderColor: '#FF7722',
  backgroundColor: '#f3f4f6',
},
leaderIcon: {
  width: 36,
  height: 36,
  borderRadius: 18,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 10,
},
leaderInitial: {
  fontFamily: Fonts.Bold,
  fontSize: 16,
  color: '#ffffff',
},
leaderContent: {
  flex: 1,
},
leaderName: {
  fontFamily: Fonts.SemiBold,
  fontSize: 14,
  color: '#1f2937',
},
leaderRole: {
  fontFamily: Fonts.Regular,
  fontSize: 12,
  color: '#6b7280',
},
leaderContacts: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 4,
},
leaderContactBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  backgroundColor: '#f9fafb',
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 4,
},
leaderContactText: {
  fontFamily: Fonts.Regular,
  fontSize: 11,
  color: '#6b7280',
},
leaderPosition: {
  fontFamily: Fonts.Regular,
  fontSize: 12,
  color: '#9ca3af',
  marginTop: 1,
},
leaderBio: {
  fontFamily: Fonts.Regular,
  fontSize: 12,
  color: '#6b7280',
  lineHeight: 18,
  marginTop: 4,
},
noMembersContainer: {
  paddingVertical: 12,
  alignItems: 'center',
  paddingLeft: 46,
},
noMembersText: {
  fontFamily: Fonts.Regular,
  fontSize: 13,
  color: '#9ca3af',
  fontStyle: 'italic',
},

// ========== SUBCOMMITTEE STYLES (FROM HOMESCREEN) ==========

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
  marginTop: 1,
},
subcommitteeType: {
  fontFamily: Fonts.Regular,
  fontSize: 10,
  color: '#9ca3af',
  marginTop: 2,
},
subcommitteeMemberCount: {
  fontFamily: Fonts.Regular,
  fontSize: 10,
  color: '#8b5cf6',
  marginTop: 2,
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
  paddingVertical: 4,
  paddingHorizontal: 4,
  backgroundColor: '#ffffff',
  borderRadius: 6,
  marginBottom: 4,
},
subcommitteeMemberInfo: {
  flex: 1,
},
subcommitteeMemberName: {
  fontFamily: Fonts.SemiBold,
  fontSize: 12,
  color: '#1f2937',
},
subcommitteeMemberRole: {
  fontFamily: Fonts.Regular,
  fontSize: 10,
  color: '#6b7280',
},
subcommitteeMemberPosition: {
  fontFamily: Fonts.Regular,
  fontSize: 10,
  color: '#9ca3af',
  marginTop: 1,
},
  quoteAuthor: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 6,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Contact
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
committeeHeaderRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 8,
},
committeeHeaderLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  flex: 1,
},
committeeMemberCount: {
  fontFamily: Fonts.Regular,
  fontSize: 12,
  color: '#6b7280',
},
committeeDescription: {
  fontFamily: Fonts.Regular,
  fontSize: 13,
  color: '#4b5563',
  lineHeight: 20,
  marginTop: 4,
  marginBottom: 8,
  paddingLeft: 4,
},
committeeMembersList: {
  marginTop: 8,
  paddingTop: 8,
  borderTopWidth: 1,
  borderTopColor: '#f0f0f0',
},
committeeMemberItem: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 8,
  borderBottomWidth: 1,
  borderBottomColor: '#f9fafb',
},
leaderContactBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  marginTop: 2,
},
leaderContactText: {
  fontFamily: Fonts.Regular,
  fontSize: 11,
  color: '#6b7280',
},
noMembersContainer: {
  paddingVertical: 12,
  alignItems: 'center',
  flexDirection: 'row',
  justifyContent: 'center',
  gap: 8,
},
noMembersText: {
  fontFamily: Fonts.Regular,
  fontSize: 13,
  color: '#9ca3af',
  fontStyle: 'italic',
},
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactText: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  linkText: {
    color: '#3b82f6',
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Donation Stats
  donationStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    marginBottom: 12,
  },
  donationStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  donationStatValue: {
    fontFamily: Fonts.Bold,
    fontSize: 20,
    color: '#ef4444',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  donationStatLabel: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  donationStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
  },
  donateNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 4,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
// Add these styles to match HomeScreen
committeeIconContainer: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: '#FFF5EB',
  justifyContent: 'center',
  alignItems: 'center',
},
committeeHeaderInfo: {
  flex: 1,
},
committeeBadges: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 6,
  marginTop: 2,
},
committeeMemberCount: {
  fontFamily: Fonts.Regular,
  fontSize: 12,
  color: '#6b7280',
},
subcommitteeCount: {
  fontFamily: Fonts.Regular,
  fontSize: 11,
  color: '#8b5cf6',
  backgroundColor: '#f5f3ff',
  paddingHorizontal: 8,
  paddingVertical: 1,
  borderRadius: 10,
},
membersGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 10,
  paddingTop: 4,
},
committeeMemberCard: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  backgroundColor: '#ffffff',
  borderRadius: 10,
  padding: 12,
  width: '100%',
  borderWidth: 1,
  borderColor: '#f0f0f0',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.03,
  shadowRadius: 2,
  elevation: 1,
},
committeeMemberPhoto: {
  width: 50,
  height: 50,
  borderRadius: 25,
  marginRight: 12,
  borderWidth: 2,
  borderColor: '#FF7722',
  backgroundColor: '#f3f4f6',
},
leaderContacts: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 4,
},
leaderContactBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  backgroundColor: '#f9fafb',
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 4,
},
leaderContactText: {
  fontFamily: Fonts.Regular,
  fontSize: 11,
  color: '#6b7280',
},
leaderPosition: {
  fontFamily: Fonts.Regular,
  fontSize: 12,
  color: '#9ca3af',
  marginTop: 1,
},
leaderBio: {
  fontFamily: Fonts.Regular,
  fontSize: 12,
  color: '#6b7280',
  lineHeight: 18,
  marginTop: 4,
},
committeeDescription: {
  fontFamily: Fonts.Regular,
  fontSize: 13,
  color: '#4b5563',
  lineHeight: 20,
  marginTop: 4,
  marginBottom: 4,
  paddingLeft: 48,
},
committeeHeaderRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 4,
},
committeeHeaderLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
  gap: 10,
},
committeeHeaderRight: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
},
committeeInfoIcon: {
  marginRight: 2,
},
committeeMembersList: {
  marginTop: 8,
  paddingTop: 8,
  borderTopWidth: 1,
  borderTopColor: '#f0f0f0',
  paddingLeft: 46,
},
committeeCard: {
  backgroundColor: '#f9fafb',
  borderRadius: 10,
  padding: 12,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: '#f0f0f0',
},
noMembersContainer: {
  paddingVertical: 12,
  alignItems: 'center',
  paddingLeft: 46,
},
noMembersText: {
  fontFamily: Fonts.Regular,
  fontSize: 13,
  color: '#9ca3af',
  fontStyle: 'italic',
},
  donateNowText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalOverlayTouch: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 800,
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalHeaderTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 18,
    color: '#1f2937',
    flex: 1,
  },
  modalCloseBtn: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: 400,
    backgroundColor: '#f8fafc',
  },
  modalDescription: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#4b5563',
    padding: 16,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  modalFileSize: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#9ca3af',
    padding: 8,
    textAlign: 'center',
  },
  modalOpenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
    marginHorizontal: 16,
    marginBottom: 16,
  },
// Quote Modal Styles
quoteModalOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
},
quoteModalOverlayTouch: {
  flex: 1,
  width: '100%',
  height: '100%',
  justifyContent: 'center',
  alignItems: 'center',
},
quoteModalContainer: {
  backgroundColor: '#ffffff',
  borderRadius: 16,
  width: '90%',
  maxWidth: 500,
  maxHeight: '90%',
  overflow: 'hidden',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 5,
},
quoteModalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#f0f0f0',
},
quoteModalTitle: {
  fontFamily: Fonts.Bold,
  fontSize: 18,
  color: '#1f2937',
  flex: 1,
},
quoteModalCloseBtn: {
  padding: 4,
  borderRadius: 20,
  backgroundColor: '#f3f4f6',
  width: 36,
  height: 36,
  justifyContent: 'center',
  alignItems: 'center',
},
quoteModalImage: {
  width: '100%',
  height: 250,
  backgroundColor: '#f8fafc',
},
quoteModalNoImage: {
  width: '100%',
  height: 200,
  backgroundColor: '#f3f4f6',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
},
quoteModalNoImageText: {
  fontFamily: Fonts.Regular,
  fontSize: 14,
  color: '#9ca3af',
},
quoteModalContent: {
  padding: 20,
  position: 'relative',
  paddingTop: 24,
},
quoteModalIcon: {
  position: 'absolute',
  top: 8,
  left: 12,
  opacity: 0.2,
},
quoteModalText: {
  fontFamily: Fonts.Italic,
  fontSize: 20,
  color: '#1f2937',
  lineHeight: 32,
  paddingLeft: 24,
  includeFontPadding: false,
  textAlignVertical: 'center',
},
quoteModalAuthor: {
  fontFamily: Fonts.SemiBold,
  fontSize: 16,
  color: '#6b7280',
  textAlign: 'right',
  marginTop: 8,
  includeFontPadding: false,
  textAlignVertical: 'center',
},
quoteModalDownloadBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#8b5cf6',
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 8,
  gap: 8,
  marginHorizontal: 20,
  marginBottom: 8,
},
quoteModalDownloadBtnText: {
  fontFamily: Fonts.SemiBold,
  fontSize: 16,
  color: '#ffffff',
  includeFontPadding: false,
  textAlignVertical: 'center',
},
quoteModalCloseBtnBottom: {
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 8,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#f3f4f6',
  marginHorizontal: 20,
  marginBottom: 20,
},
quoteModalCloseBtnBottomText: {
  fontFamily: Fonts.SemiBold,
  fontSize: 14,
  color: '#6b7280',
  includeFontPadding: false,
  textAlignVertical: 'center',
},
  modalOpenButtonText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#3b82f6',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});