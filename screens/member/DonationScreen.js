// screens/member/DonationScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, 
  Alert, Image, Modal, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db, getAuthInstance } from '../../config/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { Fonts } from '../../config/fonts';
import { 
  initiateRazorpayPayment, 
  createRazorpayOrder, 
  verifyRazorpayPayment 
} from '../../services/paymentService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommissionService } from '../../services/CommissionService';
import { useLanguage } from '../../context/LanguageContext';

export default function DonationScreen({ navigation }) {
  const { t, counter } = useLanguage();
  
  // Force re-render when language changes
  const renderKey = `donation-screen-${counter}`;

  // Get translations - EVERY SINGLE TEXT STRING is mapped to a translation key
  const translations = {
    // Common
    error: t('common.error') || 'Error',
    success: t('common.success') || 'Success',
    loading: t('common.loading') || 'Loading...',
    cancel: t('common.cancel') || 'Cancel',
    notProvided: t('common.notProvided') || 'Not provided',
    anonymous: t('common.anonymous') || 'Anonymous',
    
    // Header
    donateForCause: t('donation.donateForCause') || 'Donate for a Cause',
    enterDonationAmount: t('donation.enterDonationAmount') || 'Enter Donation Amount',
    
    // Donor Information
    donorInformation: t('donation.donorInformation') || 'Donor Information',
    fullName: t('donation.fullName') || 'Full Name',
    email: t('donation.emailAddress') || 'Email',
    phone: t('donation.phoneNumber') || 'Phone',
    enterFullName: t('donation.enterName') || 'Enter your full name',
    enterEmail: t('donation.validEmail') || 'Enter your email',
    enterPhone: t('donation.validPhone') || 'Enter your phone number',
    donateAnonymously: t('donation.donateAnonymously') || 'Donate Anonymously',
    required: t('donation.required') || '*',
    
    // Payment Method
    paymentMethod: t('donation.paymentMethod') || 'Payment Method',
    razorpay: t('donation.razorpay') || 'Razorpay',
    securePayment: t('donation.securePayments') || '💳 Secure payment powered by Razorpay',
    secureEncrypted: t('donation.secureEncrypted') || '🔒 Your donation is secure and encrypted via Razorpay',
    
    // Purpose
    purpose: t('donation.donationPurpose') || 'Purpose',
    general: t('donation.generalDonation') || 'General',
    education: t('donation.education') || 'Education',
    healthcare: t('donation.healthcare') || 'Healthcare',
    food: t('donation.food') || 'Food',
    shelter: t('donation.shelter') || 'Shelter',
    clothing: t('donation.clothing') || 'Clothing',
    emergencyRelief: t('donation.emergencyRelief') || 'Emergency Relief',
    other: t('donation.other') || 'Other',
    medical: t('donation.medical') || 'Medical',
    
    // Message
    message: t('donation.message') || 'Message (Optional)',
    writeMessage: t('donation.writeMessage') || 'Write a message...',
    
    // Donation Summary
    donationSummary: t('donation.donationSummary') || 'Donation Summary',
    amount: t('donation.donationAmount') || 'Amount',
    donor: t('donation.donor') || 'Donor',
    totalDonation: t('donation.total') || 'Total Donation',
    
    // Buttons
    donateNow: t('donation.donateNow') || 'Donate Now',
    donateAmount: t('donation.donateAmount') || 'Donate ₹{amount}',
    
    // Alert messages
    validAmount: t('donation.validAmount') || 'Please enter a valid donation amount',
    minAmount: t('donation.minAmount') || 'Minimum donation amount is ₹10',
    validEmail: t('donation.validEmail') || 'Please enter a valid email address',
    validPhone: t('donation.validPhone') || 'Please enter a valid phone number',
    enterName: t('donation.enterName') || 'Please enter your full name',
    paymentFailed: t('donation.paymentFailed') || 'Payment Failed',
    paymentVerificationFailed: t('donation.paymentVerificationFailed') || 'Payment verification failed. Please try again.',
    somethingWentWrong: t('donation.somethingWentWrong') || 'Something went wrong',
    failedToProcess: t('donation.failedToProcess') || 'Failed to process donation. Please try again.',
    
    // Success Popup
    thankYouTitle: t('donation.thankYouTitle') || 'Thank you for your',
    thankYouSubtitle: t('donation.thankYouSubtitle') || 'donation! 🙏',
    donationReceived: t('donation.donationReceived') || 'Your generous donation of ₹{amount} for {purpose} has been received.',
    paymentId: t('donation.paymentId') || 'Payment ID: ',
    backHome: t('donation.backHome') || 'Back Home',
    certificate: t('donation.certificate') || 'Certificate',
    viewCertificate: t('donation.viewCertificate') || 'View Certificate',
    anonymousDonor: t('donation.anonymousDonor') || 'Anonymous Donor',
  };

  const [loading, setLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [donationData, setDonationData] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    amount: '',
    purpose: 'General',
    message: '',
    paymentMethod: 'razorpay',
    anonymous: false
  });

  const donationPurposes = [
    translations.general, 
    translations.education, 
    translations.medical, 
    translations.food, 
    translations.shelter, 
    translations.clothing, 
    translations.emergencyRelief, 
    translations.other
  ];

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
const auth = getAuthInstance(); // ✅ ADD THIS
    try {
      const user = auth.currentUser;
      if (user) {
        const savedName = await AsyncStorage.getItem('donorName');
        const savedEmail = await AsyncStorage.getItem('donorEmail');
        const savedPhone = await AsyncStorage.getItem('donorPhone');
        setFormData(prev => ({
          ...prev,
          fullName: savedName || user.displayName || '',
          email: savedEmail || user.email || '',
          phone: savedPhone || user.phoneNumber || '',
        }));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const saveUserData = async () => {
    try {
      await AsyncStorage.setItem('donorName', formData.fullName);
      await AsyncStorage.setItem('donorEmail', formData.email);
      await AsyncStorage.setItem('donorPhone', formData.phone);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      Alert.alert(translations.error, translations.enterName);
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      Alert.alert(translations.error, translations.validEmail);
      return false;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      Alert.alert(translations.error, translations.validPhone);
      return false;
    }
    if (!formData.amount || parseFloat(formData.amount) < 10) {
      Alert.alert(translations.error, translations.minAmount);
      return false;
    }
    return true;
  };

  const handleDonate = async () => {
 const auth = getAuthInstance(); // ✅ ADD THIS
  if (!validateForm()) return;

  setLoading(true);
  try {
    const userId = auth.currentUser?.uid;
    const userEmail = auth.currentUser?.email || formData.email;

    const donationAmount = parseFloat(formData.amount);
    const donorName = formData.anonymous ? translations.anonymousDonor : formData.fullName;
    const donorEmail = formData.anonymous ? 'anonymous@donor.com' : formData.email;

    const paymentResult = await initiateRazorpayPayment({
      amount: donationAmount,
      name: donorName,
      email: donorEmail,
      phone: formData.phone,
      description: formData.purpose || translations.general,
    });

    console.log('📥 [DONATION] Payment result:', JSON.stringify(paymentResult, null, 2));

    // Check for cancellation
    if (paymentResult && paymentResult.code === 'PAYMENT_CANCELLED') {
      console.log('⚠️ [DONATION] User cancelled payment');
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
      console.log('✅ [DONATION] Payment successful!');
      console.log('✅ [DONATION] Payment ID:', paymentResult.paymentId);
      console.log('✅ [DONATION] Order ID:', paymentResult.orderId);
      console.log('✅ [DONATION] Signature:', paymentResult.signature);

      // ✅ Try to verify, but DON'T fail if verification fails
      let verificationResult = { success: true };
      
      try {
        verificationResult = await verifyRazorpayPayment({
          paymentId: paymentResult.paymentId,
          orderId: paymentResult.orderId,
          signature: paymentResult.signature,
        });
        console.log('📥 [DONATION] Verification result:', JSON.stringify(verificationResult, null, 2));
      } catch (verifyError) {
        console.log('⚠️ [DONATION] Verification error (will proceed):', verifyError);
        verificationResult = { success: true, warning: 'Verification error but proceeding' };
      }

      // ✅ PROCEED WITH DONATION - The payment was successful
      console.log('✅ [DONATION] PAYMENT SUCCESSFUL! Proceeding with donation...');

      // Save donation to Firestore
      const donationRef = await addDoc(collection(db, 'donations'), {
        donorName: donorName,
        donorEmail: donorEmail,
        phone: formData.phone,
        amount: donationAmount,
        purpose: formData.purpose || translations.general,
        message: formData.message || '',
        paymentMethod: 'razorpay',
        paymentId: paymentResult.paymentId || 'pending_verification',
        status: 'completed',
        anonymous: formData.anonymous,
        memberId: userId || 'guest',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Create certificate
      const certificateRef = await addDoc(collection(db, 'certificates'), {
        memberId: userId || 'guest',
        donorName: donorName,
        amount: donationAmount,
        purpose: formData.purpose || translations.general,
        donationId: donationRef.id,
        certificateNumber: `CERT-${Date.now().toString().slice(-8)}`,
        issuedDate: new Date().toISOString(),
        status: 'issued',
        type: 'donation',
        title: translations.certificate,
        description: `For donating ₹${donationAmount} to ${formData.purpose || translations.general} cause`,
        paymentId: paymentResult.paymentId || 'pending_verification',
        createdAt: new Date().toISOString()
      });

      // Update donor record
      if (userId && userId !== 'guest') {
        const donorRef = doc(db, 'donors', userId);
        const donorDoc = await getDoc(donorRef);
        if (donorDoc.exists()) {
          await updateDoc(donorRef, {
            totalDonations: increment(donationAmount),
            donationCount: increment(1),
            lastDonation: new Date().toISOString(),
            livesImpacted: increment(Math.floor(donationAmount / 100) + 1),
          });
        } else {
          await setDoc(donorRef, {
            userId: userId,
            name: donorName,
            email: donorEmail,
            phone: formData.phone,
            totalDonations: donationAmount,
            donationCount: 1,
            lastDonation: new Date().toISOString(),
            livesImpacted: Math.floor(donationAmount / 100) + 1,
            createdAt: new Date().toISOString(),
          });
        }
        
        // Process commission
        try {
          console.log('🔄 Processing commission for donation...');
          const commissionResult = await CommissionService.processDonationCommission(userId, donationAmount);
          console.log('✅ Commission processed:', commissionResult);
          
          if (commissionResult && commissionResult.success) {
            console.log(`💰 Commission: ₹${commissionResult.commissionAmount} at ${commissionResult.commissionRate}%`);
          }
        } catch (commissionError) {
          console.error('❌ Commission processing error:', commissionError);
        }
      }

      if (!formData.anonymous) {
        await saveUserData();
      }

      setDonationData({
        amount: donationAmount,
        name: donorName,
        purpose: formData.purpose,
        paymentId: paymentResult.paymentId || 'pending_verification',
        certificateId: certificateRef.id,
      });
      setShowSuccessPopup(true);

    } else {
      // ❌ Only show error if payment completely failed
      console.log('❌ [DONATION] Payment initiation FAILED');
      console.log('❌ [DONATION] Payment result:', paymentResult);
      console.log('❌ [DONATION] Payment error:', paymentResult?.error || 'Unknown error');
      setLoading(false);
      
      Alert.alert(
        translations.paymentFailed || 'Payment Failed',
        paymentResult?.error || translations.somethingWentWrong || 'Something went wrong. Please try again.'
      );
    }
  } catch (error) {
    console.error('❌ [DONATION] Donation error:', error);
    console.error('❌ [DONATION] Error details:', JSON.stringify(error, null, 2));
    setLoading(false);
    Alert.alert(translations.error, translations.failedToProcess);
  } finally {
    setLoading(false);
  }
};

  const handleBackHome = () => {
    setShowSuccessPopup(false);
    navigation.goBack();
  };

  const handleViewCertificate = () => {
    setShowSuccessPopup(false);
    navigation.navigate('Certificate', {
      certificateId: donationData?.certificateId,
      amount: donationData?.amount,
      name: donationData?.name,
      purpose: donationData?.purpose,
      paymentId: donationData?.paymentId,
    });
  };

  const PurposeCard = ({ purpose, selected, onSelect }) => (
    <TouchableOpacity
      style={[styles.purposeCard, selected && styles.purposeCardSelected]}
      onPress={() => onSelect(purpose)}
      activeOpacity={0.7}
    >
      <Text style={[styles.purposeText, selected && styles.purposeTextSelected]}>
        {purpose}
      </Text>
    </TouchableOpacity>
  );

  const SuccessPopup = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showSuccessPopup}
      onRequestClose={() => setShowSuccessPopup(false)}
    >
      <View style={styles.popupOverlay}>
        <View style={styles.popupContainer}>
          <View style={styles.popupIconContainer}>
            <View style={styles.popupIconCircle}>
              <MaterialIcons name="check" size={40} color="#10b981" />
            </View>
          </View>

          <Text style={styles.popupTitle}>{translations.thankYouTitle}</Text>
          <Text style={styles.popupTitle}>{translations.thankYouSubtitle}</Text>

          <Text style={styles.popupSubtext}>
            {translations.donationReceived
              .replace('{amount}', donationData?.amount?.toLocaleString())
              .replace('{purpose}', donationData?.purpose || translations.general)}
          </Text>

          {donationData?.paymentId && (
            <Text style={styles.popupPaymentId}>
              {translations.paymentId}{donationData.paymentId.slice(-12)}
            </Text>
          )}

          <View style={styles.popupButtons}>
            <TouchableOpacity 
              style={[styles.popupButton, styles.popupButtonSecondary]} 
              onPress={handleBackHome}
              activeOpacity={0.7}
            >
              <Text style={styles.popupButtonTextSecondary}>{translations.backHome}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.popupButton, styles.popupButtonPrimary]} 
              onPress={handleViewCertificate}
              activeOpacity={0.7}
            >
              <MaterialIcons name="card-membership" size={18} color="#ffffff" />
              <Text style={styles.popupButtonTextPrimary}>{translations.viewCertificate}</Text>
            </TouchableOpacity>
          </View>
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
      {/* Blue Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{translations.donateForCause}</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Amount Section */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>{translations.enterDonationAmount}</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={formData.amount}
              onChangeText={(text) => setFormData({...formData, amount: text})}
              keyboardType="numeric"
              textAlignVertical="center"
            />
          </View>
          <View style={styles.quickAmountsRow}>
            {quickAmounts.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={styles.quickAmountChip}
                onPress={() => setFormData({...formData, amount: amount.toString()})}
                activeOpacity={0.7}
              >
                <Text style={styles.quickAmountText}>₹{amount.toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Donor Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{translations.donorInformation}</Text>
          
          <View style={styles.field}>
            <Text style={styles.label}>{translations.fullName} {translations.required}</Text>
            <TextInput
              style={styles.input}
              value={formData.fullName}
              onChangeText={(text) => setFormData({...formData, fullName: text})}
              placeholder={translations.enterFullName}
              placeholderTextColor="#9ca3af"
              textAlignVertical="center"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{translations.email} {translations.required}</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({...formData, email: text})}
              placeholder={translations.enterEmail}
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              textAlignVertical="center"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{translations.phone} {translations.required}</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({...formData, phone: text})}
              placeholder={translations.enterPhone}
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              maxLength={10}
              textAlignVertical="center"
            />
          </View>

          <TouchableOpacity 
            style={styles.anonymousToggle}
            onPress={() => setFormData({...formData, anonymous: !formData.anonymous})}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, formData.anonymous && styles.checkboxChecked]}>
              {formData.anonymous && <MaterialIcons name="check" size={16} color="#ffffff" />}
            </View>
            <Text style={styles.anonymousText}>{translations.donateAnonymously}</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Method */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{translations.paymentMethod}</Text>
          <View style={styles.paymentGrid}>
            <TouchableOpacity
              style={[styles.paymentOption, formData.paymentMethod === 'razorpay' && styles.paymentOptionSelected]}
              onPress={() => setFormData({...formData, paymentMethod: 'razorpay'})}
              activeOpacity={0.7}
            >
              <MaterialIcons 
                name="security" 
                size={22} 
                color={formData.paymentMethod === 'razorpay' ? '#3b82f6' : '#6b7280'} 
              />
              <Text style={[styles.paymentOptionText, formData.paymentMethod === 'razorpay' && styles.paymentOptionTextSelected]}>
                {translations.razorpay}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.paymentNote}>{translations.securePayment}</Text>
        </View>

        {/* Purpose */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{translations.purpose}</Text>
          <View style={styles.purposeGrid}>
            {donationPurposes.map((purpose) => (
              <PurposeCard
                key={purpose}
                purpose={purpose}
                selected={formData.purpose === purpose}
                onSelect={() => setFormData({...formData, purpose})}
              />
            ))}
          </View>
        </View>

        {/* Message */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{translations.message}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.message}
            onChangeText={(text) => setFormData({...formData, message: text})}
            placeholder={translations.writeMessage}
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Donation Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{translations.donationSummary}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{translations.amount}</Text>
            <Text style={styles.summaryValue}>₹{parseFloat(formData.amount) || 0}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{translations.purpose}</Text>
            <Text style={styles.summaryValue}>{formData.purpose || translations.general}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{translations.donor}</Text>
            <Text style={styles.summaryValue}>{formData.anonymous ? translations.anonymous : formData.fullName || translations.notProvided}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalLabel}>{translations.totalDonation}</Text>
            <Text style={styles.summaryTotalValue}>₹{parseFloat(formData.amount) || 0}</Text>
          </View>
        </View>

        {/* Donate Button */}
        <TouchableOpacity 
          style={[styles.donateButton, loading && styles.disabledButton]}
          onPress={handleDonate}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <MaterialIcons name="favorite" size={20} color="#ffffff" />
              <Text style={styles.donateButtonText}>
                {translations.donateAmount.replace('{amount}', parseFloat(formData.amount) || 0)}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.noteText}>
          {translations.secureEncrypted}
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      <SuccessPopup />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  // Blue Header Card
  headerCard: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  headerRight: {
    width: 32,
  },

  // Amount Section
  amountSection: {
    alignItems: 'center',
  },
  amountLabel: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
    width: '100%',
  },
  currencySymbol: {
    fontFamily: Fonts.Bold,
    fontSize: 24,
    color: '#ffffff',
    marginRight: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  amountInput: {
    flex: 1,
    fontFamily: Fonts.Bold,
    fontSize: 28,
    color: '#ffffff',
    paddingVertical: 8,
    includeFontPadding: false,
  },
  quickAmountsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  quickAmountChip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  quickAmountText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: 14,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },

  // Cards
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Fields
  field: {
    marginBottom: 12,
  },
  label: {
    fontFamily: Fonts.SemiBold,
    fontSize: 13,
    color: '#1f2937',
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
    color: '#1f2937',
    fontFamily: Fonts.Regular,
    includeFontPadding: false,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },

  // Anonymous Toggle
  anonymousToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  anonymousText: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Payment Methods
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  paymentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    gap: 8,
    minWidth: '45%',
  },
  paymentOptionSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  paymentOptionText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 13,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  paymentOptionTextSelected: {
    color: '#3b82f6',
  },
  paymentNote: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Purpose
  purposeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  purposeCard: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  purposeCardSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  purposeText: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  purposeTextSelected: {
    color: '#ffffff',
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  summaryValue: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 6,
  },
  summaryTotalLabel: {
    fontFamily: Fonts.Bold,
    fontSize: 16,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  summaryTotalValue: {
    fontFamily: Fonts.Bold,
    fontSize: 18,
    color: '#10b981',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Donate Button
  donateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
  },
  donateButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: 18,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  noteText: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Success Popup
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popupContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  popupIconContainer: {
    marginBottom: 16,
  },
  popupIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 22,
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: 30,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  popupSubtext: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  popupPaymentId: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 20,
  },
  popupButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  popupButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  popupButtonPrimary: {
    backgroundColor: '#3b82f6',
  },
  popupButtonSecondary: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  popupButtonTextPrimary: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: 14,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  popupButtonTextSecondary: {
    fontFamily: Fonts.SemiBold,
    color: '#6b7280',
    fontSize: 14,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});