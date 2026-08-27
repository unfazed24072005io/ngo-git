// screens/admin/CommissionManagement.js
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Dimensions,
  FlatList,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db, auth, getAuthInstance } from '../../config/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  getDocs,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  runTransaction,
  Timestamp,
  increment,
  deleteDoc
} from 'firebase/firestore';
import { Fonts } from '../../config/fonts';
import { CommissionService } from '../../services/CommissionService';
import { WalletService } from '../../services/WalletService';
import { PayoutService } from '../../services/PayoutService';
import { 
  getLevelDetails, 
  LEVELS,
  getLevelByDonations,
  isEligibleForPromotion,
  getPromotionRequirements
} from '../../config/commissionLevels';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../context/LanguageContext';


const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;

// ============ LevelEditModal Component ============
const LevelEditModal = memo(({ 
  visible, 
  selectedLevel, 
  onClose, 
  onUpdateField, 
  onSave,
  onDelete,
  saving,
  isSmallDevice,
  formDataLevels,
  t
}) => {
  if (!selectedLevel) return null;

  const nextLevelIndex = formDataLevels.findIndex(l => l.id === selectedLevel.id) + 1;
  const nextLevel = nextLevelIndex < formDataLevels.length ? formDataLevels[nextLevelIndex] : null;

  const getDisplayValue = (value) => {
    if (value === Infinity) return '∞';
    if (value === '' || value === null || value === undefined) return '';
    return String(value);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { fontSize: isSmallDevice ? 16 : 18 }]}>
              {t('commission.editLevel') || 'Edit Level'}: {selectedLevel.id}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalBody}>
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>
                  {t('common.levelName') || 'Level Name'}
                </Text>
                <TextInput
                  style={[styles.fieldInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                  value={selectedLevel.name || ''}
                  onChangeText={(text) => onUpdateField('name', text)}
                  placeholder={t('common.enterLevelName') || 'Enter level name'}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>
                  {t('commission.directCommission') || 'Direct Commission (%)'}
                </Text>
                <TextInput
                  style={[styles.fieldInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                  value={getDisplayValue(selectedLevel.directCommission)}
                  onChangeText={(text) => onUpdateField('directCommission', text)}
                  keyboardType="numeric"
                  placeholder={t('commission.enterDirectCommission') || 'Enter direct commission'}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>
                  {t('commission.secondaryCommission') || 'Secondary Commission (%)'}
                </Text>
                <TextInput
                  style={[styles.fieldInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                  value={getDisplayValue(selectedLevel.secondaryCommission)}
                  onChangeText={(text) => onUpdateField('secondaryCommission', text)}
                  keyboardType="numeric"
                  placeholder={t('commission.enterSecondaryCommission') || 'Enter secondary commission'}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.sectionDivider}>
                <Text style={[styles.sectionDividerText, { fontSize: isSmallDevice ? 13 : 14 }]}>
                  💰 {t('commission.donationRequirements') || 'Donation Requirements'}
                </Text>
              </View>

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>
                  {t('commission.minDonations') || 'Min Donations (₹)'}
                </Text>
                <TextInput
                  style={[styles.fieldInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                  value={getDisplayValue(selectedLevel.minDonations)}
                  onChangeText={(text) => onUpdateField('minDonations', text)}
                  keyboardType="numeric"
                  placeholder={t('commission.enterMinDonations') || 'Enter min donations'}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>
                  {t('commission.maxDonations') || 'Max Donations (₹)'}
                </Text>
                <TextInput
                  style={[styles.fieldInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                  value={getDisplayValue(selectedLevel.maxDonations)}
                  onChangeText={(text) => onUpdateField('maxDonations', text)}
                  placeholder={t('commission.enterMaxDonations') || 'Enter max donations (∞ for unlimited)'}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>
                  {t('commission.donationsRequiredForPromotion') || 'Donations Required for Promotion (₹)'}
                </Text>
                <TextInput
                  style={[styles.fieldInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                  value={getDisplayValue(selectedLevel.donationsRequiredForPromotion)}
                  onChangeText={(text) => onUpdateField('donationsRequiredForPromotion', text)}
                  placeholder={t('commission.enterDonationsRequired') || 'Enter donations required (∞ for no promotion)'}
                  placeholderTextColor="#9ca3af"
                />
                {nextLevel && (
                  <Text style={[styles.helperText, { fontSize: isSmallDevice ? 10 : 11 }]}>
                    {t('commission.nextLevelRequires') || 'Next level'}: {nextLevel.name} {t('commission.requiresDonations') || 'requires ₹'}{nextLevel.minDonations?.toLocaleString()} {t('commission.inDonations') || 'in donations'}
                  </Text>
                )}
              </View>

              <View style={styles.sectionDivider}>
                <Text style={[styles.sectionDividerText, { fontSize: isSmallDevice ? 13 : 14 }]}>
                  🏆 {t('commission.levelPrize') || 'Level Prize'}
                </Text>
              </View>

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>
                  {t('commission.prizeAmount') || 'Prize Amount (₹)'}
                </Text>
                <TextInput
                  style={[styles.fieldInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                  value={getDisplayValue(selectedLevel.prizeAmount)}
                  onChangeText={(text) => onUpdateField('prizeAmount', text)}
                  keyboardType="numeric"
                  placeholder={t('commission.enterPrizeAmount') || 'Enter prize amount for completing this level'}
                  placeholderTextColor="#9ca3af"
                />
                <Text style={[styles.helperText, { fontSize: isSmallDevice ? 10 : 11 }]}>
                  {t('commission.prizeDescription') || 'This prize will be awarded when a member reaches this level'}
                </Text>
              </View>

              <View style={styles.modalButtonRow}>
                {formDataLevels.length > 1 && (
                  <TouchableOpacity
                    style={[styles.deleteLevelButton, { flex: 1 }]}
                    onPress={onDelete}
                  >
                    <MaterialIcons name="delete" size={20} color="#ef4444" />
                    <Text style={[styles.deleteLevelButtonText, { fontSize: isSmallDevice ? 14 : 16 }]}>
                      {t('common.delete') || 'Delete'}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.updateLevelButton, { flex: 1 }]}
                  onPress={onSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={[styles.updateLevelButtonText, { fontSize: isSmallDevice ? 14 : 16 }]}>
                      {t('common.updateLevel') || 'Update Level'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});

// ============ MemberFeeEditModal Component ============
const MemberFeeEditModal = memo(({ 
  visible, 
  selectedMemberType, 
  onClose, 
  onSave,
  saving,
  isSmallDevice,
  t
}) => {
  const [fee, setFee] = useState('');

  useEffect(() => {
    if (selectedMemberType) {
      setFee(String(selectedMemberType.fee || 0));
    }
  }, [selectedMemberType]);

  if (!selectedMemberType) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { fontSize: isSmallDevice ? 16 : 18 }]}>
              Edit Registration Fee: {selectedMemberType.label}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>
                Registration Fee (₹)
              </Text>
              <TextInput
                style={[styles.fieldInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                value={fee}
                onChangeText={setFee}
                keyboardType="numeric"
                placeholder="Enter registration fee"
                placeholderTextColor="#9ca3af"
              />
              <Text style={[styles.helperText, { fontSize: isSmallDevice ? 10 : 11 }]}>
                This fee will be displayed during registration for {selectedMemberType.label}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.updateLevelButton, saving && styles.saveButtonDisabled]}
              onPress={() => onSave(selectedMemberType.id, parseFloat(fee) || 0)}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={[styles.updateLevelButtonText, { fontSize: isSmallDevice ? 14 : 16 }]}>
                  Update Fee
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

// ============ Main Component ============
export default function CommissionManagement({ navigation }) {
  const { t, counter } = useLanguage();
  
  const renderKey = `commission-${counter}`;

  // ============ State Declarations ============
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedMemberType, setSelectedMemberType] = useState(null);
  const [memberFeeModalVisible, setMemberFeeModalVisible] = useState(false);
  const [memberFees, setMemberFees] = useState({});
  const [commissionData, setCommissionData] = useState(null);
  const [pendingPayouts, setPendingPayouts] = useState([]);
  const [memberTypes, setMemberTypes] = useState([]);
  const [memberTypeModalVisible, setMemberTypeModalVisible] = useState(false);
  const [editingMemberType, setEditingMemberType] = useState(null);
  const [newMemberTypeName, setNewMemberTypeName] = useState('');
  const [newMemberTypeFee, setNewMemberTypeFee] = useState('');
  const [isAddingMemberType, setIsAddingMemberType] = useState(false);
  const [pendingPromotions, setPendingPromotions] = useState([]);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [payoutModalVisible, setPayoutModalVisible] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNote, setPayoutNote] = useState('');
  const [stats, setStats] = useState({
    totalWorkingMembers: 0,
    totalCommissionPaid: 0,
    pendingCommission: 0,
    totalPayoutsThisMonth: 0,
    topEarners: [],
    totalDonationCommission: 0
  });
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [levelModalVisible, setLevelModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [selectedWorkingMember, setSelectedWorkingMember] = useState(null);
  const [memberPayoutModalVisible, setMemberPayoutModalVisible] = useState(false);
  const [promotionConfirmVisible, setPromotionConfirmVisible] = useState(false);
  const [pendingApproveData, setPendingApproveData] = useState(null);
  const [memberPayoutAmount, setMemberPayoutAmount] = useState('');
  const [editingLevelIndex, setEditingLevelIndex] = useState(null);
  const [donationStats, setDonationStats] = useState({
    totalDonationCommission: 0,
    totalDonations: 0,
    totalTransactions: 0
  });
  const [payoutLogs, setPayoutLogs] = useState([]);
  const [showPayoutLogs, setShowPayoutLogs] = useState(false);
  const [addLevelModalVisible, setAddLevelModalVisible] = useState(false);
  const [newLevelData, setNewLevelData] = useState({
    id: '',
    name: '',
    directCommission: '',
    secondaryCommission: '',
    minDonations: '',
    maxDonations: '',
    donationsRequiredForPromotion: '',
    prizeAmount: ''
  });

  const [formData, setFormData] = useState({
    levels: [
      { 
        id: 'I', 
        name: 'Customer', 
        directCommission: 25, 
        secondaryCommission: 10, 
        minDonations: 0,
        maxDonations: 9999,
        donationsRequiredForPromotion: 10000,
        prizeAmount: 0
      },
      { 
        id: 'II', 
        name: 'Executive', 
        directCommission: 35, 
        secondaryCommission: 5, 
        minDonations: 10000,
        maxDonations: 24999,
        donationsRequiredForPromotion: 25000,
        prizeAmount: 1000
      },
      { 
        id: 'III', 
        name: 'Manager', 
        directCommission: 40, 
        secondaryCommission: 2.5, 
        minDonations: 25000,
        maxDonations: 49999,
        donationsRequiredForPromotion: 50000,
        prizeAmount: 2500
      },
      { 
        id: 'IV', 
        name: 'Coordinator', 
        directCommission: 42.5, 
        secondaryCommission: 1.25, 
        minDonations: 50000,
        maxDonations: 99999,
        donationsRequiredForPromotion: 100000,
        prizeAmount: 5000
      },
      { 
        id: 'V', 
        name: 'Guide', 
        directCommission: 43.75, 
        secondaryCommission: 1.25, 
        minDonations: 100000,
        maxDonations: 249999,
        donationsRequiredForPromotion: 250000,
        prizeAmount: 10000
      },
      { 
        id: 'VI', 
        name: 'Leader', 
        directCommission: 44.5, 
        secondaryCommission: 0.75, 
        minDonations: 250000,
        maxDonations: 499999,
        donationsRequiredForPromotion: 500000,
        prizeAmount: 25000
      },
      { 
        id: 'VII', 
        name: 'Crown', 
        directCommission: 45, 
        secondaryCommission: 0.50, 
        minDonations: 500000,
        maxDonations: Infinity,
        donationsRequiredForPromotion: Infinity,
        prizeAmount: 50000
      }
    ],
    registrationFee: 1000,
    minWithdrawal: 100,
    maxWithdrawal: 100000,
    autoPromotionEnabled: true,
    promotionNotificationEnabled: true,
    autoPayoutEnabled: false,
    payoutThreshold: 500,
    donationCommissionEnabled: true,
    donationCommissionRate: 25,
    lastUpdated: null
  });

  // ============ Translations ============
  const getTranslations = () => ({
    commissionManagement: t('commission.management') || 'Commission Management',
    workingMembers: t('commission.workingMembers') || 'Working Members',
    totalPaid: t('commission.totalPaid') || 'Total Paid',
    pending: t('commission.pending') || 'Pending',
    payoutsThisMonth: t('commission.payoutsThisMonth') || 'Payouts This Month',
    donationCommissionStats: t('commission.donationCommissionStats') || 'Donation Commission Stats',
    totalCommission: t('commission.totalCommission') || 'Total Commission',
    totalDonations: t('commission.totalDonations') || 'Total Donations',
    transactions: t('commission.transactions') || 'Transactions',
    pendingPayouts: t('commission.pendingPayouts') || 'Pending Payouts',
    processAll: t('commission.processAll') || 'Process All',
    noPendingPayouts: t('commission.noPendingPayouts') || 'No pending payouts',
    allCommissionsPaid: t('commission.allCommissionsPaid') || 'All commissions have been paid',
    pendingPromotions: t('commission.pendingPromotions') || 'Pending Promotions',
    reject: t('common.reject') || 'Reject',
    approve: t('common.approve') || 'Approve',
    topEarners: t('commission.topEarners') || 'Top Earners',
    tapToPay: t('commission.tapToPay') || 'Tap to pay',
    levelsAndCommission: t('commission.levelsAndCommission') || 'Levels & Commission',
    level: t('common.level') || 'Level',
    type: t('common.type') || 'Type',
    direct: t('commission.direct') || 'Direct',
    secondary: t('commission.secondary') || 'Secondary',
    donationsReq: t('commission.donationsReq') || 'Donations Req',
    editLevelsHint: t('commission.editLevelsHint') || 'Tap on any level row to edit its details',
    quickSettings: t('commission.quickSettings') || 'Quick Settings',
    registrationFee: t('commission.registrationFee') || 'Registration Fee',
    minWithdrawal: t('commission.minWithdrawal') || 'Min Withdrawal',
    autoPromotion: t('commission.autoPromotion') || 'Auto Promotion',
    enabled: t('common.enabled') || 'Enabled',
    disabled: t('common.disabled') || 'Disabled',
    donationCommission: t('commission.donationCommission') || 'Donation Commission',
    lastUpdated: t('common.lastUpdated') || 'Last updated',
    processPayout: t('commission.processPayout') || 'Process Payout',
    pendingCommission: t('commission.pendingCommission') || 'Pending Commission',
    amountToPay: t('commission.amountToPay') || 'Amount to Pay (₹)',
    note: t('common.note') || 'Note (Optional)',
    addNote: t('common.addNote') || 'Add a note',
    payNow: t('commission.payNow') || 'Pay Now',
    payWorkingMember: t('commission.payWorkingMember') || 'Pay Working Member',
    totalEarned: t('commission.totalEarned') || 'Total Earned',
    editCommissionSettings: t('commission.editCommissionSettings') || 'Edit Commission Settings',
    editLevel: t('commission.editLevel') || 'Edit Level',
    levelName: t('common.levelName') || 'Level Name',
    enterLevelName: t('common.enterLevelName') || 'Enter level name',
    enterDirectCommission: t('commission.enterDirectCommission') || 'Enter direct commission',
    enterSecondaryCommission: t('commission.enterSecondaryCommission') || 'Enter secondary commission',
    donationRequirements: t('commission.donationRequirements') || 'Donation Requirements',
    minDonations: t('commission.minDonations') || 'Min Donations (₹)',
    maxDonations: t('commission.maxDonations') || 'Max Donations (₹)',
    enterMaxDonations: t('commission.enterMaxDonations') || 'Enter max donations (∞ for unlimited)',
    donationsRequiredForPromotion: t('commission.donationsRequiredForPromotion') || 'Donations Required for Promotion (₹)',
    enterDonationsRequired: t('commission.enterDonationsRequired') || 'Enter donations required (∞ for no promotion)',
    nextLevelRequires: t('commission.nextLevelRequires') || 'Next level',
    requiresDonations: t('commission.requiresDonations') || 'requires ₹',
    inDonations: t('commission.inDonations') || 'in donations',
    updateLevel: t('common.updateLevel') || 'Update Level',
    directCommission: t('commission.directCommission') || 'Direct Commission',
    secondaryCommission: t('commission.secondaryCommission') || 'Secondary Commission',
    loadingCommissionSettings: t('commission.loadingCommissionSettings') || 'Loading Commission Settings...',
    approvePromotion: t('commission.approvePromotion') || 'Approve Promotion',
    confirmPromote: t('commission.confirmPromote') || 'Are you sure you want to promote this member to',
    thisActionWillUpdate: t('commission.thisActionWillUpdate') || 'This action will update the member\'s level and grant them new commission rates.',
    processAllPayouts: t('commission.processAllPayouts') || 'Process All Payouts',
    confirmProcessAll: t('commission.confirmProcessAll') || 'Are you sure you want to process all',
    pendingPayoutsCount: t('commission.pendingPayoutsCount') || 'pending payouts?',
    total: t('common.total') || 'Total',
    bulkPayoutComplete: t('commission.bulkPayoutComplete') || 'Bulk Payout Complete',
    successful: t('commission.successful') || 'Successful',
    failed: t('commission.failed') || 'Failed',
    confirmPayout: t('commission.confirmPayout') || 'Confirm Payout',
    confirmPayoutMessage: t('commission.confirmPayoutMessage') || 'Are you sure you want to process ₹{amount} payout?\n\nThis will add the amount to the member\'s wallet balance.',
    payoutProcessed: t('commission.payoutProcessed') || '₹{amount} has been added to member\'s wallet',
    confirmPay: t('commission.confirmPay') || 'Confirm Pay',
    confirmPayMessage: t('commission.confirmPayMessage') || 'Are you sure you want to pay ₹{amount} to {name}?\n\nThis will add the amount to their wallet.',
    paidTo: t('commission.paidTo') || '₹{amount} paid to {name}',
    rejectPromotion: t('commission.rejectPromotion') || 'Reject Promotion',
    confirmReject: t('commission.confirmReject') || 'Are you sure you want to reject this promotion?',
    promotionRejected: t('commission.promotionRejected') || 'Promotion rejected',
    memberPromoted: t('commission.memberPromoted') || 'Member promoted to Level {level} successfully',
    levelUpdated: t('commission.levelUpdated') || 'Level updated successfully',
    settingsUpdated: t('commission.settingsUpdated') || 'Commission settings updated successfully',
    failedToLoad: t('common.failedToLoad') || 'Failed to load',
    error: t('common.error') || 'Error',
    success: t('common.success') || 'Success',
    invalidAmount: t('commission.invalidAmount') || 'Please enter a valid amount',
    amountExceeds: t('commission.amountExceeds') || 'Amount cannot exceed pending commission of ₹{amount}',
    noPendingPayoutsToProcess: t('commission.noPendingPayoutsToProcess') || 'No pending payouts to process',
    info: t('common.info') || 'Info',
    missingMember: t('commission.missingMember') || 'Missing member ID or level',
    addLevel: t('commission.addLevel') || 'Add Level',
    levelId: t('commission.levelId') || 'Level ID',
    enterLevelId: t('commission.enterLevelId') || 'Enter level ID (e.g., VIII)',
    prizeAmount: t('commission.prizeAmount') || 'Prize Amount (₹)',
    enterPrizeAmount: t('commission.enterPrizeAmount') || 'Enter prize amount',
    prizeDescription: t('commission.prizeDescription') || 'This prize will be awarded when a member reaches this level',
    levelPrize: t('commission.levelPrize') || 'Level Prize',
    prize: t('commission.prize') || 'Prize',
    dragToReorder: t('commission.dragToReorder') || 'Drag to reorder',
    addLevelDescription: t('commission.addLevelDescription') || 'Add a new level to the commission structure',
    deleteLevelConfirm: t('commission.deleteLevelConfirm') || 'Are you sure you want to delete this level? This action cannot be undone.',
    levelDeleted: t('commission.levelDeleted') || 'Level deleted successfully',
    levelAdded: t('commission.levelAdded') || 'Level added successfully',
    memberTypes: t('commission.memberTypes') || 'Member Types',
    addMemberType: t('commission.addMemberType') || 'Add Member Type',
    memberTypeName: t('commission.memberTypeName') || 'Member Type Name',
    enterMemberTypeName: t('commission.enterMemberTypeName') || 'Enter member type name',
    deleteMemberTypeConfirm: t('commission.deleteMemberTypeConfirm') || 'Are you sure you want to delete this member type?',
    memberTypeDeleted: t('commission.memberTypeDeleted') || 'Member type deleted successfully',
    memberTypeAdded: t('commission.memberTypeAdded') || 'Member type added successfully',
    memberTypeUpdated: t('commission.memberTypeUpdated') || 'Member type updated successfully',
    reorderHint: t('commission.reorderHint') || 'Press and hold the drag icon to reorder member types',
  });

  const translations = getTranslations();

  // ============ useEffect Hooks ============
  useEffect(() => {
    fetchCommissionData();
    fetchStats();
    setupPendingPayoutsListener();
    fetchDonationCommissionStats();
    fetchPendingPromotions();
    fetchPayoutLogs();
  }, []);

  useEffect(() => {
    const fees = {};
    memberTypes.forEach(type => {
      fees[type.id] = formData.memberFees?.[type.id] || type.defaultFee;
    });
    if (Object.keys(fees).length > 0) {
      setMemberFees(fees);
    }
  }, [memberTypes, formData.memberFees]);

  // ============ useCallback Hooks ============
  const updateLevelField = useCallback((field, value) => {
    if (!selectedLevel) return;
    
    setSelectedLevel(prev => {
      const updated = { ...prev };
      
      if (field === 'name') {
        updated.name = value;
        return updated;
      }
      
      if (value === '∞') {
        updated[field] = Infinity;
        return updated;
      }
      
      if (value === '' || value === null || value === undefined) {
        updated[field] = '';
        return updated;
      }
      
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        updated[field] = numValue;
      } else {
        updated[field] = value;
      }
      
      return updated;
    });
  }, [selectedLevel]);

  const getDisplayValue = useCallback((value) => {
    if (value === Infinity) return '∞';
    if (value === '' || value === null || value === undefined) return '';
    return String(value);
  }, []);

  // ============ Fetch Functions ============
  const fetchCommissionData = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'settings', 'commission');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCommissionData(data);
        
        if (data.memberTypes && data.memberTypes.length > 0) {
          setMemberTypes(data.memberTypes);
        } else {
          const defaultTypes = [
            { id: 'founder', label: 'Founder Member', defaultFee: 5000 },
            { id: 'collector', label: 'Collector Member', defaultFee: 3500 },
            { id: 'distinguished', label: 'Distinguished Member', defaultFee: 1500 },
            { id: 'lifetime', label: 'Lifetime Member', defaultFee: 2500 },
            { id: 'honored', label: 'Honored Member', defaultFee: 500 },
            { id: 'general', label: 'General Member', defaultFee: 100 }
          ];
          setMemberTypes(defaultTypes);
          await setDoc(docRef, { 
            ...data,
            memberTypes: defaultTypes,
            memberFees: data.memberFees || {}
          }, { merge: true });
        }
        
        if (data.memberFees) {
          setMemberFees(data.memberFees);
        } else {
          const defaultFees = {};
          memberTypes.forEach(type => {
            defaultFees[type.id] = type.defaultFee;
          });
          setMemberFees(defaultFees);
        }
        
        setFormData({
          levels: data.levels || formData.levels,
          memberFees: data.memberFees || {},
          memberTypes: data.memberTypes || memberTypes,
          registrationFee: data.registrationFee || 1000,
          minWithdrawal: data.minWithdrawal || 100,
          maxWithdrawal: data.maxWithdrawal || 100000,
          autoPromotionEnabled: data.autoPromotionEnabled !== undefined ? data.autoPromotionEnabled : true,
          promotionNotificationEnabled: data.promotionNotificationEnabled !== undefined ? data.promotionNotificationEnabled : true,
          autoPayoutEnabled: data.autoPayoutEnabled !== undefined ? data.autoPayoutEnabled : false,
          payoutThreshold: data.payoutThreshold || 500,
          donationCommissionEnabled: data.donationCommissionEnabled !== undefined ? data.donationCommissionEnabled : true,
          donationCommissionRate: data.donationCommissionRate || 25,
          lastUpdated: data.lastUpdated || null
        });
      } else {
        const defaultTypes = [
          { id: 'founder', label: 'Founder Member', defaultFee: 5000 },
          { id: 'collector', label: 'Collector Member', defaultFee: 3500 },
          { id: 'distinguished', label: 'Distinguished Member', defaultFee: 1500 },
          { id: 'lifetime', label: 'Lifetime Member', defaultFee: 2500 },
          { id: 'honored', label: 'Honored Member', defaultFee: 500 },
          { id: 'general', label: 'General Member', defaultFee: 100 }
        ];
        
        const defaultFees = {};
        defaultTypes.forEach(type => {
          defaultFees[type.id] = type.defaultFee;
        });
        
        setMemberTypes(defaultTypes);
        setMemberFees(defaultFees);
        
        await setDoc(doc(db, 'settings', 'commission'), { 
          ...formData,
          memberFees: defaultFees,
          memberTypes: defaultTypes
        });
      }
    } catch (error) {
      console.error('Error fetching commission data:', error);
      Alert.alert(translations.error, translations.failedToLoad);
    } finally {
      setLoading(false);
    }
  };

  const setupPendingPayoutsListener = () => {
    const q = query(
      collection(db, 'walletTransactions'),
      where('type', 'in', ['direct_commission', 'secondary_commission', 'donation_commission']),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const payouts = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        payouts.push({ id: doc.id, ...data });
      });
      setPendingPayouts(payouts);
    });

    return () => unsubscribe();
  };

  const fetchStats = async () => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('role', 'in', ['working', 'workingMember'])
      );
      const usersSnap = await getDocs(usersQuery);
      const workingMembers = usersSnap.size;

      const transactionsQuery = query(collection(db, 'walletTransactions'));
      const transactionsSnap = await getDocs(transactionsQuery);
      let totalPaid = 0;
      let pending = 0;

      transactionsSnap.forEach((doc) => {
        const data = doc.data();
        if (data.type === 'direct_commission' || data.type === 'secondary_commission' || data.type === 'donation_commission') {
          if (data.status === 'completed' || data.status === 'paid') {
            totalPaid += data.amount || 0;
          } else if (data.status === 'pending') {
            pending += data.amount || 0;
          }
        }
      });

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const monthQuery = query(
        collection(db, 'walletTransactions'),
        where('type', '==', 'withdrawal'),
        where('status', '==', 'completed'),
        where('createdAt', '>=', startOfMonth)
      );
      const monthSnap = await getDocs(monthQuery);
      let totalPayoutsThisMonth = 0;
      monthSnap.forEach((doc) => {
        totalPayoutsThisMonth += doc.data().amount || 0;
      });

      const topEarners = await CommissionService.getTopEarners(5);

      setStats({
        totalWorkingMembers: workingMembers,
        totalCommissionPaid: totalPaid,
        pendingCommission: pending,
        totalPayoutsThisMonth,
        topEarners
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchDonationCommissionStats = async () => {
    try {
      const q = query(
        collection(db, 'commissionLogs'),
        where('type', '==', 'donation_commission')
      );
      
      const snapshot = await getDocs(q);
      let totalDonationCommission = 0;
      let totalDonations = 0;
      let count = 0;
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        totalDonationCommission += data.commissionAmount || 0;
        totalDonations += data.donationAmount || 0;
        count++;
      });
      
      setDonationStats({
        totalDonationCommission,
        totalDonations,
        totalTransactions: count
      });
      
      const topEarners = await CommissionService.getTopEarners(5);
      setStats(prev => ({
        ...prev,
        topEarners
      }));
      
    } catch (error) {
      console.error('Error fetching donation stats:', error);
    }
  };

  const fetchPendingPromotions = async () => {
    try {
      const settingsRef = doc(db, 'settings', 'commission');
      const settingsSnap = await getDoc(settingsRef);
      let dynamicLevels = null;
      
      if (settingsSnap.exists()) {
        const settingsData = settingsSnap.data();
        if (settingsData.levels) {
          dynamicLevels = settingsData.levels;
        }
      }
      
      const levelsToUse = dynamicLevels || formData.levels;
      
      const usersQuery = query(
        collection(db, 'users'),
        where('role', 'in', ['working', 'workingMember'])
      );
      const usersSnap = await getDocs(usersQuery);
      
      const promotions = [];
      
      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;
        
        const donations = await CommissionService.getTotalDonationsByMember(userId);
        
        const currentLevel = userData.level || 'I';
        const currentLevelIndex = levelsToUse.findIndex(l => l.id === currentLevel);
        const currentLevelData = currentLevelIndex !== -1 ? levelsToUse[currentLevelIndex] : null;
        
        if (!currentLevelData) {
          continue;
        }
        
        const nextLevelIndex = currentLevelIndex + 1;
        const nextLevel = nextLevelIndex < levelsToUse.length ? levelsToUse[nextLevelIndex] : null;
        
        if (!nextLevel) {
          continue;
        }
        
        const donationsRequired = currentLevelData.donationsRequiredForPromotion || 0;
        const isEligible = donations >= donationsRequired;
        
        if (isEligible) {
          promotions.push({
            id: userId,
            name: userData.fullName || userData.name || 'Unknown',
            currentLevel: currentLevel,
            nextLevel: nextLevel.id,
            nextLevelName: nextLevel.name,
            totalDonations: donations,
            requiredDonations: donationsRequired,
            progress: Math.min((donations / (donationsRequired || 1)) * 100, 100),
            email: userData.email || '',
            phone: userData.phone || '',
            joinedDate: userData.createdAt || new Date().toISOString()
          });
        }
      }
      
      promotions.sort((a, b) => b.progress - a.progress);
      setPendingPromotions(promotions);
      
    } catch (error) {
      console.error('Error fetching pending promotions:', error);
    }
  };

  const fetchPayoutLogs = async () => {
    try {
      const logs = await PayoutService.getAllPayoutLogs(20);
      setPayoutLogs(logs);
    } catch (error) {
      console.error('Error fetching payout logs:', error);
    }
  };

  // ============ Member Type Functions ============
  const addMemberType = async () => {
    if (!newMemberTypeName.trim()) {
      Alert.alert('Error', 'Please enter a member type name');
      return;
    }
    
    if (!newMemberTypeFee || parseFloat(newMemberTypeFee) <= 0) {
      Alert.alert('Error', 'Please enter a valid fee amount');
      return;
    }

    setIsAddingMemberType(true);
    try {
      const newId = newMemberTypeName.toLowerCase().replace(/\s+/g, '_');
      const newType = {
        id: newId,
        label: newMemberTypeName.trim(),
        defaultFee: parseFloat(newMemberTypeFee)
      };
      
      const updatedTypes = [...memberTypes, newType];
      setMemberTypes(updatedTypes);
      
      const updatedFees = { ...memberFees, [newId]: parseFloat(newMemberTypeFee) };
      setMemberFees(updatedFees);
      
      const docRef = doc(db, 'settings', 'commission');
      await updateDoc(docRef, {
        memberTypes: updatedTypes,
        memberFees: updatedFees,
        lastUpdated: new Date().toISOString()
      });
      
      setNewMemberTypeName('');
      setNewMemberTypeFee('');
      setMemberTypeModalVisible(false);
      Alert.alert('Success', translations.memberTypeAdded);
    } catch (error) {
      console.error('Error adding member type:', error);
      Alert.alert('Error', error.message || 'Failed to add member type');
    } finally {
      setIsAddingMemberType(false);
    }
  };

  const saveMemberFee = async (memberTypeId, fee) => {
    setSaving(true);
    try {
      const updatedFees = { ...memberFees, [memberTypeId]: fee };
      setMemberFees(updatedFees);
      
      setFormData(prev => ({
        ...prev,
        memberFees: updatedFees
      }));
      
      const docRef = doc(db, 'settings', 'commission');
      await updateDoc(docRef, {
        memberFees: updatedFees,
        lastUpdated: new Date().toISOString()
      });
      
      setMemberFeeModalVisible(false);
      setSelectedMemberType(null);
      Alert.alert('Success', translations.memberTypeUpdated);
    } catch (error) {
      console.error('Error saving member fee:', error);
      Alert.alert('Error', error.message || 'Failed to save fee');
    } finally {
      setSaving(false);
    }
  };

  const deleteMemberType = (typeId) => {
    Alert.alert(
      'Delete Member Type',
      translations.deleteMemberTypeConfirm,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedTypes = memberTypes.filter(type => type.id !== typeId);
              setMemberTypes(updatedTypes);
              
              const updatedFees = { ...memberFees };
              delete updatedFees[typeId];
              setMemberFees(updatedFees);
              
              const docRef = doc(db, 'settings', 'commission');
              await updateDoc(docRef, {
                memberTypes: updatedTypes,
                memberFees: updatedFees,
                lastUpdated: new Date().toISOString()
              });
              
              Alert.alert('Success', translations.memberTypeDeleted);
            } catch (error) {
              console.error('Error deleting member type:', error);
              Alert.alert('Error', error.message || 'Failed to delete member type');
            }
          }
        }
      ]
    );
  };

  // ============ Level Functions ============
  const openLevelEditor = (index) => {
    setEditingLevelIndex(index);
    setSelectedLevel({ ...formData.levels[index] });
    setLevelModalVisible(true);
  };

  const saveLevelChanges = async () => {
    if (!selectedLevel || editingLevelIndex === null) return;
    
    setSaving(true);
    try {
      const level = { ...selectedLevel };
      const numericFields = ['directCommission', 'secondaryCommission', 'minDonations', 'maxDonations', 'donationsRequiredForPromotion', 'prizeAmount'];
      
      for (const field of numericFields) {
        if (level[field] === '' || level[field] === null || level[field] === undefined) {
          level[field] = 0;
        }
        if (typeof level[field] === 'string' && level[field] !== '∞') {
          level[field] = parseFloat(level[field]) || 0;
        }
      }
      
      const newLevels = [...formData.levels];
      newLevels[editingLevelIndex] = level;
      
      setFormData(prev => ({
        ...prev,
        levels: newLevels
      }));
      
      setCommissionData(prev => ({
        ...prev,
        levels: newLevels,
        lastUpdated: new Date().toISOString()
      }));
      
      const docRef = doc(db, 'settings', 'commission');
      await updateDoc(docRef, {
        levels: newLevels,
        lastUpdated: new Date().toISOString()
      });
      
      setLevelModalVisible(false);
      setEditingLevelIndex(null);
      setSelectedLevel(null);
      
      Alert.alert(translations.success, translations.levelUpdated);
      await fetchCommissionData();
      
    } catch (error) {
      console.error('Error saving level:', error);
      Alert.alert(translations.error, error.message || 'Failed to save level');
    } finally {
      setSaving(false);
    }
  };

  const deleteLevel = async () => {
    if (!selectedLevel || editingLevelIndex === null) return;
    
    Alert.alert(
      'Delete Level',
      translations.deleteLevelConfirm,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              const newLevels = formData.levels.filter((_, index) => index !== editingLevelIndex);
              
              setFormData(prev => ({
                ...prev,
                levels: newLevels
              }));
              
              const docRef = doc(db, 'settings', 'commission');
              await updateDoc(docRef, {
                levels: newLevels,
                lastUpdated: new Date().toISOString()
              });
              
              setLevelModalVisible(false);
              setEditingLevelIndex(null);
              setSelectedLevel(null);
              
              Alert.alert(translations.success, translations.levelDeleted);
              await fetchCommissionData();
            } catch (error) {
              console.error('Error deleting level:', error);
              Alert.alert(translations.error, error.message || 'Failed to delete level');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const addLevel = async () => {
    if (!newLevelData.id.trim()) {
      Alert.alert('Error', 'Please enter a level ID');
      return;
    }
    if (!newLevelData.name.trim()) {
      Alert.alert('Error', 'Please enter a level name');
      return;
    }
    
    const levelId = newLevelData.id.trim().toUpperCase();
    
    // Check if level already exists
    if (formData.levels.some(l => l.id === levelId)) {
      Alert.alert('Error', `Level ${levelId} already exists`);
      return;
    }
    
    setSaving(true);
    try {
      const newLevel = {
        id: levelId,
        name: newLevelData.name.trim(),
        directCommission: parseFloat(newLevelData.directCommission) || 0,
        secondaryCommission: parseFloat(newLevelData.secondaryCommission) || 0,
        minDonations: parseFloat(newLevelData.minDonations) || 0,
        maxDonations: parseFloat(newLevelData.maxDonations) || Infinity,
        donationsRequiredForPromotion: parseFloat(newLevelData.donationsRequiredForPromotion) || Infinity,
        prizeAmount: parseFloat(newLevelData.prizeAmount) || 0
      };
      
      const newLevels = [...formData.levels, newLevel];
      newLevels.sort((a, b) => {
        // Sort by minDonations
        return (a.minDonations || 0) - (b.minDonations || 0);
      });
      
      setFormData(prev => ({
        ...prev,
        levels: newLevels
      }));
      
      const docRef = doc(db, 'settings', 'commission');
      await updateDoc(docRef, {
        levels: newLevels,
        lastUpdated: new Date().toISOString()
      });
      
      setAddLevelModalVisible(false);
      setNewLevelData({
        id: '',
        name: '',
        directCommission: '',
        secondaryCommission: '',
        minDonations: '',
        maxDonations: '',
        donationsRequiredForPromotion: '',
        prizeAmount: ''
      });
      
      Alert.alert(translations.success, translations.levelAdded);
      await fetchCommissionData();
      
    } catch (error) {
      console.error('Error adding level:', error);
      Alert.alert(translations.error, error.message || 'Failed to add level');
    } finally {
      setSaving(false);
    }
  };

  // ============ Drag and Drop Functions ============
  
  // ============ Payout Functions ============
  const processPayout = async () => {
    if (!selectedPayout) return;
    
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
      Alert.alert(translations.error, translations.invalidAmount);
      return;
    }

    const amount = parseFloat(payoutAmount);
    const maxAmount = selectedPayout.amount || 0;

    if (amount > maxAmount) {
      Alert.alert(
        translations.error, 
        translations.amountExceeds.replace('{amount}', maxAmount.toLocaleString())
      );
      return;
    }

    Alert.alert(
      translations.confirmPayout,
      translations.confirmPayoutMessage.replace('{amount}', amount.toLocaleString()),
      [
        { text: translations.cancel || 'Cancel', style: 'cancel' },
        {
          text: translations.processPayout,
          onPress: async () => {
            setSaving(true);
            try {
              const result = await PayoutService.processCommissionPayout(
                selectedPayout.id,
                amount,
                selectedPayout.userId
              );
              
              if (result.success) {
                Alert.alert(
                  translations.success, 
                  translations.payoutProcessed.replace('{amount}', amount.toLocaleString())
                );
                setPayoutModalVisible(false);
                setSelectedPayout(null);
                setPayoutAmount('');
                setPayoutNote('');
                await fetchStats();
                await fetchDonationCommissionStats();
                await fetchPayoutLogs();
              }
            } catch (error) {
              Alert.alert(translations.error, error.message || 'Failed to process payout');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const processAllPayouts = async () => {
    if (pendingPayouts.length === 0) {
      Alert.alert(translations.info, translations.noPendingPayoutsToProcess);
      return;
    }

    const totalAmount = pendingPayouts.reduce((sum, p) => sum + (p.amount || 0), 0);

    Alert.alert(
      translations.processAllPayouts,
      `${translations.confirmProcessAll} ${pendingPayouts.length} ${translations.pendingPayoutsCount}\n\n${translations.total}: ₹${totalAmount.toLocaleString()}`,
      [
        { text: translations.cancel || 'Cancel', style: 'cancel' },
        {
          text: translations.processAll,
          onPress: async () => {
            setSaving(true);
            try {
              const payouts = pendingPayouts.map(p => ({
                transactionId: p.id,
                memberId: p.userId,
                amount: p.amount || 0
              }));
              
              const results = await PayoutService.processBulkPayouts(payouts);
              
              Alert.alert(
                translations.bulkPayoutComplete,
                `✅ ${translations.successful}: ${results.success.length}\n❌ ${translations.failed}: ${results.failed.length}`
              );
              
              if (results.failed.length > 0) {
                console.log('Failed payouts:', results.failed);
              }
              
              await fetchStats();
              await fetchDonationCommissionStats();
              await fetchPayoutLogs();
            } catch (error) {
              Alert.alert(translations.error, error.message || 'Failed to process bulk payouts');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const processMemberPayout = async () => {
    if (!selectedWorkingMember) return;
    
    if (!memberPayoutAmount || parseFloat(memberPayoutAmount) <= 0) {
      Alert.alert(translations.error, translations.invalidAmount);
      return;
    }

    const amount = parseFloat(memberPayoutAmount);

    Alert.alert(
      translations.confirmPay,
      translations.confirmPayMessage
        .replace('{amount}', amount.toLocaleString())
        .replace('{name}', selectedWorkingMember.name),
      [
        { text: translations.cancel || 'Cancel', style: 'cancel' },
        {
          text: translations.payNow,
          onPress: async () => {
            setSaving(true);
            try {
              const result = await PayoutService.processPayout(
                selectedWorkingMember.id,
                amount,
                'manual_payout',
                `Manual payout by admin`
              );
              
              if (result.success) {
                Alert.alert(
                  translations.success, 
                  translations.paidTo
                    .replace('{amount}', amount.toLocaleString())
                    .replace('{name}', selectedWorkingMember.name)
                );
                setMemberPayoutModalVisible(false);
                setSelectedWorkingMember(null);
                setMemberPayoutAmount('');
                await fetchStats();
                await fetchDonationCommissionStats();
                await fetchPayoutLogs();
              }
            } catch (error) {
              Alert.alert(translations.error, error.message || 'Failed to process payout');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  // ============ Promotion Functions ============
  const approvePromotion = (memberId, nextLevel) => {
    if (!memberId || !nextLevel) {
      Alert.alert(translations.error, translations.missingMember);
      return;
    }

    setPendingApproveData({ memberId, nextLevel });
    setPromotionConfirmVisible(true);
  };

  const confirmApprovePromotion = async () => {
    const auth = getAuthInstance();
    if (!pendingApproveData) return;
    
    const { memberId, nextLevel } = pendingApproveData;
    
    setSaving(true);
    setPromotionConfirmVisible(false);
    
    try {
      const userRef = doc(db, 'users', memberId);
      await updateDoc(userRef, {
        level: nextLevel,
        promotedAt: new Date().toISOString(),
        promotionApprovedBy: auth.currentUser?.uid || 'admin',
        updatedAt: new Date().toISOString()
      });

      const promotionLogRef = collection(db, 'promotionLogs');
      await addDoc(promotionLogRef, {
        userId: memberId,
        newLevel: nextLevel,
        approvedBy: auth.currentUser?.uid || 'admin',
        approvedAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        status: 'approved'
      });

      Alert.alert(
        translations.success, 
        translations.memberPromoted.replace('{level}', nextLevel)
      );
      await fetchPendingPromotions();
      await fetchStats();
      
    } catch (error) {
      console.error('Error approving promotion:', error);
      Alert.alert(translations.error, error.message || 'Failed to approve promotion');
    } finally {
      setSaving(false);
      setPendingApproveData(null);
    }
  };

  const rejectPromotion = async (memberId) => {
    Alert.alert(
      translations.rejectPromotion,
      translations.confirmReject,
      [
        { text: translations.cancel || 'Cancel', style: 'cancel' },
        {
          text: translations.reject,
          style: 'destructive',
          onPress: async () => {
            const auth = getAuthInstance();
            setSaving(true);
            try {
              const rejectionRef = collection(db, 'promotionLogs');
              await addDoc(rejectionRef, {
                userId: memberId,
                status: 'rejected',
                rejectedBy: auth.currentUser?.uid || 'admin',
                rejectedAt: new Date().toISOString(),
                timestamp: new Date().toISOString()
              });
              
              Alert.alert(translations.success, translations.promotionRejected);
              await fetchPendingPromotions();
              
            } catch (error) {
              console.error('Error rejecting promotion:', error);
              Alert.alert(translations.error, error.message || 'Failed to reject promotion');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  // ============ Settings Save ============
  const handleSaveSettings = async () => {
    const auth = getAuthInstance();
    setSaving(true);
    try {
      const data = {
        levels: formData.levels,
        registrationFee: formData.registrationFee,
        minWithdrawal: formData.minWithdrawal,
        maxWithdrawal: formData.maxWithdrawal,
        autoPromotionEnabled: formData.autoPromotionEnabled,
        promotionNotificationEnabled: formData.promotionNotificationEnabled,
        autoPayoutEnabled: formData.autoPayoutEnabled,
        payoutThreshold: formData.payoutThreshold,
        donationCommissionEnabled: formData.donationCommissionEnabled,
        donationCommissionRate: formData.donationCommissionRate,
        lastUpdated: new Date().toISOString(),
        updatedBy: auth.currentUser?.uid || 'admin'
      };

      await setDoc(doc(db, 'settings', 'commission'), data, { merge: true });
      Alert.alert(translations.success, translations.settingsUpdated);
      setSettingsModalVisible(false);
      fetchCommissionData();
    } catch (error) {
      Alert.alert(translations.error, error.message);
    } finally {
      setSaving(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCommissionData();
    await fetchStats();
    await fetchDonationCommissionStats();
    await fetchPendingPromotions();
    await fetchPayoutLogs();
    setRefreshing(false);
  };

  // ============ Render Components ============
  const StatCard = ({ label, value, icon, color }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <MaterialIcons name={icon} size={isSmallDevice ? 16 : 20} color={color} />
      </View>
      <Text style={[styles.statValue, { fontSize: isSmallDevice ? 11 : 13 }]}>{value}</Text>
      <Text style={[styles.statLabel, { fontSize: isSmallDevice ? 7 : 8 }]}>{label}</Text>
    </View>
  );

  const DonationStatsCard = () => (
    <View style={styles.donationStatsCard}>
      <View style={styles.donationStatsHeader}>
        <MaterialIcons name="volunteer-activism" size={isSmallDevice ? 16 : 20} color="#f59e0b" />
        <Text style={[styles.donationStatsTitle, { fontSize: isSmallDevice ? 12 : 14 }]}>
          {translations.donationCommissionStats}
        </Text>
      </View>
      <View style={styles.donationStatsGrid}>
        <View style={styles.donationStatItem}>
          <Text style={[styles.donationStatValue, { fontSize: isSmallDevice ? 14 : 18 }]}>
            ₹{donationStats.totalDonationCommission.toLocaleString()}
          </Text>
          <Text style={[styles.donationStatLabel, { fontSize: isSmallDevice ? 9 : 11 }]}>
            {translations.totalCommission}
          </Text>
        </View>
        <View style={styles.donationStatDivider} />
        <View style={styles.donationStatItem}>
          <Text style={[styles.donationStatValue, { fontSize: isSmallDevice ? 14 : 18 }]}>
            ₹{donationStats.totalDonations.toLocaleString()}
          </Text>
          <Text style={[styles.donationStatLabel, { fontSize: isSmallDevice ? 9 : 11 }]}>
            {translations.totalDonations}
          </Text>
        </View>
        <View style={styles.donationStatDivider} />
        <View style={styles.donationStatItem}>
          <Text style={[styles.donationStatValue, { fontSize: isSmallDevice ? 14 : 18 }]}>
            {donationStats.totalTransactions}
          </Text>
          <Text style={[styles.donationStatLabel, { fontSize: isSmallDevice ? 9 : 11 }]}>
            {translations.transactions}
          </Text>
        </View>
      </View>
    </View>
  );

  const PayoutCard = ({ item }) => {
    const [userName, setUserName] = useState('Loading...');
    
    useEffect(() => {
      const fetchUser = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', item.userId));
          if (userDoc.exists()) {
            setUserName(userDoc.data().fullName || userDoc.data().name || 'Unknown');
          }
        } catch (error) {
          console.error('Error fetching user:', error);
        }
      };
      fetchUser();
    }, [item.userId]);

    const isDirect = item.type === 'direct_commission';
    const isDonation = item.type === 'donation_commission' || item.isDonation === true;
    const isSecondary = item.type === 'secondary_commission';

    return (
      <View style={[styles.payoutCard, isDonation && styles.donationPayoutCard]}>
        <View style={styles.payoutHeader}>
          <View style={styles.payoutUser}>
            <View style={[styles.payoutIcon, { 
              backgroundColor: isDonation ? '#fef3c7' : (isDirect ? '#8b5cf615' : '#10b98115') 
            }]}>
              <MaterialIcons 
                name={isDonation ? 'volunteer-activism' : (isDirect ? 'person-add' : 'share')} 
                size={isSmallDevice ? 14 : 18} 
                color={isDonation ? '#f59e0b' : (isDirect ? '#8b5cf6' : '#10b981')} 
              />
            </View>
            <View>
              <Text style={[styles.payoutUserName, { fontSize: isSmallDevice ? 11 : 13 }]}>{userName}</Text>
              <Text style={[styles.payoutType, { fontSize: isSmallDevice ? 9 : 10 }]}>
                {isDonation ? translations.donationCommission : (isDirect ? translations.directCommission : translations.secondaryCommission)}
              </Text>
            </View>
          </View>
          <View style={styles.payoutAmountContainer}>
            <Text style={[styles.payoutAmount, isDonation && styles.donationAmount, { fontSize: isSmallDevice ? 12 : 14 }]}>
              ₹{item.amount?.toLocaleString() || 0}
            </Text>
            <Text style={[styles.payoutDate, { fontSize: isSmallDevice ? 9 : 10 }]}>
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.payoutButton, isDonation && styles.donationPayoutButton]}
          onPress={() => {
            setSelectedPayout(item);
            setPayoutAmount(String(item.amount || 0));
            setPayoutModalVisible(true);
          }}
        >
          <MaterialIcons name="payment" size={isSmallDevice ? 12 : 16} color="#ffffff" />
          <Text style={[styles.payoutButtonText, { fontSize: isSmallDevice ? 10 : 11 }]}>
            {translations.processPayout}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const TopEarnerItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.topEarnerItem}
      onPress={() => {
        setSelectedWorkingMember(item);
        setMemberPayoutModalVisible(true);
      }}
    >
      <Text style={[styles.topEarnerRank, { fontSize: isSmallDevice ? 11 : 13 }]}>#{index + 1}</Text>
      <View style={styles.topEarnerInfo}>
        <Text style={[styles.topEarnerName, { fontSize: isSmallDevice ? 11 : 13 }]}>{item.name || 'Unknown'}</Text>
        <Text style={[styles.topEarnerLevel, { fontSize: isSmallDevice ? 9 : 10 }]}>
          {translations.level} {item.level || 'I'}
        </Text>
        {item.donationCommission > 0 && (
          <Text style={[styles.topEarnerDonation, { fontSize: isSmallDevice ? 9 : 10 }]}>
            ❤️ {translations.donationCommission}: ₹{item.donationCommission.toLocaleString()}
          </Text>
        )}
        {item.totalDonationsFromMembers > 0 && (
          <Text style={[styles.topEarnerTotalDonations, { fontSize: isSmallDevice ? 9 : 10 }]}>
            💰 {translations.totalDonations}: ₹{item.totalDonationsFromMembers.toLocaleString()}
          </Text>
        )}
      </View>
      <View style={styles.topEarnerRight}>
        <Text style={[styles.topEarnerAmount, { fontSize: isSmallDevice ? 11 : 13 }]}>
          ₹{item.totalEarned?.toLocaleString() || 0}
        </Text>
        <TouchableOpacity
          style={styles.payNowButton}
          onPress={() => {
            setSelectedWorkingMember(item);
            setMemberPayoutAmount('');
            setMemberPayoutModalVisible(true);
          }}
        >
          <Text style={[styles.payNowText, { fontSize: isSmallDevice ? 9 : 10 }]}>
            {translations.payNow}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  

  // ============ Level Edit Modal ============
  const levelEditModal = useMemo(() => (
    <LevelEditModal
      visible={levelModalVisible}
      selectedLevel={selectedLevel}
      onClose={() => {
        setLevelModalVisible(false);
        setEditingLevelIndex(null);
        setSelectedLevel(null);
      }}
      onUpdateField={updateLevelField}
      onSave={saveLevelChanges}
      onDelete={deleteLevel}
      saving={saving}
      isSmallDevice={isSmallDevice}
      formDataLevels={formData.levels}
      t={t}
    />
  ), [levelModalVisible, selectedLevel, updateLevelField, saveLevelChanges, deleteLevel, saving, formData.levels, t]);

  // ============ Settings Edit Modal ============
  const SettingsEditModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={settingsModalVisible}
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '95%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { fontSize: isSmallDevice ? 16 : 18 }]}>
                {translations.editCommissionSettings}
              </Text>
              <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalBody}>
                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>
                    {translations.registrationFee} (₹)
                  </Text>
                  <TextInput
                    style={[styles.fieldInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                    value={String(formData.registrationFee)}
                    onChangeText={(text) => setFormData({ ...formData, registrationFee: parseFloat(text) || 0 })}
                    keyboardType="numeric"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>
                    {translations.minWithdrawal} (₹)
                  </Text>
                  <TextInput
                    style={[styles.fieldInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                    value={String(formData.minWithdrawal)}
                    onChangeText={(text) => setFormData({ ...formData, minWithdrawal: parseFloat(text) || 0 })}
                    keyboardType="numeric"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>
                    {t('commission.maxWithdrawal') || 'Max Withdrawal'} (₹)
                  </Text>
                  <TextInput
                    style={[styles.fieldInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                    value={String(formData.maxWithdrawal)}
                    onChangeText={(text) => setFormData({ ...formData, maxWithdrawal: parseFloat(text) || 0 })}
                    keyboardType="numeric"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>
                    {t('commission.payoutThreshold') || 'Payout Threshold'} (₹)
                  </Text>
                  <TextInput
                    style={[styles.fieldInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                    value={String(formData.payoutThreshold)}
                    onChangeText={(text) => setFormData({ ...formData, payoutThreshold: parseFloat(text) || 0 })}
                    keyboardType="numeric"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View style={styles.sectionDivider}>
                  <Text style={[styles.sectionDividerText, { fontSize: isSmallDevice ? 13 : 14 }]}>
                    💝 {translations.donationCommission}
                  </Text>
                </View>

                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>
                    {t('commission.donationCommissionRate') || 'Donation Commission Rate (%)'}
                  </Text>
                  <TextInput
                    style={[styles.fieldInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                    value={String(formData.donationCommissionRate)}
                    onChangeText={(text) => setFormData({ ...formData, donationCommissionRate: parseFloat(text) || 0 })}
                    keyboardType="numeric"
                    placeholderTextColor="#9ca3af"
                  />
                  <Text style={[styles.helperText, { fontSize: isSmallDevice ? 10 : 11 }]}>
                    {t('commission.donationCommissionRateDesc') || 'Percentage of donation amount given as commission'}
                  </Text>
                </View>

                <View style={styles.switchRow}>
                  <Text style={[styles.switchLabel, { fontSize: isSmallDevice ? 13 : 14 }]}>
                    {translations.autoPromotion}
                  </Text>
                  <TouchableOpacity
                    style={[styles.switch, formData.autoPromotionEnabled && styles.switchActive]}
                    onPress={() => setFormData({ ...formData, autoPromotionEnabled: !formData.autoPromotionEnabled })}
                  >
                    <View style={[styles.switchThumb, formData.autoPromotionEnabled && styles.switchThumbActive]} />
                  </TouchableOpacity>
                </View>

                <View style={styles.switchRow}>
                  <Text style={[styles.switchLabel, { fontSize: isSmallDevice ? 13 : 14 }]}>
                    {t('commission.autoPayout') || 'Auto Payout'}
                  </Text>
                  <TouchableOpacity
                    style={[styles.switch, formData.autoPayoutEnabled && styles.switchActive]}
                    onPress={() => setFormData({ ...formData, autoPayoutEnabled: !formData.autoPayoutEnabled })}
                  >
                    <View style={[styles.switchThumb, formData.autoPayoutEnabled && styles.switchThumbActive]} />
                  </TouchableOpacity>
                </View>

                <View style={styles.switchRow}>
                  <Text style={[styles.switchLabel, { fontSize: isSmallDevice ? 13 : 14 }]}>
                    {translations.donationCommission}
                  </Text>
                  <TouchableOpacity
                    style={[styles.switch, formData.donationCommissionEnabled && styles.switchActive]}
                    onPress={() => setFormData({ ...formData, donationCommissionEnabled: !formData.donationCommissionEnabled })}
                  >
                    <View style={[styles.switchThumb, formData.donationCommissionEnabled && styles.switchThumbActive]} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                  onPress={handleSaveSettings}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <MaterialIcons name="save" size={20} color="#ffffff" />
                      <Text style={[styles.saveButtonText, { fontSize: isSmallDevice ? 14 : 16 }]}>
                        {t('common.saveAllSettings') || 'Save All Settings'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // ============ RENDER ============
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7722" />
        <Text style={[styles.loadingText, { fontSize: isSmallDevice ? 13 : 14 }]}>
          {translations.loadingCommissionSettings}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']} key={renderKey}>
      <View style={styles.container}>
        {/* Saffron Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { fontSize: isSmallDevice ? 18 : 20 }]}>
              {translations.commissionManagement}
            </Text>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => setSettingsModalVisible(true)}
              >
                <MaterialIcons name="settings" size={isSmallDevice ? 18 : 22} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF7722']} />
          }
        >
          {/* Stats Cards */}
          <View style={styles.statsGrid}>
            <StatCard
              label={translations.workingMembers}
              value={stats.totalWorkingMembers}
              icon="people"
              color="#8b5cf6"
            />
            <StatCard
              label={translations.totalPaid}
              value={`₹${stats.totalCommissionPaid.toLocaleString()}`}
              icon="attach-money"
              color="#10b981"
            />
            <StatCard
              label={translations.pending}
              value={`₹${stats.pendingCommission.toLocaleString()}`}
              icon="pending"
              color="#f59e0b"
            />
            <StatCard
              label={translations.payoutsThisMonth}
              value={`₹${stats.totalPayoutsThisMonth.toLocaleString()}`}
              icon="payment"
              color="#FF7722"
            />
          </View>

          {/* Donation Stats Card */}
          <DonationStatsCard />

          {/* Pending Payouts Section */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="payment" size={isSmallDevice ? 16 : 20} color="#FF7722" />
              <Text style={[styles.sectionTitle, { fontSize: isSmallDevice ? 13 : 15 }]}>
                {translations.pendingPayouts} ({pendingPayouts.length})
              </Text>
              {pendingPayouts.length > 0 && (
                <TouchableOpacity
                  style={styles.processAllButton}
                  onPress={processAllPayouts}
                  disabled={saving}
                >
                  <Text style={[styles.processAllText, { fontSize: isSmallDevice ? 10 : 11 }]}>
                    {translations.processAll}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {pendingPayouts.length > 0 ? (
              pendingPayouts.map((item) => (
                <PayoutCard key={item.id} item={item} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="check-circle" size={isSmallDevice ? 28 : 32} color="#10b981" />
                <Text style={[styles.emptyStateText, { fontSize: isSmallDevice ? 13 : 14 }]}>
                  {translations.noPendingPayouts}
                </Text>
                <Text style={[styles.emptyStateSubtext, { fontSize: isSmallDevice ? 10 : 11 }]}>
                  {translations.allCommissionsPaid}
                </Text>
              </View>
            )}
          </View>

          {/* Pending Promotions Section */}
          {pendingPromotions.length > 0 && (
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="stars" size={isSmallDevice ? 16 : 20} color="#fbbf24" />
                <Text style={[styles.sectionTitle, { fontSize: isSmallDevice ? 13 : 15 }]}>
                  {translations.pendingPromotions} ({pendingPromotions.length})
                </Text>
              </View>

              {pendingPromotions.map((item) => (
                <View key={item.id} style={styles.promotionCard}>
                  <View style={styles.promotionHeader}>
                    <View style={styles.promotionUser}>
                      <View style={styles.promotionAvatar}>
                        <Text style={[styles.promotionAvatarText, { fontSize: isSmallDevice ? 14 : 16 }]}>
                          {item.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={[styles.promotionName, { fontSize: isSmallDevice ? 11 : 13 }]}>{item.name}</Text>
                        <Text style={[styles.promotionDetails, { fontSize: isSmallDevice ? 10 : 11 }]}>
                          {translations.level} {item.currentLevel} → {translations.level} {item.nextLevel} ({item.nextLevelName})
                        </Text>
                        <Text style={[styles.promotionDonations, { fontSize: isSmallDevice ? 10 : 11 }]}>
                          ₹{item.totalDonations.toLocaleString()} / ₹{item.requiredDonations.toLocaleString()} {translations.totalDonations}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.promotionProgressContainer}>
                      <Text style={[styles.promotionProgressText, { fontSize: isSmallDevice ? 12 : 14 }]}>
                        {Math.round(item.progress)}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.promotionProgressBar}>
                    <View 
                      style={[
                        styles.promotionProgressFill, 
                        { width: `${Math.min(item.progress, 100)}%` }
                      ]} 
                    />
                  </View>

                  <View style={styles.promotionActions}>
                    <TouchableOpacity
                      style={[styles.promotionActionButton, styles.promotionRejectButton]}
                      onPress={() => rejectPromotion(item.id)}
                      disabled={saving}
                    >
                      <MaterialIcons name="close" size={isSmallDevice ? 12 : 16} color="#ef4444" />
                      <Text style={[styles.promotionRejectText, { fontSize: isSmallDevice ? 10 : 12 }]}>
                        {translations.reject}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.promotionActionButton, styles.promotionApproveButton]}
                      onPress={() => approvePromotion(item.id, item.nextLevel)}
                      disabled={saving}
                    >
                      <MaterialIcons name="check" size={isSmallDevice ? 12 : 16} color="#ffffff" />
                      <Text style={[styles.promotionApproveText, { fontSize: isSmallDevice ? 10 : 12 }]}>
                        {translations.approve}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Top Earners */}
          {stats.topEarners.length > 0 && (
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="emoji-events" size={isSmallDevice ? 16 : 20} color="#fbbf24" />
                <Text style={[styles.sectionTitle, { fontSize: isSmallDevice ? 13 : 15 }]}>
                  {translations.topEarners}
                </Text>
                <Text style={[styles.sectionSubtitle, { fontSize: isSmallDevice ? 9 : 10 }]}>
                  {translations.tapToPay}
                </Text>
              </View>
              {stats.topEarners.map((item, index) => (
                <TopEarnerItem key={item.id} item={item} index={index} />
              ))}
            </View>
          )}

          {/* Membership Levels Table */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="workspace-premium" size={isSmallDevice ? 16 : 20} color="#FF7722" />
              <Text style={[styles.sectionTitle, { fontSize: isSmallDevice ? 13 : 15 }]}>
                {translations.levelsAndCommission}
              </Text>
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={styles.addTypeButton}
                  onPress={() => setAddLevelModalVisible(true)}
                >
                  <MaterialIcons name="add" size={isSmallDevice ? 18 : 22} color="#FF7722" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.editHintButton}
                  onPress={() => Alert.alert(translations.editLevel, translations.editLevelsHint)}
                >
                  <MaterialIcons name="info-outline" size={isSmallDevice ? 14 : 18} color="#FF7722" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { fontSize: isSmallDevice ? 9 : 10 }]}>
                {translations.level}
              </Text>
              <Text style={[styles.tableHeaderText, { fontSize: isSmallDevice ? 9 : 10 }]}>
                {translations.type}
              </Text>
              <Text style={[styles.tableHeaderText, { fontSize: isSmallDevice ? 9 : 10 }]}>
                {translations.direct}
              </Text>
              <Text style={[styles.tableHeaderText, { fontSize: isSmallDevice ? 9 : 10 }]}>
                {translations.secondary}
              </Text>
              <Text style={[styles.tableHeaderText, { fontSize: isSmallDevice ? 9 : 10 }]}>
                {translations.prize}
              </Text>
            </View>

            {formData.levels.map((level, index) => (
              <TouchableOpacity 
                key={level.id} 
                style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven, styles.tableRowTouchable]}
                onPress={() => openLevelEditor(index)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tableCell, styles.levelCol, styles.levelBadge, { fontSize: isSmallDevice ? 10 : 11 }]}>
                  {level.id}
                </Text>
                <Text style={[styles.tableCell, styles.nameCol, { fontSize: isSmallDevice ? 10 : 11 }]}>
                  {level.name}
                </Text>
                <Text style={[styles.tableCell, styles.percentageCol, styles.commissionText, { fontSize: isSmallDevice ? 10 : 11 }]}>
                  {level.directCommission}%
                </Text>
                <Text style={[styles.tableCell, styles.percentageCol, styles.secondaryText, { fontSize: isSmallDevice ? 10 : 11 }]}>
                  {level.secondaryCommission}%
                </Text>
                <Text style={[styles.tableCell, styles.donationsCol, styles.donationText, { fontSize: isSmallDevice ? 10 : 11 }]}>
                  ₹{(level.prizeAmount || 0).toLocaleString()}
                </Text>
                <View style={styles.editIconContainer}>
                  <MaterialIcons name="edit" size={isSmallDevice ? 12 : 16} color="#FF7722" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Member Registration Fees Section with Drag and Drop */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="payments" size={isSmallDevice ? 16 : 20} color="#FF7722" />
              <Text style={[styles.sectionTitle, { fontSize: isSmallDevice ? 13 : 15 }]}>
                {translations.memberTypes}
              </Text>
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={styles.addTypeButton}
                  onPress={() => {
                    setNewMemberTypeName('');
                    setNewMemberTypeFee('');
                    setMemberTypeModalVisible(true);
                  }}
                >
                  <MaterialIcons name="add" size={isSmallDevice ? 18 : 22} color="#FF7722" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.editHintButton}
                  onPress={() => Alert.alert('Info', translations.reorderHint)}
                >
                  <MaterialIcons name="info-outline" size={isSmallDevice ? 14 : 18} color="#FF7722" />
                </TouchableOpacity>
              </View>
            </View>

            {memberTypes.length > 0 ? (
  <FlatList
    data={memberTypes}
    renderItem={({ item }) => (
      <TouchableOpacity 
        style={styles.memberFeeRow}
        onPress={() => {
          setSelectedMemberType({ ...item, fee: memberFees[item.id] || item.defaultFee });
          setMemberFeeModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.memberFeeLeft}>
          <View style={[styles.memberFeeIcon, { backgroundColor: '#FF772215' }]}>
            <MaterialIcons name="person" size={isSmallDevice ? 16 : 20} color="#FF7722" />
          </View>
          <Text style={[styles.memberFeeLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>
            {item.label}
          </Text>
        </View>
        <View style={styles.memberFeeRight}>
          <Text style={[styles.memberFeeValue, { fontSize: isSmallDevice ? 14 : 16 }]}>
            ₹{memberFees[item.id]?.toLocaleString() || item.defaultFee.toLocaleString()}
          </Text>
          <TouchableOpacity
            onPress={() => deleteMemberType(item.id)}
            style={styles.deleteTypeButton}
          >
            <MaterialIcons name="close" size={isSmallDevice ? 14 : 18} color="#ef4444" />
          </TouchableOpacity>
          <MaterialIcons name="edit" size={isSmallDevice ? 16 : 20} color="#FF7722" />
        </View>
      </TouchableOpacity>
    )}
    keyExtractor={(item) => item.id}
    containerStyle={{ flexGrow: 0 }}
    scrollEnabled={false}
  />
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="people" size={32} color="#d1d5db" />
                <Text style={[styles.emptyStateText, { fontSize: isSmallDevice ? 13 : 14 }]}>
                  No member types defined
                </Text>
                <Text style={[styles.emptyStateSubtext, { fontSize: isSmallDevice ? 10 : 11 }]}>
                  Tap the + button to add member types
                </Text>
              </View>
            )}
          </View>

          {commissionData?.lastUpdated && (
            <View style={styles.updateInfo}>
              <MaterialIcons name="update" size={isSmallDevice ? 12 : 14} color="#9ca3af" />
              <Text style={[styles.updateText, { fontSize: isSmallDevice ? 10 : 11 }]}>
                {translations.lastUpdated}: {new Date(commissionData.lastUpdated).toLocaleString()}
              </Text>
            </View>
          )}

          <View style={styles.versionContainer}>
            <Text style={[styles.versionText, { fontSize: isSmallDevice ? 9 : 10 }]}>NGO App v1.0.0</Text>
          </View>
        </ScrollView>

        {/* Payout Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={payoutModalVisible}
          onRequestClose={() => setPayoutModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { fontSize: isSmallDevice ? 16 : 18 }]}>
                  {translations.processPayout}
                </Text>
                <TouchableOpacity onPress={() => setPayoutModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.payoutSummary}>
                  <Text style={[styles.payoutSummaryLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>
                    {translations.pendingCommission}
                  </Text>
                  <Text style={[styles.payoutSummaryValue, { fontSize: isSmallDevice ? 18 : 22 }]}>
                    ₹{selectedPayout?.amount?.toLocaleString() || 0}
                  </Text>
                </View>

                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>
                    {translations.amountToPay}
                  </Text>
                  <TextInput
                    style={[styles.fieldInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                    value={payoutAmount}
                    onChangeText={setPayoutAmount}
                    placeholder={t('commission.enterAmount') || 'Enter amount'}
                    keyboardType="numeric"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>
                    {translations.note}
                  </Text>
                  <TextInput
                    style={[styles.fieldInput, styles.textArea, { fontSize: isSmallDevice ? 13 : 14 }]}
                    value={payoutNote}
                    onChangeText={setPayoutNote}
                    placeholder={translations.addNote}
                    multiline
                    numberOfLines={3}
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, saving && styles.submitButtonDisabled]}
                  onPress={processPayout}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <MaterialIcons name="check-circle" size={20} color="#ffffff" />
                      <Text style={[styles.submitButtonText, { fontSize: isSmallDevice ? 14 : 15 }]}>
                        {translations.processPayout}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add Member Type Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={memberTypeModalVisible}
          onRequestClose={() => setMemberTypeModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { fontSize: isSmallDevice ? 16 : 18 }]}>
                  {translations.addMemberType}
                </Text>
                <TouchableOpacity onPress={() => setMemberTypeModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>
                    {translations.memberTypeName} *
                  </Text>
                  <TextInput
                    style={[styles.fieldInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                    value={newMemberTypeName}
                    onChangeText={setNewMemberTypeName}
                    placeholder={translations.enterMemberTypeName}
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>
                    {translations.registrationFee} (₹) *
                  </Text>
                  <TextInput
                    style={[styles.fieldInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                    value={newMemberTypeFee}
                    onChangeText={setNewMemberTypeFee}
                    placeholder={translations.enterFeeAmount}
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, isAddingMemberType && styles.submitButtonDisabled]}
                  onPress={addMemberType}
                  disabled={isAddingMemberType}
                >
                  {isAddingMemberType ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <MaterialIcons name="add" size={20} color="#ffffff" />
                      <Text style={[styles.submitButtonText, { fontSize: isSmallDevice ? 14 : 15 }]}>
                        {translations.addMemberType}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add Level Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={addLevelModalVisible}
          onRequestClose={() => setAddLevelModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { fontSize: isSmallDevice ? 16 : 18 }]}>
                  {translations.addLevel}
                </Text>
                <TouchableOpacity onPress={() => setAddLevelModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalBody}>
                  <Text style={[styles.helperText, { fontSize: isSmallDevice ? 11 : 12, marginBottom: 12 }]}>
                    {translations.addLevelDescription}
                  </Text>

                  <View style={styles.field}>
                    <Text style={[styles.fieldLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>
                      {translations.levelId} *
                    </Text>
                    <TextInput
                      style={[styles.fieldInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                      value={newLevelData.id}
                      onChangeText={(text) => setNewLevelData({ ...newLevelData, id: text })}
                      placeholder={translations.enterLevelId}
                      placeholderTextColor="#9ca3af"
                      autoCapitalize="characters"
                    />
                  </View>

                  <View style={styles.field}>
                    <Text style={[styles.fieldLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>
                      {translations.levelName} *
                    </Text>
                    <TextInput
                      style={[styles.fieldInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                      value={newLevelData.name}
                      onChangeText={(text) => setNewLevelData({ ...newLevelData, name: text })}
                      placeholder={translations.enterLevelName}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  <View style={styles.field}>
                    <Text style={[styles.fieldLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>
                      {translations.directCommission} (%)
                    </Text>
                    <TextInput
                      style={[styles.fieldInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                      value={String(newLevelData.directCommission)}
                      onChangeText={(text) => setNewLevelData({ ...newLevelData, directCommission: text })}
                      placeholder={translations.enterDirectCommission}
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.field}>
                    <Text style={[styles.fieldLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>
                      {translations.secondaryCommission} (%)
                    </Text>
                    <TextInput
                      style={[styles.fieldInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                      value={String(newLevelData.secondaryCommission)}
                      onChangeText={(text) => setNewLevelData({ ...newLevelData, secondaryCommission: text })}
                      placeholder={translations.enterSecondaryCommission}
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.field}>
                    <Text style={[styles.fieldLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>
                      {translations.minDonations} (₹)
                    </Text>
                    <TextInput
                      style={[styles.fieldInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                      value={String(newLevelData.minDonations)}
                      onChangeText={(text) => setNewLevelData({ ...newLevelData, minDonations: text })}
                      placeholder={translations.enterMinDonations}
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.field}>
                    <Text style={[styles.fieldLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>
                      {translations.maxDonations} (₹)
                    </Text>
                    <TextInput
                      style={[styles.fieldInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                      value={String(newLevelData.maxDonations)}
                      onChangeText={(text) => setNewLevelData({ ...newLevelData, maxDonations: text })}
                      placeholder={translations.enterMaxDonations}
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.field}>
                    <Text style={[styles.fieldLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>
                      {translations.donationsRequiredForPromotion} (₹)
                    </Text>
                    <TextInput
                      style={[styles.fieldInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                      value={String(newLevelData.donationsRequiredForPromotion)}
                      onChangeText={(text) => setNewLevelData({ ...newLevelData, donationsRequiredForPromotion: text })}
                      placeholder={translations.enterDonationsRequired}
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.field}>
                    <Text style={[styles.fieldLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>
                      {translations.prizeAmount} (₹)
                    </Text>
                    <TextInput
                      style={[styles.fieldInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                      value={String(newLevelData.prizeAmount)}
                      onChangeText={(text) => setNewLevelData({ ...newLevelData, prizeAmount: text })}
                      placeholder={translations.enterPrizeAmount}
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                    />
                    <Text style={[styles.helperText, { fontSize: isSmallDevice ? 10 : 11 }]}>
                      {translations.prizeDescription}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.submitButton, saving && styles.submitButtonDisabled]}
                    onPress={addLevel}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <MaterialIcons name="add" size={20} color="#ffffff" />
                        <Text style={[styles.submitButtonText, { fontSize: isSmallDevice ? 14 : 15 }]}>
                          {translations.addLevel}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Promotion Confirmation Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={promotionConfirmVisible}
          onRequestClose={() => {
            setPromotionConfirmVisible(false);
            setPendingApproveData(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.confirmModalContent}>
              <View style={styles.confirmModalHeader}>
                <MaterialIcons name="stars" size={isSmallDevice ? 24 : 28} color="#fbbf24" />
                <Text style={[styles.confirmModalTitle, { fontSize: isSmallDevice ? 18 : 20 }]}>
                  {translations.approvePromotion}
                </Text>
              </View>
              
              <View style={styles.confirmModalBody}>
                <Text style={[styles.confirmModalText, { fontSize: isSmallDevice ? 13 : 14 }]}>
                  {translations.confirmPromote}
                </Text>
                <Text style={[styles.confirmModalLevel, { fontSize: isSmallDevice ? 24 : 28 }]}>
                  {translations.level} {pendingApproveData?.nextLevel}
                </Text>
                <Text style={[styles.confirmModalSubtext, { fontSize: isSmallDevice ? 11 : 12 }]}>
                  {translations.thisActionWillUpdate}
                </Text>
              </View>

              <View style={styles.confirmModalActions}>
                <TouchableOpacity
                  style={[styles.confirmModalButton, styles.confirmModalCancelButton]}
                  onPress={() => {
                    setPromotionConfirmVisible(false);
                    setPendingApproveData(null);
                  }}
                >
                  <Text style={[styles.confirmModalCancelText, { fontSize: isSmallDevice ? 13 : 14 }]}>
                    {translations.cancel || 'Cancel'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.confirmModalButton, styles.confirmModalApproveButton]}
                  onPress={confirmApprovePromotion}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <MaterialIcons name="check" size={isSmallDevice ? 14 : 18} color="#ffffff" />
                      <Text style={[styles.confirmModalApproveText, { fontSize: isSmallDevice ? 13 : 14 }]}>
                        {translations.approve}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Member Payout Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={memberPayoutModalVisible}
          onRequestClose={() => setMemberPayoutModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { fontSize: isSmallDevice ? 16 : 18 }]}>
                  {translations.payWorkingMember}
                </Text>
                <TouchableOpacity onPress={() => setMemberPayoutModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberInfoName, { fontSize: isSmallDevice ? 14 : 16 }]}>
                    {selectedWorkingMember?.name || 'Unknown'}
                  </Text>
                  <Text style={[styles.memberInfoLevel, { fontSize: isSmallDevice ? 11 : 12 }]}>
                    {translations.level} {selectedWorkingMember?.level || 'I'}
                  </Text>
                  <Text style={[styles.memberInfoEarned, { fontSize: isSmallDevice ? 12 : 13 }]}>
                    {translations.totalEarned}: ₹{selectedWorkingMember?.totalEarned?.toLocaleString() || 0}
                  </Text>
                  {selectedWorkingMember?.donationCommission > 0 && (
                    <Text style={[styles.memberInfoDonation, { fontSize: isSmallDevice ? 11 : 12 }]}>
                      ❤️ {translations.donationCommission}: ₹{selectedWorkingMember.donationCommission.toLocaleString()}
                    </Text>
                  )}
                  {selectedWorkingMember?.totalDonationsFromMembers > 0 && (
                    <Text style={[styles.memberInfoTotalDonations, { fontSize: isSmallDevice ? 11 : 12 }]}>
                      💰 {translations.totalDonations}: ₹{selectedWorkingMember.totalDonationsFromMembers.toLocaleString()}
                    </Text>
                  )}
                </View>

                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { fontSize: isSmallDevice ? 12 : 13 }]}>
                    {translations.amountToPay}
                  </Text>
                  <TextInput
                    style={[styles.fieldInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                    value={memberPayoutAmount}
                    onChangeText={setMemberPayoutAmount}
                    placeholder={t('commission.enterAmount') || 'Enter amount'}
                    keyboardType="numeric"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, saving && styles.submitButtonDisabled]}
                  onPress={processMemberPayout}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <MaterialIcons name="payment" size={20} color="#ffffff" />
                      <Text style={[styles.submitButtonText, { fontSize: isSmallDevice ? 14 : 15 }]}>
                        {translations.payNow}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Level Edit Modal */}
        {levelEditModal}

        {/* Member Fee Edit Modal */}
        <MemberFeeEditModal
          visible={memberFeeModalVisible}
          selectedMemberType={selectedMemberType}
          onClose={() => {
            setMemberFeeModalVisible(false);
            setSelectedMemberType(null);
          }}
          onSave={saveMemberFee}
          saving={saving}
          isSmallDevice={isSmallDevice}
          t={t}
        />

        {/* Settings Edit Modal */}
        <SettingsEditModal />
      </View>
    </SafeAreaView>
  );
}

// ============ Styles ============
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fdf8f3',
  },
  container: {
    flex: 1,
    backgroundColor: '#fdf8f3',
  },
  headerCard: {
    backgroundColor: '#FF7722',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 50,
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
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
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
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 6,
  },
  statCard: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontFamily: Fonts.Bold,
    color: '#1f2937',
  },
  statLabel: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
    textAlign: 'center',
  },
  donationStatsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#fef3c7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  donationStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  donationStatsTitle: {
    fontFamily: Fonts.SemiBold,
    color: '#1f2937',
  },
  donationStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  donationStatItem: {
    alignItems: 'center',
  },
  donationStatValue: {
    fontFamily: Fonts.Bold,
    color: '#f59e0b',
  },
  donationStatLabel: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
    marginTop: 2,
  },
  donationStatDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    marginTop: 10,
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
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: Fonts.SemiBold,
    color: '#1f2937',
    flex: 1,
  },
  sectionSubtitle: {
    fontFamily: Fonts.Regular,
    color: '#9ca3af',
  },
  processAllButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  processAllText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
  },
  editHintButton: {
    padding: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addTypeButton: {
    padding: 4,
    backgroundColor: '#FF772215',
    borderRadius: 16,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginBottom: 4,
  },
  tableHeaderText: {
    fontFamily: Fonts.SemiBold,
    color: '#4b5563',
    paddingHorizontal: 2,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 4,
    alignItems: 'center',
    position: 'relative',
  },
  tableRowEven: {
    backgroundColor: '#f9fafb',
  },
  tableRowTouchable: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tableCell: {
    fontFamily: Fonts.Regular,
    color: '#1f2937',
    paddingHorizontal: 2,
  },
  levelCol: {
    width: '11%',
    minWidth: 28,
  },
  nameCol: {
    width: '22%',
    minWidth: 55,
  },
  percentageCol: {
    width: '17%',
    minWidth: 40,
  },
  donationsCol: {
    width: '24%',
    minWidth: 55,
  },
  levelBadge: {
    fontFamily: Fonts.Bold,
    color: '#FF7722',
  },
  commissionText: {
    fontFamily: Fonts.Bold,
    color: '#10b981',
  },
  secondaryText: {
    fontFamily: Fonts.Regular,
    color: '#8b5cf6',
  },
  donationText: {
    fontFamily: Fonts.SemiBold,
    color: '#f59e0b',
  },
  editIconContainer: {
    width: '8%',
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 6,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
  },
  editHintText: {
    fontFamily: Fonts.Regular,
    color: '#92400e',
  },
  editButtonSmall: {
    padding: 2,
  },
  promotionCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  promotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  promotionUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  promotionAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promotionAvatarText: {
    fontFamily: Fonts.Bold,
    color: '#f59e0b',
  },
  promotionName: {
    fontFamily: Fonts.SemiBold,
    color: '#1f2937',
  },
  promotionDetails: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
  },
  promotionDonations: {
    fontFamily: Fonts.Regular,
    color: '#f59e0b',
    marginTop: 2,
  },
  promotionProgressContainer: {
    alignItems: 'flex-end',
  },
  promotionProgressText: {
    fontFamily: Fonts.Bold,
    color: '#f59e0b',
  },
  promotionProgressBar: {
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  promotionProgressFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 3,
  },
  promotionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  promotionActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  promotionApproveButton: {
    backgroundColor: '#10b981',
  },
  promotionRejectButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  promotionApproveText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
  },
  promotionRejectText: {
    fontFamily: Fonts.SemiBold,
    color: '#ef4444',
  },
  payoutCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  donationPayoutCard: {
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
  },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  payoutUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payoutIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payoutUserName: {
    fontFamily: Fonts.SemiBold,
    color: '#1f2937',
  },
  payoutType: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
  },
  payoutAmountContainer: {
    alignItems: 'flex-end',
  },
  payoutAmount: {
    fontFamily: Fonts.Bold,
    color: '#10b981',
  },
  donationAmount: {
    color: '#f59e0b',
  },
  payoutDate: {
    fontFamily: Fonts.Regular,
    color: '#9ca3af',
  },
  payoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  donationPayoutButton: {
    backgroundColor: '#f59e0b',
  },
  payoutButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
  },
  topEarnerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  topEarnerRank: {
    fontFamily: Fonts.Bold,
    color: '#FF7722',
    width: 30,
  },
  topEarnerInfo: {
    flex: 1,
  },
  topEarnerName: {
    fontFamily: Fonts.SemiBold,
    color: '#1f2937',
  },
  topEarnerLevel: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
  },
  topEarnerDonation: {
    fontFamily: Fonts.Regular,
    color: '#f59e0b',
    marginTop: 2,
  },
  topEarnerTotalDonations: {
    fontFamily: Fonts.Regular,
    color: '#10b981',
    marginTop: 2,
  },
  topEarnerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topEarnerAmount: {
    fontFamily: Fonts.Bold,
    color: '#10b981',
  },
  payNowButton: {
    backgroundColor: '#FF7722',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
  },
  payNowText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
  },
  settingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  settingItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    padding: 8,
  },
  settingLabel: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
  },
  settingValue: {
    fontFamily: Fonts.SemiBold,
    color: '#1f2937',
    marginTop: 2,
  },
  helperText: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
    marginTop: 4,
  },
  sectionDivider: {
    marginTop: 12,
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  sectionDividerText: {
    fontFamily: Fonts.SemiBold,
    color: '#1f2937',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 4,
  },
  emptyStateText: {
    fontFamily: Fonts.SemiBold,
    color: '#1f2937',
  },
  emptyStateSubtext: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
  },
  updateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  updateText: {
    fontFamily: Fonts.Regular,
    color: '#9ca3af',
  },
  confirmModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  confirmModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  confirmModalTitle: {
    fontFamily: Fonts.Bold,
    color: '#1f2937',
  },
  confirmModalBody: {
    alignItems: 'center',
    marginBottom: 24,
  },
  confirmModalText: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmModalLevel: {
    fontFamily: Fonts.Bold,
    color: '#f59e0b',
    marginVertical: 8,
  },
  confirmModalSubtext: {
    fontFamily: Fonts.Regular,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
  },
  confirmModalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  confirmModalCancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  confirmModalApproveButton: {
    backgroundColor: '#10b981',
  },
  confirmModalCancelText: {
    fontFamily: Fonts.SemiBold,
    color: '#6b7280',
  },
  confirmModalApproveText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
  },
  versionContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  versionText: {
    fontFamily: Fonts.Regular,
    color: '#9ca3af',
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
    color: '#1f2937',
  },
  modalBody: {
    gap: 12,
  },
  field: {
    marginBottom: 4,
  },
  fieldLabel: {
    fontFamily: Fonts.SemiBold,
    color: '#1f2937',
    marginBottom: 4,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f9fafb',
    fontFamily: Fonts.Regular,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
  },
  payoutSummary: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 4,
  },
  payoutSummaryLabel: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
  },
  payoutSummaryValue: {
    fontFamily: Fonts.Bold,
    color: '#10b981',
    marginTop: 2,
  },
  memberInfo: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 4,
  },
  memberInfoName: {
    fontFamily: Fonts.Bold,
    color: '#1f2937',
  },
  memberInfoLevel: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
    marginTop: 2,
  },
  memberInfoEarned: {
    fontFamily: Fonts.SemiBold,
    color: '#10b981',
    marginTop: 4,
  },
  memberInfoDonation: {
    fontFamily: Fonts.SemiBold,
    color: '#f59e0b',
    marginTop: 2,
  },
  memberInfoTotalDonations: {
    fontFamily: Fonts.SemiBold,
    color: '#10b981',
    marginTop: 2,
  },
  updateLevelButton: {
    backgroundColor: '#FF7722',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  updateLevelButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
  },
  deleteLevelButton: {
    backgroundColor: '#fef2f2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  deleteLevelButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ef4444',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  switchLabel: {
    fontFamily: Fonts.SemiBold,
    color: '#1f2937',
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#d1d5db',
    padding: 2,
  },
  switchActive: {
    backgroundColor: '#10b981',
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginTop: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
  },
  memberFeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  memberFeeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  memberFeeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberFeeLabel: {
    fontFamily: Fonts.Regular,
    color: '#1f2937',
    flex: 1,
  },
  memberFeeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberFeeValue: {
    fontFamily: Fonts.Bold,
    color: '#FF7722',
  },
  deleteTypeButton: {
    padding: 2,
  },
  
});