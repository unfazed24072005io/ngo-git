// screens/workingMember/WorkingMemberCreateAssign.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Dimensions,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db, getAuthInstance } from '../../config/firebase';
import { 
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  query, 
  where, 
  onSnapshot, 
  getDoc, 
  setDoc,
  addDoc
} from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { Fonts } from '../../config/fonts';
import { getLevelDetails } from '../../config/commissionLevels';
import { WalletService } from '../../services/WalletService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../context/LanguageContext';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;

export default function WorkingMemberCreateAssign({ navigation }) {
  const { t, counter } = useLanguage();
  const renderKey = `workingmember-create-${counter}`;

  // ============ STATE ============
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dynamicLevels, setDynamicLevels] = useState([]);
  const [savingMember, setSavingMember] = useState(false);
  
  // Step management
  const [step, setStep] = useState(1); // 1: Registration Method, 2: Create Member, 3: Assignment
  
  // Registration Method
  const [registrationMethod, setRegistrationMethod] = useState('email'); // 'email' or 'phone'
  
  // Create Member Form
  const [newMemberData, setNewMemberData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    village: '',
    postOffice: '',
    thana: '',
    district: '',
    state: '',
    pinCode: '',
    gender: '',
    dob: '',
    aadharNumber: '',
    level: '',
    status: 'active',
    role: 'working',
    profilePhoto: null,
  });
  
  // Parent selection
  const [availableParents, setAvailableParents] = useState([]);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [selectedParentName, setSelectedParentName] = useState('');
  const [searchParent, setSearchParent] = useState('');
  // Add with other state declarations
const [creatorLevel, setCreatorLevel] = useState(null);
const [creatorLevelIndex, setCreatorLevelIndex] = useState(null);
  // Assignment confirmation
  const [showAssignmentConfirm, setShowAssignmentConfirm] = useState(false);
  const [createdMemberId, setCreatedMemberId] = useState(null);
  const [createdMemberName, setCreatedMemberName] = useState('');

  // ============ FETCH DYNAMIC LEVELS ============
  useEffect(() => {
    fetchDynamicLevels();
  }, []);

  const fetchDynamicLevels = async () => {
    try {
      const settingsRef = doc(db, 'settings', 'commission');
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        const settingsData = settingsSnap.data();
        if (settingsData.levels && settingsData.levels.length > 0) {
          // Sort levels by id (I, II, III, etc.)
          const sortedLevels = settingsData.levels.sort((a, b) => {
            const order = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
            return order.indexOf(a.id) - order.indexOf(b.id);
          });
          setDynamicLevels(sortedLevels);
        } else {
          setDynamicLevels(getDefaultLevels());
        }
      } else {
        setDynamicLevels(getDefaultLevels());
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching levels:', error);
      setDynamicLevels(getDefaultLevels());
      setLoading(false);
    }
  };
// Add this useEffect after the other useEffects
useEffect(() => {
  fetchCreatorLevel();
}, []);

const fetchCreatorLevel = async () => {
  try {
    const auth = getAuthInstance();
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const level = userData.level || 'I';
      setCreatorLevel(level);
      
      // Find the index of the creator's level
      const levelsToUse = dynamicLevels.length > 0 ? dynamicLevels : getDefaultLevels();
      const index = levelsToUse.findIndex(l => l.id === level);
      setCreatorLevelIndex(index);
    }
  } catch (error) {
    console.error('Error fetching creator level:', error);
  }
};
  const getDefaultLevels = () => {
    return [
      { id: 'I', name: 'Customer', directCommission: 25, secondaryCommission: 10 },
      { id: 'II', name: 'Executive', directCommission: 35, secondaryCommission: 5 },
      { id: 'III', name: 'Manager', directCommission: 40, secondaryCommission: 2.5 },
      { id: 'IV', name: 'Coordinator', directCommission: 42.5, secondaryCommission: 1.25 },
      { id: 'V', name: 'Guide', directCommission: 43.75, secondaryCommission: 1.25 },
      { id: 'VI', name: 'Leader', directCommission: 44.5, secondaryCommission: 0.75 },
      { id: 'VII', name: 'Crown', directCommission: 45, secondaryCommission: 0.50 }
    ];
  };

  // ============ FETCH AVAILABLE PARENTS ============
  const fetchAvailableParents = async (selectedLevel) => {
    if (!selectedLevel) return;
    
    try {
      const levelsToUse = dynamicLevels;
      const selectedLevelIndex = levelsToUse.findIndex(l => l.id === selectedLevel);
      
      // Parents must be at HIGHER levels (lower index = higher level)
      const parentLevels = levelsToUse.filter((l, index) => index < selectedLevelIndex);
      const parentLevelIds = parentLevels.map(l => l.id);
      
      if (parentLevelIds.length === 0) {
        setAvailableParents([]);
        return;
      }
      
      const q = query(
        collection(db, 'users'),
        where('role', 'in', ['working', 'workingMember']),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);
      const parents = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (parentLevelIds.includes(data.level)) {
          parents.push({
            id: doc.id,
            fullName: data.fullName || data.name || 'Unknown',
            level: data.level,
            levelName: getLevelLabel(data.level),
            phone: data.phone || '',
            email: data.email || '',
            directReferralCount: (data.directReferrals || []).length
          });
        }
      });
      setAvailableParents(parents);
    } catch (error) {
      console.error('Error fetching parents:', error);
    }
  };

  const getLevelLabel = (levelId) => {
    if (dynamicLevels && dynamicLevels.length > 0) {
      const dynamicLevel = dynamicLevels.find(l => l.id === levelId);
      if (dynamicLevel) {
        return dynamicLevel.name || levelId;
      }
    }
    const details = getLevelDetails(levelId);
    return details?.title || levelId;
  };

  const getLevelColor = (levelId) => {
    const details = getLevelDetails(levelId);
    return details?.color || '#6b7280';
  };

  const getLevelIcon = (levelId) => {
    const icons = {
      'I': 'grade',
      'II': 'star-half',
      'III': 'star',
      'IV': 'stars',
      'V': 'military-tech',
      'VI': 'workspace-premium',
      'VII': 'emoji-events'
    };
    return icons[levelId] || 'circle';
  };

  // ============ CREATE WORKING MEMBER ============
  const handleCreateWorkingMember = async () => {
    // Validate required fields
    if (!newMemberData.fullName.trim()) {
      Alert.alert('Error', 'Full Name is required');
      return;
    }
    
    if (!newMemberData.level) {
      Alert.alert('Error', 'Please select a level');
      return;
    }
    
    if (registrationMethod === 'email') {
      if (!newMemberData.email.trim()) {
        Alert.alert('Error', 'Email is required');
        return;
      }
      if (!newMemberData.password || newMemberData.password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
      }
    } else {
      if (!newMemberData.phone.trim()) {
        Alert.alert('Error', 'Phone number is required');
        return;
      }
      if (!newMemberData.password || newMemberData.password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
      }
    }

    setSavingMember(true);
    try {
      const auth = getAuthInstance();
      let userCredential;
      
      if (registrationMethod === 'email') {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          newMemberData.email.trim(),
          newMemberData.password
        );
      } else {
        const phoneNumber = `+91${newMemberData.phone.trim()}`;
        userCredential = await createUserWithEmailAndPassword(
          auth,
          `${phoneNumber}@phone.auth`,
          newMemberData.password
        );
      }
      
      const userId = userCredential.user.uid;

      const selectedLevel = dynamicLevels.find(l => l.id === newMemberData.level) || { 
        directCommission: 25, 
        secondaryCommission: 10 
      };

      const userData = {
        fullName: newMemberData.fullName.trim(),
        email: registrationMethod === 'email' ? newMemberData.email.trim().toLowerCase() : '',
        phone: newMemberData.phone.trim(),
        address: newMemberData.address.trim() || '',
        village: newMemberData.village || '',
        postOffice: newMemberData.postOffice || '',
        thana: newMemberData.thana || '',
        district: newMemberData.district || '',
        state: newMemberData.state || '',
        pinCode: newMemberData.pinCode || '',
        gender: newMemberData.gender || '',
        dob: newMemberData.dob || '',
        aadharNumber: newMemberData.aadharNumber || '',
        level: newMemberData.level,
        directCommission: selectedLevel.directCommission || 25,
        secondaryCommission: selectedLevel.secondaryCommission || 10,
        role: 'working',
        status: 'active',
        profilePhoto: newMemberData.profilePhoto || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        directReferrals: [],
        registeredBy: auth.currentUser?.uid || 'admin',
        promotionPending: false,
        walletCreated: false,
        registrationMethod: registrationMethod,
        parentId: null,
        parentName: null,
        childrenIds: [],
      };

      await setDoc(doc(db, 'users', userId), userData);

      // Create wallet
      await setDoc(doc(db, 'wallets', userId), {
        balance: 0,
        totalEarned: 0,
        pendingCommission: 0,
        totalWithdrawn: 0,
        pendingWithdrawals: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Store created member info for assignment step
      setCreatedMemberId(userId);
      setCreatedMemberName(newMemberData.fullName.trim());
      
      // Check if there are available parents for this level
      await fetchAvailableParents(newMemberData.level);
      
      // If no parents available, skip assignment
      if (availableParents.length === 0) {
        Alert.alert(
          'Success',
          `Working member "${newMemberData.fullName}" created successfully!\n\nNo higher-level members available to assign under.`
        );
        resetForm();
        navigation.goBack();
        return;
      }
      
      // Move to assignment step
      setStep(3);
      Alert.alert(
        '✅ Member Created!',
        `Working member "${newMemberData.fullName}" created successfully.\n\nWould you like to assign them under a higher-level member?`
      );
      
    } catch (error) {
      console.error('Error creating working member:', error);
      let errorMessage = 'Failed to create working member';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already registered. Please use a different email.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Use at least 6 characters.';
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setSavingMember(false);
    }
  };

  // ============ ASSIGN TO PARENT ============
  const handleAssignToParent = async () => {
    if (!selectedParentId || !createdMemberId) {
      Alert.alert('Error', 'Please select a parent');
      return;
    }

    setSavingMember(true);
    try {
      // Update the new member with parent
      const memberRef = doc(db, 'users', createdMemberId);
      await updateDoc(memberRef, {
        parentId: selectedParentId,
        parentName: selectedParentName,
        updatedAt: new Date().toISOString()
      });

      // Update the parent's children list
      const parentRef = doc(db, 'users', selectedParentId);
      const parentDoc = await getDoc(parentRef);
      if (parentDoc.exists()) {
        const parentData = parentDoc.data();
        const currentChildren = parentData.childrenIds || [];
        if (!currentChildren.includes(createdMemberId)) {
          await updateDoc(parentRef, {
            childrenIds: [...currentChildren, createdMemberId],
            updatedAt: new Date().toISOString()
          });
        }
      }

      Alert.alert(
        '✅ Success!',
        `${createdMemberName} has been assigned under ${selectedParentName}.\n\n${selectedParentName} will now earn secondary commission from ${createdMemberName}'s donations.`
      );
      
      resetForm();
      navigation.goBack();
      
    } catch (error) {
      console.error('Error assigning member:', error);
      Alert.alert('Error', 'Failed to assign member. Please try again.');
    } finally {
      setSavingMember(false);
    }
  };

  // ============ SKIP ASSIGNMENT ============
  const handleSkipAssignment = () => {
    Alert.alert(
      'Skip Assignment',
      `${createdMemberName} will be created without a parent. They can be assigned later.`,
      [
        { text: 'Go Back', style: 'cancel' },
        { 
          text: 'Skip', 
          onPress: () => {
            resetForm();
            navigation.goBack();
          }
        }
      ]
    );
  };

  // ============ RESET FORM ============
  const resetForm = () => {
    setNewMemberData({
      fullName: '',
      email: '',
      phone: '',
      password: '',
      address: '',
      village: '',
      postOffice: '',
      thana: '',
      district: '',
      state: '',
      pinCode: '',
      gender: '',
      dob: '',
      aadharNumber: '',
      level: '',
      status: 'active',
      role: 'working',
      profilePhoto: null,
    });
    setSelectedParentId(null);
    setSelectedParentName('');
    setSearchParent('');
    setCreatedMemberId(null);
    setCreatedMemberName('');
    setStep(1);
  };

  // ============ STEP 1: REGISTRATION METHOD ============
  const renderRegistrationMethod = () => (
    <View>
      <Text style={styles.stepTitle}>Choose Registration Method</Text>
      <Text style={styles.stepSubtitle}>Select how you want to register this working member</Text>

      <TouchableOpacity 
        style={[styles.methodCard, registrationMethod === 'email' && styles.methodCardActive]}
        onPress={() => setRegistrationMethod('email')}
      >
        <View style={[styles.methodIcon, { backgroundColor: registrationMethod === 'email' ? '#FF7722' : '#e5e7eb' }]}>
          <MaterialIcons name="email" size={24} color={registrationMethod === 'email' ? '#ffffff' : '#6b7280'} />
        </View>
        <View style={styles.methodContent}>
          <Text style={[styles.methodTitle, registrationMethod === 'email' && styles.methodTitleActive]}>
            Email Registration
          </Text>
          <Text style={styles.methodDescription}>
            Register using email and password
          </Text>
        </View>
        {registrationMethod === 'email' && (
          <MaterialIcons name="check-circle" size={20} color="#FF7722" />
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.methodCard, registrationMethod === 'phone' && styles.methodCardActive]}
        onPress={() => setRegistrationMethod('phone')}
      >
        <View style={[styles.methodIcon, { backgroundColor: registrationMethod === 'phone' ? '#10b981' : '#e5e7eb' }]}>
          <MaterialIcons name="phone" size={24} color={registrationMethod === 'phone' ? '#ffffff' : '#6b7280'} />
        </View>
        <View style={styles.methodContent}>
          <Text style={[styles.methodTitle, registrationMethod === 'phone' && styles.methodTitleActive]}>
            Phone Registration
          </Text>
          <Text style={styles.methodDescription}>
            Register using phone number and password
          </Text>
        </View>
        {registrationMethod === 'phone' && (
          <MaterialIcons name="check-circle" size={20} color="#10b981" />
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.nextButton} 
        onPress={() => setStep(2)}
      >
        <Text style={styles.buttonText}>Next →</Text>
      </TouchableOpacity>
    </View>
  );

  // ============ STEP 2: CREATE MEMBER FORM ============
  const renderCreateMember = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Create Working Member</Text>
      <Text style={styles.stepSubtitle}>Enter member details</Text>

      {/* Full Name */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Full Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter full name"
          placeholderTextColor="#9ca3af"
          value={newMemberData.fullName}
          onChangeText={(text) => setNewMemberData({...newMemberData, fullName: text})}
        />
        <View style={styles.bottomLine} />
      </View>

      {/* Email or Phone based on registration method */}
      {registrationMethod === 'email' ? (
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email"
            placeholderTextColor="#9ca3af"
            value={newMemberData.email}
            onChangeText={(text) => setNewMemberData({...newMemberData, email: text})}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={styles.bottomLine} />
        </View>
      ) : (
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Phone Number *</Text>
          <View style={styles.phoneInputWrapper}>
            <Text style={styles.countryCode}>+91</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="Enter phone number"
              placeholderTextColor="#9ca3af"
              value={newMemberData.phone}
              onChangeText={(text) => {
                const cleaned = text.replace(/\D/g, '').slice(0, 10);
                setNewMemberData({...newMemberData, phone: cleaned});
              }}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
          <View style={styles.bottomLine} />
        </View>
      )}

      {/* Password */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Password * (min 6 characters)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter password"
          placeholderTextColor="#9ca3af"
          value={newMemberData.password}
          onChangeText={(text) => setNewMemberData({...newMemberData, password: text})}
          secureTextEntry
        />
        <View style={styles.bottomLine} />
      </View>

      {/* Level Selection */}
<View style={styles.fieldContainer}>
  <Text style={styles.fieldLabel}>Select Level *</Text>
  <Text style={styles.levelHelperText}>
    You can only create members at levels below your current level ({creatorLevel || 'I'})
  </Text>
  <View style={styles.levelOptionsGrid}>
    {dynamicLevels.map((level, index) => {
      // ✅ Only show levels lower than creator's level
      if (creatorLevelIndex !== null && index >= creatorLevelIndex) {
        return null; // Skip levels at or above creator's level
      }
      
      const isSelected = newMemberData.level === level.id;
      const levelColor = getLevelColor(level.id);
      return (
        <TouchableOpacity
          key={level.id}
          style={[
            styles.levelOption,
            isSelected && styles.levelOptionActive,
            { borderColor: isSelected ? levelColor : '#e5e7eb' }
          ]}
          onPress={() => {
            setNewMemberData({...newMemberData, level: level.id});
            // Fetch available parents for this level
            fetchAvailableParents(level.id);
            setSelectedParentId(null);
            setSelectedParentName('');
          }}
        >
          <MaterialIcons 
            name={getLevelIcon(level.id)} 
            size={isSmallDevice ? 10 : 14} 
            color={isSelected ? '#ffffff' : levelColor} 
          />
          <Text style={[
            styles.levelOptionText,
            isSelected && styles.levelOptionTextActive,
            { fontSize: isSmallDevice ? 9 : 10 }
          ]}>
            {level.id}
          </Text>
          <Text style={[
            styles.levelOptionSubText,
            isSelected && { color: '#ffffff' },
            { fontSize: isSmallDevice ? 7 : 8 }
          ]}>
            {level.directCommission}%/{level.secondaryCommission}%
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
  {newMemberData.level && (
    <Text style={styles.selectedLevelInfo}>
      Selected: {getLevelLabel(newMemberData.level)} (Direct: {dynamicLevels.find(l => l.id === newMemberData.level)?.directCommission || 0}%, 
      Secondary: {dynamicLevels.find(l => l.id === newMemberData.level)?.secondaryCommission || 0}%)
    </Text>
  )}
</View>
      {/* Optional: Additional fields collapsed */}
      <TouchableOpacity 
        style={styles.expandButton}
        onPress={() => Alert.alert('Additional Fields', 'Add more details like address, Aadhar, etc.')}
      >
        <MaterialIcons name="add-circle-outline" size={20} color="#FF7722" />
        <Text style={styles.expandButtonText}>Add Additional Details (Optional)</Text>
      </TouchableOpacity>

      <View style={styles.stepButtons}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
          <MaterialIcons name="arrow-back" size={20} color="#ffffff" />
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.submitButton, savingMember && { opacity: 0.6 }]}
          onPress={handleCreateWorkingMember}
          disabled={savingMember}
        >
          {savingMember ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <MaterialIcons name="person-add" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Create Member</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // ============ STEP 3: ASSIGN TO PARENT ============
  const renderAssignParent = () => (
    <View>
      <Text style={styles.stepTitle}>Assign to Parent</Text>
      <Text style={styles.stepSubtitle}>
        Assign {createdMemberName} under a higher-level working member
      </Text>

      <View style={styles.createdMemberInfo}>
        <MaterialIcons name="person" size={24} color="#10b981" />
        <View>
          <Text style={styles.createdMemberName}>{createdMemberName}</Text>
          <Text style={styles.createdMemberLevel}>
            Level: {getLevelLabel(newMemberData.level)}
          </Text>
        </View>
      </View>

      {availableParents.length > 0 ? (
        <>
          <View style={styles.parentSearchContainer}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              placeholder="Search parent by name..."
              placeholderTextColor="#9ca3af"
              value={searchParent}
              onChangeText={(text) => {
                setSearchParent(text);
                if (text.trim()) {
                  const filtered = availableParents.filter(p => 
                    p.fullName.toLowerCase().includes(text.toLowerCase())
                  );
                  setAvailableParents(filtered);
                } else {
                  fetchAvailableParents(newMemberData.level);
                }
              }}
            />
          </View>

          <FlatList
            data={availableParents}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.parentItem,
                  selectedParentId === item.id && styles.parentItemActive
                ]}
                onPress={() => {
                  setSelectedParentId(item.id);
                  setSelectedParentName(item.fullName);
                }}
              >
                <View style={styles.parentItemLeft}>
                  <View style={styles.parentItemAvatar}>
                    <Text style={styles.parentItemAvatarText}>
                      {item.fullName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.parentItemName}>{item.fullName}</Text>
                    <Text style={styles.parentItemLevel}>
                      Level: {item.levelName} • Direct: {item.directReferralCount}
                    </Text>
                  </View>
                </View>
                {selectedParentId === item.id && (
                  <MaterialIcons name="check-circle" size={24} color="#10b981" />
                )}
              </TouchableOpacity>
            )}
            style={styles.parentList}
            showsVerticalScrollIndicator={true}
          />

          {selectedParentId && (
            <View style={styles.selectedParentContainer}>
              <MaterialIcons name="link" size={16} color="#10b981" />
              <Text style={styles.selectedParentText}>
                Assigning under: {selectedParentName}
              </Text>
            </View>
          )}

          <View style={styles.stepButtons}>
            <TouchableOpacity 
              style={[styles.backButton, { backgroundColor: '#6b7280' }]} 
              onPress={handleSkipAssignment}
            >
              <MaterialIcons name="skip-next" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Skip</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.submitButton, (!selectedParentId || savingMember) && { opacity: 0.6 }]}
              onPress={handleAssignToParent}
              disabled={!selectedParentId || savingMember}
            >
              {savingMember ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <MaterialIcons name="group-add" size={20} color="#ffffff" />
                  <Text style={styles.buttonText}>Assign & Complete</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.noParentContainer}>
          <MaterialIcons name="people-outline" size={50} color="#d1d5db" />
          <Text style={styles.noParentTitle}>No Higher-Level Members Available</Text>
          <Text style={styles.noParentSubtext}>
            There are no active working members at higher levels to assign {createdMemberName} under.
          </Text>
          <TouchableOpacity 
            style={[styles.submitButton, { marginTop: 16 }]}
            onPress={handleSkipAssignment}
          >
            <Text style={styles.buttonText}>Complete Without Assignment</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // ============ RENDER ============
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7722" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']} key={renderKey}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backHeaderButton}>
              <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { fontSize: isSmallDevice ? 18 : 20 }]}>
              {step === 1 ? 'Register Method' : step === 2 ? 'Create Member' : 'Assign Parent'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>Step {step} of 3</Text>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {step === 1 && renderRegistrationMethod()}
            {step === 2 && renderCreateMember()}
            {step === 3 && renderAssignParent()}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fdf8f3',
  },
  container: {
    flex: 1,
    backgroundColor: '#fdf8f3',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fdf8f3',
  },
  loadingText: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
    marginTop: 10,
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
    marginBottom: 12,
  },
  backHeaderButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: Fonts.Bold,
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  progressText: {
    fontFamily: Fonts.Regular,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 400,
  },
  stepTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 20,
    color: '#1f2937',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
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
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 4,
  },
  input: {
    fontFamily: Fonts.Regular,
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 4,
    color: '#1f2937',
  },
  bottomLine: {
    height: 2,
    backgroundColor: '#FF7722',
    width: '100%',
    marginTop: 2,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCode: {
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
    color: '#1f2937',
    paddingRight: 8,
    paddingVertical: 10,
  },
  phoneInput: {
    fontFamily: Fonts.Regular,
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 4,
    color: '#1f2937',
    flex: 1,
  },
  levelOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  levelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 4,
  },
  levelOptionActive: {
    backgroundColor: '#FF7722',
    borderColor: '#FF7722',
  },
  levelOptionText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 10,
    color: '#6b7280',
  },
  levelOptionTextActive: {
    color: '#ffffff',
  },
  levelOptionSubText: {
    fontFamily: Fonts.Regular,
    fontSize: 8,
    color: '#6b7280',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  expandButtonText: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#FF7722',
  },
  stepButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF7722',
    paddingVertical: 14,
    borderRadius: 50,
    marginTop: 16,
    shadowColor: '#FF7722',
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
    paddingVertical: 14,
    borderRadius: 50,
    flex: 1,
    gap: 8,
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
    paddingVertical: 14,
    borderRadius: 50,
    paddingHorizontal: 20,
    gap: 6,
  },
  buttonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: 16,
  },
  createdMemberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: 12,
    marginBottom: 16,
  },
  createdMemberName: {
    fontFamily: Fonts.Bold,
    fontSize: 16,
    color: '#1f2937',
  },
  createdMemberLevel: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#6b7280',
  },
  parentSearchContainer: {
    marginBottom: 12,
  },
  parentList: {
    maxHeight: 300,
  },
  parentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  parentItemActive: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  parentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  parentItemAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF772215',
    justifyContent: 'center',
    alignItems: 'center',
  },
  parentItemAvatarText: {
    fontFamily: Fonts.Bold,
    fontSize: 16,
    color: '#FF7722',
  },
  parentItemName: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#1f2937',
  },
  parentItemLevel: {
    fontFamily: Fonts.Regular,
    fontSize: 11,
    color: '#6b7280',
  },
  selectedParentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  selectedParentText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 13,
    color: '#10b981',
    flex: 1,
  },
  noParentContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  noParentTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
    color: '#1f2937',
  },
levelHelperText: {
  fontFamily: Fonts.Regular,
  fontSize: isSmallDevice ? 11 : 12,
  color: '#6b7280',
  marginBottom: 8,
  fontStyle: 'italic',
},
selectedLevelInfo: {
  fontFamily: Fonts.Regular,
  fontSize: isSmallDevice ? 11 : 12,
  color: '#10b981',
  marginTop: 6,
},
  noParentSubtext: {
    fontFamily: Fonts.Regular,
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
});