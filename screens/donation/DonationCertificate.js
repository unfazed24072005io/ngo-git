// screens/donation/DonationCertificate.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, 
  Alert, ActivityIndicator, Share, RefreshControl, Modal, Platform 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db, getAuthInstance } from '../../config/firebase';
import { collection, getDocs, query, where, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { Fonts } from '../../config/fonts';
import { getDonationHistory, getDonationById } from '../../services/paymentService';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../../context/LanguageContext';

export default function DonationCertificate({ navigation }) {
  const { t, counter } = useLanguage();
  
  // Force re-render when language changes
  const renderKey = `certificate-${counter}`;

  // Get translations
  const getTranslations = () => ({
    myCertificates: t('certificate.myCertificates') || 'My Certificates',
    total: t('common.total') || 'Total',
    totalDonated: t('certificate.totalDonated') || 'Total Donated',
    donations: t('certificate.donations') || 'Donations',
    noCertificates: t('certificate.noCertificates') || 'No certificates yet',
    earnFirstCertificate: t('certificate.earnFirstCertificate') || 'Make a donation to earn your first certificate',
    makeDonation: t('certificate.makeDonation') || 'Make a Donation',
    certificateDetails: t('certificate.details') || 'Certificate Details',
    issuedTo: t('certificate.issuedTo') || 'Issued To',
    type: t('common.type') || 'Type',
    amount: t('certificate.amount') || 'Amount',
    paymentId: t('certificate.paymentId') || 'Payment ID',
    purpose: t('certificate.purpose') || 'Purpose',
    issuedDate: t('certificate.issuedDate') || 'Issued Date',
    share: t('common.share') || 'Share',
    shareCertificate: t('certificate.shareCertificate') || 'Share Certificate',
    shareAsText: t('certificate.shareAsText') || 'Share as Text',
    shareAsHTML: t('certificate.shareAsHTML') || 'Share as HTML',
    donation: t('certificate.donation') || 'Donation',
    achievement: t('certificate.achievement') || 'Achievement',
    milestone: t('certificate.milestone') || 'Milestone',
    certificate: t('certificate.certificate') || 'Certificate',
    ofAppreciation: t('certificate.ofAppreciation') || 'of Appreciation',
    presentedTo: t('certificate.presentedTo') || 'This certificate is proudly presented to',
    recognition: t('certificate.recognition') || 'in recognition of their generous contribution of',
    forPurpose: t('certificate.forPurpose') || 'for the purpose of',
    generosityQuote: t('certificate.generosityQuote') || '"Your generosity transforms lives and builds a better tomorrow."',
    issuedOn: t('certificate.issuedOn') || 'Issued on:',
    certificateNo: t('certificate.certificateNo') || 'Certificate No:',
    sharingNotAvailable: t('certificate.sharingNotAvailable') || 'Sharing is not available on this device',
    failedToShare: t('certificate.failedToShare') || 'Failed to share certificate. Please try again.',
    loadingCertificates: t('certificate.loading') || 'Loading Certificates...',
    nA: t('common.nA') || 'N/A',
    generalDonation: t('donation.generalDonation') || 'General Donation',
    verifiedByRazorpay: t('certificate.verifiedByRazorpay') || 'Verified by Razorpay',
    certificateOf: t('certificate.certificateOf') || 'Certificate of',
    est: t('certificate.est') || 'Est.',
  });

  const translations = getTranslations();

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [selectedCert, setSelectedCert] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    donationCerts: 0,
    achievementCerts: 0,
    totalAmount: 0
  });

  useEffect(() => {
    fetchData();
    setupRealtimeListener();
  }, []);

  const setupRealtimeListener = () => {
const auth = getAuthInstance(); 
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const q = query(
      collection(db, 'donationCertificates'),
      where('donorId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const certList = [];
      snapshot.forEach((doc) => {
        certList.push({ id: doc.id, ...doc.data() });
      });
      
      const localHistory = getDonationHistory();
      const localCerts = localHistory.map(donation => ({
        id: `local_${donation.paymentId}`,
        type: 'donation',
        title: 'Donation Certificate',
        donorName: donation.name,
        amount: donation.amount,
        purpose: donation.description || translations.generalDonation,
        paymentId: donation.paymentId,
        issuedDate: donation.timestamp,
        status: 'issued',
        isLocal: true,
        certificateNumber: donation.paymentId 
          ? `CERT-${donation.paymentId.slice(-8)}` 
          : `CERT-${Date.now().toString().slice(-8)}`,
      }));
      
      const allCerts = [...certList, ...localCerts];
      setCertificates(allCerts);
      
      const donationCerts = allCerts.filter(c => c.type === 'donation').length;
      const achievementCerts = allCerts.filter(c => c.type === 'achievement').length;
      const totalAmount = allCerts.reduce((sum, c) => sum + (c.amount || 0), 0);
      
      setStats({
        total: allCerts.length,
        donationCerts: donationCerts,
        achievementCerts: achievementCerts,
        totalAmount: totalAmount
      });
      
      setLoading(false);
    });

    return () => unsubscribe();
  };

  const fetchData = async () => {
const auth = getAuthInstance(); // ✅ ADD THIS
    setLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        setLoading(false);
        return;
      }

      const userDoc = await getDoc(doc(db, 'donors', userId));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }

      const certSnap = await getDocs(query(
        collection(db, 'donationCertificates'),
        where('donorId', '==', userId)
      ));
      
      const certList = [];
      certSnap.forEach((doc) => {
        certList.push({ id: doc.id, ...doc.data() });
      });
      
      const localHistory = getDonationHistory();
      const localCerts = localHistory.map(donation => ({
        id: `local_${donation.paymentId}`,
        type: 'donation',
        title: 'Donation Certificate',
        donorName: donation.name,
        amount: donation.amount,
        purpose: donation.description || translations.generalDonation,
        paymentId: donation.paymentId,
        issuedDate: donation.timestamp,
        status: 'issued',
        isLocal: true,
        certificateNumber: donation.paymentId 
          ? `CERT-${donation.paymentId.slice(-8)}` 
          : `CERT-${Date.now().toString().slice(-8)}`,
      }));
      
      const allCerts = [...certList, ...localCerts];
      setCertificates(allCerts);
      
      const donationCerts = allCerts.filter(c => c.type === 'donation').length;
      const achievementCerts = allCerts.filter(c => c.type === 'achievement').length;
      const totalAmount = allCerts.reduce((sum, c) => sum + (c.amount || 0), 0);
      
      setStats({
        total: allCerts.length,
        donationCerts: donationCerts,
        achievementCerts: achievementCerts,
        totalAmount: totalAmount
      });
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const generateHTMLCertificate = (cert) => {
    const donorName = cert.donorName || userData?.fullName || 'Donor';
    const amount = cert.amount || 0;
    const purpose = cert.purpose || translations.generalDonation;
    const date = cert.issuedDate ? new Date(cert.issuedDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }) : new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    const certNumber = cert.certificateNumber || `CERT-${Date.now().toString().slice(-8)}`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Georgia', serif;
      background: #f5f0eb;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      margin: 0;
    }
    .certificate-wrapper {
      background: white;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.15);
      max-width: 800px;
      width: 100%;
    }
    .certificate {
      border: 8px double #10b981;
      padding: 40px;
      text-align: center;
      background: #fafafa;
      position: relative;
    }
    .certificate::before {
      content: '';
      position: absolute;
      top: 15px;
      left: 15px;
      right: 15px;
      bottom: 15px;
      border: 2px solid #10b981;
      opacity: 0.2;
    }
    .header h1 {
      font-size: 48px;
      color: #10b981;
      font-weight: bold;
      letter-spacing: 6px;
      font-family: 'Georgia', serif;
      margin-bottom: 5px;
    }
    .header .subtitle {
      font-size: 20px;
      color: #666;
      letter-spacing: 4px;
      font-style: italic;
    }
    .divider {
      width: 60%;
      height: 2px;
      background: #10b981;
      margin: 20px auto;
      opacity: 0.3;
    }
    .cert-body {
      margin: 30px 0;
    }
    .cert-body p {
      font-size: 18px;
      color: #333;
      line-height: 2;
      font-family: 'Georgia', serif;
    }
    .donor-name {
      font-size: 40px;
      font-weight: bold;
      color: #1a1a2e;
      margin: 15px 0;
      font-family: 'Georgia', serif;
      letter-spacing: 2px;
    }
    .amount {
      font-size: 32px;
      font-weight: bold;
      color: #10b981;
      margin: 10px 0;
    }
    .purpose {
      font-size: 22px;
      color: #555;
      margin: 10px 0;
      font-style: italic;
    }
    .quote {
      margin-top: 20px;
      font-style: italic;
      color: #666;
      font-size: 16px;
    }
    .footer {
      margin-top: 30px;
    }
    .footer .cert-number {
      font-size: 12px;
      color: #999;
      margin-top: 10px;
      font-family: monospace;
    }
    .footer .date {
      font-size: 16px;
      color: #555;
    }
    .seal {
      margin: 20px auto;
      width: 90px;
      height: 90px;
      border-radius: 50%;
      border: 4px solid #10b981;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #10b981;
      font-size: 13px;
      font-weight: bold;
      text-align: center;
      background: #f0fdf4;
      line-height: 1.3;
    }
    .seal span {
      display: block;
      font-size: 10px;
      font-weight: normal;
      color: #666;
    }
    @media print {
      body { background: white; padding: 0; }
      .certificate-wrapper { box-shadow: none; border-radius: 0; }
    }
    @media (max-width: 600px) {
      .certificate-wrapper { padding: 15px; }
      .certificate { padding: 20px; }
      .header h1 { font-size: 28px; }
      .donor-name { font-size: 24px; }
      .amount { font-size: 22px; }
    }
  </style>
</head>
<body>
  <div class="certificate-wrapper">
    <div class="certificate">
      <div class="header">
        <h1>🏆 ${translations.certificate}</h1>
        <div class="subtitle">${translations.ofAppreciation}</div>
      </div>
      
      <div class="divider"></div>
      
      <div class="cert-body">
        <p>${translations.presentedTo}</p>
        <div class="donor-name">${donorName}</div>
        <p>${translations.recognition}</p>
        <div class="amount">₹${amount.toLocaleString()}</div>
        <p>${translations.forPurpose}</p>
        <div class="purpose">${purpose}</div>
        <div class="quote">
          ${translations.generosityQuote}
        </div>
      </div>
      
      <div class="divider"></div>
      
      <div class="footer">
        <div class="seal">
          NGO<br>App Fresh
          <span>${translations.est} 2024</span>
        </div>
        <div class="date">${translations.issuedOn} ${date}</div>
        <div class="cert-number">${translations.certificateNo} ${certNumber}</div>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  };

  const shareCertificateAsHTML = async (cert) => {
    setGeneratingPDF(true);
    try {
      const html = generateHTMLCertificate(cert);
      const filePath = FileSystem.documentDirectory + `certificate_${Date.now()}.html`;
      
      await FileSystem.writeAsStringAsync(filePath, html);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/html',
          dialogTitle: translations.shareCertificate,
        });
      } else {
        Alert.alert(translations.error, translations.sharingNotAvailable);
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert(translations.error, translations.failedToShare);
    } finally {
      setGeneratingPDF(false);
    }
  };

  const shareAsText = async (cert) => {
    try {
      const donorName = cert.donorName || userData?.fullName || 'Donor';
      const amount = cert.amount || 0;
      const purpose = cert.purpose || translations.generalDonation;
      const date = cert.issuedDate ? new Date(cert.issuedDate).toLocaleDateString() : new Date().toLocaleDateString();
      
      const message = `🏆 ${translations.certificate} ${translations.ofAppreciation} 🏆

${translations.presentedTo}

${donorName}

${translations.recognition}

₹${amount.toLocaleString()}

${translations.forPurpose}

${purpose}

${translations.generosityQuote}

${translations.issuedOn} ${date}
${translations.certificateNo} ${cert.certificateNumber || translations.nA}

#NGOAppFresh #Donation #GiveBack`;

      await Share.share({
        message: message,
        title: translations.shareCertificate,
      });
    } catch (error) {
      Alert.alert(translations.error, translations.failedToShare);
    }
  };

  const handleShare = async (cert) => {
    Alert.alert(
      translations.shareCertificate,
      translations.howWouldYouLike || 'How would you like to share?',
      [
        { text: translations.cancel || 'Cancel', style: 'cancel' },
        { text: translations.shareAsText, onPress: () => shareAsText(cert) },
        { text: translations.shareAsHTML, onPress: () => shareCertificateAsHTML(cert) },
      ]
    );
  };

  const getCertificateIcon = (type) => {
    switch(type) {
      case 'donation': return 'favorite';
      case 'achievement': return 'emoji-events';
      case 'milestone': return 'stars';
      default: return 'verified';
    }
  };

  const getCertificateColor = (type) => {
    switch(type) {
      case 'donation': return '#10b981';
      case 'achievement': return '#8b5cf6';
      case 'milestone': return '#f59e0b';
      default: return '#3b82f6';
    }
  };

  const getCertificateBgColor = (type) => {
    switch(type) {
      case 'donation': return '#10b98115';
      case 'achievement': return '#8b5cf615';
      case 'milestone': return '#f59e0b15';
      default: return '#3b82f615';
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'donation': return translations.donation;
      case 'achievement': return translations.achievement;
      case 'milestone': return translations.milestone;
      default: return translations.certificate;
    }
  };

  const CertificateCard = ({ cert }) => (
    <TouchableOpacity 
      style={styles.certCard}
      onPress={() => {
        setSelectedCert(cert);
        setDetailModalVisible(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.certHeader}>
        <View style={[styles.certIcon, { backgroundColor: getCertificateBgColor(cert.type) }]}>
          <MaterialIcons name={getCertificateIcon(cert.type)} size={22} color={getCertificateColor(cert.type)} />
        </View>
        <View style={styles.certInfo}>
          <Text style={styles.certTitle} numberOfLines={1}>{cert.title || `${getTypeLabel(cert.type)} ${translations.certificate}`}</Text>
          <Text style={styles.certDate}>
            {cert.issuedDate ? new Date(cert.issuedDate).toLocaleDateString() : translations.nA}
          </Text>
        </View>
        {cert.isLocal && (
          <View style={[styles.certStatus, { backgroundColor: '#3b82f6' }]}>
            <Text style={styles.certStatusText}>{translations.razorpay || 'Razorpay'}</Text>
          </View>
        )}
      </View>
      
      {cert.purpose && (
        <Text style={styles.certPurpose} numberOfLines={1}>{translations.purpose}: {cert.purpose}</Text>
      )}
      
      {cert.amount && (
        <View style={styles.certAmountBadge}>
          <Text style={styles.certAmountText}>₹{cert.amount.toLocaleString()}</Text>
        </View>
      )}
      
      <View style={styles.certActions}>
        <TouchableOpacity style={styles.certAction} onPress={() => handleShare(cert)} activeOpacity={0.7}>
          <MaterialIcons name="share" size={18} color="#10b981" />
          <Text style={styles.certActionText}>{translations.share}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer} key={renderKey}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>{translations.loadingCertificates}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} key={renderKey}>
      {/* Green Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{translations.myCertificates}</Text>
          <View style={{ width: 32 }} />
        </View>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{stats.total}</Text>
          <Text style={styles.summaryLabel}>{translations.total}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>₹{stats.totalAmount.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>{translations.totalDonated}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{stats.donationCerts}</Text>
          <Text style={styles.summaryLabel}>{translations.donations}</Text>
        </View>
      </View>

      {/* Certificate List */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
        }
        contentContainerStyle={styles.listContent}
      >
        {certificates.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="verified" size={44} color="#d1d5db" />
            <Text style={styles.emptyStateText}>{translations.noCertificates}</Text>
            <Text style={styles.emptyStateSubtext}>{translations.earnFirstCertificate}</Text>
            <TouchableOpacity 
              style={styles.donateButton}
              onPress={() => navigation.navigate('DonateScreen')}
              activeOpacity={0.7}
            >
              <MaterialIcons name="favorite" size={20} color="#ffffff" />
              <Text style={styles.donateButtonText}>{translations.makeDonation}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          certificates.map((cert) => (
            <CertificateCard key={cert.id} cert={cert} />
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{translations.certificateDetails}</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)} activeOpacity={0.7}>
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {selectedCert && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailCertificate}>
                  <View style={[styles.detailIcon, { backgroundColor: getCertificateBgColor(selectedCert.type) }]}>
                    <MaterialIcons name={getCertificateIcon(selectedCert.type)} size={40} color={getCertificateColor(selectedCert.type)} />
                  </View>
                  <Text style={styles.detailTitle}>{selectedCert.title || translations.certificate}</Text>
                  <Text style={styles.detailNumber}>{selectedCert.certificateNumber || translations.nA}</Text>
                  {selectedCert.isLocal && (
                    <View style={styles.detailRazorpayBadge}>
                      <MaterialIcons name="security" size={14} color="#3b82f6" />
                      <Text style={styles.detailRazorpayText}>{translations.verifiedByRazorpay}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.issuedTo}</Text>
                  <Text style={styles.detailValue}>{selectedCert.donorName || userData?.fullName || translations.nA}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.type}</Text>
                  <Text style={styles.detailValue}>{getTypeLabel(selectedCert.type)}</Text>
                </View>

                {selectedCert.amount && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>{translations.amount}</Text>
                    <Text style={styles.detailValue}>₹{selectedCert.amount.toLocaleString()}</Text>
                  </View>
                )}

                {selectedCert.paymentId && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>{translations.paymentId}</Text>
                    <Text style={[styles.detailValue, styles.detailCode]}>{selectedCert.paymentId}</Text>
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.purpose}</Text>
                  <Text style={styles.detailValue}>{selectedCert.purpose || translations.generalDonation}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{translations.issuedDate}</Text>
                  <Text style={styles.detailValue}>
                    {selectedCert.issuedDate ? new Date(selectedCert.issuedDate).toLocaleString() : translations.nA}
                  </Text>
                </View>

                <View style={styles.detailActions}>
                  <TouchableOpacity 
                    style={[styles.detailActionButton, styles.detailShareButton]} 
                    onPress={() => handleShare(selectedCert)}
                    disabled={generatingPDF}
                    activeOpacity={0.7}
                  >
                    {generatingPDF ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <MaterialIcons name="share" size={20} color="#ffffff" />
                        <Text style={styles.detailActionText}>{translations.share}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  // Green Header
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

  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryValue: {
    fontFamily: Fonts.Bold,
    fontSize: 20,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  summaryLabel: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 4,
  },

  certCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  certHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  certIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  certInfo: {
    flex: 1,
  },
  certTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 15,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  certDate: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  certStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  certStatusText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: 9,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  certPurpose: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
    marginLeft: 52,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  certAmountBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginLeft: 52,
    marginBottom: 8,
  },
  certAmountText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  certActions: {
    flexDirection: 'row',
    gap: 16,
    marginLeft: 52,
  },
  certAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  certActionText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    color: '#10b981',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyStateText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  emptyStateSubtext: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  donateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  donateButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: 14,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Modal
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
    maxHeight: '85%',
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
  detailCertificate: {
    alignItems: 'center',
    marginBottom: 16,
  },
  detailIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 18,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  detailNumber: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  detailRazorpayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    gap: 4,
  },
  detailRazorpayText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 11,
    color: '#3b82f6',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  detailSection: {
    marginBottom: 12,
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
  detailCode: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#6b7280',
  },
  detailActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  detailActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    flex: 1,
  },
  detailShareButton: {
    backgroundColor: '#10b981',
  },
  detailActionText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: 14,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});