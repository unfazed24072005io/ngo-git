// components/IDCardWithTemplate.js
import React from 'react';
import { View, Image, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
  let scaledSize = size * scale;
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

// Get card width based on device
const getCardWidth = () => {
  if (isWeb) return Math.min(width * 0.5, 500);
  if (isTablet) return width * 0.7;
  return width - 32;
};

const CARD_WIDTH = getCardWidth();
const CARD_HEIGHT = CARD_WIDTH * 0.62; // Maintain aspect ratio

const IDCardWithTemplate = ({ formData, userData }) => {
  return (
    <View style={styles.cardWrapper}>
      <View style={[styles.card, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
        {/* Background PNG Template */}
        <Image 
          source={require('../../assets/images/id-card-template.png')}
          style={[styles.templateImage, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
          resizeMode="stretch"
        />
        
        {/* Overlay Text */}
        <View style={[styles.overlay, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
          
          
          
          {/* Personal Details - Left Side */}
          <View style={styles.detailsContainer}>
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldValue, { fontSize: responsiveFont(12) }]} numberOfLines={1}>
                {formData.fullName || 'N/A'}
              </Text>
            </View>
            
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldValue, { fontSize: responsiveFont(12) }]} numberOfLines={1}>
                {formData.fatherName || 'N/A'}
              </Text>
            </View>
            
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldValue, { fontSize: responsiveFont(12) }]} numberOfLines={1}>
                {formData.dob || 'N/A'}
              </Text>
            </View>
            
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldValue, { fontSize: responsiveFont(12) }]} numberOfLines={1}>
                {formData.aadharNumber || 'N/A'}
              </Text>
            </View>
            
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldValue, styles.statusValue, { fontSize: responsiveFont(12) }]} numberOfLines={1}>
                {formData.membershipStatus || 'Active'}
              </Text>
            </View>
            
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldValue, { fontSize: responsiveFont(12) }]} numberOfLines={1}>
                {formData.phone || 'N/A'}
              </Text>
            </View>
            
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldValue, { fontSize: responsiveFont(11) }]} numberOfLines={2}>
                {formData.address || 'N/A'}
              </Text>
            </View>
          </View>
          
          {/* Photo - Right Side */}
          <View style={styles.photoContainer}>
            {formData.profilePhoto ? (
              <Image 
                source={{ uri: formData.profilePhoto }} 
                style={[styles.photo, { width: responsiveWidth(75), height: responsiveHeight(95) }]}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.photoPlaceholder, { width: responsiveWidth(75), height: responsiveHeight(95) }]}>
                <Text style={{ color: '#9ca3af', fontSize: responsiveFont(10) }}>No Photo</Text>
              </View>
            )}
            <Text style={[styles.photoLabel, { fontSize: responsiveFont(8) }]}>फोटो</Text>
          </View>
          
          {/* Footer - Bottom */}
          <View style={styles.footerContainer}>
            <Text style={[styles.footerText, { fontSize: responsiveFont(10) }]}>प्रबंधक</Text>
            <View style={styles.signatureContainer}>
              <View style={[styles.signatureLine, { width: responsiveWidth(55) }]} />
              <Text style={[styles.signatureLabel, { fontSize: responsiveFont(8) }]}>सदस्य हस्ताक्षर</Text>
            </View>
            <Text style={[styles.footerText, { fontSize: responsiveFont(10) }]}>सचिव</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    alignItems: 'center',
    marginVertical: responsiveHeight(12),
    width: '100%',
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  templateImage: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: responsiveWidth(16),
    width: '100%',
    height: '100%',
  },
  orgName: {
    fontFamily: 'sans-serif',
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginTop: responsiveHeight(4),
    marginBottom: responsiveHeight(2),
  },
  orgSub: {
    fontFamily: 'sans-serif',
    fontWeight: 'normal',
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: responsiveHeight(1),
  },
  orgRegNo: {
    fontFamily: 'sans-serif',
    fontWeight: 'normal',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: responsiveHeight(4),
  },
  idTitleContainer: {
    alignItems: 'center',
    marginVertical: responsiveHeight(6),
    paddingVertical: responsiveHeight(4),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#d1d5db',
  },
  idTitle: {
    fontFamily: 'sans-serif',
    fontWeight: 'bold',
    color: '#1f2937',
    letterSpacing: 2,
  },
  detailsContainer: {
    position: 'absolute',
    left: responsiveWidth(100),    // ← CHANGE THIS to move all fields right
    top: responsiveHeight(120),   // ← CHANGE THIS to move all fields down
    width: '62%',                 // ← CHANGE THIS to adjust width
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: responsiveHeight(3),
    alignItems: 'center',
  },
  fieldLabel: {
    fontWeight: 'bold',
    color: '#4b5563',
    width: '32%',                // ← CHANGE THIS to adjust label width
    marginRight: responsiveWidth(4),
  },
  fieldValue: {
    color: '#1f2937',
    flex: 1,
  },
  statusValue: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  photoContainer: {
    position: 'absolute',
    right: responsiveWidth(25),   // ← CHANGE THIS to move photo left/right
    top: '35%',                   // ← CHANGE THIS to move photo up/down
    alignItems: 'center',
  },
  photo: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  photoPlaceholder: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoLabel: {
    color: '#6b7280',
    marginTop: responsiveHeight(2),
  },
  footerContainer: {
    position: 'absolute',
    bottom: responsiveHeight(15),
    left: responsiveWidth(20),
    right: responsiveWidth(20),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: responsiveHeight(8),
  },
  footerText: {
    fontWeight: 'bold',
    color: '#4b5563',
  },
  signatureContainer: {
    alignItems: 'center',
  },
  signatureLine: {
    height: 1,
    backgroundColor: '#9ca3af',
    marginBottom: responsiveHeight(2),
  },
  signatureLabel: {
    color: '#6b7280',
  },
});

export default IDCardWithTemplate;