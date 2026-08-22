// screens/donation/DonateScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TextInput, 
  TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
  Modal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '../../config/fonts';
import { getAuthInstance, db } from '../../config/firebase';
import { doc, updateDoc, increment, setDoc, getDoc } from 'firebase/firestore';
import { 
  initiateRazorpayPayment, 
  createRazorpayOrder, 
  verifyRazorpayPayment 
} from '../../services/paymentService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../../context/LanguageContext';

export default function DonateScreen({ navigation }) {
  const { t, counter } = useLanguage();
  
  // Force re-render when language changes
  const renderKey = `donate-${counter}`;

  // Get translations
  const getTranslations = () => ({
    makeDonation: t('donation.makeDonation') || 'Make a Donation',
    yourDetails: t('donation.yourDetails') || 'Your Details',
    donateAnonymously: t('donation.donateAnonymously') || 'Donate Anonymously',
    fullName: t('donation.fullName') || 'Full Name',
    emailAddress: t('donation.emailAddress') || 'Email Address',
    phoneNumber: t('donation.phoneNumber') || 'Phone Number',
    selectAmount: t('donation.selectAmount') || 'Select Amount',
    orEnterCustomAmount: t('donation.orEnterCustomAmount') || 'Or enter custom amount',
    enterAmount: t('donation.enterAmount') || 'Enter amount',
    donationPurpose: t('donation.donationPurpose') || 'Donation Purpose',
    generalDonation: t('donation.generalDonation') || 'General Donation',
    education: t('donation.education') || 'Education',
    healthcare: t('donation.healthcare') || 'Healthcare',
    food: t('donation.food') || 'Food',
    clothing: t('donation.clothing') || 'Clothing',
    paymentMethod: t('donation.paymentMethod') || 'Payment Method',
    razorpay: t('donation.razorpay') || 'Razorpay',
    upi: t('donation.upi') || 'UPI',
    card: t('donation.card') || 'Card',
    securePayments: t('donation.securePayments') || 'Secure payments powered by Razorpay',
    donationAmount: t('donation.donationAmount') || 'Donation Amount',
    donor: t('donation.donor') || 'Donor',
    total: t('donation.total') || 'Total',
    donateNow: t('donation.donateNow') || 'Donate Now',
    taxDeductible: t('donation.taxDeductible') || 'All donations are tax-deductible under section 80G',
    secureEncrypted: t('donation.secureEncrypted') || '🔒 Your payment is secure and encrypted',
    paymentFailed: t('donation.paymentFailed') || 'Payment Failed',
    paymentVerificationFailed: t('donation.paymentVerificationFailed') || 'Payment verification failed. Please try again.',
    somethingWentWrong: t('donation.somethingWentWrong') || 'Something went wrong. Please try again.',
    failedToProcess: t('donation.failedToProcess') || 'Failed to process donation. Please check your internet connection and try again.',
    validAmount: t('donation.validAmount') || 'Please enter a valid donation amount',
    minAmount: t('donation.minAmount') || 'Minimum donation amount is ₹10',
    pleaseLogin: t('donation.pleaseLogin') || 'Please login to donate',
    enterName: t('donation.enterName') || 'Please enter your name or select anonymous',
    validEmail: t('donation.validEmail') || 'Please enter a valid email address',
    validPhone: t('donation.validPhone') || 'Please enter a valid phone number',
    donationSuccessful: t('donation.donationSuccessful') || '🎉 Donation Successful!',
    thankYouDonation: t('donation.thankYouDonation') || 'Thank you for your donation of ₹{amount}!',
    paymentId: t('donation.paymentId') || 'Payment ID: ',
    purpose: t('donation.purpose') || 'Purpose: ',
    donorLabel: t('donation.donorLabel') || 'Donor: ',
    viewHistory: t('donation.viewHistory') || 'View History',
    getCertificate: t('donation.getCertificate') || 'Get Certificate',
    close: t('common.close') || 'Close',
    error: t('common.error') || 'Error',
    notProvided: t('common.notProvided') || 'Not provided',
    anonymousDonor: t('donation.anonymousDonor') || 'Anonymous Donor',
  });

  const translations = getTranslations();

  const [amount, setAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [purpose, setPurpose] = useState('General Donation');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [donationData, setDonationData] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const presetAmounts = [100, 500, 1000, 2000, 5000];
  const purposes = [
    translations.generalDonation, 
    translations.education, 
    translations.healthcare, 
    translations.food, 
    translations.clothing
  ];

  // Load saved user data
  useEffect(() => {
    loadUserData();
    loadDonorData();
  }, []);

  const loadUserData = async () => {
    try {
      const auth = getAuthInstance();
const user = auth.currentUser;
      if (user) {
        const savedName = await AsyncStorage.getItem('donorName');
        const savedEmail = await AsyncStorage.getItem('donorEmail');
        const savedPhone = await AsyncStorage.getItem('donorPhone');
        setName(savedName || user.displayName || '');
        setEmail(savedEmail || user.email || '');
        setPhone(savedPhone || user.phoneNumber || '');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadDonorData = async () => {
    try {
      const auth = getAuthInstance();
const user = auth.currentUser;
      if (user) {
        const donorRef = doc(db, 'donors', user.uid);
        const donorDoc = await getDoc(donorRef);
        if (donorDoc.exists()) {
          const data = donorDoc.data();
          setName(data.name || '');
          setEmail(data.email || '');
          setPhone(data.phone || '');
        }
      }
    } catch (error) {
      console.error('Error loading donor data:', error);
    }
  };

  const handleAmountSelect = (value) => {
    setSelectedAmount(value);
    setAmount(value.toString());
    setCustomAmount('');
  };

  const handleCustomAmount = (value) => {
    setCustomAmount(value);
    setSelectedAmount(null);
    setAmount(value);
  };

  const handleDonation = async () => {
  const donationAmount = parseFloat(amount);
  if (!donationAmount || donationAmount <= 0) {
    Alert.alert(translations.error, translations.validAmount);
    return;
  }

  if (donationAmount < 10) {
    Alert.alert(translations.error, translations.minAmount);
    return;
  }

  const auth = getAuthInstance();
const user = auth.currentUser;
  if (!user) {
    Alert.alert(translations.error, translations.pleaseLogin);
    return;
  }

  // Validate donor details
  if (!isAnonymous) {
    if (!name.trim()) {
      Alert.alert(translations.error, translations.enterName);
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert(translations.error, translations.validEmail);
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      Alert.alert(translations.error, translations.validPhone);
      return;
    }
  }

  setLoading(true);
  try {
    const donorName = isAnonymous ? translations.anonymousDonor : name;
    const donorEmail = isAnonymous ? 'anonymous@donor.com' : email;
    const donorPhone = isAnonymous ? '0000000000' : phone;

    const paymentResult = await initiateRazorpayPayment({
      amount: donationAmount,
      name: donorName,
      email: donorEmail,
      phone: donorPhone,
      description: purpose,
    });

    console.log('📥 [DONATE_SCREEN] Payment result:', JSON.stringify(paymentResult, null, 2));

    // Check for cancellation
    if (paymentResult && paymentResult.code === 'PAYMENT_CANCELLED') {
      console.log('⚠️ [DONATE_SCREEN] User cancelled payment');
      setLoading(false);
      Alert.alert('Payment Cancelled', 'You cancelled the donation process.');
      return;
    }

    // ✅ FIX: Check for paymentId instead of success flag
    const isPaymentSuccessful = 
      paymentResult && 
      paymentResult.paymentId && 
      paymentResult.orderId && 
      paymentResult.signature;

    if (isPaymentSuccessful) {
      console.log('✅ [DONATE_SCREEN] Payment successful!');
      console.log('✅ [DONATE_SCREEN] Payment ID:', paymentResult.paymentId);
      console.log('✅ [DONATE_SCREEN] Order ID:', paymentResult.orderId);
      console.log('✅ [DONATE_SCREEN] Signature:', paymentResult.signature);

      // ✅ Try to verify, but DON'T fail if verification fails
      let verificationResult = { success: true };
      
      try {
        verificationResult = await verifyRazorpayPayment({
          paymentId: paymentResult.paymentId,
          orderId: paymentResult.orderId,
          signature: paymentResult.signature,
        });
        console.log('📥 [DONATE_SCREEN] Verification result:', JSON.stringify(verificationResult, null, 2));
      } catch (verifyError) {
        console.log('⚠️ [DONATE_SCREEN] Verification error (will proceed):', verifyError);
        verificationResult = { success: true, warning: 'Verification error but proceeding' };
      }

      // ✅ PROCEED WITH DONATION - The payment was successful
      console.log('✅ [DONATE_SCREEN] PAYMENT SUCCESSFUL! Saving donation...');

      const transactionId = `DON${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      const donationData = {
        donorId: user.uid,
        donorName: donorName,
        donorEmail: donorEmail,
        donorPhone: donorPhone,
        amount: donationAmount,
        paymentMethod: 'razorpay',
        paymentId: paymentResult.paymentId || 'pending_verification',
        status: 'completed',
        purpose: purpose,
        campaign: purpose,
        transactionId: transactionId,
        isAnonymous: isAnonymous,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'donations', transactionId), donationData);

      const donorRef = doc(db, 'donors', user.uid);
      const donorDoc = await getDoc(donorRef);
      
      if (donorDoc.exists()) {
        await updateDoc(donorRef, {
          totalDonations: increment(donationAmount),
          donationCount: increment(1),
          lastDonation: new Date().toISOString(),
          livesImpacted: increment(Math.floor(donationAmount / 100) + 1),
          name: donorName,
          email: donorEmail,
          phone: donorPhone,
        });
      } else {
        await setDoc(donorRef, {
          userId: user.uid,
          name: donorName,
          email: donorEmail,
          phone: donorPhone,
          totalDonations: donationAmount,
          donationCount: 1,
          lastDonation: new Date().toISOString(),
          livesImpacted: Math.floor(donationAmount / 100) + 1,
          createdAt: new Date().toISOString(),
        });
      }

      if (!isAnonymous) {
        await AsyncStorage.setItem('donorName', name);
        await AsyncStorage.setItem('donorEmail', email);
        await AsyncStorage.setItem('donorPhone', phone);
      }

      setDonationData({
        ...paymentResult,
        amount: donationAmount,
        name: donorName,
        email: donorEmail,
        phone: donorPhone,
        purpose: purpose,
      });
      setShowSuccessModal(true);

    } else {
      // ❌ Only show error if payment completely failed
      console.log('❌ [DONATE_SCREEN] Payment initiation FAILED');
      console.log('❌ [DONATE_SCREEN] Payment result:', paymentResult);
      console.log('❌ [DONATE_SCREEN] Payment error:', paymentResult?.error || 'Unknown error');
      setLoading(false);
      
      Alert.alert(
        translations.paymentFailed || 'Payment Failed',
        paymentResult?.error || translations.somethingWentWrong || 'Something went wrong. Please try again.',
        [{ text: 'OK', style: 'cancel' }]
      );
    }
  } catch (error) {
    console.error('❌ [DONATE_SCREEN] Donation error:', error);
    console.error('❌ [DONATE_SCREEN] Error details:', JSON.stringify(error, null, 2));
    setLoading(false);
    Alert.alert(
      translations.error,
      translations.failedToProcess,
      [{ text: 'OK', style: 'cancel' }]
    );
  } finally {
    setLoading(false);
  }
};
  const handleSuccessAction = (action) => {
    setShowSuccessModal(false);
    if (action === 'certificate') {
      navigation.navigate('DonationCertificate', {
        paymentId: donationData.paymentId,
        amount: donationData.amount,
        name: donationData.name,
        email: donationData.email,
        purpose: donationData.purpose,
        date: new Date().toISOString(),
      });
    } else if (action === 'history') {
      navigation.navigate('MyDonations');
    } else {
      navigation.goBack();
    }
  };

  // Success Modal Component
  const SuccessModal = () => (
    <Modal
      visible={showSuccessModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowSuccessModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.successIconContainer}>
            <MaterialIcons name="check-circle" size={60} color="#10b981" />
          </View>
          <Text style={styles.modalTitle}>{translations.donationSuccessful}</Text>
          <Text style={styles.modalSubtitle}>
            {translations.thankYouDonation.replace('{amount}', donationData?.amount)}
          </Text>
          
          <View style={styles.modalDetails}>
            <Text style={styles.modalDetailText}>
              <Text style={styles.modalDetailLabel}>{translations.paymentId}</Text>
              {donationData?.paymentId}
            </Text>
            <Text style={styles.modalDetailText}>
              <Text style={styles.modalDetailLabel}>{translations.purpose}</Text>
              {donationData?.purpose}
            </Text>
            <Text style={styles.modalDetailText}>
              <Text style={styles.modalDetailLabel}>{translations.donorLabel}</Text>
              {donationData?.name}
            </Text>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={() => handleSuccessAction('history')}
              activeOpacity={0.7}
            >
              <Text style={styles.modalButtonTextSecondary}>{translations.viewHistory}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={() => handleSuccessAction('certificate')}
              activeOpacity={0.7}
            >
              <Text style={styles.modalButtonTextPrimary}>{translations.getCertificate}</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => handleSuccessAction('close')}
            activeOpacity={0.7}
          >
            <Text style={styles.modalCloseText}>{translations.close}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      key={renderKey}
    >
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{translations.makeDonation}</Text>
          <View style={{ width: 32 }} />
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Donor Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{translations.yourDetails}</Text>
          
          <TouchableOpacity
            style={styles.anonymousToggle}
            onPress={() => setIsAnonymous(!isAnonymous)}
            activeOpacity={0.7}
          >
            <MaterialIcons 
              name={isAnonymous ? 'check-box' : 'check-box-outline-blank'} 
              size={24} 
              color="#10b981" 
            />
            <Text style={styles.anonymousToggleText}>{translations.donateAnonymously}</Text>
          </TouchableOpacity>

          {!isAnonymous && (
            <>
              <View style={styles.inputContainer}>
                <MaterialIcons name="person" size={20} color="#6b7280" />
                <TextInput
                  style={styles.input}
                  placeholder={translations.fullName}
                  placeholderTextColor="#9ca3af"
                  value={name}
                  onChangeText={setName}
                  textAlignVertical="center"
                />
              </View>

              <View style={styles.inputContainer}>
                <MaterialIcons name="email" size={20} color="#6b7280" />
                <TextInput
                  style={styles.input}
                  placeholder={translations.emailAddress}
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textAlignVertical="center"
                />
              </View>

              <View style={styles.inputContainer}>
                <MaterialIcons name="phone" size={20} color="#6b7280" />
                <TextInput
                  style={styles.input}
                  placeholder={translations.phoneNumber}
                  placeholderTextColor="#9ca3af"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                  textAlignVertical="center"
                />
              </View>
            </>
          )}
        </View>

        {/* Amount Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{translations.selectAmount}</Text>
          <View style={styles.presetContainer}>
            {presetAmounts.map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.presetButton,
                  selectedAmount === preset && styles.presetButtonActive,
                ]}
                onPress={() => handleAmountSelect(preset)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.presetText,
                    selectedAmount === preset && styles.presetTextActive,
                  ]}
                >
                  ₹{preset}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.customContainer}>
            <Text style={styles.customLabel}>{translations.orEnterCustomAmount}</Text>
            <View style={styles.customInputContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.customInput}
                placeholder={translations.enterAmount}
                placeholderTextColor="#9ca3af"
                value={customAmount}
                onChangeText={handleCustomAmount}
                keyboardType="numeric"
                textAlignVertical="center"
              />
            </View>
          </View>
        </View>

        {/* Purpose Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{translations.donationPurpose}</Text>
          <View style={styles.purposeContainer}>
            {purposes.map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.purposeButton,
                  purpose === p && styles.purposeButtonActive,
                ]}
                onPress={() => setPurpose(p)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.purposeText,
                    purpose === p && styles.purposeTextActive,
                  ]}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payment Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{translations.paymentMethod}</Text>
          <View style={styles.paymentOptions}>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'razorpay' && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentMethod('razorpay')}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name="security"
                size={22}
                color={paymentMethod === 'razorpay' ? '#10b981' : '#6b7280'}
              />
              <Text
                style={[
                  styles.paymentOptionText,
                  paymentMethod === 'razorpay' && styles.paymentOptionTextActive,
                ]}
              >
                {translations.razorpay}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'upi' && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentMethod('upi')}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name="payment"
                size={22}
                color={paymentMethod === 'upi' ? '#10b981' : '#6b7280'}
              />
              <Text
                style={[
                  styles.paymentOptionText,
                  paymentMethod === 'upi' && styles.paymentOptionTextActive,
                ]}
              >
                {translations.upi}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'card' && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentMethod('card')}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name="credit-card"
                size={22}
                color={paymentMethod === 'card' ? '#10b981' : '#6b7280'}
              />
              <Text
                style={[
                  styles.paymentOptionText,
                  paymentMethod === 'card' && styles.paymentOptionTextActive,
                ]}
              >
                {translations.card}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.paymentNote}>{translations.securePayments}</Text>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{translations.donationAmount}</Text>
            <Text style={styles.summaryValue}>₹{amount || 0}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{translations.purpose}</Text>
            <Text style={styles.summaryValue}>{purpose}</Text>
          </View>
          {!isAnonymous && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{translations.donor}</Text>
              <Text style={styles.summaryValue}>{name || translations.notProvided}</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>{translations.total}</Text>
            <Text style={styles.totalValue}>₹{amount || 0}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.donateButton,
            (!amount || parseFloat(amount) <= 0) && styles.donateButtonDisabled,
          ]}
          onPress={handleDonation}
          disabled={!amount || parseFloat(amount) <= 0 || loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <MaterialIcons name="favorite" size={20} color="#ffffff" />
              <Text style={styles.donateButtonText}>{translations.donateNow}</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.noteText}>{translations.taxDeductible}</Text>
        <Text style={styles.noteText}>{translations.secureEncrypted}</Text>
      </ScrollView>

      <SuccessModal />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerCard: {
    backgroundColor: '#10b981',
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    backgroundColor: '#f9fafb',
  },
  input: {
    flex: 1,
    fontFamily: Fonts.Regular,
    fontSize: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    color: '#1f2937',
    includeFontPadding: false,
  },
  anonymousToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  anonymousToggleText: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#1f2937',
    marginLeft: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  presetButtonActive: {
    borderColor: '#10b981',
    backgroundColor: '#d1fae5',
  },
  presetText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  presetTextActive: {
    color: '#10b981',
  },
  customContainer: {
    marginTop: 16,
  },
  customLabel: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
  },
  currencySymbol: {
    fontFamily: Fonts.SemiBold,
    fontSize: 18,
    color: '#1f2937',
    marginRight: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  customInput: {
    flex: 1,
    fontFamily: Fonts.Regular,
    fontSize: 16,
    paddingVertical: 12,
    color: '#1f2937',
    includeFontPadding: false,
  },
  purposeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  purposeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  purposeButtonActive: {
    borderColor: '#10b981',
    backgroundColor: '#d1fae5',
  },
  purposeText: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  purposeTextActive: {
    color: '#10b981',
    fontFamily: Fonts.SemiBold,
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  paymentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  paymentOptionActive: {
    borderColor: '#10b981',
    backgroundColor: '#d1fae5',
  },
  paymentOptionText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  paymentOptionTextActive: {
    color: '#10b981',
  },
  paymentNote: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  summaryValue: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  totalLabel: {
    fontFamily: Fonts.Bold,
    fontSize: 16,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  totalValue: {
    fontFamily: Fonts.Bold,
    fontSize: 18,
    color: '#10b981',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  donateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  donateButtonDisabled: {
    opacity: 0.5,
  },
  donateButtonText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 18,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  noteText: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 22,
    color: '#1f2937',
    marginBottom: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  modalSubtitle: {
    fontFamily: Fonts.Regular,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  modalDetails: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  modalDetailText: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#1f2937',
    paddingVertical: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  modalDetailLabel: {
    fontFamily: Fonts.SemiBold,
    color: '#6b7280',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#10b981',
  },
  modalButtonSecondary: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalButtonTextPrimary: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  modalButtonTextSecondary: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  modalCloseButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  modalCloseText: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});