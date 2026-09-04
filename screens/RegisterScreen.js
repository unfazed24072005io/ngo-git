// screens/RegisterScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, Image, Alert, Platform, KeyboardAvoidingView, ActivityIndicator, Modal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { 
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { getAuthInstance, db } from '../config/firebase';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Fonts } from '../config/fonts';
import { Picker } from '@react-native-picker/picker';
import { useLanguage } from '../context/LanguageContext';
import { initiateRazorpayPayment, verifyRazorpayPayment } from '../services/paymentService';

export default function RegisterScreen({ navigation, route }) {
  const { t, counter } = useLanguage();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('member');
  const [registrationMethod, setRegistrationMethod] = useState('email');
  const [feesLoaded, setFeesLoaded] = useState(false);
  const [memberTypes, setMemberTypes] = useState([]);
  const [memberFees, setMemberFees] = useState({});
  const [referralCode, setReferralCode] = useState('');
  const [referralValid, setReferralValid] = useState(false);
  const [referrerData, setReferrerData] = useState(null);
  const [checkingReferral, setCheckingReferral] = useState(false);
  const [showNoPaymentOption, setShowNoPaymentOption] = useState(false);
  const [noPaymentReason, setNoPaymentReason] = useState('');
  
  // Payment States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [feeAmount, setFeeAmount] = useState('');
  
  const isDonationFlow = route?.params?.donationFlow || false;
  const isDonorFlow = route?.params?.isDonorRegistration || false;
  
  // Force re-render when language changes
  const renderKey = `register-${counter}`;

  // Get translations
  const getTranslations = () => ({
    title: t('auth.createAccount') || 'Create',
    subtitle: isDonationFlow ? (t('auth.donorAccount') || 'donor account') : (t('auth.yourAccount') || 'your account'),
    step: t('common.step') || 'Step',
    of: t('common.of') || 'of',
    alreadyHaveAccount: t('auth.alreadyHaveAccount') || 'Already have an account? ',
    signIn: t('auth.signIn') || 'Sign In',
    selectRegistrationType: t('auth.selectRegistrationType') || 'Select Registration Type',
    chooseHowToRegister: t('auth.chooseHowToRegister') || 'Choose how you want to register',
    member: t('auth.member') || 'Member',
    registerAsMember: t('auth.registerAsMember') || 'Register as a regular member',
    workingMember: t('auth.workingMember') || 'Working Member',
    registerAsWorkingMember: t('auth.registerAsWorkingMember') || 'Register as a working member to earn commissions',
    donor: t('auth.donor') || 'Donor',
    registerAsDonor: t('auth.registerAsDonor') || 'Register as a donor to support the cause',
    next: t('common.next') || 'Next',
    chooseRegistrationMethod: t('auth.chooseRegistrationMethod') || 'Choose Registration Method',
    howWouldYouLike: t('auth.howWouldYouLike') || 'How would you like to register?',
    emailRegistration: t('auth.emailRegistration') || 'Email Registration',
    registerUsingEmail: t('auth.registerUsingEmail') || 'Register using your email and password',
    phoneRegistration: t('auth.phoneRegistration') || 'Phone Registration',
    registerUsingPhone: t('auth.registerUsingPhone') || 'Register using your phone number and password',
    personalInformation: t('auth.personalInformation') || 'Personal Information',
    enterPersonalDetails: t('auth.enterPersonalDetails') || 'Enter your basic personal details',
    fullName: t('auth.fullName') || 'Full Name',
    fatherHusbandName: t('auth.fatherHusbandName') || 'Father/Husband Name',
    dateOfBirth: t('auth.dateOfBirth') || 'Date of Birth (DD/MM/YYYY)',
    selectGender: t('auth.selectGender') || 'Select Gender',
    male: t('auth.male') || 'Male',
    female: t('auth.female') || 'Female',
    other: t('auth.other') || 'Other',
    educationQualification: t('auth.educationQualification') || 'Educational Qualification',
    caste: t('auth.caste') || 'Caste',
    spouseName: t('auth.spouseName') || 'Spouse Name',
    aadharNumber: t('auth.aadharNumber') || 'Aadhar Number',
    email: t('auth.email') || 'Email',
    phoneNumber: t('auth.phoneNumber') || 'Phone Number',
    password: t('auth.password') || 'Password',
    confirmPassword: t('auth.confirmPassword') || 'Confirm Password',
    back: t('common.back') || 'Back',
    addressLocation: t('auth.addressLocation') || 'Address & Location',
    enterAddressDetails: t('auth.enterAddressDetails') || 'Enter your address and location details',
    address: t('auth.address') || 'Address',
    village: t('auth.village') || 'Village',
    postOffice: t('auth.postOffice') || 'Post Office',
    thana: t('auth.thana') || 'Thana/Police Station',
    district: t('auth.district') || 'District',
    state: t('auth.state') || 'State',
    pinCode: t('auth.pinCode') || 'PIN Code',
    nationality: t('auth.nationality') || 'Nationality',
    profession: t('auth.profession') || 'Profession',
    membershipDetails: t('auth.membershipDetails') || 'Membership Details',
    enterMembershipInfo: t('auth.enterMembershipInfo') || 'Enter your membership information',
    membershipNumber: t('auth.membershipNumber') || 'Membership Number',
    membershipDate: t('auth.membershipDate') || 'Membership Date (DD/MM/YYYY)',
    guruAshram: t('auth.guruAshram') || 'Guru Ashram',
    selectMemberType: t('auth.selectMemberType') || 'Select Member Type',
    founderMember: t('auth.founderMember') || 'Founder Member',
    collectorMember: t('auth.collectorMember') || 'Collector Member',
    distinguishedMember: t('auth.distinguishedMember') || 'Distinguished Member',
    lifetimeMember: t('auth.lifetimeMember') || 'Lifetime Member',
    honoredMember: t('auth.honoredMember') || 'Honored Member',
    generalMember: t('auth.generalMember') || 'General Member',
    contributionAmount: t('auth.contributionAmount') || 'Contribution Amount (₹)',
    accountSecurity: t('auth.accountSecurity') || 'Account Security',
    setPassword: t('auth.setPassword') || 'Set your password for account security',
    profilePhoto: t('auth.profilePhoto') || 'Profile Photo',
    uploadProfilePhoto: t('auth.uploadProfilePhoto') || 'Upload your profile photo',
    changePhoto: t('auth.changePhoto') || 'Change Photo',
    uploadPhoto: t('auth.uploadPhoto') || 'Upload Profile Photo',
    aadharFront: t('auth.aadharFront') || 'Aadhar Card (Front)',
    uploadAadharFront: t('auth.uploadAadharFront') || 'Upload front side of Aadhar card',
    changeAadharFront: t('auth.changeAadharFront') || 'Change Aadhar Front',
    uploadAadharFrontLabel: t('auth.uploadAadharFrontLabel') || 'Upload Aadhar Front',
    aadharBack: t('auth.aadharBack') || 'Aadhar Card (Back)',
    uploadAadharBack: t('auth.uploadAadharBack') || 'Upload back side of Aadhar card',
    changeAadharBack: t('auth.changeAadharBack') || 'Change Aadhar Back',
    uploadAadharBackLabel: t('auth.uploadAadharBackLabel') || 'Upload Aadhar Back',
    panCard: t('auth.panCard') || 'PAN Card',
    uploadPanCard: t('auth.uploadPanCard') || 'Upload your PAN card',
    changePanCard: t('auth.changePanCard') || 'Change PAN Card',
    uploadPanCardLabel: t('auth.uploadPanCardLabel') || 'Upload PAN Card',
    signature: t('auth.signature') || 'Signature & Declaration',
    uploadSignature: t('auth.uploadSignature') || 'Upload your signature and complete registration',
    changeSignature: t('auth.changeSignature') || 'Change Signature',
    uploadSignatureLabel: t('auth.uploadSignatureLabel') || 'Upload Signature',
    register: t('auth.register') || 'Register',
    required: t('auth.required') || 'Required',
    error: t('common.error') || 'Error',
    validEmail: t('auth.validEmail') || 'Please enter a valid email address',
    passwordMinLength: t('auth.passwordMinLength') || 'Password must be at least 6 characters',
    passwordMismatch: t('auth.passwordMismatch') || 'Passwords do not match',
    registrationComplete: t('auth.registrationComplete') || 'Registration Complete!',
    donorAccountCreated: t('auth.donorAccountCreated') || 'Your donor account has been created successfully! You can now start donating.',
    workingAccountCreated: t('auth.workingAccountCreated') || 'Your working member account has been created. You can now login and start earning commissions!',
    registrationSubmitted: t('auth.registrationSubmitted') || 'Your registration has been submitted for approval. You will be notified once approved.',
    registrationFailed: t('auth.registrationFailed') || 'Registration failed. Please try again.',
    emailAlreadyUsed: t('auth.emailAlreadyUsed') || 'This email is already registered. Please use a different email or login.',
    invalidEmailFormat: t('auth.invalidEmailFormat') || 'Please enter a valid email address.',
    weakPassword: t('auth.weakPassword') || 'Password is too weak. Please use at least 6 characters.',
    networkError: t('auth.networkError') || 'Network error. Please check your internet connection.',
    validPhoneNumber: t('auth.validPhoneNumber') || 'Please enter a valid phone number',
    fillAllFields: t('auth.fillAllFields') || 'Please fill all fields',
    fullNameRequired: t('auth.fullNameRequired') || 'Please enter your full name',
    phoneRequired: t('auth.phoneRequired') || 'Please enter your phone number',
    registrationFee: 'Registration Fee',
    payRegistrationFee: 'Pay Registration Fee',
    paymentRequired: 'Please complete the payment to register',
    payNow: 'Pay Now',
    processingPayment: 'Processing Payment...',
    paymentFailed: 'Payment Failed',
    paymentSuccess: 'Payment Successful',
    paymentSuccessMessage: 'Registration fee of ₹{amount} paid successfully!',
    feeAmountLabel: 'Fee Amount (₹)',
    memberTypeRequired: 'Please select a member type first',
    invalidFeeAmount: 'Invalid registration fee amount',
    declaration: {
      part1: t('auth.declaration.part1') || 'I, {name} am voluntarily taking membership in Kabir Sat Dharam Foundation (Trust).',
      part2: t('auth.declaration.part2') || 'I will follow all the rules of this trust.',
      part3: t('auth.declaration.part3') || 'I will not do any act that causes any kind of loss to the trust.',
      part4: t('auth.declaration.part4') || 'I also commit that I will make every possible effort to take the trust forward.',
    }
  });

  const translations = getTranslations();

  const [formData, setFormData] = useState({
    fullName: '',
    fatherName: '',
    dob: '',
    gender: '',
    education: '',
    caste: '',
    spouseName: '',
    otherNationality: '',
    aadharNumber: '',
    phone: '',
    email: '',
    address: '',
    village: '',
    postOffice: '',
    thana: '',
    district: '',
    state: '',
    pinCode: '',
    nationality: '',
    profession: '',
    membershipNumber: '',
    membershipDate: '',
    guruAshram: '',
    memberType: '',
    contributionAmount: '',
    password: '',
    confirmPassword: '',
    profilePhoto: null,
    aadharFront: null,
    aadharBack: null,
    panCard: null,
    signature: null,
  });

  const fetchMemberFees = async () => {
    try {
      const docRef = doc(db, 'settings', 'commission');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.memberFees && Object.keys(data.memberFees).length > 0) {
          setMemberFees(data.memberFees);
          console.log('✅ Member fees loaded:', data.memberFees);
          setFeesLoaded(true);
        } else {
          console.warn('⚠️ No memberFees found in document');
          setFeesLoaded(false);
          Alert.alert('Configuration Error', 'Member fee structure not configured. Please contact admin.');
        }
      } else {
        console.warn('⚠️ Commission document does not exist');
        setFeesLoaded(false);
        Alert.alert('Configuration Error', 'Member fee structure not configured. Please contact admin.');
      }
    } catch (error) {
      console.error('❌ Error fetching member fees:', error);
      setFeesLoaded(false);
      Alert.alert('Error', 'Failed to load member fees. Please check your connection.');
    }
  };

  const validateReferralCode = async (code) => {
    if (!code || code.length < 6) {
      setReferralValid(false);
      setReferrerData(null);
      return;
    }

    setCheckingReferral(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('referralCode', '==', code.toUpperCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        if (userData.role === 'working' || userData.role === 'workingMember') {
          setReferralValid(true);
          setReferrerData({
            id: userDoc.id,
            name: userData.fullName || 'Working Member',
            level: userData.level || 'I'
          });
          Alert.alert('✅ Valid Referral Code', `You are being referred by ${userData.fullName}`);
        } else {
          setReferralValid(false);
          setReferrerData(null);
          Alert.alert('Invalid Code', 'This referral code belongs to a non-working member');
        }
      } else {
        setReferralValid(false);
        setReferrerData(null);
        if (code.length >= 6) {
          Alert.alert('Invalid Code', 'Please enter a valid referral code');
        }
      }
    } catch (error) {
      console.error('Error validating referral code:', error);
      setReferralValid(false);
      setReferrerData(null);
    } finally {
      setCheckingReferral(false);
    }
  };

  const getMemberTypeFee = (memberType) => {
    if (!memberType) return 0;
    return memberFees[memberType];
  };

  // ============ USE EFFECTS ============
  useEffect(() => {
    fetchMemberFees();
  }, []);

  useEffect(() => {
    if (formData.memberType) {
      const fee = getMemberTypeFee(formData.memberType);
      setFeeAmount(fee.toString());
      setFormData(prev => ({ ...prev, contributionAmount: fee.toString() }));
    }
  }, [formData.memberType, memberFees]);

  const handleRegistrationFeePayment = async () => {
    console.log('🔵 [PAYMENT] Starting payment flow');
    console.log('🔵 [PAYMENT] Member Type:', formData.memberType);
    console.log('🔵 [PAYMENT] Fee Amount:', feeAmount);
    
    if (!formData.memberType) {
      console.log('❌ [PAYMENT] No member type selected');
      Alert.alert('Error', translations.memberTypeRequired);
      return;
    }

    const amount = parseFloat(feeAmount);
    console.log('🔵 [PAYMENT] Parsed amount:', amount);
    
    if (amount <= 0) {
      console.log('❌ [PAYMENT] Invalid amount:', amount);
      Alert.alert('Error', translations.invalidFeeAmount);
      return;
    }

    console.log('✅ [PAYMENT] Payment validation passed');
    setPaymentLoading(true);
    console.log('🔄 [PAYMENT] Payment loading set to true');

    try {
      const donorName = formData.fullName || 'Member';
      const donorEmail = formData.email || 'member@email.com';
      const donorPhone = formData.phone || '0000000000';

      console.log('🔵 [PAYMENT] Initiating Razorpay payment');
      console.log('🔵 [PAYMENT] Donor details:', { donorName, donorEmail, donorPhone });
      console.log('🔵 [PAYMENT] Amount:', amount);
      console.log('🔵 [PAYMENT] Description:', `Registration Fee - ${formData.memberType}`);

      const paymentResult = await initiateRazorpayPayment({
        amount: amount,
        name: donorName,
        email: donorEmail,
        phone: donorPhone,
        description: `Registration Fee - ${formData.memberType}`,
      });

      console.log('📥 [PAYMENT] Razorpay payment result:', JSON.stringify(paymentResult, null, 2));

      if (paymentResult && paymentResult.code === 'PAYMENT_CANCELLED') {
        console.log('⚠️ [PAYMENT] User cancelled payment');
        setPaymentLoading(false);
        Alert.alert('Payment Cancelled', 'You cancelled the payment process.');
        return;
      }

      const isPaymentSuccessful = 
        paymentResult && 
        paymentResult.paymentId && 
        paymentResult.orderId && 
        paymentResult.signature;

      if (isPaymentSuccessful) {
        console.log('✅ [PAYMENT] Payment successful!');
        console.log('✅ [PAYMENT] Payment ID:', paymentResult.paymentId);
        console.log('✅ [PAYMENT] Order ID:', paymentResult.orderId);
        console.log('✅ [PAYMENT] Signature:', paymentResult.signature);

        if (paymentResult.paymentId && paymentResult.orderId && paymentResult.signature) {
          console.log('🔵 [PAYMENT] Verifying payment with Razorpay...');
          try {
            const verificationResult = await verifyRazorpayPayment({
              paymentId: paymentResult.paymentId,
              orderId: paymentResult.orderId,
              signature: paymentResult.signature,
            });
            console.log('📥 [PAYMENT] Verification result:', JSON.stringify(verificationResult, null, 2));
          } catch (verifyError) {
            console.log('⚠️ [PAYMENT] Verification error (will proceed):', verifyError);
          }
        }

        console.log('✅ [PAYMENT] PAYMENT SUCCESSFUL! Proceeding with registration...');
        
        setShowPaymentModal(false);
        console.log('✅ [PAYMENT] Payment modal closed');
        
        setPaymentLoading(false);
        console.log('✅ [PAYMENT] Payment loading set to false');
        
        await completeRegistrationWithoutAlert();
        console.log('✅ [PAYMENT] Registration completed successfully');
        
      } else {
        console.log('❌ [PAYMENT] Payment initiation FAILED');
        console.log('❌ [PAYMENT] Payment result:', paymentResult);
        console.log('❌ [PAYMENT] Payment error:', paymentResult?.error || 'Unknown error');
        setPaymentLoading(false);
        
        Alert.alert(
          translations.paymentFailed || 'Payment Failed',
          paymentResult?.error || 'Something went wrong. Please try again.'
        );
      }
    } catch (error) {
      console.log('❌ [PAYMENT] EXCEPTION OCCURRED');
      console.log('❌ [PAYMENT] Error object:', error);
      console.log('❌ [PAYMENT] Error message:', error.message);
      console.log('❌ [PAYMENT] Error stack:', error.stack);
      setPaymentLoading(false);
      Alert.alert(
        translations.error || 'Error',
        translations.failedToProcess || 'Failed to process payment. Please try again.'
      );
    }
  };

  const completeRegistrationWithoutAlert = async () => {
    console.log('🔵 [REGISTRATION] Starting completeRegistrationWithoutAlert');
    console.log('🔵 [REGISTRATION] Registration method:', registrationMethod);
    
    if (registrationMethod === 'phone') {
      console.log('🔵 [REGISTRATION] Using phone registration flow');
      await handlePhoneRegisterWithoutAlert();
    } else {
      console.log('🔵 [REGISTRATION] Using email registration flow');
      await handleEmailRegisterWithoutAlert();
    }
    
    console.log('✅ [REGISTRATION] Registration completed without alert');
  };

  const completeRegistration = async () => {
    if (registrationMethod === 'phone') {
      await handlePhoneRegister();
    } else {
      await handleEmailRegister();
    }
  };

  const handlePhoneRegister = async () => {
  console.log('🔵 [PHONE] ===== PHONE REGISTER CALLED =====');
  console.log('🔵 [PHONE] Full name:', formData.fullName);
  console.log('🔵 [PHONE] Phone:', formData.phone);
  console.log('🔵 [PHONE] Password length:', formData.password?.length || 0);
  console.log('🔵 [PHONE] Confirm password length:', formData.confirmPassword?.length || 0);
  console.log('🔵 [PHONE] Passwords match:', formData.password === formData.confirmPassword);
  
  if (!formData.fullName.trim()) {
    console.log('❌ [PHONE] No full name');
    Alert.alert(translations.error, translations.fullNameRequired);
    return;
  }

  if (!formData.phone.trim()) {
    console.log('❌ [PHONE] No phone number');
    Alert.alert(translations.error, translations.phoneRequired);
    return;
  }

  if (!formData.password || formData.password.length < 6) {
    console.log('❌ [PHONE] Password too short or missing');
    Alert.alert(translations.error, translations.passwordMinLength);
    return;
  }

  if (formData.password !== formData.confirmPassword) {
    console.log('❌ [PHONE] Passwords do not match');
    Alert.alert(translations.error, translations.passwordMismatch);
    return;
  }

  console.log('✅ [PHONE] All validations passed!');
  console.log('🔵 [PHONE] Password to store:', formData.password);

  if (!isDonorFlow && !isDonationFlow && role !== 'donor') {
    const fee = parseFloat(feeAmount);
    console.log('🔵 [PHONE] Fee check:', { fee, memberType: formData.memberType });
    if (fee > 0 && formData.memberType) {
      console.log('🔵 [PHONE] Opening payment modal');
      setShowPaymentModal(true);
      return;
    }
  }

  console.log('🔵 [PHONE] Proceeding with phone registration');
  await completePhoneRegistration({
    uid: `phone_${Date.now()}`,
    phoneNumber: formData.phone
  });
};

  const handleRegistrationWithoutPayment = async () => {
    console.log('🔵 [NO_PAYMENT] Starting registration without payment');
    console.log('🔵 [NO_PAYMENT] Reason:', noPaymentReason || 'Not provided');
    
    setLoading(true);
    
    try {
      if (registrationMethod === 'phone') {
        await completePhoneRegistrationWithoutPayment({
          uid: `phone_${Date.now()}`,
          phoneNumber: formData.phone
        });
      } else {
        await handleEmailRegisterWithoutPayment();
      }
      
      setShowNoPaymentOption(false);
      setNoPaymentReason('');
      
      console.log('🔵 [NO_PAYMENT] Navigating to Login silently...');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      console.log('✅ [NO_PAYMENT] Navigation complete');
      
    } catch (error) {
      console.error('❌ [NO_PAYMENT] Registration error:', error);
      Alert.alert('Error', 'Failed to complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const completePhoneRegistrationWithoutPayment = async (user) => {
  console.log('🔵 [NO_PAYMENT] ===== STARTING SILENT PHONE REGISTRATION WITHOUT PAYMENT =====');
  console.log('🔵 [NO_PAYMENT] User UID:', user.uid);
  console.log('🔵 [NO_PAYMENT] Phone number:', user.phoneNumber);
  console.log('🔵 [NO_PAYMENT] Is Donation Flow:', isDonationFlow);
  console.log('🔵 [NO_PAYMENT] Role:', role);
  console.log('🔵 [NO_PAYMENT] Full Name:', formData.fullName);
  console.log('🔵 [NO_PAYMENT] Phone:', formData.phone);
  console.log('🔵 [NO_PAYMENT] Password provided:', !!formData.password);
  console.log('🔵 [NO_PAYMENT] Password length:', formData.password?.length || 0);
  console.log('🔵 [NO_PAYMENT] Confirm password provided:', !!formData.confirmPassword);
  console.log('🔵 [NO_PAYMENT] Passwords match:', formData.password === formData.confirmPassword);
  
  const userId = user.uid;
  const finalRole = isDonationFlow ? 'donor' : role;
  
  console.log('🔵 [NO_PAYMENT] Final role:', finalRole);

  const userData = {
    fullName: formData.fullName.trim(),
    fatherName: formData.fatherName.trim(),
    dob: formData.dob,
    gender: formData.gender,
    education: formData.education,
    caste: formData.caste,
    spouseName: formData.spouseName,
    aadharNumber: formData.aadharNumber,
    phone: formData.phone.trim(),
    email: formData.email.trim().toLowerCase() || '',
    address: formData.address.trim(),
    village: formData.village,
    postOffice: formData.postOffice,
    thana: formData.thana,
    district: formData.district,
    state: formData.state,
    pinCode: formData.pinCode,
    nationality: formData.nationality,
    otherNationality: formData.otherNationality || '',
    profession: formData.profession,
    membershipNumber: formData.membershipNumber,
    membershipDate: formData.membershipDate,
    guruAshram: formData.guruAshram,
    memberType: formData.memberType,
    contributionAmount: formData.contributionAmount,
    role: finalRole,
    status: 'pending',
    profilePhoto: formData.profilePhoto || null,
    aadharFront: formData.aadharFront || null,
    aadharBack: formData.aadharBack || null,
    panCard: formData.panCard || null,
    signature: formData.signature || null,
    registrationFeePaid: false,
    registrationFeeAmount: parseFloat(feeAmount) || 0,
    registrationFeePaidAt: null,
    paymentSkipped: true,
    paymentSkippedReason: noPaymentReason || 'Payment skipped by user',
    paymentSkippedAt: new Date().toISOString(),
    requiresAdminApproval: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    uid: userId,
    phoneNumber: formData.phone.trim(),
    registrationMethod: 'phone',
    referredBy: referrerData ? referrerData.id : null,
    referredByName: referrerData ? referrerData.name : null,
    referralCodeUsed: referralCode || null,
    referralDate: referrerData ? new Date().toISOString() : null,
    // ✅ CRITICAL FIX: Store password for phone login!
    password: formData.password,
    phonePassword: formData.password,
  };

  console.log('🔵 [NO_PAYMENT] ===== USER DATA SUMMARY =====');
  console.log('🔵 [NO_PAYMENT] - Full Name:', userData.fullName);
  console.log('🔵 [NO_PAYMENT] - Phone:', userData.phone);
  console.log('🔵 [NO_PAYMENT] - Email:', userData.email || '(empty)');
  console.log('🔵 [NO_PAYMENT] - Role:', userData.role);
  console.log('🔵 [NO_PAYMENT] - Status:', userData.status);
  console.log('🔵 [NO_PAYMENT] - Registration Method:', userData.registrationMethod);
  console.log('🔵 [NO_PAYMENT] - password field exists:', 'password' in userData);
  console.log('🔵 [NO_PAYMENT] - password value:', userData.password ? '✅ SET (length: ' + userData.password.length + ')' : '❌ MISSING');
  console.log('🔵 [NO_PAYMENT] - phonePassword field exists:', 'phonePassword' in userData);
  console.log('🔵 [NO_PAYMENT] - phonePassword value:', userData.phonePassword ? '✅ SET (length: ' + userData.phonePassword.length + ')' : '❌ MISSING');
  console.log('🔵 [NO_PAYMENT] - referredBy:', userData.referredBy || 'none');
  console.log('🔵 [NO_PAYMENT] - referralCodeUsed:', userData.referralCodeUsed || 'none');
  console.log('🔵 [NO_PAYMENT] - paymentSkippedReason:', userData.paymentSkippedReason);
  console.log('🔵 [NO_PAYMENT] ==============================================');

  console.log('🔵 [NO_PAYMENT] Saving user data to Firestore collection:', finalRole === 'donor' ? 'donors' : 'users');

  try {
    if (finalRole === 'donor') {
      console.log('🔵 [NO_PAYMENT] Saving to donors collection with ID:', userId);
      await setDoc(doc(db, 'donors', userId), {
        ...userData,
        totalDonations: 0,
        donationCount: 0,
        lastDonation: null,
      });
      console.log('✅ [NO_PAYMENT] Donor saved successfully to Firestore');
    } else {
      console.log('🔵 [NO_PAYMENT] Saving to users collection with ID:', userId);
      await setDoc(doc(db, 'users', userId), userData);
      console.log('✅ [NO_PAYMENT] User saved successfully to Firestore');
    }
    console.log('✅ [NO_PAYMENT] User saved with pending status');
    
    // ✅ VERIFY: Immediately check if password was actually saved
    console.log('🔵 [NO_PAYMENT] ===== VERIFYING DATA WAS SAVED =====');
    const verifyCollection = finalRole === 'donor' ? 'donors' : 'users';
    const verifyDoc = await getDoc(doc(db, verifyCollection, userId));
    
    if (verifyDoc.exists()) {
      const savedData = verifyDoc.data();
      console.log('✅ [NO_PAYMENT] Verification: Document exists in', verifyCollection);
      console.log('🔵 [NO_PAYMENT] Verification results:');
      console.log('🔵 [NO_PAYMENT] - password field exists:', 'password' in savedData);
      console.log('🔵 [NO_PAYMENT] - password value:', savedData.password ? '✅ SET (length: ' + savedData.password.length + ')' : '❌ MISSING');
      console.log('🔵 [NO_PAYMENT] - phonePassword field exists:', 'phonePassword' in savedData);
      console.log('🔵 [NO_PAYMENT] - phonePassword value:', savedData.phonePassword ? '✅ SET (length: ' + savedData.phonePassword.length + ')' : '❌ MISSING');
      console.log('🔵 [NO_PAYMENT] - fullName:', savedData.fullName || '❌ MISSING');
      console.log('🔵 [NO_PAYMENT] - phone:', savedData.phone || '❌ MISSING');
      console.log('🔵 [NO_PAYMENT] - role:', savedData.role || '❌ MISSING');
      console.log('🔵 [NO_PAYMENT] - status:', savedData.status || '❌ MISSING');
      
      // Log all keys for debugging
      console.log('🔵 [NO_PAYMENT] All keys in saved document:', Object.keys(savedData).join(', '));
      
      if (!savedData.password || !savedData.phonePassword) {
        console.log('⚠️ [NO_PAYMENT] WARNING: Password fields were NOT saved correctly!');
        console.log('⚠️ [NO_PAYMENT] This will prevent users from logging in.');
      } else {
        console.log('✅ [NO_PAYMENT] Password fields verified successfully!');
      }
    } else {
      console.log('❌ [NO_PAYMENT] Verification FAILED: Document does not exist in', verifyCollection);
    }
    console.log('🔵 [NO_PAYMENT] ===== VERIFICATION COMPLETE =====');
    
  } catch (error) {
    console.log('❌ [NO_PAYMENT] Error saving user data:', error);
    console.log('❌ [NO_PAYMENT] Error code:', error.code);
    console.log('❌ [NO_PAYMENT] Error message:', error.message);
    console.log('❌ [NO_PAYMENT] Error stack:', error.stack);
    throw error;
  }

  // Save phone mapping
  try {
    console.log('🔵 [NO_PAYMENT] ===== SAVING PHONE MAPPING =====');
    console.log('🔵 [NO_PAYMENT] Phone number:', userData.phone);
    console.log('🔵 [NO_PAYMENT] User ID:', userId);
    console.log('🔵 [NO_PAYMENT] Role:', finalRole);
    console.log('🔵 [NO_PAYMENT] Status: pending');
    
    await setDoc(doc(db, 'phoneUsers', userData.phone), {
      userId: userId,
      phone: userData.phone,
      role: finalRole,
      status: 'pending',
      referredBy: referrerData ? referrerData.id : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log('✅ [NO_PAYMENT] Phone mapping saved successfully');
    
    // Verify phone mapping
    const verifyPhoneMap = await getDoc(doc(db, 'phoneUsers', userData.phone));
    if (verifyPhoneMap.exists()) {
      console.log('✅ [NO_PAYMENT] Phone mapping verified: exists');
      const mapData = verifyPhoneMap.data();
      console.log('🔵 [NO_PAYMENT] Phone mapping data:', {
        userId: mapData.userId,
        phone: mapData.phone,
        role: mapData.role,
        status: mapData.status
      });
    } else {
      console.log('❌ [NO_PAYMENT] Phone mapping verification FAILED');
    }
    console.log('🔵 [NO_PAYMENT] ===== PHONE MAPPING COMPLETE =====');
    
  } catch (error) {
    console.error('❌ [NO_PAYMENT] Error saving phone mapping:', error);
    console.error('❌ [NO_PAYMENT] Error stack:', error.stack);
  }

  // Sign out user
  try {
    const auth = getAuthInstance();
    console.log('🔵 [NO_PAYMENT] Signing out user...');
    await auth.signOut();
    console.log('✅ [NO_PAYMENT] User signed out successfully');
  } catch (error) {
    console.log('❌ [NO_PAYMENT] Error signing out:', error);
    console.log('❌ [NO_PAYMENT] Error stack:', error.stack);
  }
  
  console.log('✅ [NO_PAYMENT] ===== SILENT PHONE REGISTRATION WITHOUT PAYMENT COMPLETE =====');
  console.log('✅ [NO_PAYMENT] Summary:');
  console.log('✅ [NO_PAYMENT] - User ID:', userId);
  console.log('✅ [NO_PAYMENT] - Phone:', userData.phone);
  console.log('✅ [NO_PAYMENT] - Role:', finalRole);
  console.log('✅ [NO_PAYMENT] - Status: pending');
  console.log('✅ [NO_PAYMENT] - Password stored:', !!userData.password);
  console.log('✅ [NO_PAYMENT] - Phone mapping saved: yes');
  console.log('✅ [NO_PAYMENT] ===========================================================');
};

  const handleEmailRegisterWithoutPayment = async () => {
    console.log('🔵 [NO_PAYMENT] Starting email registration without payment');
    
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      const auth = getAuthInstance();
      
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email.trim(), 
        formData.password
      );
      
      const userId = userCredential.user.uid;
      const finalRole = isDonationFlow ? 'donor' : role;

      const userData = {
        fullName: formData.fullName.trim(),
        fatherName: formData.fatherName.trim(),
        dob: formData.dob,
        gender: formData.gender,
        education: formData.education,
        caste: formData.caste,
        spouseName: formData.spouseName,
        aadharNumber: formData.aadharNumber,
        phone: formData.phone.trim() || '',
        email: formData.email.trim().toLowerCase(),
        address: formData.address.trim(),
        village: formData.village,
        postOffice: formData.postOffice,
        thana: formData.thana,
        district: formData.district,
        state: formData.state,
        pinCode: formData.pinCode,
        nationality: formData.nationality,
        profession: formData.profession,
        membershipNumber: formData.membershipNumber,
        membershipDate: formData.membershipDate,
        guruAshram: formData.guruAshram,
        memberType: formData.memberType,
        contributionAmount: formData.contributionAmount,
        role: finalRole,
        status: 'pending',
        profilePhoto: formData.profilePhoto || null,
        aadharFront: formData.aadharFront || null,
        aadharBack: formData.aadharBack || null,
        panCard: formData.panCard || null,
        signature: formData.signature || null,
        registrationFeePaid: false,
        registrationFeeAmount: parseFloat(feeAmount) || 0,
        registrationFeePaidAt: null,
        paymentSkipped: true,
        paymentSkippedReason: noPaymentReason || 'Payment skipped by user',
        paymentSkippedAt: new Date().toISOString(),
        requiresAdminApproval: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        referredBy: referrerData ? referrerData.id : null,
        referredByName: referrerData ? referrerData.name : null,
        referralCodeUsed: referralCode || null,
        referralDate: referrerData ? new Date().toISOString() : null,
      };

      if (finalRole === 'donor') {
        await setDoc(doc(db, 'donors', userId), {
          ...userData,
          totalDonations: 0,
          donationCount: 0,
          lastDonation: null,
        });
      } else {
        await setDoc(doc(db, 'users', userId), userData);
      }

      console.log('✅ [NO_PAYMENT] User saved with pending status');
      await auth.signOut();
      
    } catch (error) {
      console.log('❌ [NO_PAYMENT] Registration error:', error);
      throw error;
    }
  };

  const completePhoneRegistrationSilent = async (user) => {
  console.log('🔵 [SILENT] ===== STARTING SILENT PHONE REGISTRATION =====');
  console.log('🔵 [SILENT] User UID:', user.uid);
  console.log('🔵 [SILENT] Phone number:', user.phoneNumber);
  console.log('🔵 [SILENT] Is Donor Flow:', isDonorFlow);
  console.log('🔵 [SILENT] Is Donation Flow:', isDonationFlow);
  console.log('🔵 [SILENT] Selected Role:', role);
  console.log('🔵 [SILENT] Full Name:', formData.fullName);
  console.log('🔵 [SILENT] Password provided:', !!formData.password);
  console.log('🔵 [SILENT] Password length:', formData.password?.length || 0);
  console.log('🔵 [SILENT] Confirm password provided:', !!formData.confirmPassword);
  console.log('🔵 [SILENT] Passwords match:', formData.password === formData.confirmPassword);
  
  const userId = user.uid;
  const finalRole = isDonorFlow ? 'donor' : (isDonationFlow ? 'donor' : role);
  
  console.log('🔵 [SILENT] Final role determined:', finalRole);

  let userData;
  
  if (isDonorFlow) {
    console.log('🔵 [SILENT] Creating DONOR user data structure');
    userData = {
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim().toLowerCase() || '',
      address: formData.address.trim() || '',
      role: 'donor',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      uid: userId,
      phoneNumber: formData.phone.trim(),
      registrationMethod: registrationMethod,
      totalDonations: 0,
      donationCount: 0,
      lastDonation: null,
      profilePhoto: null,
      referredBy: referrerData ? referrerData.id : null,
      referredByName: referrerData ? referrerData.name : null,
      referralCodeUsed: referralCode || null,
      referralDate: referrerData ? new Date().toISOString() : null,
      // ✅ STORE PASSWORD FOR DONOR
      password: formData.password,
      phonePassword: formData.password,
    };
    console.log('✅ [SILENT] Donor data created with password fields');
  } else {
    console.log('🔵 [SILENT] Creating USER data structure with role:', finalRole);
    userData = {
      fullName: formData.fullName.trim(),
      fatherName: formData.fatherName.trim(),
      dob: formData.dob,
      gender: formData.gender,
      education: formData.education,
      caste: formData.caste,
      spouseName: formData.spouseName,
      aadharNumber: formData.aadharNumber,
      phone: formData.phone.trim(),
      email: formData.email.trim().toLowerCase() || '',
      address: formData.address.trim(),
      village: formData.village,
      postOffice: formData.postOffice,
      thana: formData.thana,
      district: formData.district,
      state: formData.state,
      pinCode: formData.pinCode,
      nationality: formData.nationality,
      otherNationality: formData.otherNationality || '',
      profession: formData.profession,
      membershipNumber: formData.membershipNumber,
      membershipDate: formData.membershipDate,
      guruAshram: formData.guruAshram,
      memberType: formData.memberType,
      contributionAmount: formData.contributionAmount,
      role: finalRole,
      status: 'active',
      profilePhoto: formData.profilePhoto || null,
      aadharFront: formData.aadharFront || null,
      aadharBack: formData.aadharBack || null,
      panCard: formData.panCard || null,
      signature: formData.signature || null,
      registrationFeePaid: parseFloat(feeAmount) > 0 ? true : false,
      registrationFeeAmount: parseFloat(feeAmount) || 0,
      registrationFeePaidAt: parseFloat(feeAmount) > 0 ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      uid: userId,
      phoneNumber: formData.phone.trim(),
      registrationMethod: 'phone',
      referredBy: referrerData ? referrerData.id : null,
      referredByName: referrerData ? referrerData.name : null,
      referralCodeUsed: referralCode || null,
      referralDate: referrerData ? new Date().toISOString() : null,
      // ✅ STORE PASSWORD - THIS WAS PREVIOUSLY MISSING!
      password: formData.password,
      phonePassword: formData.password,
    };
    console.log('✅ [SILENT] User data created with password fields');
  }

  console.log('🔵 [SILENT] ===== USER DATA SUMMARY =====');
  console.log('🔵 [SILENT] - Full Name:', userData.fullName);
  console.log('🔵 [SILENT] - Phone:', userData.phone);
  console.log('🔵 [SILENT] - Email:', userData.email || '(empty)');
  console.log('🔵 [SILENT] - Role:', userData.role);
  console.log('🔵 [SILENT] - Status:', userData.status);
  console.log('🔵 [SILENT] - Registration Method:', userData.registrationMethod);
  console.log('🔵 [SILENT] - password field exists:', 'password' in userData);
  console.log('🔵 [SILENT] - password value:', userData.password ? '✅ SET (length: ' + userData.password.length + ')' : '❌ MISSING');
  console.log('🔵 [SILENT] - phonePassword field exists:', 'phonePassword' in userData);
  console.log('🔵 [SILENT] - phonePassword value:', userData.phonePassword ? '✅ SET (length: ' + userData.phonePassword.length + ')' : '❌ MISSING');
  console.log('🔵 [SILENT] - referralCodeUsed:', userData.referralCodeUsed || 'none');
  console.log('🔵 [SILENT] - paymentSkipped:', userData.paymentSkipped || false);
  console.log('🔵 [SILENT] ===================================');

  console.log('🔵 [SILENT] Saving user data to Firestore collection:', finalRole === 'donor' ? 'donors' : 'users');

  try {
    if (finalRole === 'donor') {
      console.log('🔵 [SILENT] Saving to donors collection with ID:', userId);
      await setDoc(doc(db, 'donors', userId), userData);
      console.log('✅ [SILENT] Donor saved successfully to Firestore');
    } else {
      console.log('🔵 [SILENT] Saving to users collection with ID:', userId);
      await setDoc(doc(db, 'users', userId), userData);
      console.log('✅ [SILENT] User saved successfully to Firestore');
    }
    
    // ✅ VERIFY: Immediately check if password was actually saved
    console.log('🔵 [SILENT] ===== VERIFYING DATA WAS SAVED =====');
    const verifyCollection = finalRole === 'donor' ? 'donors' : 'users';
    const verifyDoc = await getDoc(doc(db, verifyCollection, userId));
    
    if (verifyDoc.exists()) {
      const savedData = verifyDoc.data();
      console.log('✅ [SILENT] Verification: Document exists in', verifyCollection);
      console.log('🔵 [SILENT] Verification results:');
      console.log('🔵 [SILENT] - password field exists:', 'password' in savedData);
      console.log('🔵 [SILENT] - password value:', savedData.password ? '✅ SET (length: ' + savedData.password.length + ')' : '❌ MISSING');
      console.log('🔵 [SILENT] - phonePassword field exists:', 'phonePassword' in savedData);
      console.log('🔵 [SILENT] - phonePassword value:', savedData.phonePassword ? '✅ SET (length: ' + savedData.phonePassword.length + ')' : '❌ MISSING');
      console.log('🔵 [SILENT] - fullName:', savedData.fullName || '❌ MISSING');
      console.log('🔵 [SILENT] - phone:', savedData.phone || '❌ MISSING');
      console.log('🔵 [SILENT] - role:', savedData.role || '❌ MISSING');
      console.log('🔵 [SILENT] - status:', savedData.status || '❌ MISSING');
      
      // Log all keys for debugging
      console.log('🔵 [SILENT] All keys in saved document:', Object.keys(savedData).join(', '));
      
      if (!savedData.password || !savedData.phonePassword) {
        console.log('⚠️ [SILENT] WARNING: Password fields were NOT saved correctly!');
        console.log('⚠️ [SILENT] This will prevent users from logging in.');
      } else {
        console.log('✅ [SILENT] Password fields verified successfully!');
      }
    } else {
      console.log('❌ [SILENT] Verification FAILED: Document does not exist in', verifyCollection);
    }
    console.log('🔵 [SILENT] ===== VERIFICATION COMPLETE =====');
    
  } catch (error) {
    console.log('❌ [SILENT] ERROR saving user data:', error);
    console.log('❌ [SILENT] Error code:', error.code);
    console.log('❌ [SILENT] Error message:', error.message);
    console.log('❌ [SILENT] Error stack:', error.stack);
    throw error;
  }

  // Update referrer if applicable
  if (!isDonorFlow && referrerData && referrerData.id) {
    console.log('🔵 [SILENT] ===== UPDATING REFERRER =====');
    console.log('🔵 [SILENT] Referrer ID:', referrerData.id);
    console.log('🔵 [SILENT] Referrer Name:', referrerData.name);
    console.log('🔵 [SILENT] Referrer Level:', referrerData.level);
    
    try {
      const referrerRef = doc(db, 'users', referrerData.id);
      const referrerDoc = await getDoc(referrerRef);
      
      if (referrerDoc.exists()) {
        const referrer = referrerDoc.data();
        const currentReferrals = referrer.directReferrals || [];
        console.log('🔵 [SILENT] Current referral count:', currentReferrals.length);
        console.log('🔵 [SILENT] Adding new referral:', userId);
        
        await updateDoc(referrerRef, {
          directReferrals: [...currentReferrals, userId],
          updatedAt: new Date().toISOString()
        });
        console.log('✅ [SILENT] Referrer updated successfully');
        console.log('✅ [SILENT] New referral count:', currentReferrals.length + 1);
      } else {
        console.log('⚠️ [SILENT] Referrer document not found for ID:', referrerData.id);
      }
    } catch (error) {
      console.log('❌ [SILENT] Error updating referrer:', error);
      console.log('❌ [SILENT] Error stack:', error.stack);
    }
    console.log('🔵 [SILENT] ===== REFERRER UPDATE COMPLETE =====');
  } else {
    console.log('🔵 [SILENT] No referrer to update (donor flow or no referrer)');
  }

  // Save phone mapping
  try {
    console.log('🔵 [SILENT] ===== SAVING PHONE MAPPING =====');
    console.log('🔵 [SILENT] Phone number:', userData.phone);
    console.log('🔵 [SILENT] User ID:', userId);
    console.log('🔵 [SILENT] Role:', finalRole);
    
    await setDoc(doc(db, 'phoneUsers', userData.phone), {
      userId: userId,
      phone: userData.phone,
      role: finalRole,
      referredBy: referrerData ? referrerData.id : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log('✅ [SILENT] Phone mapping saved successfully in phoneUsers collection');
    
    // Verify phone mapping
    const verifyPhoneMap = await getDoc(doc(db, 'phoneUsers', userData.phone));
    if (verifyPhoneMap.exists()) {
      console.log('✅ [SILENT] Phone mapping verified: exists');
      const mapData = verifyPhoneMap.data();
      console.log('🔵 [SILENT] Phone mapping data:', {
        userId: mapData.userId,
        phone: mapData.phone,
        role: mapData.role
      });
    } else {
      console.log('❌ [SILENT] Phone mapping verification FAILED');
    }
    console.log('🔵 [SILENT] ===== PHONE MAPPING COMPLETE =====');
    
  } catch (error) {
    console.log('❌ [SILENT] Error saving phone mapping:', error);
    console.log('❌ [SILENT] Error stack:', error.stack);
  }

  // Create wallet for working member
  if (!isDonorFlow && finalRole === 'working') {
    console.log('🔵 [SILENT] ===== CREATING WALLET =====');
    console.log('🔵 [SILENT] User ID:', userId);
    console.log('🔵 [SILENT] Role: working');
    
    try {
      await setDoc(doc(db, 'wallets', userId), {
        balance: 0,
        totalEarned: 0,
        pendingCommission: 0,
        totalWithdrawn: 0,
        pendingWithdrawals: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log('✅ [SILENT] Wallet created successfully');
      
      // Verify wallet
      const verifyWallet = await getDoc(doc(db, 'wallets', userId));
      if (verifyWallet.exists()) {
        console.log('✅ [SILENT] Wallet verified: exists');
      } else {
        console.log('❌ [SILENT] Wallet verification FAILED');
      }
    } catch (error) {
      console.log('❌ [SILENT] Error creating wallet:', error);
      console.log('❌ [SILENT] Error stack:', error.stack);
    }
    console.log('🔵 [SILENT] ===== WALLET CREATION COMPLETE =====');
  }

  // Sign out user
  try {
    const auth = getAuthInstance();
    console.log('🔵 [SILENT] Signing out user...');
    await auth.signOut();
    console.log('✅ [SILENT] User signed out successfully');
  } catch (error) {
    console.log('❌ [SILENT] Error signing out:', error);
    console.log('❌ [SILENT] Error stack:', error.stack);
  }

  // Navigate to appropriate screen
  const navigateTo = (isDonorFlow || finalRole === 'donor') ? 'DonationTabs' : 'Login';
  console.log('🔵 [SILENT] ===== NAVIGATION =====');
  console.log('🔵 [SILENT] Target screen:', navigateTo);
  console.log('🔵 [SILENT] Is donor flow:', isDonorFlow);
  console.log('🔵 [SILENT] Final role:', finalRole);
  
  console.log('✅ [SILENT] Navigation starting...');
  if (isDonorFlow || finalRole === 'donor') {
    console.log('✅ [SILENT] Resetting navigation to DonationTabs');
    navigation.reset({
      index: 0,
      routes: [{ name: 'DonationTabs' }],
    });
  } else {
    console.log('✅ [SILENT] Navigating to:', navigateTo);
    navigation.navigate(navigateTo);
  }
  
  console.log('✅ [SILENT] ===== SILENT PHONE REGISTRATION COMPLETE =====');
  console.log('✅ [SILENT] Summary:');
  console.log('✅ [SILENT] - User ID:', userId);
  console.log('✅ [SILENT] - Phone:', userData.phone);
  console.log('✅ [SILENT] - Role:', finalRole);
  console.log('✅ [SILENT] - Password stored:', !!userData.password);
  console.log('✅ [SILENT] - Phone mapping saved: yes');
  console.log('✅ [SILENT] - Navigation to:', navigateTo);
  console.log('✅ [SILENT] ==============================================');
};

const handlePhoneRegisterWithoutAlert = async () => {
  console.log('🔵 [PHONE_SILENT] ===== STARTING PHONE REGISTRATION WITHOUT ALERT =====');
  console.log('🔵 [PHONE_SILENT] Full name:', formData.fullName);
  console.log('🔵 [PHONE_SILENT] Phone:', formData.phone);
  console.log('🔵 [PHONE_SILENT] Password length:', formData.password?.length || 0);
  console.log('🔵 [PHONE_SILENT] Confirm password length:', formData.confirmPassword?.length || 0);
  console.log('🔵 [PHONE_SILENT] Password provided:', !!formData.password);
  console.log('🔵 [PHONE_SILENT] Confirm password provided:', !!formData.confirmPassword);
  console.log('🔵 [PHONE_SILENT] Passwords match:', formData.password === formData.confirmPassword);
  console.log('🔵 [PHONE_SILENT] Is Donor Flow:', isDonorFlow);
  console.log('🔵 [PHONE_SILENT] Is Donation Flow:', isDonationFlow);
  console.log('🔵 [PHONE_SILENT] Selected Role:', role);
  
  if (!formData.fullName.trim()) {
    console.log('❌ [PHONE_SILENT] Validation failed: No full name');
    Alert.alert('Error', 'Please enter your full name');
    return;
  }

  if (!formData.phone.trim()) {
    console.log('❌ [PHONE_SILENT] Validation failed: No phone number');
    Alert.alert('Error', 'Please enter your phone number');
    return;
  }

  if (!formData.password || formData.password.length < 6) {
    console.log('❌ [PHONE_SILENT] Validation failed: Password too short or missing');
    console.log('🔵 [PHONE_SILENT] Password length:', formData.password?.length || 0);
    Alert.alert('Error', 'Password must be at least 6 characters');
    return;
  }

  if (formData.password !== formData.confirmPassword) {
    console.log('❌ [PHONE_SILENT] Validation failed: Passwords do not match');
    console.log('🔵 [PHONE_SILENT] Password:', formData.password);
    console.log('🔵 [PHONE_SILENT] Confirm Password:', formData.confirmPassword);
    Alert.alert('Error', 'Passwords do not match');
    return;
  }

  console.log('✅ [PHONE_SILENT] All validations passed!');
  console.log('🔵 [PHONE_SILENT] Password to store (length):', formData.password.length);
  console.log('🔵 [PHONE_SILENT] Creating user with UID: phone_' + Date.now());
  console.log('🔵 [PHONE_SILENT] Phone number:', formData.phone);
  
  try {
    await completePhoneRegistrationSilent({
      uid: `phone_${Date.now()}`,
      phoneNumber: formData.phone
    });
    console.log('✅ [PHONE_SILENT] Phone registration completed successfully!');
  } catch (error) {
    console.log('❌ [PHONE_SILENT] Registration failed with error:', error);
    console.log('❌ [PHONE_SILENT] Error code:', error.code);
    console.log('❌ [PHONE_SILENT] Error message:', error.message);
    console.log('❌ [PHONE_SILENT] Error stack:', error.stack);
    Alert.alert('Registration Failed', 'Please try again. Error: ' + error.message);
  }
  
  console.log('✅ [PHONE_SILENT] ===== PHONE REGISTRATION WITHOUT ALERT COMPLETE =====');
};

  const handleEmailRegisterWithoutAlert = async () => {
    console.log('🔵 [EMAIL_SILENT] Starting email registration without alert');
    console.log('🔵 [EMAIL_SILENT] Full name:', formData.fullName);
    console.log('🔵 [EMAIL_SILENT] Email:', formData.email);
    console.log('🔵 [EMAIL_SILENT] Password length:', formData.password?.length);
    
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password) {
      console.log('❌ [EMAIL_SILENT] Missing required fields, going back');
      navigation.goBack();
      return;
    }

    console.log('✅ [EMAIL_SILENT] Validation passed, proceeding with Firebase registration');
    
    try {
      const auth = getAuthInstance();
      
      console.log('🔵 [EMAIL_SILENT] Creating user with email/password...');
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email.trim(), 
        formData.password
      );
      
      const userId = userCredential.user.uid;
      const finalRole = isDonationFlow ? 'donor' : role;
      
      console.log('✅ [EMAIL_SILENT] User created with UID:', userId);
      console.log('🔵 [EMAIL_SILENT] Final role:', finalRole);

      const userData = {
        fullName: formData.fullName.trim(),
        fatherName: formData.fatherName.trim(),
        dob: formData.dob,
        gender: formData.gender,
        education: formData.education,
        caste: formData.caste,
        spouseName: formData.spouseName,
        aadharNumber: formData.aadharNumber,
        phone: formData.phone.trim() || '',
        email: formData.email.trim().toLowerCase(),
        address: formData.address.trim(),
        village: formData.village,
        postOffice: formData.postOffice,
        thana: formData.thana,
        district: formData.district,
        state: formData.state,
        pinCode: formData.pinCode,
        nationality: formData.nationality,
        profession: formData.profession,
        membershipNumber: formData.membershipNumber,
        membershipDate: formData.membershipDate,
        guruAshram: formData.guruAshram,
        memberType: formData.memberType,
        contributionAmount: formData.contributionAmount,
        role: finalRole,
        status: finalRole === 'donor' ? 'active' : (finalRole === 'working' ? 'active' : 'pending'),
        profilePhoto: formData.profilePhoto || null,
        aadharFront: formData.aadharFront || null,
        aadharBack: formData.aadharBack || null,
        panCard: formData.panCard || null,
        signature: formData.signature || null,
        registrationFeePaid: parseFloat(feeAmount) > 0 ? true : false,
        registrationFeeAmount: parseFloat(feeAmount) || 0,
        registrationFeePaidAt: parseFloat(feeAmount) > 0 ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        referredBy: referrerData ? referrerData.id : null,
        referredByName: referrerData ? referrerData.name : null,
        referralCodeUsed: referralCode || null,
        referralDate: referrerData ? new Date().toISOString() : null,
      };

      console.log('🔵 [EMAIL_SILENT] Saving user data to Firestore...');

      if (finalRole === 'donor') {
        console.log('🔵 [EMAIL_SILENT] Saving as donor');
        await setDoc(doc(db, 'donors', userId), {
          ...userData,
          totalDonations: 0,
          donationCount: 0,
          lastDonation: null,
        });
        console.log('✅ [EMAIL_SILENT] Donor saved');
      } else {
        console.log('🔵 [EMAIL_SILENT] Saving as user');
        await setDoc(doc(db, 'users', userId), userData);
        console.log('✅ [EMAIL_SILENT] User saved');
      }

      if (finalRole === 'working') {
        console.log('🔵 [EMAIL_SILENT] Creating wallet for working member');
        await setDoc(doc(db, 'wallets', userId), {
          balance: 0,
          totalEarned: 0,
          totalWithdrawn: 0,
          pendingWithdrawals: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        console.log('✅ [EMAIL_SILENT] Wallet created');
      }

      if (referrerData && referrerData.id) {
        console.log('🔵 [EMAIL_SILENT] Updating referrer:', referrerData.id);
        try {
          const referrerRef = doc(db, 'users', referrerData.id);
          const referrerDoc = await getDoc(referrerRef);
          
          if (referrerDoc.exists()) {
            const referrer = referrerDoc.data();
            const currentReferrals = referrer.directReferrals || [];
            
            await updateDoc(referrerRef, {
              directReferrals: [...currentReferrals, userId],
              updatedAt: new Date().toISOString()
            });
            console.log('✅ [EMAIL_SILENT] Referrer updated');
          }
        } catch (error) {
          console.log('❌ [EMAIL_SILENT] Error updating referrer:', error);
        }
      }

      console.log('🔵 [EMAIL_SILENT] Signing out...');
      await auth.signOut();
      console.log('✅ [EMAIL_SILENT] Signed out');

      const navigateTo = finalRole === 'donor' ? 'DonationTabs' : 'Login';
      console.log('🔵 [EMAIL_SILENT] Navigating to:', navigateTo);
      
      if (finalRole === 'donor') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'DonationTabs' }],
        });
      } else {
        navigation.navigate(navigateTo);
      }
      console.log('✅ [EMAIL_SILENT] Navigation complete');
      
    } catch (error) {
      console.log('❌ [EMAIL_SILENT] Registration error:', error);
      console.log('❌ [EMAIL_SILENT] Error code:', error.code);
      console.log('❌ [EMAIL_SILENT] Error message:', error.message);
      navigation.goBack();
    }
  };

  const completePhoneRegistration = async (user) => {
  console.log('🔵 [PHONE] ===== STARTING PHONE REGISTRATION =====');
  console.log('🔵 [PHONE] User UID:', user.uid);
  console.log('🔵 [PHONE] Phone number:', user.phoneNumber);
  console.log('🔵 [PHONE] Is Donor Flow:', isDonorFlow);
  console.log('🔵 [PHONE] Is Donation Flow:', isDonationFlow);
  console.log('🔵 [PHONE] Selected Role:', role);
  console.log('🔵 [PHONE] Full Name:', formData.fullName);
  console.log('🔵 [PHONE] Password provided:', !!formData.password);
  console.log('🔵 [PHONE] Password length:', formData.password?.length || 0);
  console.log('🔵 [PHONE] Confirm password provided:', !!formData.confirmPassword);
  console.log('🔵 [PHONE] Passwords match:', formData.password === formData.confirmPassword);
  
  const userId = user.uid;
  const finalRole = isDonorFlow ? 'donor' : (isDonationFlow ? 'donor' : role);
  
  console.log('🔵 [PHONE] Final role determined:', finalRole);

  let userData;
  
  if (isDonorFlow) {
    console.log('🔵 [PHONE] Creating DONOR user data structure');
    userData = {
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim().toLowerCase() || '',
      address: formData.address.trim() || '',
      role: 'donor',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      uid: userId,
      phoneNumber: formData.phone.trim(),
      registrationMethod: registrationMethod,
      totalDonations: 0,
      donationCount: 0,
      lastDonation: null,
      profilePhoto: null,
      referredBy: referrerData ? referrerData.id : null,
      referredByName: referrerData ? referrerData.name : null,
      referralCodeUsed: referralCode || null,
      referralDate: referrerData ? new Date().toISOString() : null,
      // ✅ STORE PASSWORD FOR DONOR
      password: formData.password,
      phonePassword: formData.password,
    };
    console.log('✅ [PHONE] Donor data created with password field');
  } else {
    console.log('🔵 [PHONE] Creating USER data structure with role:', finalRole);
    userData = {
      fullName: formData.fullName.trim(),
      fatherName: formData.fatherName.trim(),
      dob: formData.dob,
      gender: formData.gender,
      education: formData.education,
      caste: formData.caste,
      spouseName: formData.spouseName,
      aadharNumber: formData.aadharNumber,
      phone: formData.phone.trim(),
      email: formData.email.trim().toLowerCase() || '',
      address: formData.address.trim(),
      village: formData.village,
      postOffice: formData.postOffice,
      thana: formData.thana,
      district: formData.district,
      state: formData.state,
      pinCode: formData.pinCode,
      nationality: formData.nationality,
      otherNationality: formData.otherNationality || '',
      profession: formData.profession,
      membershipNumber: formData.membershipNumber,
      membershipDate: formData.membershipDate,
      guruAshram: formData.guruAshram,
      memberType: formData.memberType,
      contributionAmount: formData.contributionAmount,
      role: finalRole,
      status: 'active',
      profilePhoto: formData.profilePhoto || null,
      aadharFront: formData.aadharFront || null,
      aadharBack: formData.aadharBack || null,
      panCard: formData.panCard || null,
      signature: formData.signature || null,
      registrationFeePaid: parseFloat(feeAmount) > 0 ? true : false,
      registrationFeeAmount: parseFloat(feeAmount) || 0,
      registrationFeePaidAt: parseFloat(feeAmount) > 0 ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      uid: userId,
      phoneNumber: formData.phone.trim(),
      registrationMethod: 'phone',
      referredBy: referrerData ? referrerData.id : null,
      referredByName: referrerData ? referrerData.name : null,
      referralCodeUsed: referralCode || null,
      referralDate: referrerData ? new Date().toISOString() : null,
      // ✅ STORE PASSWORD - THIS WAS PREVIOUSLY MISSING!
      password: formData.password,
      phonePassword: formData.password,
    };
    console.log('✅ [PHONE] User data created with password fields');
  }

  console.log('🔵 [PHONE] ===== USER DATA SUMMARY =====');
  console.log('🔵 [PHONE] - Full Name:', userData.fullName);
  console.log('🔵 [PHONE] - Phone:', userData.phone);
  console.log('🔵 [PHONE] - Email:', userData.email || '(empty)');
  console.log('🔵 [PHONE] - Role:', userData.role);
  console.log('🔵 [PHONE] - Status:', userData.status);
  console.log('🔵 [PHONE] - Registration Method:', userData.registrationMethod);
  console.log('🔵 [PHONE] - password field exists:', 'password' in userData);
  console.log('🔵 [PHONE] - password value:', userData.password ? '✅ SET (length: ' + userData.password.length + ')' : '❌ MISSING');
  console.log('🔵 [PHONE] - phonePassword field exists:', 'phonePassword' in userData);
  console.log('🔵 [PHONE] - phonePassword value:', userData.phonePassword ? '✅ SET (length: ' + userData.phonePassword.length + ')' : '❌ MISSING');
  console.log('🔵 [PHONE] - referralCodeUsed:', userData.referralCodeUsed || 'none');
  console.log('🔵 [PHONE] ===================================');

  console.log('🔵 [PHONE] Saving user data to Firestore collection:', finalRole === 'donor' ? 'donors' : 'users');

  try {
    if (finalRole === 'donor') {
      console.log('🔵 [PHONE] Saving to donors collection with ID:', userId);
      await setDoc(doc(db, 'donors', userId), userData);
      console.log('✅ [PHONE] Donor saved successfully to Firestore');
    } else {
      console.log('🔵 [PHONE] Saving to users collection with ID:', userId);
      await setDoc(doc(db, 'users', userId), userData);
      console.log('✅ [PHONE] User saved successfully to Firestore');
    }
    
    // ✅ VERIFY: Immediately check if password was actually saved
    console.log('🔵 [PHONE] ===== VERIFYING DATA WAS SAVED =====');
    const verifyCollection = finalRole === 'donor' ? 'donors' : 'users';
    const verifyDoc = await getDoc(doc(db, verifyCollection, userId));
    
    if (verifyDoc.exists()) {
      const savedData = verifyDoc.data();
      console.log('✅ [PHONE] Verification: Document exists in', verifyCollection);
      console.log('🔵 [PHONE] Verification results:');
      console.log('🔵 [PHONE] - password field exists:', 'password' in savedData);
      console.log('🔵 [PHONE] - password value:', savedData.password ? '✅ SET (length: ' + savedData.password.length + ')' : '❌ MISSING');
      console.log('🔵 [PHONE] - phonePassword field exists:', 'phonePassword' in savedData);
      console.log('🔵 [PHONE] - phonePassword value:', savedData.phonePassword ? '✅ SET (length: ' + savedData.phonePassword.length + ')' : '❌ MISSING');
      console.log('🔵 [PHONE] - fullName:', savedData.fullName || '❌ MISSING');
      console.log('🔵 [PHONE] - phone:', savedData.phone || '❌ MISSING');
      console.log('🔵 [PHONE] - role:', savedData.role || '❌ MISSING');
      console.log('🔵 [PHONE] - status:', savedData.status || '❌ MISSING');
      
      // Log all keys for debugging
      console.log('🔵 [PHONE] All keys in saved document:', Object.keys(savedData).join(', '));
      
      if (!savedData.password || !savedData.phonePassword) {
        console.log('⚠️ [PHONE] WARNING: Password fields were NOT saved correctly!');
        console.log('⚠️ [PHONE] This will prevent users from logging in.');
      } else {
        console.log('✅ [PHONE] Password fields verified successfully!');
      }
    } else {
      console.log('❌ [PHONE] Verification FAILED: Document does not exist in', verifyCollection);
    }
    console.log('🔵 [PHONE] ===== VERIFICATION COMPLETE =====');
    
  } catch (error) {
    console.log('❌ [PHONE] ERROR saving user data:', error);
    console.log('❌ [PHONE] Error code:', error.code);
    console.log('❌ [PHONE] Error message:', error.message);
    console.log('❌ [PHONE] Error stack:', error.stack);
    throw error;
  }

  // Update referrer if applicable
  if (!isDonorFlow && referrerData && referrerData.id) {
    console.log('🔵 [PHONE] ===== UPDATING REFERRER =====');
    console.log('🔵 [PHONE] Referrer ID:', referrerData.id);
    console.log('🔵 [PHONE] Referrer Name:', referrerData.name);
    console.log('🔵 [PHONE] Referrer Level:', referrerData.level);
    
    try {
      const referrerRef = doc(db, 'users', referrerData.id);
      const referrerDoc = await getDoc(referrerRef);
      
      if (referrerDoc.exists()) {
        const referrer = referrerDoc.data();
        const currentReferrals = referrer.directReferrals || [];
        console.log('🔵 [PHONE] Current referral count:', currentReferrals.length);
        console.log('🔵 [PHONE] Adding new referral:', userId);
        
        await updateDoc(referrerRef, {
          directReferrals: [...currentReferrals, userId],
          updatedAt: new Date().toISOString()
        });
        console.log('✅ [PHONE] Referrer updated successfully');
        console.log('✅ [PHONE] New referral count:', currentReferrals.length + 1);
      } else {
        console.log('⚠️ [PHONE] Referrer document not found for ID:', referrerData.id);
      }
    } catch (error) {
      console.log('❌ [PHONE] Error updating referrer:', error);
      console.log('❌ [PHONE] Error stack:', error.stack);
    }
    console.log('🔵 [PHONE] ===== REFERRER UPDATE COMPLETE =====');
  } else {
    console.log('🔵 [PHONE] No referrer to update (donor flow or no referrer)');
  }

  // Save phone mapping
  try {
    console.log('🔵 [PHONE] ===== SAVING PHONE MAPPING =====');
    console.log('🔵 [PHONE] Phone number:', userData.phone);
    console.log('🔵 [PHONE] User ID:', userId);
    console.log('🔵 [PHONE] Role:', finalRole);
    
    await setDoc(doc(db, 'phoneUsers', userData.phone), {
      userId: userId,
      phone: userData.phone,
      role: finalRole,
      referredBy: referrerData ? referrerData.id : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log('✅ [PHONE] Phone mapping saved successfully in phoneUsers collection');
    
    // Verify phone mapping
    const verifyPhoneMap = await getDoc(doc(db, 'phoneUsers', userData.phone));
    if (verifyPhoneMap.exists()) {
      console.log('✅ [PHONE] Phone mapping verified: exists');
    } else {
      console.log('❌ [PHONE] Phone mapping verification FAILED');
    }
    console.log('🔵 [PHONE] ===== PHONE MAPPING COMPLETE =====');
    
  } catch (error) {
    console.log('❌ [PHONE] Error saving phone mapping:', error);
    console.log('❌ [PHONE] Error stack:', error.stack);
  }

  // Create wallet for working member
  if (!isDonorFlow && finalRole === 'working') {
    console.log('🔵 [PHONE] ===== CREATING WALLET =====');
    console.log('🔵 [PHONE] User ID:', userId);
    console.log('🔵 [PHONE] Role: working');
    
    try {
      await setDoc(doc(db, 'wallets', userId), {
        balance: 0,
        totalEarned: 0,
        pendingCommission: 0,
        totalWithdrawn: 0,
        pendingWithdrawals: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log('✅ [PHONE] Wallet created successfully');
      
      // Verify wallet
      const verifyWallet = await getDoc(doc(db, 'wallets', userId));
      if (verifyWallet.exists()) {
        console.log('✅ [PHONE] Wallet verified: exists');
      } else {
        console.log('❌ [PHONE] Wallet verification FAILED');
      }
    } catch (error) {
      console.log('❌ [PHONE] Error creating wallet:', error);
      console.log('❌ [PHONE] Error stack:', error.stack);
    }
    console.log('🔵 [PHONE] ===== WALLET CREATION COMPLETE =====');
  }

  // Sign out user
  try {
    const auth = getAuthInstance();
    console.log('🔵 [PHONE] Signing out user...');
    await auth.signOut();
    console.log('✅ [PHONE] User signed out successfully');
  } catch (error) {
    console.log('❌ [PHONE] Error signing out:', error);
    console.log('❌ [PHONE] Error stack:', error.stack);
  }

  // Navigate to appropriate screen
  const navigateTo = (isDonorFlow || finalRole === 'donor') ? 'DonationTabs' : 'Login';
  console.log('🔵 [PHONE] ===== NAVIGATION =====');
  console.log('🔵 [PHONE] Target screen:', navigateTo);
  console.log('🔵 [PHONE] Is donor flow:', isDonorFlow);
  console.log('🔵 [PHONE] Final role:', finalRole);
  
  console.log('✅ [PHONE] Navigation starting...');
  if (isDonorFlow || finalRole === 'donor') {
    console.log('✅ [PHONE] Resetting navigation to DonationTabs');
    navigation.reset({
      index: 0,
      routes: [{ name: 'DonationTabs' }],
    });
  } else {
    console.log('✅ [PHONE] Navigating to:', navigateTo);
    navigation.navigate(navigateTo);
  }
  
  console.log('✅ [PHONE] ===== PHONE REGISTRATION COMPLETE =====');
  console.log('✅ [PHONE] Summary:');
  console.log('✅ [PHONE] - User ID:', userId);
  console.log('✅ [PHONE] - Phone:', userData.phone);
  console.log('✅ [PHONE] - Role:', finalRole);
  console.log('✅ [PHONE] - Password stored:', !!userData.password);
  console.log('✅ [PHONE] - Phone mapping saved: yes');
  console.log('✅ [PHONE] - Navigation to:', navigateTo);
  console.log('✅ [PHONE] ==========================================');
};

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleEmailRegister = async () => {
    if (!formData.fullName.trim()) {
      Alert.alert(translations.error, translations.fullNameRequired);
      return;
    }

    if (!formData.email.trim() || !validateEmail(formData.email)) {
      Alert.alert(translations.error, translations.validEmail);
      return;
    }

    if (!isDonorFlow && !isDonationFlow && !formData.phone.trim()) {
      Alert.alert(translations.error, translations.phoneRequired);
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert(translations.error, translations.passwordMinLength);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert(translations.error, translations.passwordMismatch);
      return;
    }

    if (!isDonationFlow && role !== 'donor') {
      const fee = parseFloat(feeAmount);
      if (fee > 0 && formData.memberType) {
        setShowPaymentModal(true);
        return;
      }
    }

    setLoading(true);
    try {
      const auth = getAuthInstance();
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email.trim(), 
        formData.password
      );
      
      const userId = userCredential.user.uid;
      const finalRole = isDonationFlow ? 'donor' : role;

      const userData = {
        fullName: formData.fullName.trim(),
        fatherName: formData.fatherName.trim(),
        dob: formData.dob,
        gender: formData.gender,
        education: formData.education,
        caste: formData.caste,
        spouseName: formData.spouseName,
        aadharNumber: formData.aadharNumber,
        phone: formData.phone.trim() || '',
        email: formData.email.trim().toLowerCase(),
        address: formData.address.trim(),
        village: formData.village,
        postOffice: formData.postOffice,
        thana: formData.thana,
        district: formData.district,
        state: formData.state,
        pinCode: formData.pinCode,
        nationality: formData.nationality,
        profession: formData.profession,
        membershipNumber: formData.membershipNumber,
        membershipDate: formData.membershipDate,
        guruAshram: formData.guruAshram,
        memberType: formData.memberType,
        contributionAmount: formData.contributionAmount,
        role: finalRole,
        status: finalRole === 'donor' ? 'active' : (finalRole === 'working' ? 'active' : 'pending'),
        profilePhoto: formData.profilePhoto || null,
        aadharFront: formData.aadharFront || null,
        aadharBack: formData.aadharBack || null,
        panCard: formData.panCard || null,
        signature: formData.signature || null,
        registrationFeePaid: parseFloat(feeAmount) > 0 ? true : false,
        registrationFeeAmount: parseFloat(feeAmount) || 0,
        registrationFeePaidAt: parseFloat(feeAmount) > 0 ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (finalRole === 'donor') {
        await setDoc(doc(db, 'donors', userId), {
          ...userData,
          totalDonations: 0,
          donationCount: 0,
          lastDonation: null,
        });
      } else {
        await setDoc(doc(db, 'users', userId), userData);
      }

      if (finalRole === 'working') {
        await setDoc(doc(db, 'wallets', userId), {
          balance: 0,
          totalEarned: 0,
          totalWithdrawn: 0,
          pendingWithdrawals: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      let successMessage = translations.registrationSubmitted;
      let navigateTo = 'Login';

      if (finalRole === 'donor') {
        successMessage = translations.donorAccountCreated;
        navigateTo = 'DonationTabs';
      } else if (finalRole === 'working') {
        successMessage = translations.workingAccountCreated;
      }

      Alert.alert(
        translations.registrationComplete, 
        successMessage,
        [
          { 
            text: 'OK', 
            onPress: () => {
              if (finalRole === 'donor') {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'DonationTabs' }],
                });
              } else {
                navigation.navigate(navigateTo);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = translations.registrationFailed;
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = translations.emailAlreadyUsed;
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = translations.invalidEmailFormat;
      } else if (error.code === 'auth/weak-password') {
        errorMessage = translations.weakPassword;
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = translations.networkError;
      }
      
      Alert.alert(translations.registrationFailed, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (field) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your gallery');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const base64Url = `data:image/jpeg;base64,${asset.base64}`;
        setFormData({ ...formData, [field]: base64Url });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // ============ STEP 1: Role Selection ============
  const renderRoleSelection = () => {
    if (isDonationFlow) {
      setTimeout(() => setStep(2), 100);
      return null;
    }

    return (
      <View>
        <Text style={styles.stepTitle}>{translations.selectRegistrationType}</Text>
        <Text style={styles.subStep}>{translations.chooseHowToRegister}</Text>

        <TouchableOpacity 
          style={[styles.roleCard, role === 'member' && styles.roleCardActive]}
          onPress={() => setRole('member')}
        >
          <View style={[styles.roleIcon, { backgroundColor: role === 'member' ? '#FF7722' : '#e5e7eb' }]}>
            <MaterialIcons name="person" size={24} color={role === 'member' ? '#ffffff' : '#6b7280'} />
          </View>
          <View style={styles.roleContent}>
            <Text style={[styles.roleTitle, role === 'member' && styles.roleTitleActive]}>{translations.member}</Text>
            <Text style={styles.roleDescription}>{translations.registerAsMember}</Text>
          </View>
          {role === 'member' && (
            <MaterialIcons name="check-circle" size={20} color="#FF7722" />
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.roleCard, role === 'working' && styles.roleCardActive]}
          onPress={() => setRole('working')}
        >
          <View style={[styles.roleIcon, { backgroundColor: role === 'working' ? '#8b5cf6' : '#e5e7eb' }]}>
            <MaterialIcons name="work" size={24} color={role === 'working' ? '#ffffff' : '#6b7280'} />
          </View>
          <View style={styles.roleContent}>
            <Text style={[styles.roleTitle, role === 'working' && styles.roleTitleActive]}>{translations.workingMember}</Text>
            <Text style={styles.roleDescription}>{translations.registerAsWorkingMember}</Text>
          </View>
          {role === 'working' && (
            <MaterialIcons name="check-circle" size={20} color="#8b5cf6" />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextButton} onPress={() => setStep(2)}>
          <Text style={styles.buttonText}>{translations.next} →</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ============ STEP 2: Registration Method ============
  const renderRegistrationMethod = () => (
    <View>
      <Text style={styles.stepTitle}>{translations.chooseRegistrationMethod}</Text>
      <Text style={styles.subStep}>{translations.howWouldYouLike}</Text>

      <TouchableOpacity 
        style={[styles.methodCard, registrationMethod === 'email' && styles.methodCardActive]}
        onPress={() => {
          setRegistrationMethod('email');
        }}
      >
        <View style={[styles.methodIcon, { backgroundColor: registrationMethod === 'email' ? '#FF7722' : '#e5e7eb' }]}>
          <MaterialIcons name="email" size={24} color={registrationMethod === 'email' ? '#ffffff' : '#6b7280'} />
        </View>
        <View style={styles.methodContent}>
          <Text style={[styles.methodTitle, registrationMethod === 'email' && styles.methodTitleActive]}>{translations.emailRegistration}</Text>
        </View>
        {registrationMethod === 'email' && (
          <MaterialIcons name="check-circle" size={20} color="#FF7722" />
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.methodCard, registrationMethod === 'phone' && styles.methodCardActive]}
        onPress={() => {
          setRegistrationMethod('phone');
        }}
      >
        <View style={[styles.methodIcon, { backgroundColor: registrationMethod === 'phone' ? '#10b981' : '#e5e7eb' }]}>
          <MaterialIcons name="phone" size={24} color={registrationMethod === 'phone' ? '#ffffff' : '#6b7280'} />
        </View>
        <View style={styles.methodContent}>
          <Text style={[styles.methodTitle, registrationMethod === 'phone' && styles.methodTitleActive]}>{translations.phoneRegistration}</Text>
        </View>
        {registrationMethod === 'phone' && (
          <MaterialIcons name="check-circle" size={20} color="#10b981" />
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.nextButton} onPress={() => {
        if (registrationMethod === 'phone') {
          setStep(4);
        } else {
          setStep(4);
        }
      }}>
        <Text style={styles.buttonText}>{translations.next} →</Text>
      </TouchableOpacity>
    </View>
  );

  // ============ STEP 4: Personal Information ============
  const renderPersonalInfo = () => {
    if (isDonorFlow) {
      return (
        <View>
          <Text style={styles.stepTitle}>Donor Registration</Text>
          <Text style={styles.subStep}>Enter your basic details to register as a donor</Text>
          
          <View style={styles.fieldContainer}>
            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              placeholderTextColor="#9ca3af"
              value={formData.fullName}
              onChangeText={(text) => setFormData({...formData, fullName: text})}
            />
            <View style={styles.bottomLine} />
          </View>

          {registrationMethod === 'email' && (
            <View style={styles.fieldContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email *"
                placeholderTextColor="#9ca3af"
                value={formData.email}
                onChangeText={(text) => setFormData({...formData, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.bottomLine} />
            </View>
          )}

          <View style={styles.fieldContainer}>
            <TextInput
              style={[styles.input, registrationMethod === 'phone' && styles.disabledInput]}
              placeholder="Phone Number *"
              placeholderTextColor="#9ca3af"
              value={formData.phone}
              onChangeText={(text) => {
                setFormData({...formData, phone: text});
              }}
              keyboardType="phone-pad"
              maxLength={10}
            />
            <View style={styles.bottomLine} />
          </View>

          <View style={styles.fieldContainer}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Address"
              placeholderTextColor="#9ca3af"
              value={formData.address}
              onChangeText={(text) => setFormData({...formData, address: text})}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
            <View style={styles.bottomLine} />
          </View>

          <View style={styles.stepButtons}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => setStep(2)}
            >
              <MaterialIcons name="arrow-back" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.nextButton} 
              onPress={() => setStep(7)}
            >
              <Text style={styles.buttonText}>Next →</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View>
        <Text style={styles.stepTitle}>{translations.personalInformation}</Text>
        <Text style={styles.subStep}>{translations.enterPersonalDetails}</Text>
        
        <View style={styles.fieldContainer}>
          <TextInput
            style={styles.input}
            placeholder={`${translations.fullName} *`}
            placeholderTextColor="#9ca3af"
            value={formData.fullName}
            onChangeText={(text) => setFormData({...formData, fullName: text})}
          />
          <View style={styles.bottomLine} />
        </View>

        <View style={styles.fieldContainer}>
          <TextInput
            style={styles.input}
            placeholder={translations.fatherHusbandName}
            placeholderTextColor="#9ca3af"
            value={formData.fatherName}
            onChangeText={(text) => setFormData({...formData, fatherName: text})}
          />
          <View style={styles.bottomLine} />
        </View>

        <View style={styles.fieldContainer}>
          <TextInput
            style={styles.input}
            placeholder={translations.dateOfBirth}
            placeholderTextColor="#9ca3af"
            value={formData.dob}
            onChangeText={(text) => setFormData({...formData, dob: text})}
          />
          <View style={styles.bottomLine} />
        </View>

        <View style={styles.fieldContainer}>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={formData.gender}
              onValueChange={(itemValue) => setFormData({...formData, gender: itemValue})}
              style={styles.picker}
            >
              <Picker.Item label={translations.selectGender} value="" />
              <Picker.Item label={translations.male} value="Male" />
              <Picker.Item label={translations.female} value="Female" />
              <Picker.Item label={translations.other} value="Other" />
            </Picker>
            <View style={styles.bottomLine} />
          </View>
        </View>

        <View style={styles.fieldContainer}>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={formData.nationality || 'indian'}
              onValueChange={(itemValue) => setFormData({...formData, nationality: itemValue})}
              style={styles.picker}
            >
              <Picker.Item label="Indian" value="indian" />
              <Picker.Item label="Other" value="other" />
            </Picker>
            <View style={styles.bottomLine} />
          </View>
        </View>

        {formData.nationality === 'other' && (
          <View style={styles.fieldContainer}>
            <TextInput
              style={styles.input}
              placeholder="Please specify your nationality"
              placeholderTextColor="#9ca3af"
              value={formData.otherNationality}
              onChangeText={(text) => setFormData({...formData, otherNationality: text})}
            />
            <View style={styles.bottomLine} />
          </View>
        )}

        <View style={styles.fieldContainer}>
          <TextInput
            style={styles.input}
            placeholder={translations.educationQualification}
            placeholderTextColor="#9ca3af"
            value={formData.education}
            onChangeText={(text) => setFormData({...formData, education: text})}
          />
          <View style={styles.bottomLine} />
        </View>

        <View style={styles.fieldContainer}>
          <TextInput
            style={styles.input}
            placeholder={translations.caste}
            placeholderTextColor="#9ca3af"
            value={formData.caste}
            onChangeText={(text) => setFormData({...formData, caste: text})}
          />
          <View style={styles.bottomLine} />
        </View>

        <View style={styles.fieldContainer}>
          <TextInput
            style={styles.input}
            placeholder={translations.spouseName}
            placeholderTextColor="#9ca3af"
            value={formData.spouseName}
            onChangeText={(text) => setFormData({...formData, spouseName: text})}
          />
          <View style={styles.bottomLine} />
        </View>

        <View style={styles.fieldContainer}>
          <TextInput
            style={styles.input}
            placeholder={translations.aadharNumber}
            placeholderTextColor="#9ca3af"
            value={formData.aadharNumber}
            onChangeText={(text) => setFormData({...formData, aadharNumber: text})}
            keyboardType="numeric"
            maxLength={12}
          />
          <View style={styles.bottomLine} />
        </View>

        <View style={styles.fieldContainer}>
          <TextInput
            style={styles.input}
            placeholder="Referral Code (Optional)"
            placeholderTextColor="#9ca3af"
            value={referralCode}
            onChangeText={(text) => {
              const code = text.toUpperCase();
              setReferralCode(code);
              if (code.length >= 6) {
                validateReferralCode(code);
              } else {
                setReferralValid(false);
                setReferrerData(null);
              }
            }}
            autoCapitalize="characters"
            maxLength={8}
          />
          <View style={styles.bottomLine} />
          {referralValid && referrerData && (
            <View style={styles.referralValidContainer}>
              <MaterialIcons name="verified" size={16} color="#10b981" />
              <Text style={styles.referralValidText}>
                Referred by: {referrerData.name} (Level {referrerData.level})
              </Text>
            </View>
          )}
          {checkingReferral && (
            <View style={styles.referralCheckingContainer}>
              <ActivityIndicator size="small" color="#FF7722" />
              <Text style={styles.referralCheckingText}>Checking...</Text>
            </View>
          )}
        </View>
        
        {registrationMethod === 'email' && (
          <View style={styles.fieldContainer}>
            <TextInput
              style={styles.input}
              placeholder={`${translations.email} *`}
              placeholderTextColor="#9ca3af"
              value={formData.email}
              onChangeText={(text) => setFormData({...formData, email: text})}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.bottomLine} />
          </View>
        )}

        <View style={styles.fieldContainer}>
          <TextInput
            style={styles.input}
            placeholder={`${translations.phoneNumber} *`}
            placeholderTextColor="#9ca3af"
            value={formData.phone}
            onChangeText={(text) => {
              setFormData({...formData, phone: text});
            }}
            keyboardType="phone-pad"
            maxLength={10}
          />
          <View style={styles.bottomLine} />
        </View>

        <View style={styles.stepButtons}>
          <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}>
            <MaterialIcons name="arrow-back" size={20} color="#ffffff" />
            <Text style={styles.buttonText}>{translations.back}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.nextButton} onPress={() => setStep(5)}>
            <Text style={styles.buttonText}>{translations.next} →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ============ STEP 5: Address & Location ============
  const renderAddress = () => (
    <View>
      <Text style={styles.stepTitle}>{translations.addressLocation}</Text>
      <Text style={styles.subStep}>{translations.enterAddressDetails}</Text>
      
      <View style={styles.fieldContainer}>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={translations.address}
          placeholderTextColor="#9ca3af"
          value={formData.address}
          onChangeText={(text) => setFormData({...formData, address: text})}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />
        <View style={styles.bottomLine} />
      </View>

      <View style={styles.fieldContainer}>
        <TextInput
          style={styles.input}
          placeholder={translations.village}
          placeholderTextColor="#9ca3af"
          value={formData.village}
          onChangeText={(text) => setFormData({...formData, village: text})}
        />
        <View style={styles.bottomLine} />
      </View>

      <View style={styles.fieldContainer}>
        <TextInput
          style={styles.input}
          placeholder={translations.postOffice}
          placeholderTextColor="#9ca3af"
          value={formData.postOffice}
          onChangeText={(text) => setFormData({...formData, postOffice: text})}
        />
        <View style={styles.bottomLine} />
      </View>

      <View style={styles.fieldContainer}>
        <TextInput
          style={styles.input}
          placeholder={translations.thana}
          placeholderTextColor="#9ca3af"
          value={formData.thana}
          onChangeText={(text) => setFormData({...formData, thana: text})}
        />
        <View style={styles.bottomLine} />
      </View>

      <View style={styles.fieldContainer}>
        <TextInput
          style={styles.input}
          placeholder={translations.district}
          placeholderTextColor="#9ca3af"
          value={formData.district}
          onChangeText={(text) => setFormData({...formData, district: text})}
        />
        <View style={styles.bottomLine} />
      </View>

      <View style={styles.fieldContainer}>
        <TextInput
          style={styles.input}
          placeholder={translations.state}
          placeholderTextColor="#9ca3af"
          value={formData.state}
          onChangeText={(text) => setFormData({...formData, state: text})}
        />
        <View style={styles.bottomLine} />
      </View>

      <View style={styles.fieldContainer}>
        <TextInput
          style={styles.input}
          placeholder={translations.pinCode}
          placeholderTextColor="#9ca3af"
          value={formData.pinCode}
          onChangeText={(text) => setFormData({...formData, pinCode: text})}
          keyboardType="numeric"
          maxLength={6}
        />
        <View style={styles.bottomLine} />
      </View>

      <View style={styles.fieldContainer}>
        <TextInput
          style={styles.input}
          placeholder={translations.profession}
          placeholderTextColor="#9ca3af"
          value={formData.profession}
          onChangeText={(text) => setFormData({...formData, profession: text})}
        />
        <View style={styles.bottomLine} />
      </View>

      <View style={styles.stepButtons}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep(4)}>
          <MaterialIcons name="arrow-back" size={20} color="#ffffff" />
          <Text style={styles.buttonText}>{translations.back}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.nextButton} onPress={() => setStep(6)}>
          <Text style={styles.buttonText}>{translations.next} →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ============ STEP 6: Membership Details ============
  const renderMembershipDetails = () => {
    if (isDonationFlow) {
      setTimeout(() => setStep(7), 100);
      return null;
    }

    if (!feesLoaded) {
      return (
        <View>
          <Text style={styles.stepTitle}>{translations.membershipDetails}</Text>
          <Text style={styles.subStep}>{translations.enterMembershipInfo}</Text>
          
          <View style={styles.fieldContainer}>
            <TextInput
              style={styles.input}
              placeholder={translations.membershipDate}
              placeholderTextColor="#9ca3af"
              value={formData.membershipDate}
              onChangeText={(text) => setFormData({...formData, membershipDate: text})}
            />
            <View style={styles.bottomLine} />
          </View>

          <View style={styles.fieldContainer}>
            <TextInput
              style={styles.input}
              placeholder={translations.guruAshram}
              placeholderTextColor="#9ca3af"
              value={formData.guruAshram}
              onChangeText={(text) => setFormData({...formData, guruAshram: text})}
            />
            <View style={styles.bottomLine} />
          </View>

          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF7722" />
            <Text style={styles.loadingText}>Loading member types...</Text>
          </View>

          <View style={styles.stepButtons}>
            <TouchableOpacity style={styles.backButton} onPress={() => setStep(5)}>
              <MaterialIcons name="arrow-back" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>{translations.back}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.nextButton, styles.disabledButton]} disabled>
              <Text style={styles.buttonText}>{translations.next} →</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    const showFee = !isDonationFlow && role !== 'donor';

    return (
      <View>
        <Text style={styles.stepTitle}>{translations.membershipDetails}</Text>
        <Text style={styles.subStep}>{translations.enterMembershipInfo}</Text>

        <View style={styles.fieldContainer}>
          <TextInput
            style={styles.input}
            placeholder={translations.membershipDate}
            placeholderTextColor="#9ca3af"
            value={formData.membershipDate}
            onChangeText={(text) => setFormData({...formData, membershipDate: text})}
          />
          <View style={styles.bottomLine} />
        </View>

        <View style={styles.fieldContainer}>
          <TextInput
            style={styles.input}
            placeholder={translations.guruAshram}
            placeholderTextColor="#9ca3af"
            value={formData.guruAshram}
            onChangeText={(text) => setFormData({...formData, guruAshram: text})}
          />
          <View style={styles.bottomLine} />
        </View>

        <View style={styles.fieldContainer}>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={formData.memberType}
              onValueChange={(itemValue) => {
                setFormData({...formData, memberType: itemValue});
              }}
              style={styles.picker}
            >
              <Picker.Item label={translations.selectMemberType} value="" />
              {Object.keys(memberFees).map((type) => (
                <Picker.Item 
                  key={type}
                  label={`${type} (₹${memberFees[type]})`} 
                  value={type} 
                />
              ))}
            </Picker>
            <View style={styles.bottomLine} />
          </View>
        </View>

        {showFee && formData.memberType && (
          <View style={styles.feeContainer}>
            <View style={styles.feeCard}>
              <MaterialIcons name="payments" size={24} color="#FF7722" />
              <View style={styles.feeInfo}>
                <Text style={styles.feeLabel}>Registration Fee</Text>
                <Text style={styles.feeAmount}>₹{memberFees[formData.memberType]}</Text>
              </View>
            </View>
            <Text style={styles.feeNote}>
              💳 Registration fee must be paid to complete registration
            </Text>
          </View>
        )}

        <View style={styles.stepButtons}>
          <TouchableOpacity style={styles.backButton} onPress={() => setStep(5)}>
            <MaterialIcons name="arrow-back" size={20} color="#ffffff" />
            <Text style={styles.buttonText}>{translations.back}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.nextButton} onPress={() => setStep(7)}>
            <Text style={styles.buttonText}>{translations.next} →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ============ STEP 7: Password ============
  const renderPassword = () => {
    if (isDonorFlow) {
      return (
        <View>
          <Text style={styles.stepTitle}>Set Password</Text>
          <Text style={styles.subStep}>Create a secure password for your donor account</Text>
          
          <View style={styles.fieldContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password * (min 6 characters)"
              placeholderTextColor="#9ca3af"
              value={formData.password}
              onChangeText={(text) => setFormData({...formData, password: text})}
              secureTextEntry
            />
            <View style={styles.bottomLine} />
          </View>

          <View style={styles.fieldContainer}>
            <TextInput
              style={styles.input}
              placeholder="Confirm Password *"
              placeholderTextColor="#9ca3af"
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
              secureTextEntry
            />
            <View style={styles.bottomLine} />
          </View>

          <View style={styles.stepButtons}>
            <TouchableOpacity style={styles.backButton} onPress={() => setStep(4)}>
              <MaterialIcons name="arrow-back" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.nextButton} 
              onPress={() => setStep(12)}
            >
              <Text style={styles.buttonText}>Next →</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View>
        <Text style={styles.stepTitle}>{translations.accountSecurity}</Text>
        <Text style={styles.subStep}>{translations.setPassword}</Text>
        
        <View style={styles.fieldContainer}>
          <TextInput
            style={styles.input}
            placeholder={`${translations.password} * (min 6 characters)`}
            placeholderTextColor="#9ca3af"
            value={formData.password}
            onChangeText={(text) => setFormData({...formData, password: text})}
            secureTextEntry
          />
          <View style={styles.bottomLine} />
        </View>

        <View style={styles.fieldContainer}>
          <TextInput
            style={styles.input}
            placeholder={`${translations.confirmPassword} *`}
            placeholderTextColor="#9ca3af"
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
            secureTextEntry
          />
          <View style={styles.bottomLine} />
        </View>

        <View style={styles.stepButtons}>
          <TouchableOpacity style={styles.backButton} onPress={() => setStep(6)}>
            <MaterialIcons name="arrow-back" size={20} color="#ffffff" />
            <Text style={styles.buttonText}>{translations.back}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.nextButton} onPress={() => setStep(8)}>
            <Text style={styles.buttonText}>{translations.next} →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ============ STEP 8: Profile Photo ============
  const renderProfilePhoto = () => (
    <View>
      <Text style={styles.stepTitle}>{translations.profilePhoto}</Text>
      <Text style={styles.subStep}>{translations.uploadProfilePhoto}</Text>

      <View style={styles.uploadContainer}>
        <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage('profilePhoto')}>
          <MaterialIcons name="photo-camera" size={24} color="#FF7722" />
          <Text style={[styles.uploadButtonText, { color: '#FF7722' }]}>
            {formData.profilePhoto ? translations.changePhoto : translations.uploadPhoto}
          </Text>
        </TouchableOpacity>
        {formData.profilePhoto && (
          <Image source={{ uri: formData.profilePhoto }} style={styles.previewImage} />
        )}
      </View>

      <View style={styles.stepButtons}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep(7)}>
          <MaterialIcons name="arrow-back" size={20} color="#ffffff" />
          <Text style={styles.buttonText}>{translations.back}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.nextButton} onPress={() => setStep(9)}>
          <Text style={styles.buttonText}>{translations.next} →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ============ STEP 9: Aadhar Front ============
  const renderAadharFront = () => {
    if (isDonationFlow) {
      setTimeout(() => setStep(12), 100);
      return null;
    }

    return (
      <View>
        <Text style={styles.stepTitle}>{translations.aadharFront}</Text>
        <Text style={styles.subStep}>{translations.uploadAadharFront}</Text>

        <View style={styles.uploadContainer}>
          <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage('aadharFront')}>
            <MaterialIcons name="credit-card" size={24} color="#FF7722" />
            <Text style={[styles.uploadButtonText, { color: '#FF7722' }]}>
              {formData.aadharFront ? translations.changeAadharFront : translations.uploadAadharFrontLabel}
            </Text>
          </TouchableOpacity>
          {formData.aadharFront && (
            <Image source={{ uri: formData.aadharFront }} style={styles.previewImage} />
          )}
        </View>

        <View style={styles.stepButtons}>
          <TouchableOpacity style={styles.backButton} onPress={() => setStep(8)}>
            <MaterialIcons name="arrow-back" size={20} color="#ffffff" />
            <Text style={styles.buttonText}>{translations.back}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.nextButton} onPress={() => setStep(10)}>
            <Text style={styles.buttonText}>{translations.next} →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ============ STEP 10: Aadhar Back ============
  const renderAadharBack = () => {
    if (isDonationFlow) return null;

    return (
      <View>
        <Text style={styles.stepTitle}>{translations.aadharBack}</Text>
        <Text style={styles.subStep}>{translations.uploadAadharBack}</Text>

        <View style={styles.uploadContainer}>
          <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage('aadharBack')}>
            <MaterialIcons name="credit-card" size={24} color="#FF7722" />
            <Text style={[styles.uploadButtonText, { color: '#FF7722' }]}>
              {formData.aadharBack ? translations.changeAadharBack : translations.uploadAadharBackLabel}
            </Text>
          </TouchableOpacity>
          {formData.aadharBack && (
            <Image source={{ uri: formData.aadharBack }} style={styles.previewImage} />
          )}
        </View>

        <View style={styles.stepButtons}>
          <TouchableOpacity style={styles.backButton} onPress={() => setStep(9)}>
            <MaterialIcons name="arrow-back" size={20} color="#ffffff" />
            <Text style={styles.buttonText}>{translations.back}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.nextButton} onPress={() => setStep(11)}>
            <Text style={styles.buttonText}>{translations.next} →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ============ STEP 11: PAN Card ============
  const renderPANCard = () => {
    if (isDonationFlow) return null;

    return (
      <View>
        <Text style={styles.stepTitle}>{translations.panCard}</Text>
        <Text style={styles.subStep}>{translations.uploadPanCard}</Text>

        <View style={styles.uploadContainer}>
          <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage('panCard')}>
            <MaterialIcons name="assignment" size={24} color="#FF7722" />
            <Text style={[styles.uploadButtonText, { color: '#FF7722' }]}>
              {formData.panCard ? translations.changePanCard : translations.uploadPanCardLabel}
            </Text>
          </TouchableOpacity>
          {formData.panCard && (
            <Image source={{ uri: formData.panCard }} style={styles.previewImage} />
          )}
        </View>

        <View style={styles.stepButtons}>
          <TouchableOpacity style={styles.backButton} onPress={() => setStep(10)}>
            <MaterialIcons name="arrow-back" size={20} color="#ffffff" />
            <Text style={styles.buttonText}>{translations.back}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.nextButton} onPress={() => setStep(12)}>
            <Text style={styles.buttonText}>{translations.next} →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ============ STEP 12: Signature & Submit ============
  const renderSignature = () => {
    const isDonor = isDonationFlow || role === 'donor' || isDonorFlow;
    const buttonColor = isDonor ? '#FF7722' : (role === 'working' ? '#8b5cf6' : '#FF7722');

    const handleSubmit = () => {
      console.log('🔵 HandleSubmit called');
      console.log('🔵 isDonorFlow:', isDonorFlow);
      console.log('🔵 isDonationFlow:', isDonationFlow);
      console.log('🔵 role:', role);
      
      if (isDonorFlow || isDonationFlow || role === 'donor') {
        console.log('🔵 Donor flow detected, proceeding with registration');
        if (registrationMethod === 'phone') {
          handlePhoneRegister();
        } else {
          handleEmailRegister();
        }
        return;
      }

      if (!isDonationFlow && role !== 'donor') {
        const fee = parseFloat(feeAmount);
        console.log('🔵 Fee check:', { fee, memberType: formData.memberType });
        if (fee > 0 && formData.memberType) {
          console.log('🔵 Opening payment modal');
          setShowPaymentModal(true);
          return;
        } else if (fee > 0 && !formData.memberType) {
          Alert.alert('Error', 'Please select a member type first');
          return;
        }
      }
      
      console.log('🔵 Proceeding with registration');
      if (registrationMethod === 'phone') {
        handlePhoneRegister();
      } else {
        handleEmailRegister();
      }
    };

    return (
      <View>
        <Text style={styles.stepTitle}>{translations.signature}</Text>
        <Text style={styles.subStep}>{translations.uploadSignature}</Text>

        <View style={styles.uploadContainer}>
          <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage('signature')}>
            <MaterialIcons name="edit" size={24} color={buttonColor} />
            <Text style={[styles.uploadButtonText, { color: buttonColor }]}>
              {formData.signature ? translations.changeSignature : translations.uploadSignatureLabel}
            </Text>
          </TouchableOpacity>
          {formData.signature && (
            <Image source={{ uri: formData.signature }} style={styles.previewImage} />
          )}
        </View>

        <View style={styles.declarationContainer}>
          <Text style={styles.declarationText}>
            {translations.declaration.part1.replace('{name}', formData.fullName || '___________')}
          </Text>
          <Text style={styles.declarationText}>
            {translations.declaration.part2}
          </Text>
          <Text style={styles.declarationText}>
            {translations.declaration.part3}
          </Text>
          <Text style={styles.declarationText}>
            {translations.declaration.part4}
          </Text>
        </View>

        <View style={styles.stepButtons}>
          {!isDonationFlow && !isDonorFlow && (
            <TouchableOpacity style={styles.backButton} onPress={() => setStep(11)}>
              <MaterialIcons name="arrow-back" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>{translations.back}</Text>
            </TouchableOpacity>
          )}
          
          {isDonorFlow && (
            <TouchableOpacity style={styles.backButton} onPress={() => setStep(7)}>
              <MaterialIcons name="arrow-back" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: buttonColor }]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <MaterialIcons name="check" size={20} color="#ffffff" />
                <Text style={styles.buttonText}>
                  {isDonorFlow || role === 'donor' ? 'Register as Donor' : translations.register}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ============ PAYMENT MODAL ============
  const renderPaymentModal = () => (
    <Modal
      visible={showPaymentModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        if (!paymentLoading) {
          setShowPaymentModal(false);
          setShowNoPaymentOption(true);
        }
      }}
    >
      <View style={styles.paymentModalOverlay}>
        <View style={styles.paymentModalContent}>
          <View style={styles.paymentSuccessIconContainer}>
            <MaterialIcons name="payments" size={50} color="#FF7722" />
          </View>
          <Text style={styles.paymentModalTitle}>Registration Fee</Text>
          <Text style={styles.paymentModalSubtitle}>
            ₹{feeAmount} for {formData.memberType || 'Member'} Registration
          </Text>
          
          <View style={styles.paymentModalDetails}>
            <Text style={styles.paymentModalDetailText}>
              <Text style={styles.paymentModalDetailLabel}>Name: </Text>
              {formData.fullName || 'Member'}
            </Text>
            <Text style={styles.paymentModalDetailText}>
              <Text style={styles.paymentModalDetailLabel}>Email: </Text>
              {formData.email || 'member@email.com'}
            </Text>
            <Text style={styles.paymentModalDetailText}>
              <Text style={styles.paymentModalDetailLabel}>Phone: </Text>
              {formData.phone || 'Not provided'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.noPaymentOptionButton}
            onPress={() => {
              setShowPaymentModal(false);
              setShowNoPaymentOption(true);
            }}
            disabled={paymentLoading}
            activeOpacity={0.7}
          >
            <MaterialIcons name="help" size={18} color="#6b7280" />
            <Text style={styles.noPaymentOptionText}>
              Having trouble with payment? Click here
            </Text>
          </TouchableOpacity>

          <View style={styles.paymentModalButtons}>
            <TouchableOpacity
              style={[styles.paymentModalButton, styles.paymentModalButtonSecondary]}
              onPress={() => {
                setShowPaymentModal(false);
                setShowNoPaymentOption(true);
              }}
              disabled={paymentLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.paymentModalButtonTextSecondary}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paymentModalButton, styles.paymentModalButtonPrimary, paymentLoading && { opacity: 0.6 }]}
              onPress={handleRegistrationFeePayment}
              disabled={paymentLoading}
              activeOpacity={0.7}
            >
              {paymentLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.paymentModalButtonTextPrimary}>Pay ₹{feeAmount}</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.paymentModalCloseButton}
            onPress={() => {
              setShowPaymentModal(false);
              setShowNoPaymentOption(true);
            }}
            disabled={paymentLoading}
            activeOpacity={0.7}
          >
            <Text style={styles.paymentModalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderNoPaymentOption = () => (
    <Modal
      visible={showNoPaymentOption}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowNoPaymentOption(false)}
    >
      <View style={styles.paymentModalOverlay}>
        <View style={[styles.paymentModalContent, { paddingTop: 20 }]}>
          <View style={[styles.paymentSuccessIconContainer, { backgroundColor: '#fef3c7' }]}>
            <MaterialIcons name="warning" size={50} color="#f59e0b" />
          </View>
          <Text style={[styles.paymentModalTitle, { color: '#f59e0b' }]}>
            Complete Registration Without Payment
          </Text>
          <Text style={[styles.paymentModalSubtitle, { fontSize: 14 }]}>
            If you're having technical issues with payment, you can complete your registration without paying now.
          </Text>
          
          <View style={[styles.paymentModalDetails, { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a' }]}>
            <Text style={[styles.paymentModalDetailText, { color: '#92400e' }]}>
              <Text style={[styles.paymentModalDetailLabel, { color: '#92400e' }]}>⚠️ Important: </Text>
              Your account will be created with "Pending" status. You will not be able to login until an admin approves your registration.
            </Text>
          </View>

          <View style={styles.noPaymentInputContainer}>
            <Text style={styles.noPaymentInputLabel}>Reason for not paying (Optional)</Text>
            <TextInput
              style={[styles.input, styles.noPaymentTextArea]}
              placeholder="E.g., Internet issues, payment failed, etc."
              placeholderTextColor="#9ca3af"
              value={noPaymentReason}
              onChangeText={setNoPaymentReason}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
            <View style={styles.bottomLine} />
          </View>

          <View style={[styles.paymentModalButtons, { marginTop: 8 }]}>
            <TouchableOpacity
              style={[styles.paymentModalButton, styles.paymentModalButtonSecondary]}
              onPress={() => {
                setShowNoPaymentOption(false);
                setShowPaymentModal(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.paymentModalButtonTextSecondary}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paymentModalButton, { backgroundColor: '#f59e0b' }]}
              onPress={handleRegistrationWithoutPayment}
              activeOpacity={0.7}
            >
              <Text style={styles.paymentModalButtonTextPrimary}>Complete</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.paymentModalCloseButton}
            onPress={() => setShowNoPaymentOption(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.paymentModalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ============ STEP ROUTING ============
  const getStepContent = () => {
    if (step === 1) {
      if (isDonorFlow) {
        setTimeout(() => setStep(2), 100);
        return null;
      }
      return renderRoleSelection();
    }
    
    if (step === 2) {
      if (isDonorFlow) {
        setRegistrationMethod('email');
        setTimeout(() => setStep(4), 100);
        return null;
      }
      return renderRegistrationMethod();
    }
    
    if (step === 4) {
      return renderPersonalInfo();
    }
    
    if (step === 5) {
      if (isDonorFlow) {
        setTimeout(() => setStep(7), 100);
        return null;
      }
      return renderAddress();
    }
    
    if (step === 6) {
      if (isDonorFlow) {
        setTimeout(() => setStep(7), 100);
        return null;
      }
      return renderMembershipDetails();
    }
    
    if (step === 7) {
      return renderPassword();
    }
    
    if (step === 8) {
      if (isDonorFlow) {
        setTimeout(() => setStep(12), 100);
        return null;
      }
      return renderProfilePhoto();
    }
    
    if (step === 9) {
      if (isDonorFlow) {
        setTimeout(() => setStep(12), 100);
        return null;
      }
      return renderAadharFront();
    }
    
    if (step === 10) {
      if (isDonorFlow) {
        setTimeout(() => setStep(12), 100);
        return null;
      }
      return renderAadharBack();
    }
    
    if (step === 11) {
      if (isDonorFlow) {
        setTimeout(() => setStep(12), 100);
        return null;
      }
      return renderPANCard();
    }
    
    if (step === 12) {
      return renderSignature();
    }
    
    return null;
  };

  const getTotalSteps = () => {
    if (isDonorFlow) {
      return 4;
    }
    
    if (isDonationFlow) {
      return 6;
    }
    
    if (registrationMethod === 'phone') {
      return 11;
    }
    
    return 12;
  };

  // ============ STEP SKIPPING LOGIC ============
  useEffect(() => {
    if (isDonorFlow && step === 7) {
      console.log('🔵 [DONOR] Step 7 reached, staying on step 7 for password entry');
      return;
    }
    
    if (isDonorFlow && step > 7 && step < 12) {
      console.log('🔵 [DONOR] Skipping step', step, 'moving to 12');
      setTimeout(() => setStep(12), 100);
    }
  }, [step, isDonorFlow]);

  useEffect(() => {
    if (isDonationFlow && step === 1) {
      console.log('🔵 [DONATION] Skipping step 1, moving to step 2');
      setTimeout(() => setStep(2), 100);
    }
    if (isDonationFlow && step === 6) {
      console.log('🔵 [DONATION] Skipping step 6, moving to step 7');
      setTimeout(() => setStep(7), 100);
    }
    if (isDonationFlow && step >= 9 && step <= 11) {
      console.log('🔵 [DONATION] Skipping aadhar/pan steps, moving to step 12');
      setTimeout(() => setStep(12), 100);
    }
  }, [step, isDonationFlow]);

  useEffect(() => {
    fetchMemberFees();
  }, []);

  useEffect(() => {
    if (formData.memberType) {
      const fee = getMemberTypeFee(formData.memberType);
      setFeeAmount(fee.toString());
      setFormData(prev => ({ ...prev, contributionAmount: fee.toString() }));
    }
  }, [formData.memberType, memberFees]);

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#fdf8f3' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      key={renderKey}
    >
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.backHeaderButton} onPress={() => navigation.navigate('Login')}>
          <MaterialIcons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.title}>{translations.title}</Text>
        <Text style={styles.subtitle}>
          {translations.subtitle}
        </Text>

        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>{translations.step} {step} {translations.of} {getTotalSteps()}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / getTotalSteps()) * 100}%` }]} />
          </View>
        </View>

        <View style={styles.card}>
          {getStepContent()}
        </View>
        
        <View style={styles.signInContainer}>
          <Text style={styles.signInText}>{translations.alreadyHaveAccount}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.signInLink}>{translations.signIn}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {renderPaymentModal()}
      {renderNoPaymentOption()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backHeaderButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: Fonts.Bold,
    fontSize: 32,
    color: '#1f2937',
  },
  subtitle: {
    fontFamily: Fonts.Bold,
    fontSize: 32,
    color: '#1f2937',
    marginBottom: 30,
    textTransform: 'lowercase',
  },
  progressContainer: {
    marginBottom: 30,
  },
  progressText: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF7722',
    borderRadius: 2,
  },
  card: {
    borderRadius: 12,
    paddingHorizontal: 4,
    width: '100%',
  },
  noPaymentOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 6,
  },
  noPaymentOptionText: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
    textDecorationLine: 'underline',
  },
  noPaymentInputContainer: {
    width: '100%',
    marginBottom: 12,
  },
  noPaymentInputLabel: {
    fontFamily: Fonts.SemiBold,
    fontSize: 13,
    color: '#1f2937',
    marginBottom: 4,
  },
  noPaymentTextArea: {
    height: 50,
    textAlignVertical: 'top',
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  stepTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 18,
    color: '#1f2937',
    marginBottom: 8,
  },
  subStep: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  input: {
    fontFamily: Fonts.Regular,
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 4,
    color: '#1f2937',
    backgroundColor: 'transparent',
  },
  bottomLine: {
    height: 2,
    backgroundColor: '#FF7722',
    width: '100%',
    marginTop: 4,
  },
  textArea: {
    height: 50,
    textAlignVertical: 'top',
    paddingVertical: 8,
  },
  pickerWrapper: {
    backgroundColor: 'transparent',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#1f2937',
  },
  uploadContainer: {
    marginVertical: 8,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff5eb',
    padding: 14,
    borderRadius: 10,
    gap: 10,
    width: '100%',
  },
  uploadButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#FF7722',
    fontSize: 16,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'center',
  },
  declarationContainer: {
    backgroundColor: '#fef9f0',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginVertical: 12,
  },
  declarationText: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 20,
  },
  stepButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF7722',
    paddingVertical: 16,
    borderRadius: 50,
    flex: 1,
    shadowColor: '#FF7722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6b7280',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 50,
    flex: 1,
    gap: 8,
    shadowColor: '#6b7280',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF7722',
    paddingVertical: 16,
    borderRadius: 50,
    flex: 1,
    gap: 8,
    shadowColor: '#FF7722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    flexWrap: 'wrap',
  },
  signInText: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
    fontSize: 14,
  },
  signInLink: {
    fontFamily: Fonts.SemiBold,
    color: '#FF7722',
    fontSize: 14,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  roleCardActive: {
    borderColor: '#FF7722',
    backgroundColor: '#fff5eb',
  },
  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    flexShrink: 0,
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
    color: '#1f2937',
  },
  roleTitleActive: {
    color: '#FF7722',
  },
  roleDescription: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
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
  disabledInput: {
    color: '#9ca3af',
  },
  feeContainer: {
    marginVertical: 12,
    paddingHorizontal: 4,
  },
  feeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5EB',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 12,
  },
  feeInfo: {
    flex: 1,
  },
  feeLabel: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
  },
  feeAmount: {
    fontFamily: Fonts.Bold,
    fontSize: 20,
    color: '#FF7722',
  },
  feeNote: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
    textAlign: 'center',
  },
  paymentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  paymentModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  paymentSuccessIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentModalTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 22,
    color: '#1f2937',
    marginBottom: 4,
  },
  paymentModalSubtitle: {
    fontFamily: Fonts.Regular,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  paymentModalDetails: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  paymentModalDetailText: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#1f2937',
    paddingVertical: 4,
  },
  paymentModalDetailLabel: {
    fontFamily: Fonts.SemiBold,
    color: '#6b7280',
  },
  paymentModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 12,
  },
  paymentModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentModalButtonPrimary: {
    backgroundColor: '#FF7722',
  },
  paymentModalButtonSecondary: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  paymentModalButtonTextPrimary: {
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
    color: '#ffffff',
  },
  paymentModalButtonTextSecondary: {
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
    color: '#6b7280',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginVertical: 16,
  },
  loadingText: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
  },
  paymentModalCloseButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  paymentModalCloseText: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#6b7280',
  },
  referralValidContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  referralValidText: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#10b981',
  },
  referralCheckingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  referralCheckingText: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
  },
});