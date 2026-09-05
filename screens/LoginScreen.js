import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, ActivityIndicator, ScrollView, KeyboardAvoidingView, Dimensions } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
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

export default function LoginScreen({ navigation, route }) {
  const { t, counter } = useLanguage();
  const [loginMethod, setLoginMethod] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phonePassword, setPhonePassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');
  const [loading, setLoading] = useState(false);

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
    phonePassword: t('auth.password') || 'Password',
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

      if (!auth) {
        console.log('❌ Auth instance is null/undefined!');
        throw new Error('Authentication service is not available');
      }

      console.log('4️⃣ Calling signInWithEmailAndPassword...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('5️⃣ signInWithEmailAndPassword SUCCESS!');
      
      const user = userCredential.user;
      console.log('6️⃣ User UID:', user?.uid);

      console.log('9️⃣ Checking user in Firestore...');
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const donorDoc = await getDoc(doc(db, 'donors', user.uid));

      let userData = null;
      let role = 'member';

      if (userDoc.exists()) {
        userData = userDoc.data();
        role = userData.role || 'member';
        console.log('1️⃣2️⃣ User role from users collection:', role);
      } else if (donorDoc.exists()) {
        userData = donorDoc.data();
        role = 'donor';
        console.log('1️⃣4️⃣ User role from donors collection:', role);
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
      
      Alert.alert('✅ Success', `Welcome ${userName}!`);
      handleNavigation(role, userData);

    } catch (error) {
      console.log('❌ ===== LOGIN FAILED =====');
      console.log('❌ Error Code:', error.code);
      console.log('❌ Error Message:', error.message);

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

  // ============ PHONE LOGIN ============
  const handlePhoneLogin = async () => {
  console.log('📱 ===== PHONE LOGIN ATTEMPT STARTED =====');
  console.log('📱 Phone:', phoneNumber);
  console.log('📱 Password length:', phonePassword?.length || 0);

  if (!phoneNumber || phoneNumber.length < 10) {
    Alert.alert('Error', 'Please enter a valid phone number');
    return;
  }

  if (!phonePassword || phonePassword.length < 6) {
    Alert.alert('Error', 'Password must be at least 6 characters');
    return;
  }

  setLoading(true);
  try {
    const auth = getAuthInstance();
    console.log('📱 Auth instance:', auth ? '✅ EXISTS' : '❌ NULL');
    
    // First, check if there's a phone-to-user mapping
    const phoneDoc = await getDoc(doc(db, 'phoneUsers', phoneNumber));
    
    let userId = null;
    let userData = null;
    let role = 'member';
    let userDoc = null;
    let isDonor = false;
    let originalUserId = null;

    if (phoneDoc.exists()) {
      const phoneData = phoneDoc.data();
      userId = phoneData.userId;
      role = phoneData.role || 'member';
      console.log('✅ Found phone mapping:', { userId, role });
      
      // Try to get user data
      userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        userData = userDoc.data();
        console.log('✅ Found user in users collection');
      } else {
        userDoc = await getDoc(doc(db, 'donors', userId));
        if (userDoc.exists()) {
          userData = userDoc.data();
          isDonor = true;
          console.log('✅ Found user in donors collection');
        }
      }
    }
    
    // If no mapping found, search by phone number
    if (!userData) {
      console.log('📱 No mapping found, searching by phone number...');
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phone', '==', phoneNumber));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        userDoc = querySnapshot.docs[0];
        userData = userDoc.data();
        userId = userDoc.id;
        role = userData.role || 'member';
        console.log('✅ Found user by phone number');
      }
    }
    
    if (!userData) {
      // Check in donors collection
      const donorsRef = collection(db, 'donors');
      const donorQ = query(donorsRef, where('phone', '==', phoneNumber));
      const donorSnapshot = await getDocs(donorQ);
      
      if (!donorSnapshot.empty) {
        userData = donorSnapshot.docs[0].data();
        userId = donorSnapshot.docs[0].id;
        role = 'donor';
        isDonor = true;
        console.log('✅ Found donor by phone number');
      }
    }
    
    if (!userData) {
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
      setLoading(false);
      return;
    }

    // Check if password is set
    const storedPassword = userData.password || userData.phonePassword;
    
    if (!storedPassword) {
      console.log('⚠️ No password found in user data - prompting to set password');
      setSetupUserId(userId);
      setShowPasswordSetup(true);
      setLoading(false);
      return;
    }
    
    // Verify password
    if (storedPassword !== phonePassword) {
      console.log('❌ Password mismatch');
      Alert.alert('Error', 'Incorrect password. Please try again.');
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
    
    // ✅ CHECK IF USER HAS FIREBASE AUTH ACCOUNT
    const isFirebaseUser = userId && !userId.startsWith('phone_');
    console.log('📱 Is Firebase Auth user:', isFirebaseUser);
    
    let firebaseAuthSuccess = false;
    
    if (!isFirebaseUser) {
      // ✅ CREATE FIREBASE AUTH USER ON THE FLY
      console.log('🔄 User does not have Firebase Auth account - creating one...');
      const phoneEmail = `${phoneNumber}@phone.auth`;
      
      try {
        // Try to create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, phoneEmail, phonePassword);
        console.log('✅ Firebase Auth user created on the fly with UID:', userCredential.user.uid);
        
        // Update user data with new Firebase UID
        const newUid = userCredential.user.uid;
        originalUserId = userId;
        userId = newUid;
        
        const userRef = doc(db, 'users', originalUserId);
        await updateDoc(userRef, {
          uid: newUid,
          firebaseUid: newUid,
          originalUid: originalUserId,
          updatedAt: new Date().toISOString()
        });
        console.log('✅ User document updated with Firebase UID');
        
        // Update phone mapping
        await updateDoc(doc(db, 'phoneUsers', phoneNumber), {
          userId: newUid,
          updatedAt: new Date().toISOString()
        });
        console.log('✅ Phone mapping updated with Firebase UID');
        
        firebaseAuthSuccess = true;
        
      } catch (createError) {
        console.log('⚠️ Could not create Firebase Auth user:', createError.code);
        console.log('⚠️ Error message:', createError.message);
        
        // If email already in use, try to sign in
        if (createError.code === 'auth/email-already-in-use') {
          console.log('📱 Email already in use, trying to sign in...');
          try {
            const userCredential = await signInWithEmailAndPassword(auth, phoneEmail, phonePassword);
            console.log('✅ Signed in to existing Firebase Auth user:', userCredential.user.uid);
            
            // Update with existing Firebase UID
            const existingUid = userCredential.user.uid;
            originalUserId = userId;
            userId = existingUid;
            
            const userRef = doc(db, 'users', originalUserId);
            await updateDoc(userRef, {
              uid: existingUid,
              firebaseUid: existingUid,
              originalUid: originalUserId,
              updatedAt: new Date().toISOString()
            });
            console.log('✅ User document updated with existing Firebase UID');
            
            await updateDoc(doc(db, 'phoneUsers', phoneNumber), {
              userId: existingUid,
              updatedAt: new Date().toISOString()
            });
            
            firebaseAuthSuccess = true;
          } catch (signInError) {
            console.log('⚠️ Could not sign in to existing Firebase Auth user:', signInError.code);
          }
        }
      }
    } else {
      // ✅ USER ALREADY HAS FIREBASE AUTH - TRY NORMAL LOGIN
      console.log('📱 User has Firebase Auth account, trying normal login...');
      const possibleEmails = [
        userData.email,
        `${phoneNumber}@phone.auth`,
        `phone_${phoneNumber}@auth.com`,
        `${phoneNumber}@phone.user`
      ].filter(email => email && email.trim() !== '');
      
      for (const email of possibleEmails) {
        try {
          console.log(`📱 Trying Firebase Auth login with email: ${email}`);
          const userCredential = await signInWithEmailAndPassword(auth, email, phonePassword);
          console.log('✅ Firebase Auth login successful with email:', email);
          console.log('✅ User signed in:', auth.currentUser?.uid);
          firebaseAuthSuccess = true;
          break;
        } catch (error) {
          console.log(`⚠️ Failed with email ${email}:`, error.code);
        }
      }
    }
    
    if (!firebaseAuthSuccess) {
      console.log('⚠️ Firebase Auth setup failed - proceeding with Firestore-only login');
    }
    
    // Create mapping if it doesn't exist
    if (!phoneDoc.exists()) {
      try {
        await setDoc(doc(db, 'phoneUsers', phoneNumber), {
          userId: userId,
          phone: phoneNumber,
          role: role,
          email: userData.email || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        console.log('✅ Phone mapping created');
      } catch (mapError) {
        console.log('⚠️ Error creating phone mapping:', mapError);
      }
    }
    
    const userName = userData.fullName || userData.name || 'User';
    console.log('✅ Login successful!');
    Alert.alert('Success', `Welcome ${userName}!`);
    handleNavigation(role, userData);
    
  } catch (error) {
    console.error('Phone login error:', error);
    Alert.alert('Error', 'Failed to login. Please try again.');
  } finally {
    setLoading(false);
  }
};

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
          }}
          keyboardType="phone-pad"
          maxLength={10}
        />
      </View>
      <View style={styles.bottomLine} />
    </View>

    <View style={styles.fieldContainer}>
      <TextInput
        style={styles.input}
        placeholder="Password * (min 6 characters)"
        placeholderTextColor="#9ca3af"
        value={phonePassword}
        onChangeText={setPhonePassword}
        secureTextEntry
      />
      <View style={styles.bottomLine} />
    </View>

    {/* ✅ PHONE LOGIN BUTTON - Calls handlePhoneLogin */}
    <TouchableOpacity
      style={[styles.loginButton, loading && styles.disabledButton]}
      onPress={handlePhoneLogin}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : (
        <Text style={styles.loginButtonText}>{translations.login}</Text>
      )}
    </TouchableOpacity>
  </>
);

  // ============ RENDER EMAIL LOGIN ============
  const renderEmailLogin = () => (
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
              onPress={() => setLoginMethod('email')}
            >
              <MaterialIcons name="email" size={20} color={loginMethod === 'email' ? '#ffffff' : '#6b7280'} />
              <Text style={[styles.methodText, loginMethod === 'email' && styles.methodTextActive]}>
                {translations.email}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.methodButton, loginMethod === 'phone' && styles.methodButtonActive]}
              onPress={() => setLoginMethod('phone')}
            >
              <MaterialIcons name="phone" size={20} color={loginMethod === 'phone' ? '#ffffff' : '#6b7280'} />
              <Text style={[styles.methodText, loginMethod === 'phone' && styles.methodTextActive]}>
                {translations.phone}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            {loginMethod === 'email' ? renderEmailLogin() : renderPhoneLogin()}

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
});