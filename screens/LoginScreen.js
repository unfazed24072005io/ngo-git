import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, ActivityIndicator, ScrollView, KeyboardAvoidingView, Dimensions } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  collection,
  query,
  where,
  getDocs,
  setDoc
} from 'firebase/firestore';
import { getAuthInstance, db } from '../config/firebase';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '../config/fonts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';

const { width, height } = Dimensions.get('window');

// ============ MESSAGECENTRAL (TWILIO) OTP SERVICE ============
const MESSAGECENTRAL_BACKEND_URL = 'https://twilio-2tjp.onrender.com';

export default function LoginScreen({ navigation, route }) {
  const { t, counter } = useLanguage();
  const [loginMethod, setLoginMethod] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [selectedRole, setSelectedRole] = useState('member');
  const [loading, setLoading] = useState(false);
  
  // OTP States
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpResendDisabled, setOtpResendDisabled] = useState(false);
  const timerIntervalRef = useRef(null);
  const [generatedOtp, setGeneratedOtp] = useState('');

  const isDonationFlow = route?.params?.donationFlow || false;

  // Force re-render when counter changes
  const renderKey = `login-${counter}`;

  // Get all translations using t() function
  const getTranslations = () => ({
    title: t('auth.logInto'),
    subtitle: t('auth.yourAccount'),
    email: t('auth.email'),
    phone: t('auth.phone'),
    password: t('auth.password'),
    phoneNumber: t('auth.phoneNumber'),
    enterOtp: t('auth.enterOtp'),
    sendOtp: t('auth.sendOtp'),
    verifyOtp: t('auth.verifyOtp'),
    loginAs: t('auth.loginAs'),
    forgotPassword: t('auth.forgotPassword'),
    login: t('auth.login'),
    dontHaveAccount: t('auth.dontHaveAccount'),
    signUp: t('auth.signUp'),
    wantToDonate: t('auth.wantToDonate'),
    registerAsDonor: t('auth.registerAsDonor'),
  });

  const translations = getTranslations();

  // Roles with translations
  const roles = [
    { id: 'member', label: t('auth.member') },
    { id: 'workingMember', label: t('auth.workingMember') },
    { id: 'admin', label: t('auth.admin') },
    { id: 'donor', label: t('auth.donor') },
    { id: 'employee', label: t('auth.employee') }
  ];

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Reset verification state when switching to phone method
  useEffect(() => {
    if (loginMethod === 'phone') {
      setIsPhoneVerified(false);
      setShowOtpInput(false);
      setOtp('');
      setVerificationId('');
    }
  }, [loginMethod]);

  // ============ OTP TIMER FUNCTION ============
  const startOtpTimer = (duration = 60) => {
    setOtpTimer(duration);
    setOtpResendDisabled(true);
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    timerIntervalRef.current = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
          setOtpResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ============ MESSAGECENTRAL (TWILIO) OTP FUNCTIONS ============
  
  // Send OTP via MessageCentral
  const sendOTP = async (to, channel = 'SMS') => {
    try {
      setIsSendingOtp(true);
      setLoading(true);

      console.log('📤 Sending OTP to:', to, 'via:', channel);
      console.log('📤 Backend URL:', MESSAGECENTRAL_BACKEND_URL);
      
      const response = await fetch(`${MESSAGECENTRAL_BACKEND_URL}/start-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          to: to,
          channel: channel,
          otpLength: 6
        })
      });

      console.log('📥 Response status:', response.status);
      
      const data = await response.json();
      console.log('📥 Send OTP Response:', data);
      
      if (data.success) {
        setVerificationId(String(data.verificationId));
        setShowOtpInput(true);
        setIsPhoneVerified(false);
        startOtpTimer(parseInt(data.timeout) || 60);
        Alert.alert(
          'OTP Sent',
          `Please check your phone for the OTP\n${to}`
        );
      } else {
        Alert.alert('Error', 'Failed to send OTP: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Send OTP error:', error);
      
      Alert.alert(
        '⚠️ OTP Service Unavailable',
        'Unable to send OTP. Please check your internet connection and try again.\n\nWould you like to use Test Mode? (OTP: 123456)',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Use Test Mode', 
            onPress: () => {
              const testOtp = '123456';
              setGeneratedOtp(testOtp);
              setVerificationId('test_verification_id');
              setShowOtpInput(true);
              Alert.alert('🧪 Test Mode', `OTP: ${testOtp}\nPhone: ${phoneNumber}\n\n(No SMS sent - testing only)`);
            }
          }
        ]
      );
    } finally {
      setIsSendingOtp(false);
      setLoading(false);
    }
  };

  // Verify OTP via MessageCentral
  const verifyOTP = async (verificationId, code) => {
  try {
    setIsVerifyingOtp(true);
    setLoading(true);

    console.log('🔐 Verifying OTP for verificationId:', verificationId, 'code:', code);
    
    const response = await fetch(`${MESSAGECENTRAL_BACKEND_URL}/check-verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        verificationId: verificationId,
        code: code
      })
    });

    const data = await response.json();
    console.log('✅ Verify OTP Response:', data);
    
    if (data.success) {
      // OTP Verified Successfully
      setIsPhoneVerified(true);
      setShowOtpInput(false);
      setOtp('');
      setOtpTimer(0);
      setOtpResendDisabled(false);
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      Alert.alert('✅ Success', 'Phone number verified successfully!');
      
      // ✅ Call handlePhoneLogin with skipVerificationCheck = true
      console.log('🔐 Calling handlePhoneLogin with skip=true');
      await handlePhoneLogin(true);
      console.log('✅ handlePhoneLogin completed');
      
      // ✅ Return true to indicate success
      return true;
      
    } else {
      Alert.alert('Error', data.message || 'Invalid OTP. Please try again.');
      setOtp('');
      return false;
    }
  } catch (error) {
    console.error('❌ Verify OTP Error:', error);
    Alert.alert('Error', 'Failed to verify OTP. Please try again.');
    return false;
  } finally {
    setIsVerifyingOtp(false);
    setLoading(false);
  }
};
const handleVerifyOtp = async () => {
  console.log('🔐 handleVerifyOtp called');
  console.log('🔐 OTP:', otp);
  console.log('🔐 VerificationId:', verificationId);
  console.log('🔐 isPhoneVerified before:', isPhoneVerified);
  
  if (!otp || otp.length < 6) {
    Alert.alert('Error', 'Please enter complete 6-digit OTP');
    return;
  }

  if (!verificationId) {
    Alert.alert('Error', 'Verification ID missing. Please request OTP again.');
    return;
  }

  if (verificationId === 'test_verification_id') {
    if (otp !== generatedOtp) {
      Alert.alert('Error', 'Invalid OTP');
      return;
    }
    setIsPhoneVerified(true);
    setShowOtpInput(false);
    setOtp('');
    Alert.alert('✅ Success', 'Phone number verified successfully!');
    await handlePhoneLogin(true); // ✅ Pass skip=true
    return;
  }

  console.log('🔐 Calling verifyOTP with ID:', verificationId);
  const verified = await verifyOTP(verificationId, otp);
  console.log('🔐 verifyOTP returned:', verified);
  
  if (verified) {
    console.log('✅ OTP Verified successfully!');
    // handlePhoneLogin is already called inside verifyOTP
  } else {
    console.log('❌ OTP verification failed');
  }
};
  // Handle Verify OTP
  // Handle Verify OTP
// ============ PHONE LOGIN ============
const handlePhoneLogin = async (skipVerificationCheck = false) => {
  // ✅ Allow skipping the verification check
  if (!skipVerificationCheck && !isPhoneVerified) {
    Alert.alert('Error', 'Please verify your phone number first');
    return;
  }

  setLoading(true);
  try {
    console.log('🔐 Starting phone login for number:', phoneNumber);
    
    // ✅ First, check if there's a phone-to-user mapping
    const phoneDoc = await getDoc(doc(db, 'phoneUsers', phoneNumber));
    
    if (phoneDoc.exists()) {
      const phoneData = phoneDoc.data();
      const userId = phoneData.userId;
      const role = phoneData.role || 'member';
      
      console.log('✅ Found phone mapping:', { userId, role });
      
      // Try to get user data
      let userData = null;
      let userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        userData = userDoc.data();
        console.log('✅ Found user in users collection');
      } else {
        userDoc = await getDoc(doc(db, 'donors', userId));
        if (userDoc.exists()) {
          userData = userDoc.data();
          console.log('✅ Found user in donors collection');
        }
      }
      
      if (!userData) {
        console.log('❌ User data not found!');
        Alert.alert('Error', 'User profile not found. Please contact support.');
        setLoading(false);
        return;
      }
      
      // Check status
      if (userData.status === 'pending') {
        Alert.alert(
          '⏳ Account Pending Approval',
          'Your registration is waiting for admin approval.\n\nYou will be notified once your account is approved.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }
      
      if (userData.status === 'rejected') {
        Alert.alert(
          '❌ Account Rejected',
          'Your registration has been rejected.\n\nPlease contact support for more information.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }
      
      const userName = userData.fullName || userData.name || 'User';
      console.log('✅ Login successful!');
      Alert.alert('Success', `Welcome ${userName}!`);
      handleNavigation(role, userData);
      return;
    }
    
    // If no mapping found, search by phone number
    console.log('🔐 No mapping found, searching by phone number...');
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phone', '==', phoneNumber));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      const userId = userDoc.id;
      const role = userData.role || 'member';
      
      console.log('✅ Found user by phone number');
      
      if (userData.status === 'pending') {
        Alert.alert(
          '⏳ Account Pending Approval',
          'Your registration is waiting for admin approval.\n\nYou will be notified once your account is approved.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }
      
      if (userData.status === 'rejected') {
        Alert.alert(
          '❌ Account Rejected',
          'Your registration has been rejected.\n\nPlease contact support for more information.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }
      
      // Create mapping for future logins
      await setDoc(doc(db, 'phoneUsers', phoneNumber), {
        userId: userId,
        phone: phoneNumber,
        role: role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      const userName = userData.fullName || userData.name || 'User';
      Alert.alert('Success', `Welcome ${userName}!`);
      handleNavigation(role, userData);
      return;
    }
    
    // Check in donors collection
    const donorsRef = collection(db, 'donors');
    const donorQ = query(donorsRef, where('phone', '==', phoneNumber));
    const donorSnapshot = await getDocs(donorQ);
    
    if (!donorSnapshot.empty) {
      const donorData = donorSnapshot.docs[0].data();
      const donorId = donorSnapshot.docs[0].id;
      
      console.log('✅ Found donor by phone number');
      
      if (donorData.status === 'pending') {
        Alert.alert(
          '⏳ Account Pending Approval',
          'Your donor registration is waiting for admin approval.\n\nYou will be notified once your account is approved.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }
      
      if (donorData.status === 'rejected') {
        Alert.alert(
          '❌ Account Rejected',
          'Your donor registration has been rejected.\n\nPlease contact support for more information.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }
      
      await setDoc(doc(db, 'phoneUsers', phoneNumber), {
        userId: donorId,
        phone: phoneNumber,
        role: 'donor',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      Alert.alert('Success', 'Welcome Donor!');
      navigation.reset({
        index: 0,
        routes: [{ name: 'DonationTabs' }],
      });
      return;
    }
    
    // No account found
    Alert.alert(
      'Account Not Found',
      'No account found with this phone number. Would you like to register?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Register', 
          onPress: () => navigation.navigate('Register') 
        }
      ]
    );
    
  } catch (error) {
    console.error('Phone login error:', error);
    Alert.alert('Error', 'Failed to login. Please try again.');
  } finally {
    setLoading(false);
  }
};
  // Resend OTP
  const resendOTP = () => {
    if (otpResendDisabled) {
      Alert.alert('Please wait', `Please wait ${otpTimer} seconds before requesting a new OTP`);
      return;
    }
    const to = `+91${phoneNumber}`;
    sendOTP(to, 'SMS');
  };

  // ============ OTP FUNCTIONS ============
  const handleSendOtp = async () => {
    console.log('📞 handleSendOtp called');
    console.log('📞 Phone:', phoneNumber);
    
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    const to = `+91${phoneNumber}`;
    console.log('📤 Sending to MessageCentral:', to);
    await sendOTP(to, 'SMS');
  };


  // ============ EMAIL LOGIN ============
const handleEmailLogin = async () => {
  console.log('🔑 ===== LOGIN ATTEMPT STARTED =====');
  console.log('📧 Email:', email);
  console.log('🔑 Password length:', password?.length || 0);

  if (!email || !password) {
    console.log('❌ Email or password empty');
    Alert.alert('Error', 'Please fill all fields');
    return;
  }

  setLoading(true);
  try {
    console.log('1️⃣ Getting auth instance...');
    const auth = getAuthInstance();
    console.log('2️⃣ Auth instance received:', auth ? '✅ YES' : '❌ NO');
    console.log('3️⃣ Auth object keys:', auth ? Object.keys(auth) : 'null');

    if (!auth) {
      console.log('❌ Auth instance is null/undefined!');
      throw new Error('Authentication service is not available');
    }

    console.log('4️⃣ Calling signInWithEmailAndPassword...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('5️⃣ signInWithEmailAndPassword SUCCESS!');
    
    const user = userCredential.user;
    console.log('6️⃣ User object:', user ? '✅ YES' : '❌ NO');
    console.log('7️⃣ User UID:', user?.uid);
    console.log('8️⃣ User Email:', user?.email);

    console.log('9️⃣ Checking user in Firestore...');
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const donorDoc = await getDoc(doc(db, 'donors', user.uid));
    
    console.log('🔟 UserDoc exists:', userDoc.exists());
    console.log('1️⃣1️⃣ DonorDoc exists:', donorDoc.exists());

    let userData = null;
    let role = 'member';

    if (userDoc.exists()) {
      userData = userDoc.data();
      role = userData.role || 'member';
      console.log('1️⃣2️⃣ User role from users collection:', role);
      console.log('1️⃣3️⃣ User data:', JSON.stringify(userData, null, 2));
    } else if (donorDoc.exists()) {
      userData = donorDoc.data();
      role = 'donor';
      console.log('1️⃣4️⃣ User role from donors collection:', role);
      console.log('1️⃣5️⃣ Donor data:', JSON.stringify(userData, null, 2));
    } else {
      console.log('❌ User NOT found in users OR donors collection!');
      Alert.alert(
        '⚠️ Profile Not Found',
        'Your account exists but profile is incomplete. Please contact support.',
        [{ text: 'OK' }]
      );
      setLoading(false);
      return;
    }

    console.log('1️⃣6️⃣ Checking user status...');
    if (userData?.status === 'pending') {
      console.log('⏳ Account is pending approval');
      Alert.alert(
        '⏳ Account Pending Approval',
        'Your registration is waiting for admin approval.\n\nYou will be notified once your account is approved.',
        [{ text: 'OK' }]
      );
      setLoading(false);
      return;
    }

    if (userData?.status === 'rejected') {
      console.log('❌ Account was rejected');
      Alert.alert(
        '❌ Account Rejected',
        'Your registration has been rejected.\n\nPlease contact support for more information.',
        [{ text: 'OK' }]
      );
      setLoading(false);
      return;
    }

    const userName = userData?.fullName || userData?.name || 'User';
    console.log('1️⃣7️⃣ Login SUCCESS! User:', userName);
    console.log('1️⃣8️⃣ Navigating to role:', role);
    
    Alert.alert('✅ Success', `Welcome ${userName}!`);
    handleNavigation(role, userData);

  } catch (error) {
    console.log('❌ ===== LOGIN FAILED =====');
    console.log('❌ Error Code:', error.code);
    console.log('❌ Error Message:', error.message);
    console.log('❌ Full Error:', JSON.stringify(error, null, 2));

    let message = 'Login failed. Please try again.';
    if (error.code === 'auth/wrong-password') {
      message = 'Incorrect password. Please try again.';
    } else if (error.code === 'auth/user-not-found') {
      message = 'No account found with this email.';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Invalid email address.';
    } else if (error.code === 'auth/too-many-requests') {
      message = 'Too many attempts. Please try again later.';
    } else if (error.code === 'auth/network-request-failed') {
      message = 'No internet connection. Please check your network.';
    } else if (error.code === 'auth/invalid-api-key') {
      message = 'Firebase configuration error. Please contact support.';
    } else if (error.message) {
      message = error.message;
    }

    Alert.alert('❌ Login Failed', message);
  } finally {
    setLoading(false);
    console.log('🔑 ===== LOGIN ATTEMPT ENDED =====');
  }
};
  // ============ NAVIGATION HANDLER ============
// ============ NAVIGATION HANDLER ============
const handleNavigation = (role, userData) => {
  // ✅ If coming from donation flow, always go to DonationTabs
  if (isDonationFlow) {
    navigation.reset({
      index: 0,
      routes: [{ name: 'DonationTabs' }],
    });
    return;
  }

  // ✅ Check if user is an employee
  if (userData?.isEmployee || userData?.role === 'employee') {
    navigation.reset({
      index: 0,
      routes: [{ name: 'EmployeeTabs' }],
    });
    return;
  }

  // ✅ Check if user is a donor
  if (role === 'donor' || userData?.role === 'donor') {
    navigation.reset({
      index: 0,
      routes: [{ name: 'DonationTabs' }],
    });
    return;
  }

  // ✅ Check for admin role
  if (role === 'admin') {
    navigation.reset({
      index: 0,
      routes: [{ name: 'AdminTabs' }],
    });
    return;
  }

  // ✅ Check for working member role
  if (role === 'working' || role === 'workingMember') {
    navigation.reset({
      index: 0,
      routes: [{ name: 'WorkingMemberTabs' }],
    });
    return;
  }

  // ✅ Default: Regular member
  navigation.reset({
    index: 0,
    routes: [{ name: 'MemberTabs' }],
  });
};

  // ============ RENDER FUNCTIONS ============
  // ============ RENDER PHONE LOGIN ============
const renderPhoneLogin = () => (
  <>
    <View style={styles.fieldContainer}>
      <View style={styles.phoneInputContainer}>
        <View style={styles.countryCodeContainer}>
          <Text style={styles.countryCodeText}>+91</Text>
        </View>
        <TextInput
          style={[styles.input, styles.phoneInput]}
          placeholder="Enter phone number"
          placeholderTextColor="#9ca3af"
          value={phoneNumber}
          onChangeText={(text) => {
            const cleaned = text.replace(/\D/g, '').slice(0, 10);
            setPhoneNumber(cleaned);
            // Reset verification state when phone changes
            if (isPhoneVerified) {
              setIsPhoneVerified(false);
              setShowOtpInput(false);
              setOtp('');
              setVerificationId('');
            }
          }}
          keyboardType="phone-pad"
          maxLength={10}
          editable={!isPhoneVerified}
        />
      </View>
      <View style={styles.bottomLine} />
    </View>

    {/* Show verified phone number if verified */}
    {isPhoneVerified && (
      <View style={styles.phoneDisplayContainer}>
        <MaterialIcons name="phone" size={20} color="#10b981" />
        <Text style={styles.phoneDisplayText}>+91 {phoneNumber}</Text>
        <TouchableOpacity onPress={() => {
          setIsPhoneVerified(false);
          setShowOtpInput(false);
          setOtp('');
          setVerificationId('');
        }}>
          <Text style={styles.changePhoneText}>Change</Text>
        </TouchableOpacity>
      </View>
    )}

    {!isPhoneVerified && (
      <>
        {/* Show Send OTP button only when OTP is NOT sent yet */}
        {!showOtpInput && (
          <TouchableOpacity
            style={[styles.sendOtpButton, (isSendingOtp) && styles.disabledButton]}
            onPress={handleSendOtp}
            disabled={isSendingOtp || !phoneNumber || phoneNumber.length < 10}
          >
            {isSendingOtp ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.sendOtpText}>Send OTP</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Show OTP input and Verify button when OTP is sent */}
        {showOtpInput && (
          <>
            <View style={styles.fieldContainer}>
              <TextInput
                style={[styles.input, styles.otpInputLarge]}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor="#9ca3af"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
              <View style={styles.bottomLine} />
            </View>

            <TouchableOpacity
              style={[styles.sendOtpButton, (isVerifyingOtp) && styles.disabledButton]}
              onPress={handleVerifyOtp}
              disabled={isVerifyingOtp || otp.length < 6}
            >
              {isVerifyingOtp ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.sendOtpText}>Verify OTP</Text>
              )}
            </TouchableOpacity>

            <View style={styles.otpTimerContainer}>
              <Text style={styles.otpTimerText}>
                {otpResendDisabled ? `Resend OTP in ${otpTimer}s` : ''}
              </Text>
              {!otpResendDisabled && (
                <TouchableOpacity onPress={resendOTP}>
                  <Text style={styles.resendOtpText}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </>
    )}

    {isPhoneVerified && (
      <View style={styles.verifiedContainer}>
        <MaterialIcons name="check-circle" size={24} color="#10b981" />
        <Text style={styles.verifiedText}>Phone Verified Successfully!</Text>
      </View>
    )}
  </>
);
  return (
    <SafeAreaView style={styles.safeArea} key={renderKey}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('PublicTabs')}>

  <MaterialIcons name="arrow-back" size={24} color="#1f2937" />
</TouchableOpacity>

          <Text style={styles.title}>{translations.title}</Text>
          <Text style={styles.subtitle}>{translations.subtitle}</Text>

          <View style={styles.methodToggle}>
            <TouchableOpacity
              style={[styles.methodButton, loginMethod === 'email' && styles.methodButtonActive]}
              onPress={() => {
                setLoginMethod('email');
                setShowOtpInput(false);
                setOtp('');
                setIsPhoneVerified(false);
              }}
            >
              <MaterialIcons name="email" size={20} color={loginMethod === 'email' ? '#ffffff' : '#6b7280'} />
              <Text style={[styles.methodText, loginMethod === 'email' && styles.methodTextActive]}>
                {translations.email}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.methodButton, loginMethod === 'phone' && styles.methodButtonActive]}
              onPress={() => {
                setLoginMethod('phone');
                setShowOtpInput(false);
                setOtp('');
                setIsPhoneVerified(false);
                setVerificationId('');
              }}
            >
              <MaterialIcons name="phone" size={20} color={loginMethod === 'phone' ? '#ffffff' : '#6b7280'} />
              <Text style={[styles.methodText, loginMethod === 'phone' && styles.methodTextActive]}>
                {translations.phone}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            {loginMethod === 'email' ? (
              <>
                <View style={styles.fieldContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder={translations.email}
                    placeholderTextColor="#9ca3af"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <View style={styles.bottomLine} />
                </View>

                <View style={styles.fieldContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder={translations.password}
                    placeholderTextColor="#9ca3af"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                  <View style={styles.bottomLine} />
                </View>

                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>{translations.forgotPassword}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.disabledButton]}
                  onPress={handleEmailLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.loginButtonText}>{translations.login}</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              renderPhoneLogin()
            )}

            <View style={styles.roleContainer}>
              <Text style={styles.roleLabel}>{translations.loginAs}</Text>
              <View style={styles.roleButtonsContainer}>
                {roles.map((role) => (
                  <TouchableOpacity
                    key={role.id}
                    style={[
                      styles.roleButton,
                      selectedRole === role.id && styles.roleButtonActive
                    ]}
                    onPress={() => setSelectedRole(role.id)}
                  >
                    <Text style={[
                      styles.roleText,
                      selectedRole === role.id && styles.roleTextActive
                    ]}>
                      {role.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>


            {!isDonationFlow && (
              <View style={styles.donationContainer}>
                <Text style={styles.donationText}>{translations.wantToDonate}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register', { isDonorRegistration: true })}>
  <Text style={styles.donationLink}>{translations.registerAsDonor}</Text>
</TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 10,
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
    marginBottom: 20,
  },
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  methodButtonActive: {
    backgroundColor: '#FF7722',
  },
  methodText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#6b7280',
  },
  methodTextActive: {
    color: '#ffffff',
  },
  formContainer: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 20,
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
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeContainer: {
    paddingRight: 10,
  },
  countryCodeText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
    color: '#1f2937',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 0,
  },
  sendOtpButton: {
    backgroundColor: '#FF7722',
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#FF7722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  sendOtpText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  roleContainer: {
    marginBottom: 16,
    marginTop: 10,
  },
  roleLabel: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 8,
  },
  roleButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  roleButtonActive: {
    backgroundColor: '#FF7722',
    borderColor: '#FF7722',
  },
  roleText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 10,
    color: '#6b7280',
  },
  roleTextActive: {
    color: '#ffffff',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#FF7722',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF7722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  loginButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  signUpText: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
    fontSize: 14,
  },
  signUpLink: {
    fontFamily: Fonts.SemiBold,
    color: '#FF7722',
    fontSize: 14,
  },
  donationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  donationText: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
    fontSize: 14,
  },
  donationLink: {
    fontFamily: Fonts.SemiBold,
    color: '#FF7722',
    fontSize: 14,
  },
  // OTP Specific Styles
  phoneDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 16,
    gap: 10,
  },
  phoneDisplayText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
  },
  changePhoneText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#FF7722',
  },
  otpInputLarge: {
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 8,
    paddingVertical: 16,
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginVertical: 10,
    gap: 8,
  },
  verifiedText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
    color: '#10b981',
  },
  otpTimerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginBottom: 8,
  },
  otpTimerText: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#6b7280',
  },
  resendOtpText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#FF7722',
  },
});