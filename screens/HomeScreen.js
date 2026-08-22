// screens/HomeScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  Linking,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getAuthInstance } from '../config/firebase';
import { MaterialIcons } from '@expo/vector-icons';
import { db } from '../config/firebase';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  setDoc,
  where,
  addDoc,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { Fonts } from '../config/fonts';
import { useLanguage } from '../context/LanguageContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { t, currentLanguage, isHindi } = useLanguage();

  // ========== STATE DECLARATIONS ==========
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedAbout, setExpandedAbout] = useState(false);
  const [expandedAboutTab, setExpandedAboutTab] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [expandedCommittees, setExpandedCommittees] = useState({});
  const [activeTab, setActiveTab] = useState('food');
  const [activeProductIndex, setActiveProductIndex] = useState(0);
  const [activeEventIndex, setActiveEventIndex] = useState(0);
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);

  // Data states
  const [companyData, setCompanyData] = useState(null);
  const [eventPhotos, setEventPhotos] = useState([]);
  const [products, setProducts] = useState([]);
  const [events, setEvents] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [members, setMembers] = useState([]);
  const [serviceApplications, setServiceApplications] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [partners, setPartners] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [serviceDetails, setServiceDetails] = useState({});

  // Modal states
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [selectedEventPhoto, setSelectedEventPhoto] = useState(null);
  const [donateModalVisible, setDonateModalVisible] = useState(false);
  const [donationLoading, setDonationLoading] = useState(false);
  const [expandedService, setExpandedService] = useState(null);
  
  // Quote modal states
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [quoteModalVisible, setQuoteModalVisible] = useState(false);
  const [downloadingQuote, setDownloadingQuote] = useState(false);

  // Donation form state
  const [donationForm, setDonationForm] = useState({
    name: '',
    address: '',
    mobile: '',
    email: '',
    password: '',
  });

  // Timer refs
  const productTimerRef = useRef(null);
  const eventTimerRef = useRef(null);
  const testimonialTimerRef = useRef(null);

  // ========== HARDCODED SERVICES ==========
  const HARDCODED_SERVICES = [
    {
      id: 'kanya_vivah',
      icon: 'child-care',
      title: 'Kanya Vivaha Sahayata Yojna',
      titleHi: 'कन्या विवाह सहायता योजना',
    },
    {
      id: 'kabir_anteshti',
      icon: 'church',
      title: 'Kabir Anteshti Sahayata Yojna',
      titleHi: 'कबीर अंतेष्टि सहायता योजना',
    },
    {
      id: 'apada_sahayata',
      icon: 'warning',
      title: 'Apada Sahayata Yojana',
      titleHi: 'आपदा सहायता योजना',
    },
    {
      id: 'siksha_sahayata',
      icon: 'school',
      title: 'Siksha Sahayata Yojana',
      titleHi: 'शिक्षा सहायता योजना',
    },
    {
      id: 'swasth_sahayata',
      icon: 'health-and-safety',
      title: 'Swasth Sahayata Yojana',
      titleHi: 'स्वास्थ सहायता योजना',
    },
  ];

  // ========== TRANSLATION HELPERS ==========
  const getTranslatedField = (field, fallback = t('common.notProvided')) => {
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
    const address = getTranslatedField('address', t('home.locationNotSpecified'));
    if (isHindi && companyData?.addressHi) {
      return companyData.addressHi;
    }
    return address;
  };

  const getTranslatedAbout = () => {
    const about = getTranslatedField('about', t('home.defaultAbout'));
    if (isHindi && companyData?.aboutHi) {
      return companyData.aboutHi;
    }
    return about;
  };

  const getTranslatedTagline = () => {
    const tagline = getTranslatedField('tagline', t('home.togetherWeCan'));
    if (isHindi && companyData?.taglineHi) {
      return companyData.taglineHi;
    }
    return tagline;
  };

  // ========== SERVICE TRANSLATION HELPERS ==========
  const getTranslatedServiceDescription = (serviceId) => {
    const details = serviceDetails[serviceId];
    if (!details) return '';
    if (isHindi && details.descriptionHi) {
      return details.descriptionHi;
    }
    return details.description || '';
  };

  const getTranslatedServiceDetailLabel = (detail) => {
    if (isHindi && detail.labelHi) {
      return detail.labelHi;
    }
    return detail.label || '';
  };

  const getTranslatedServiceName = (service) => {
  console.log('isHindi:', isHindi, 'service.titleHi:', service.titleHi);
  if (isHindi && service.titleHi) {
    return service.titleHi;
  }
  return service.title || '';
};	

  // ========== QUOTE TRANSLATION HELPERS ==========
  const getTranslatedQuoteText = (quote) => {
    if (isHindi && quote.textHi) {
      return quote.textHi;
    }
    return quote.text || '';
  };

  // ========== OTHER TRANSLATION HELPERS ==========
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

  // ========== FETCH FUNCTIONS ==========
  const fetchServiceDetails = async () => {
    try {
      const servicesRef = collection(db, 'company', 'profile', 'services');
      const servicesSnapshot = await getDocs(servicesRef);
      const detailsMap = {};
      servicesSnapshot.forEach((doc) => {
        const data = doc.data();
        detailsMap[doc.id] = {
          ...data,
          description: data.description || '',
          descriptionHi: data.descriptionHi || data.description || '',
          details: data.details?.map(detail => ({
            label: detail.label || '',
            labelHi: detail.labelHi || detail.label || '',
            value: detail.value || '',
          })) || [],
        };
      });
      setServiceDetails(detailsMap);
    } catch (error) {
      console.error('Error fetching service details:', error);
    }
  };

  const fetchEventPhotos = async () => {
    try {
      const eventsQuery = query(
        collection(db, 'events'),
        orderBy('date', 'desc')
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      const photos = [];
      eventsSnapshot.forEach((doc) => {
        const data = doc.data();
        const imageUrl = data.image || data.imageUrl;
        if (imageUrl) {
          photos.push({
            id: doc.id,
            image: imageUrl,
            title: data.title || 'Event',
            titleHi: data.titleHi || data.title || 'Event',
            date: data.date,
          });
        }
      });
      setEventPhotos(photos);
      console.log(`📸 Found ${photos.length} event photos`);
    } catch (error) {
      console.error('Error fetching event photos:', error);
      setEventPhotos([]);
    }
  };

  const fetchHomeData = async () => {
    setLoading(true);
    try {
      // Fetch company profile
      const companyDocRef = doc(db, 'company', 'profile');
      const companyDocSnap = await getDoc(companyDocRef);
      if (companyDocSnap.exists()) {
        setCompanyData(companyDocSnap.data());
      }

      // Fetch products
      try {
        const productsQuery = query(
          collection(db, 'products'),
          where('isActive', '==', true),
          orderBy('createdAt', 'desc')
        );
        const productsSnapshot = await getDocs(productsQuery);
        const productsList = [];
        productsSnapshot.forEach((doc) => {
          productsList.push({ id: doc.id, ...doc.data() });
        });
        setProducts(productsList);
      } catch (productError) {
        console.log('Products collection may not exist yet:', productError);
        setProducts([]);
      }

      // Fetch events
      try {
        const eventsQuery = query(
          collection(db, 'events'),
          where('isActive', '==', true),
          orderBy('date', 'asc')
        );
        const eventsSnapshot = await getDocs(eventsQuery);
        const eventsList = [];
        eventsSnapshot.forEach((doc) => {
          eventsList.push({ id: doc.id, ...doc.data() });
        });
        setEvents(eventsList);
      } catch (eventError) {
        console.log('Events collection may not exist yet:', eventError);
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ========== SETUP REAL-TIME LISTENERS ==========
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

  const setupApplicationsListener = () => {
    const q = query(
      collection(db, 'serviceApplications'),
      where('status', 'in', ['pending', 'verified', 'funded'])
    );
    return onSnapshot(q, (snapshot) => {
      const apps = [];
      snapshot.forEach((doc) => {
        apps.push({ id: doc.id, ...doc.data() });
      });
      setServiceApplications(apps);
    }, (error) => {
      console.error('Error fetching applications:', error);
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
    const q = query(
      collection(db, 'quotes'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const quotesList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const startDate = data.startDate?.toDate?.() || new Date(data.startDate);
        const endDate = data.endDate?.toDate?.() || new Date(data.endDate);
        const now = new Date();
        if (data.isActive !== false && now >= startDate && now <= endDate) {
          quotesList.push({
            id: doc.id,
            ...data,
            startDate,
            endDate,
          });
        }
      });
      setQuotes(quotesList);
    }, (error) => {
      console.error('Error fetching quotes:', error);
    });
  };

  // ========== HANDLERS ==========
  const handleDonationSubmit = async () => {
    const auth = getAuthInstance();
    if (!donationForm.name.trim()) {
      Alert.alert(t('common.error') || 'Error', t('home.validationName'));
      return;
    }
    if (!donationForm.address.trim()) {
      Alert.alert(t('common.error') || 'Error', t('home.validationAddress'));
      return;
    }
    if (!donationForm.mobile.trim() || donationForm.mobile.length < 10) {
      Alert.alert(t('common.error') || 'Error', t('home.validationMobile'));
      return;
    }
    if (!donationForm.email.trim() || !donationForm.email.includes('@')) {
      Alert.alert(t('common.error') || 'Error', t('home.validationEmail'));
      return;
    }
    if (!donationForm.password.trim() || donationForm.password.length < 6) {
      Alert.alert(t('common.error') || 'Error', t('home.validationPassword'));
      return;
    }

    setDonationLoading(true);
    try {
      console.log('🔄 Creating Firebase Auth user...');
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        donationForm.email,
        donationForm.password
      );
      const uid = userCredential.user.uid;
      console.log('✅ Firebase Auth user created:', uid);

      const userData = {
        uid: uid,
        fullName: donationForm.name,
        name: donationForm.name,
        email: donationForm.email,
        phone: donationForm.mobile,
        address: donationForm.address,
        role: 'donor',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'donation_registration',
      };

      await setDoc(doc(db, 'users', uid), userData);
      console.log('✅ User document created in users collection');

      const donationRef = collection(db, 'donationRegistrations');
      await addDoc(donationRef, {
        ...donationForm,
        uid: uid,
        createdAt: new Date().toISOString(),
        status: 'pending',
      });
      console.log('✅ Donation registration saved');

      setDonationForm({ name: '', address: '', mobile: '', email: '', password: '' });
      setDonateModalVisible(false);
      console.log('🔄 Navigating to Login screen...');
      navigation.replace('Login');
    } catch (error) {
      console.error('❌ Error:', error);
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Error', 'This email is already registered. Please use a different email or login.');
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('Error', 'Password is too weak. Please use at least 6 characters.');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Error', 'Invalid email address. Please enter a valid email.');
      } else {
        Alert.alert(t('common.error') || 'Error', t('home.donationError'));
      }
    } finally {
      setDonationLoading(false);
    }
  };

  const handleRequireLogin = (action, screen) => {
    Alert.alert(
      t('home.loginRequired') || 'Login Required',
      `${t('home.pleaseLoginTo') || 'Please login to'} ${action}`,
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        { text: t('auth.login') || 'Login', onPress: () => navigation.navigate('Login') },
      ]
    );
  };

  const handleEventPress = (event) => {
    handleRequireLogin(t('home.registerForEvent') || 'register for this event', 'Login');
  };

  const handleDocumentPress = (document) => {
    if (!document.fileUrl) return;
    const isImageUrl = document.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
      document.fileUrl.includes('i.ibb.co') ||
      document.fileUrl.includes('imgbb.com') ||
      document.fileUrl.startsWith('data:image');

    if (isImageUrl) {
      setSelectedDocument(document);
      setModalVisible(true);
    } else if (document.fileUrl.match(/\.(pdf|doc|docx)$/i)) {
      Linking.openURL(document.fileUrl);
    } else if (document.fileUrl.startsWith('http')) {
      Linking.openURL(document.fileUrl);
    } else if (document.fileUrl.startsWith('data:')) {
      Alert.alert(
        document.title || 'Document',
        'This document cannot be previewed directly.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCallPress = (number) => {
    if (number) {
      Linking.openURL(`tel:${number}`);
    }
  };

  const handleEmailPress = (email) => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    }
  };

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const toggleCommittee = (committeeId) => {
    setExpandedCommittees(prev => ({
      ...prev,
      [committeeId]: !prev[committeeId],
    }));
  };

  const toggleService = (id) => {
    setExpandedService(expandedService === id ? null : id);
  };

  // ========== QUOTE DOWNLOAD FUNCTIONS ==========
  const downloadQuoteImage = async (imageUrl, quoteText) => {
    if (!imageUrl) {
      Alert.alert('Error', 'No image to download');
      return;
    }

    setDownloadingQuote(true);
    try {
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `quote_${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        Alert.alert('Success', 'Quote image downloaded successfully!');
        setDownloadingQuote(false);
        return;
      }

      const fileUri = FileSystem.documentDirectory + `quote_${Date.now()}.jpg`;
      const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Share Quote Image',
        });
      }
      Alert.alert('Success', 'Quote image downloaded successfully!');
    } catch (error) {
      console.error('Error downloading quote:', error);
      Alert.alert('Error', 'Failed to download image. Please try again.');
    } finally {
      setDownloadingQuote(false);
    }
  };

  // ========== USE EFFECT ==========
  useEffect(() => {
    fetchHomeData();
    fetchServiceDetails();
    fetchEventPhotos();

    const unsubscribeCommittee = setupCommitteeListener();
    const unsubscribeDocuments = setupDocumentsListener();
    const unsubscribeMembers = setupMembersListener();
    const unsubscribeApplications = setupApplicationsListener();
    const unsubscribeCompetitions = setupCompetitionsListener();
    const unsubscribeTestimonials = setupTestimonialsListener();
    const unsubscribeAnnouncements = setupAnnouncementsListener();
    const unsubscribePartners = setupPartnersListener();
    const unsubscribeFaqs = setupFaqsListener();
    const unsubscribeGallery = setupGalleryListener();
    const unsubscribeQuotes = setupQuotesListener();

    return () => {
      clearInterval(productTimerRef.current);
      clearInterval(eventTimerRef.current);
      clearInterval(testimonialTimerRef.current);
      unsubscribeCommittee();
      unsubscribeDocuments();
      unsubscribeMembers();
      unsubscribeApplications();
      unsubscribeCompetitions();
      unsubscribeTestimonials();
      unsubscribeAnnouncements();
      unsubscribePartners();
      unsubscribeFaqs();
      unsubscribeGallery();
      unsubscribeQuotes();
    };
  }, []);

  // Auto-slide timers
  useEffect(() => {
    if (products.length > 1) {
      productTimerRef.current = setInterval(() => {
        setActiveProductIndex((prev) => (prev + 1) % products.length);
      }, 4000);
    }
    return () => clearInterval(productTimerRef.current);
  }, [products]);

  useEffect(() => {
    if (events.length > 1) {
      eventTimerRef.current = setInterval(() => {
        setActiveEventIndex((prev) => (prev + 1) % events.length);
      }, 4000);
    }
    return () => clearInterval(eventTimerRef.current);
  }, [events]);

  useEffect(() => {
    if (testimonials.length > 1) {
      testimonialTimerRef.current = setInterval(() => {
        setActiveTestimonialIndex((prev) => (prev + 1) % testimonials.length);
      }, 5000);
    }
    return () => clearInterval(testimonialTimerRef.current);
  }, [testimonials]);

  // ========== ON REFRESH ==========
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHomeData();
    await fetchServiceDetails();
    await fetchEventPhotos();
    setRefreshing(false);
  };

  // ========== RENDER ==========
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7722" />
        <Text style={styles.loadingText}>{t('common.loading') || 'Loading...'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF7722']} />
        }
      >
        {/* Cover Image */}
        <View style={styles.coverContainer}>
          <Image
            source={{ uri: companyData?.coverImage || 'https://via.placeholder.com/400x200/FF7722/ffffff?text=NGO+Cover' }}
            style={styles.coverImage}
          />
        </View>

        {/* Profile Info Row */}
        <View style={styles.profileRow}>
          <View style={styles.profileLeft}>
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={18} color="#FF7722" />
              <Text style={styles.verifiedText}>{t('home.verified') || 'Verified'}</Text>
            </View>
          </View>
          <View style={styles.profileRight}>
            {companyData?.contactNo && (
              <TouchableOpacity style={styles.actionIcon} onPress={() => handleCallPress(companyData.contactNo)}>
                <MaterialIcons name="call" size={22} color="#FF7722" />
              </TouchableOpacity>
            )}
            {companyData?.email && (
              <TouchableOpacity style={styles.actionIcon} onPress={() => handleEmailPress(companyData.email)}>
                <MaterialIcons name="message" size={22} color="#FF7722" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* NGO Name */}
        <Text style={styles.orgName}>{getTranslatedOrgName()}</Text>

        {/* Location */}
        <View style={styles.locationContainer}>
          <MaterialIcons name="location-on" size={16} color="#6b7280" />
          <Text style={styles.locationText}>{getTranslatedAddress()}</Text>
        </View>

        {/* Tabs Row */}
        <View style={styles.tabsContainer}>
          {['education', 'health', 'employment'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <MaterialIcons
                name={tab === 'education' ? 'school' : tab === 'health' ? 'health-and-safety' : 'work'}
                size={16}
                color={activeTab === tab ? '#FF7722' : '#6b7280'}
              />
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'education' ? t('home.education') || 'Education' :
                 tab === 'health' ? t('home.health') || 'Health' :
                 t('home.employment') || 'Employment'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Reviews Bar */}
        <View style={styles.reviewsBar}>
          <View style={styles.reviewsContent}>
            <View style={styles.reviewsLeft}>
              <Text style={styles.reviewsLabel}>{t('home.reviews') || 'Reviews'}</Text>
              <View style={styles.ratingContainer}>
                <MaterialIcons name="star" size={18} color="#fbbf24" />
                <Text style={styles.ratingText}>{companyData?.averageRating || '4.8'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Donate Button */}
        <View style={styles.donateButtonContainer}>
          <TouchableOpacity style={styles.donateButton} onPress={() => setDonateModalVisible(true)} activeOpacity={0.8}>
            <MaterialIcons name="favorite" size={24} color="#ffffff" />
            <Text style={styles.donateButtonText}>{t('home.donateNow') || 'Donate Now'}</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.aboutContainer}>
          <Text style={styles.aboutTitle}>{t('home.aboutUs') || 'About Us'}</Text>
          <Text style={styles.aboutText}>{getTranslatedAbout()}</Text>
          <View style={styles.divider} />

          {/* Mission Tab */}
          {companyData?.mission && (
            <View style={styles.nestedTabContainer}>
              <TouchableOpacity
                style={styles.nestedTabHeader}
                onPress={() => setExpandedAboutTab(expandedAboutTab === 'mission' ? null : 'mission')}
                activeOpacity={0.7}
              >
                <View style={styles.nestedTabHeaderLeft}>
                  <MaterialIcons name="flag" size={20} color="#FF7722" />
                  <Text style={styles.nestedTabTitle}>{t('company.mission') || 'Mission'}</Text>
                </View>
                <MaterialIcons
                  name={expandedAboutTab === 'mission' ? 'expand-less' : 'expand-more'}
                  size={24}
                  color="#6b7280"
                />
              </TouchableOpacity>
              {expandedAboutTab === 'mission' && (
                <View style={styles.nestedTabContent}>
                  <Text style={styles.nestedTabText}>
                    {isHindi && companyData?.missionHi ? companyData.missionHi : companyData.mission}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Vision Tab */}
          {companyData?.vision && (
            <View style={styles.nestedTabContainer}>
              <TouchableOpacity
                style={styles.nestedTabHeader}
                onPress={() => setExpandedAboutTab(expandedAboutTab === 'vision' ? null : 'vision')}
                activeOpacity={0.7}
              >
                <View style={styles.nestedTabHeaderLeft}>
                  <MaterialIcons name="visibility" size={20} color="#FF7722" />
                  <Text style={styles.nestedTabTitle}>{t('company.vision') || 'Vision'}</Text>
                </View>
                <MaterialIcons
                  name={expandedAboutTab === 'vision' ? 'expand-less' : 'expand-more'}
                  size={24}
                  color="#6b7280"
                />
              </TouchableOpacity>
              {expandedAboutTab === 'vision' && (
                <View style={styles.nestedTabContent}>
                  <Text style={styles.nestedTabText}>
                    {isHindi && companyData?.visionHi ? companyData.visionHi : companyData.vision}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Docs Tab */}
          {documents.length > 0 && (
            <View style={styles.nestedTabContainer}>
              <TouchableOpacity
                style={styles.nestedTabHeader}
                onPress={() => setExpandedAboutTab(expandedAboutTab === 'docs' ? null : 'docs')}
                activeOpacity={0.7}
              >
                <View style={styles.nestedTabHeaderLeft}>
                  <MaterialIcons name="attach-file" size={20} color="#FF7722" />
                  <Text style={styles.nestedTabTitle}>{t('company.documents') || 'Documents'} ({documents.length})</Text>
                </View>
                <MaterialIcons
                  name={expandedAboutTab === 'docs' ? 'expand-less' : 'expand-more'}
                  size={24}
                  color="#6b7280"
                />
              </TouchableOpacity>
              {expandedAboutTab === 'docs' && (
                <View style={styles.nestedTabContent}>
                  {documents.slice(0, 10).map((doc) => (
                    <TouchableOpacity
                      key={doc.id}
                      style={styles.documentCard}
                      onPress={() => handleDocumentPress(doc)}
                      activeOpacity={0.7}
                    >
                      {doc.type === 'image' && doc.fileUrl && (
                        <Image source={{ uri: doc.fileUrl }} style={styles.documentThumbnail} resizeMode="cover" />
                      )}
                      {doc.type !== 'image' && (
                        <MaterialIcons
                          name={doc.type === 'pdf' ? 'picture-as-pdf' :
                                doc.type === 'document' ? 'description' : 'insert-drive-file'}
                          size={20}
                          color="#FF7722"
                        />
                      )}
                      <View style={styles.documentInfo}>
                        <Text style={styles.documentTitle}>{doc.title}</Text>
                        {doc.description && (
                          <Text style={styles.documentDesc} numberOfLines={1}>{doc.description}</Text>
                        )}
                        <View style={styles.documentMeta}>
                          <Text style={styles.documentMetaText}>{doc.type?.toUpperCase() || 'FILE'}</Text>
                          {doc.fileSize && (
                            <Text style={styles.documentMetaText}>{(doc.fileSize / 1024).toFixed(1)} KB</Text>
                          )}
                        </View>
                      </View>
                      <MaterialIcons name="chevron-right" size={20} color="#6b7280" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Announcements */}
        {announcements.length > 0 && (
          <View style={styles.announcementsContainer}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="campaign" size={20} color="#FF7722" />
              <Text style={styles.sectionTitle}>{t('home.announcements') || 'Announcements'}</Text>
            </View>
            {announcements.slice(0, 3).map((announcement) => (
              <View key={announcement.id} style={styles.announcementCard}>
                <Text style={styles.announcementText}>{getTranslatedAnnouncement(announcement)}</Text>
                {announcement.date && (
                  <Text style={styles.announcementDate}>{new Date(announcement.date).toLocaleDateString()}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Event Gallery */}
        {eventPhotos.length > 0 && (
          <View style={styles.eventGalleryContainer}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="photo-library" size={20} color="#FF7722" />
              <Text style={styles.sectionTitle}>{t('home.eventGallery') || 'Event Gallery'}</Text>
              <Text style={styles.galleryCount}>{eventPhotos.length} {t('home.photos') || 'photos'}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScrollContent}>
              {eventPhotos.map((item, index) => (
                <TouchableOpacity
                  key={item.id || index}
                  style={styles.eventPhotoItem}
                  onPress={() => {
                    setSelectedEventPhoto(item);
                    setEventModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: item.image }} style={styles.eventPhotoImage} resizeMode="cover" />
                  {item.title && (
                    <View style={styles.eventPhotoOverlay}>
                      <Text style={styles.eventPhotoTitle} numberOfLines={1}>
                        {isHindi && item.titleHi ? item.titleHi : item.title}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Services Section */}
        <View style={styles.servicesContainer}>
          <Text style={styles.sectionTitle}>{t('company.services') || 'Our Services'}</Text>
          <View style={styles.servicesVerticalList}>
            {HARDCODED_SERVICES.map((service) => {
              const details = serviceDetails[service.id];
              const hasDetails = details && details.details && details.details.length > 0;

              return (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceItemWrapper}
                  onPress={() => {
                    setSelectedService(service);
                    setServiceModalVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.serviceTabVertical}>
                    <View style={styles.serviceTabLeft}>
                      <View style={styles.serviceTabIconVertical}>
                        <MaterialIcons name={service.icon} size={22} color="#FF7722" />
                      </View>
                      <Text style={styles.serviceTabTextVertical}>
                        {getTranslatedServiceName(service)}
                      </Text>
                    </View>
                    <View style={styles.serviceTabRight}>
                      {hasDetails && (
                        <View style={styles.serviceBadgeVertical}>
                          <Text style={styles.serviceBadgeTextVertical}>{details.details.length}</Text>
                        </View>
                      )}
                      <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Leadership/Committees */}
        {committees.length > 0 && (
          <View style={styles.leadershipContainer}>
            <Text style={styles.leadershipTitle}>{t('home.leadership') || 'Leadership & Committees'}</Text>
            {committees.map((committee) => {
              const isExpanded = expandedCommittees[committee.id];
              const memberCount = committee.members?.length || 0;

              return (
                <View key={committee.id} style={styles.committeeCard}>
                  <TouchableOpacity
                    style={styles.committeeHeaderRow}
                    onPress={() => toggleCommittee(committee.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.committeeHeaderLeft}>
                      <View style={styles.committeeIconContainer}>
                        <MaterialIcons name="groups" size={20} color="#FF7722" />
                      </View>
                      <View style={styles.committeeHeaderInfo}>
                        <Text style={styles.committeeName}>{getTranslatedCommitteeName(committee)}</Text>
                      </View>
                    </View>
                    <View style={styles.committeeHeaderRight}>
                      {committee.description && (
                        <MaterialIcons name="info-outline" size={18} color="#9ca3af" style={styles.committeeInfoIcon} />
                      )}
                      <MaterialIcons name={isExpanded ? 'expand-less' : 'expand-more'} size={24} color="#6b7280" />
                    </View>
                  </TouchableOpacity>

                  {committee.description && (
                    <Text style={styles.committeeDesc}>{getTranslatedCommitteeDesc(committee)}</Text>
                  )}

                  {isExpanded && memberCount > 0 && (
                    <View style={styles.committeeMembersList}>
                      {committee.members.slice(0, 10).map((member, index) => (
                        <View key={member.id || index} style={styles.committeeMemberItem}>
                          {member.photo ? (
                            <Image source={{ uri: member.photo }} style={styles.committeeMemberPhoto} />
                          ) : (
                            <View style={[styles.leaderIcon, { backgroundColor: member.color || '#FF7722' }]}>
                              <Text style={styles.leaderInitial}>{getTranslatedMemberName(member).charAt(0)}</Text>
                            </View>
                          )}
                          <View style={styles.leaderContent}>
                            <Text style={styles.leaderName}>{getTranslatedMemberName(member)}</Text>
                            <Text style={styles.leaderRole}>{getTranslatedMemberRole(member)}</Text>
                            {member.phone && (
                              <Text style={styles.leaderContact}>
                                <MaterialIcons name="phone" size={12} color="#6b7280" /> {member.phone}
                              </Text>
                            )}
                            {member.email && (
                              <Text style={styles.leaderContact}>
                                <MaterialIcons name="email" size={12} color="#6b7280" /> {member.email}
                              </Text>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {isExpanded && memberCount === 0 && (
                    <View style={styles.noMembersContainer}>
                      <Text style={styles.noMembersText}>{t('company.noMembers') || 'No members added yet'}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Members */}
        {members.length > 0 && (
          <View style={styles.membersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {members.slice(0, 10).map((member) => (
                <View key={member.id} style={styles.memberCard}>
                  <View style={styles.memberAvatarLarge}>
                    {member.photo ? (
                      <Image source={{ uri: member.photo }} style={styles.memberPhoto} />
                    ) : (
                      <Text style={styles.memberAvatarText}>{getTranslatedMemberName(member).charAt(0)}</Text>
                    )}
                  </View>
                  <Text style={styles.memberNameText}>{getTranslatedMemberName(member)}</Text>
                  <Text style={styles.memberRoleText}>{getTranslatedMemberRole(member)}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Products */}
        {products.length > 0 && (
          <View style={styles.productsContainer}>
            <Text style={styles.sectionTitle}>{t('ecommerce.products') || 'Products'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {products.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productCard}
                  onPress={() => handleRequireLogin(t('home.viewProduct') || 'view product details', 'Login')}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: product.image || 'https://via.placeholder.com/100' }} style={styles.productImage} />
                  <Text style={styles.productName}>{isHindi && product.nameHi ? product.nameHi : product.name}</Text>
                  <Text style={styles.productPrice}>₹{product.price || '0'}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Events */}
        {events.length > 0 && (
          <View style={styles.eventsContainer}>
            <Text style={styles.sectionTitle}>{t('home.events') || 'Upcoming Events'}</Text>
            {events.slice(0, 5).map((event) => (
              <TouchableOpacity key={event.id} style={styles.eventCard} onPress={() => handleEventPress(event)} activeOpacity={0.7}>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventName}>{getTranslatedEventName(event)}</Text>
                  <Text style={styles.eventDesc} numberOfLines={2}>{getTranslatedEventDesc(event)}</Text>
                  <View style={styles.eventMeta}>
                    <MaterialIcons name="calendar-today" size={14} color="#6b7280" />
                    <Text style={styles.eventDate}>{event.date ? new Date(event.date).toLocaleDateString() : ''}</Text>
                    {event.venue && (
                      <>
                        <MaterialIcons name="location-on" size={14} color="#6b7280" />
                        <Text style={styles.eventVenue}>{event.venue}</Text>
                      </>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Partners */}
        {partners.length > 0 && (
          <View style={styles.partnersContainer}>
            <Text style={styles.sectionTitle}>{t('home.partners') || 'Our Partners'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {partners.map((partner) => (
                <View key={partner.id} style={styles.partnerCard}>
                  {partner.logo ? (
                    <Image source={{ uri: partner.logo }} style={styles.partnerLogo} />
                  ) : (
                    <MaterialIcons name="business" size={40} color="#FF7722" />
                  )}
                  <Text style={styles.partnerName}>
                    {isHindi && partner.nameHi ? partner.nameHi : partner.name}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Testimonials */}
        {testimonials.length > 0 && (
          <View style={styles.testimonialsContainer}>
            <Text style={styles.sectionTitle}>{t('home.testimonials') || 'Testimonials'}</Text>
            <View style={styles.testimonialCard}>
              <View style={styles.testimonialAvatar}>
                <Text style={styles.testimonialAvatarText}>
                  {testimonials[activeTestimonialIndex]?.name?.charAt(0) || 'U'}
                </Text>
              </View>
              <Text style={styles.testimonialContent}>{getTranslatedTestimonial(testimonials[activeTestimonialIndex])}</Text>
              <Text style={styles.testimonialAuthor}>
                {testimonials[activeTestimonialIndex]?.name || t('common.anonymous') || 'Anonymous'}
              </Text>
              {testimonials[activeTestimonialIndex]?.role && (
                <Text style={styles.testimonialRole}>{testimonials[activeTestimonialIndex].role}</Text>
              )}
              <View style={styles.testimonialDots}>
                {testimonials.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.testimonialDot, activeTestimonialIndex === index && styles.testimonialDotActive]}
                    onPress={() => setActiveTestimonialIndex(index)}
                  />
                ))}
              </View>
            </View>
          </View>
        )}

        {/* FAQs */}
        {faqs.length > 0 && (
          <View style={styles.faqsContainer}>
            <Text style={styles.sectionTitle}>{t('home.faqs') || 'Frequently Asked Questions'}</Text>
            {faqs.slice(0, 5).map((faq) => (
              <TouchableOpacity key={faq.id} style={styles.faqItem} onPress={() => toggleFaq(faq.id)} activeOpacity={0.7}>
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{getTranslatedFaqQuestion(faq)}</Text>
                  <MaterialIcons name={expandedFaq === faq.id ? 'expand-less' : 'expand-more'} size={24} color="#6b7280" />
                </View>
                {expandedFaq === faq.id && (
                  <Text style={styles.faqAnswer}>{getTranslatedFaqAnswer(faq)}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Gallery */}
        {gallery.length > 0 && (
          <View style={styles.galleryContainer}>
            <Text style={styles.sectionTitle}>{t('home.gallery') || 'Gallery'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {gallery.slice(0, 10).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.galleryItem}
                  onPress={() => {
                    if (item.imageUrl) {
                      Alert.alert(item.title || 'Image', t('common.view') || 'View full image');
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }} style={styles.galleryImage} />
                  {item.title && (
                    <View style={styles.galleryOverlay}>
                      <Text style={styles.galleryTitle} numberOfLines={1}>
                        {isHindi && item.titleHi ? item.titleHi : item.title}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* QUOTES SECTION */}
        {quotes.length > 0 && (
          <View style={styles.quotesContainer}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="format-quote" size={20} color="#8b5cf6" />
              <Text style={styles.sectionTitle}>{t('quotes.dailyQuotes') || 'Daily Quotes'}</Text>
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
                    <Image source={{ uri: item.imageUrl }} style={styles.quoteImage} resizeMode="cover" />
                  )}
                  <View style={styles.quoteContent}>
                    <MaterialIcons name="format-quote" size={20} color="#8b5cf6" style={styles.quoteIcon} />
                    <Text style={styles.quoteText} numberOfLines={3}>
                      "{getTranslatedQuoteText(item)}"
                    </Text>
                    {item.author && <Text style={styles.quoteAuthor}>— {item.author}</Text>}
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} {getTranslatedOrgName()}. {t('home.allRightsReserved') || 'All rights reserved.'}
          </Text>
          <Text style={styles.footerSubText}>{getTranslatedTagline()}</Text>
          {companyData?.email && (
            <TouchableOpacity onPress={() => handleEmailPress(companyData.email)}>
              <Text style={styles.footerContact}>{companyData.email}</Text>
            </TouchableOpacity>
          )}
          {companyData?.contactNo && (
            <TouchableOpacity onPress={() => handleCallPress(companyData.contactNo)}>
              <Text style={styles.footerContact}>{companyData.contactNo}</Text>
            </TouchableOpacity>
          )}
          {companyData?.website && (
            <TouchableOpacity onPress={() => Linking.openURL(companyData.website)}>
              <Text style={styles.footerContact}>{companyData.website}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ========== MODALS ========== */}

      {/* Document Modal */}
      {modalVisible && selectedDocument && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false);
            setSelectedDocument(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle} numberOfLines={1}>
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
              <View style={styles.modalImageContainer}>
                <Image
                  source={{ uri: selectedDocument.fileUrl, cache: 'force-cache' }}
                  style={styles.modalImage}
                  resizeMode="contain"
                  onError={() => {
                    Alert.alert('Error', 'Failed to load image. The URL may be invalid.', [{ text: 'OK' }]);
                  }}
                />
              </View>
              <View style={styles.modalFooter}>
                {selectedDocument.description && (
                  <Text style={styles.modalDescription} numberOfLines={2}>{selectedDocument.description}</Text>
                )}
                <View style={styles.modalFooterMeta}>
                  <Text style={styles.modalFooterText}>{selectedDocument.type?.toUpperCase() || 'IMAGE'}</Text>
                  {selectedDocument.fileSize && (
                    <Text style={styles.modalFooterText}>{(selectedDocument.fileSize / 1024).toFixed(1)} KB</Text>
                  )}
                  {selectedDocument.fileName && (
                    <Text style={styles.modalFooterText}>{selectedDocument.fileName}</Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Service Modal */}
      {selectedService && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={serviceModalVisible}
          onRequestClose={() => {
            setServiceModalVisible(false);
            setSelectedService(null);
          }}
        >
          <View style={styles.serviceModalOverlay}>
            <View style={styles.serviceModalContainer}>
              <View style={styles.serviceModalHeader}>
                <View style={styles.serviceModalHeaderLeft}>
                  <View style={styles.serviceModalIcon}>
                    <MaterialIcons name={selectedService.icon} size={28} color="#FF7722" />
                  </View>
                  <Text style={styles.serviceModalTitle}>{getTranslatedServiceName(selectedService)}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setServiceModalVisible(false);
                    setSelectedService(null);
                  }}
                  style={styles.serviceModalCloseBtn}
                >
                  <MaterialIcons name="close" size={28} color="#1f2937" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.serviceModalBody} showsVerticalScrollIndicator={false}>
                {serviceDetails[selectedService.id]?.description && (
                  <View style={styles.serviceModalDescriptionContainer}>
                    <Text style={styles.serviceModalDescriptionLabel}>Description</Text>
                    <Text style={styles.serviceModalDescription}>
                      {getTranslatedServiceDescription(selectedService.id)}
                    </Text>
                  </View>
                )}

                {serviceDetails[selectedService.id]?.details?.length > 0 && (
                  <View style={styles.serviceModalDetailsContainer}>
                    <Text style={styles.serviceModalDetailsLabel}>Details</Text>
                    {serviceDetails[selectedService.id].details.map((detail, idx) => (
                      <View key={idx} style={styles.serviceModalDetailRow}>
                        <Text style={styles.serviceModalDetailLabel}>
                          {getTranslatedServiceDetailLabel(detail)}
                        </Text>
                        <Text style={styles.serviceModalDetailValue}>{detail.value}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>

              <View style={styles.serviceModalFooter}>
                <TouchableOpacity
                  style={styles.serviceModalCloseButton}
                  onPress={() => {
                    setServiceModalVisible(false);
                    setSelectedService(null);
                  }}
                >
                  <Text style={styles.serviceModalCloseButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Event Modal */}
      {eventModalVisible && selectedEventPhoto && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={eventModalVisible}
          onRequestClose={() => {
            setEventModalVisible(false);
            setSelectedEventPhoto(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                  {isHindi && selectedEventPhoto.titleHi ? selectedEventPhoto.titleHi : selectedEventPhoto.title || 'Event Photo'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setEventModalVisible(false);
                    setSelectedEventPhoto(null);
                  }}
                  style={styles.modalCloseBtn}
                >
                  <MaterialIcons name="close" size={28} color="#1f2937" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalImageContainer}>
                <Image
                  source={{ uri: selectedEventPhoto.image, cache: 'force-cache' }}
                  style={styles.modalImage}
                  resizeMode="contain"
                  onError={() => {
                    Alert.alert('Error', 'Failed to load image. The URL may be invalid.', [{ text: 'OK' }]);
                  }}
                />
              </View>
              <View style={styles.modalFooter}>
                {selectedEventPhoto.date && (
                  <View style={styles.modalFooterMeta}>
                    <MaterialIcons name="event" size={14} color="#6b7280" />
                    <Text style={styles.modalFooterText}>
                      {selectedEventPhoto.date?.toDate?.()
                        ? new Date(selectedEventPhoto.date.toDate()).toLocaleDateString()
                        : new Date(selectedEventPhoto.date).toLocaleDateString()}
                    </Text>
                  </View>
                )}
                <View style={styles.modalFooterMeta}>
                  <Text style={styles.modalFooterText}>{t('home.eventPhoto') || 'Event Photo'}</Text>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Donation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={donateModalVisible}
        onRequestClose={() => {
          setDonateModalVisible(false);
          setDonationForm({ name: '', address: '', mobile: '', email: '', password: '' });
        }}
      >
        <View style={styles.donateModalOverlay}>
          <View style={styles.donateModalContainer}>
            <View style={styles.donateModalHeader}>
              <View style={styles.donateModalHeaderLeft}>
                <View style={styles.donateModalIcon}>
                  <MaterialIcons name="volunteer-activism" size={28} color="#FF7722" />
                </View>
                <Text style={styles.donateModalTitle}>{t('home.donateNow')}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setDonateModalVisible(false);
                  setDonationForm({ name: '', address: '', mobile: '', email: '', password: '' });
                }}
                style={styles.donateModalCloseBtn}
              >
                <MaterialIcons name="close" size={28} color="#1f2937" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.donateModalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.donateModalSubtitle}>{t('home.donateSubtitle')}</Text>

              <View style={styles.donateFormGroup}>
                <Text style={styles.donateFormLabel}>{t('home.fullName')} <Text style={styles.donateRequired}>*</Text></Text>
                <TextInput
                  style={styles.donateFormInput}
                  placeholder={t('home.enterFullName')}
                  placeholderTextColor="#9ca3af"
                  value={donationForm.name}
                  onChangeText={(text) => setDonationForm({ ...donationForm, name: text })}
                />
              </View>

              <View style={styles.donateFormGroup}>
                <Text style={styles.donateFormLabel}>{t('home.address')} <Text style={styles.donateRequired}>*</Text></Text>
                <TextInput
                  style={[styles.donateFormInput, styles.donateFormTextArea]}
                  placeholder={t('home.enterAddress')}
                  placeholderTextColor="#9ca3af"
                  multiline={true}
                  numberOfLines={3}
                  value={donationForm.address}
                  onChangeText={(text) => setDonationForm({ ...donationForm, address: text })}
                />
              </View>

              <View style={styles.donateFormGroup}>
                <Text style={styles.donateFormLabel}>{t('home.mobileNumber')} <Text style={styles.donateRequired}>*</Text></Text>
                <TextInput
                  style={styles.donateFormInput}
                  placeholder={t('home.enterMobile')}
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  value={donationForm.mobile}
                  onChangeText={(text) => setDonationForm({ ...donationForm, mobile: text })}
                  maxLength={10}
                />
              </View>

              <View style={styles.donateFormGroup}>
                <Text style={styles.donateFormLabel}>{t('home.emailAddress')} <Text style={styles.donateRequired}>*</Text></Text>
                <TextInput
                  style={styles.donateFormInput}
                  placeholder={t('home.enterEmail')}
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={donationForm.email}
                  onChangeText={(text) => setDonationForm({ ...donationForm, email: text })}
                />
              </View>

              <View style={styles.donateFormGroup}>
                <Text style={styles.donateFormLabel}>{t('home.password')} <Text style={styles.donateRequired}>*</Text></Text>
                <TextInput
                  style={styles.donateFormInput}
                  placeholder={t('home.enterPassword')}
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={true}
                  value={donationForm.password}
                  onChangeText={(text) => setDonationForm({ ...donationForm, password: text })}
                />
              </View>
            </ScrollView>

            <View style={styles.donateModalFooter}>
              <TouchableOpacity
                style={[styles.donateModalSubmitButton, donationLoading && styles.donateModalSubmitDisabled]}
                onPress={handleDonationSubmit}
                disabled={donationLoading}
              >
                {donationLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.donateModalSubmitText}>{t('home.submitDonation')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========== QUOTE MODAL ========== */}
      {quoteModalVisible && selectedQuote && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={quoteModalVisible}
          onRequestClose={() => {
            setQuoteModalVisible(false);
            setSelectedQuote(null);
          }}
        >
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

                {selectedQuote.imageUrl ? (
                  <Image
                    source={{ uri: selectedQuote.imageUrl }}
                    style={styles.quoteModalImage}
                    resizeMode="contain"
                    onError={() => {
                      Alert.alert('Error', 'Failed to load image');
                    }}
                  />
                ) : (
                  <View style={styles.quoteModalNoImage}>
                    <MaterialIcons name="image" size={60} color="#d1d5db" />
                    <Text style={styles.quoteModalNoImageText}>No image available</Text>
                  </View>
                )}

                <View style={styles.quoteModalContent}>
                  <MaterialIcons name="format-quote" size={32} color="#8b5cf6" style={styles.quoteModalIcon} />
                  <Text style={styles.quoteModalText}>
                    "{getTranslatedQuoteText(selectedQuote)}"
                  </Text>
                  {selectedQuote.author && (
                    <Text style={styles.quoteModalAuthor}>— {selectedQuote.author}</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.quoteModalDownloadBtn, downloadingQuote && { opacity: 0.6 }]}
                  onPress={() => downloadQuoteImage(selectedQuote.imageUrl, selectedQuote.text)}
                  disabled={downloadingQuote}
                >
                  {downloadingQuote ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <MaterialIcons name="download" size={22} color="#ffffff" />
                      <Text style={styles.quoteModalDownloadBtnText}>Download Image</Text>
                    </>
                  )}
                </TouchableOpacity>

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
        </Modal>
      )}
    </View>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  },
  coverContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  coverImage: {
    marginTop: 16,
    width: '100%',
    height: 250,
    borderRadius: 16,
    resizeMode: 'cover',
    backgroundColor: '#f3f4f6',
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5eb',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 4,
  },
  verifiedText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    color: '#FF7722',
  },
  profileRight: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff5eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orgName: {
    fontFamily: Fonts.Bold,
    fontSize: 22,
    color: '#1f2937',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 4,
  },
  locationText: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#6b7280',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  tabActive: {
    backgroundColor: '#fff5eb',
  },
  tabText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#FF7722',
  },
  reviewsBar: {
    backgroundColor: '#FF7722',
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: 350,
    marginLeft: 13,
    borderRadius: 10,
  },
  reviewsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewsLabel: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#ffffff',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontFamily: Fonts.Bold,
    fontSize: 16,
    color: '#ffffff',
  },
  donateButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  donateButton: {
    backgroundColor: '#FF7722',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#FF7722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  donateButtonText: {
    fontFamily: Fonts.Bold,
    fontSize: 18,
    color: '#ffffff',
    letterSpacing: 1,
  },
  aboutContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  aboutTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 18,
    color: '#1f2937',
    marginBottom: 8,
  },
  aboutText: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 14,
  },
  nestedTabContainer: {
    marginBottom: 4,
  },
  nestedTabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    marginBottom: 2,
  },
  nestedTabHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nestedTabTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
  },
  nestedTabContent: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#FF7722',
  },
  nestedTabText: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    gap: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  documentThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 13,
    color: '#1f2937',
  },
  documentDesc: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#6b7280',
    marginTop: 1,
  },
  documentMeta: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  documentMetaText: {
    fontFamily: Fonts.Regular,
    fontSize: 9,
    color: '#9ca3af',
  },
  announcementsContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 18,
    color: '#1f2937',
    marginBottom: 10,
  },
  announcementCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  announcementText: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#1f2937',
  },
  announcementDate: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
  servicesContainer: {
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  servicesVerticalList: {
    flexDirection: 'column',
    width: '100%',
    gap: 8,
  },
  serviceItemWrapper: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  serviceTabVertical: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    minHeight: 56,
  },
  serviceTabLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  serviceTabRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceTabIconVertical: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceTabTextVertical: {
    fontFamily: Fonts.Medium,
    fontSize: 15,
    color: '#1f2937',
    flex: 1,
  },
  serviceBadgeVertical: {
    backgroundColor: '#FF7722',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceBadgeTextVertical: {
    fontFamily: Fonts.SemiBold,
    fontSize: 11,
    color: '#ffffff',
  },
  leadershipContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  leadershipTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 18,
    color: '#1f2937',
    marginBottom: 12,
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
  committeeName: {
    fontFamily: Fonts.Bold,
    fontSize: 16,
    color: '#1f2937',
  },
  committeeHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  committeeInfoIcon: {
    marginRight: 2,
  },
  committeeDesc: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 8,
    paddingLeft: 46,
  },
  committeeMembersList: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingLeft: 46,
  },
  committeeMemberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  committeeMemberPhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
  leaderContact: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#6b7280',
    marginTop: 1,
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
  membersContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  memberCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  memberAvatarLarge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff5eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  memberPhoto: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  memberAvatarText: {
    fontFamily: Fonts.Bold,
    fontSize: 28,
    color: '#FF7722',
  },
  memberNameText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    color: '#1f2937',
    textAlign: 'center',
  },
  memberRoleText: {
    fontFamily: Fonts.Regular,
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
  },
  productsContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  productCard: {
    width: 120,
    marginRight: 12,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 10,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  productName: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    color: '#1f2937',
    marginTop: 6,
    textAlign: 'center',
  },
  productPrice: {
    fontFamily: Fonts.Bold,
    fontSize: 14,
    color: '#FF7722',
    marginTop: 2,
  },
  eventsContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  eventCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
  },
  eventDesc: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  eventDate: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
  },
  eventVenue: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
  },
  partnersContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  partnerCard: {
    alignItems: 'center',
    marginRight: 20,
    width: 80,
  },
  partnerLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
  },
  partnerName: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  testimonialsContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  testimonialCard: {
    alignItems: 'center',
    padding: 12,
  },
  testimonialAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff5eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  testimonialAvatarText: {
    fontFamily: Fonts.Bold,
    fontSize: 22,
    color: '#FF7722',
  },
  testimonialContent: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  testimonialAuthor: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
  },
  testimonialRole: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
  },
  testimonialDots: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 6,
  },
  testimonialDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  testimonialDotActive: {
    backgroundColor: '#FF7722',
    width: 20,
  },
  faqsContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  },
  faqAnswer: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  galleryContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
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
  },
  // Event Gallery Styles
  eventGalleryContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  galleryCount: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 'auto',
  },
  galleryScrollContent: {
    paddingVertical: 4,
    gap: 8,
    paddingRight: 4,
  },
  eventPhotoItem: {
    width: 160,
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 10,
    backgroundColor: '#f3f4f6',
    position: 'relative',
  },
  eventPhotoImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
  },
  eventPhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  eventPhotoTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 11,
    color: '#ffffff',
    textAlign: 'center',
  },
  // Quotes Styles
  quotesContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
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
  quoteAuthor: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 6,
    includeFontPadding: false,
    textAlignVertical: 'center',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: Platform.OS === 'web' ? '90%' : '95%',
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
    backgroundColor: '#ffffff',
  },
  modalHeaderTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 18,
    color: '#1f2937',
    flex: 1,
    marginRight: 12,
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
  modalImageContainer: {
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  modalImage: {
    width: '100%',
    height: Platform.OS === 'web' ? 500 : height * 0.55,
    backgroundColor: '#f8fafc',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#ffffff',
  },
  modalDescription: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalFooterMeta: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  modalFooterText: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#9ca3af',
  },
  // Service Modal
  serviceModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  serviceModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  serviceModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#ffffff',
  },
  serviceModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceModalIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff5eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceModalTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 18,
    color: '#1f2937',
    flex: 1,
  },
  serviceModalCloseBtn: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceModalBody: {
    padding: 16,
    maxHeight: 400,
  },
  serviceModalDescriptionContainer: {
    marginBottom: 16,
  },
  serviceModalDescriptionLabel: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  serviceModalDescription: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
  },
  serviceModalDetailsContainer: {
    marginTop: 4,
  },
  serviceModalDetailsLabel: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  serviceModalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  serviceModalDetailLabel: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
  },
  serviceModalDetailValue: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#FF7722',
    marginLeft: 8,
  },
  serviceModalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#ffffff',
  },
  serviceModalCloseButton: {
    backgroundColor: '#FF7722',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  serviceModalCloseButtonText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
    color: '#ffffff',
  },
  // Donation Modal
  donateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  donateModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  donateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#ffffff',
  },
  donateModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  donateModalIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff5eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  donateModalTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 18,
    color: '#1f2937',
  },
  donateModalCloseBtn: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donateModalBody: {
    padding: 20,
    maxHeight: 450,
  },
  donateModalSubtitle: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  donateFormGroup: {
    marginBottom: 16,
  },
  donateFormLabel: {
    fontFamily: Fonts.Medium,
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
  },
  donateRequired: {
    color: '#ef4444',
  },
  donateFormInput: {
    fontFamily: Fonts.Regular,
    fontSize: 15,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    minHeight: 48,
  },
  donateFormTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  donateModalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#ffffff',
  },
  donateModalSubmitButton: {
    backgroundColor: '#FF7722',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  donateModalSubmitDisabled: {
    backgroundColor: '#fbbf8c',
  },
  donateModalSubmitText: {
    fontFamily: Fonts.Bold,
    fontSize: 16,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  footer: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  footerText: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  footerSubText: {
    fontFamily: Fonts.Italic,
    fontSize: 11,
    color: '#b0b8c4',
    textAlign: 'center',
    marginTop: 4,
  },
  footerContact: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});