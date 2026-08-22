// screens/employee/EmployeeProfile.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TextInput, TouchableOpacity, Alert, ActivityIndicator, Switch } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db, getAuthInstance } from '../../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Fonts } from '../../config/fonts';
import { useLanguage } from '../../context/LanguageContext';

export default function EmployeeProfile({ navigation }) {
  const { t, counter } = useLanguage();
  
  // Force re-render when language changes
  const renderKey = `employee-profile-${counter}`;

  // Get translations
  const getTranslations = () => ({
    // Common
    error: t('common.error') || 'Error',
    success: t('common.success') || 'Success',
    loading: t('common.loading') || 'Loading...',
    notProvided: t('common.notProvided') || 'Not provided',
    nA: t('common.nA') || 'N/A',
    profile: t('common.profile') || 'Profile',
    edit: t('common.edit') || 'Edit',
    cancel: t('common.cancel') || 'Cancel',
    save: t('common.save') || 'Save',
    saving: t('common.saving') || 'Saving...',
    logout: t('common.logout') || 'Logout',
    enterFullName: t('common.enterFullName') || 'Enter full name',
    enterPhone: t('common.enterPhone') || 'Enter phone number',
    enterAddress: t('common.enterAddress') || 'Enter address',
    loadingProfile: t('common.loadingProfile') || 'Loading Profile...',
    profileUpdated: t('common.profileUpdated') || 'Profile updated successfully',
    failedToLoad: t('common.failedToLoad') || 'Failed to load profile',
    userNotLoggedIn: t('common.userNotLoggedIn') || 'User not logged in',
    active: t('common.active') || 'Active',
    
    // Employee specific
    myProfile: t('common.profile') || 'My Profile',
    employeeId: t('employee.employeeId') || 'ID',
    fullName: t('employee.fullName') || 'Full Name',
    email: t('common.email') || 'Email',
    phone: t('common.phone') || 'Phone',
    address: t('common.address') || 'Address',
    bio: t('common.bio') || 'Bio',
    position: t('employee.position') || 'Position',
    department: t('employee.department') || 'Department',
    joiningDate: t('employee.joiningDate') || 'Joining Date',
    personalInformation: 'Personal Information',
    employmentInformation: 'Employment Information',
    myTasks: t('employee.tasks') || 'My Tasks',
    viewAssignedTasks: t('employee.tasks') || 'View your assigned tasks',
    employee: 'Employee',
    general: t('common.general') || 'General',
    version: 'NGO App v1.0.0',
    employeeLabel: 'Employee',
    id: t('common.id') || 'ID',
  });

  const translations = getTranslations();

  const [userData, setUserData] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    profilePhoto: null,
    position: '',
    department: '',
    employeeId: '',
    joiningDate: '',
    bio: ''
  });

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const fetchEmployeeData = async () => {
 const auth = getAuthInstance(); // ✅ ADD THIS
    setLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert(translations.error, translations.userNotLoggedIn);
        return;
      }

      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setUserData(userData);
        
        if (userData.employeeId) {
          const empDocRef = doc(db, 'employees', userData.employeeId);
          const empDocSnap = await getDoc(empDocRef);
          
          if (empDocSnap.exists()) {
            const empData = empDocSnap.data();
            setEmployeeData(empData);
            setFormData({
              fullName: empData.fullName || userData.fullName || '',
              email: empData.email || userData.email || '',
              phone: empData.phone || '',
              address: empData.address || '',
              profilePhoto: empData.profilePhoto || userData.profilePhoto || null,
              position: empData.position || translations.employee,
              department: empData.department || translations.general,
              employeeId: empData.employeeId || translations.nA,
              joiningDate: empData.joiningDate || translations.nA,
              bio: empData.bio || translations.employee
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
      Alert.alert(translations.error, translations.failedToLoad);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
const auth = getAuthInstance(); // ✅ ADD THIS
    setSaving(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      await updateDoc(doc(db, 'users', userId), {
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        profilePhoto: formData.profilePhoto,
        bio: formData.bio,
        updatedAt: new Date().toISOString()
      });

      if (userData?.employeeId) {
        await updateDoc(doc(db, 'employees', userData.employeeId), {
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          profilePhoto: formData.profilePhoto,
          bio: formData.bio,
          updatedAt: new Date().toISOString()
        });
      }

      Alert.alert(translations.success, translations.profileUpdated);
      setEditing(false);
      fetchEmployeeData();
    } catch (error) {
      Alert.alert(translations.error, error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
const auth = getAuthInstance(); // ✅ ADD THIS
    try {
      await signOut(auth);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      Alert.alert(translations.error, error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer} key={renderKey}>
        <ActivityIndicator size="large" color="#FF7722" />
        <Text style={styles.loadingText}>{translations.loadingProfile}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} key={renderKey}>
      {/* Saffron Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{translations.myProfile}</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)} activeOpacity={0.7}>
            <Text style={styles.editButton}>{editing ? translations.cancel : translations.edit}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {formData.profilePhoto ? (
              <Image source={{ uri: formData.profilePhoto }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <MaterialIcons name="person" size={50} color="#FF7722" />
              </View>
            )}
          </View>
          <Text style={styles.profileName}>{formData.fullName || translations.employee}</Text>
          <Text style={styles.profilePosition}>{formData.position}</Text>
          <Text style={styles.profileDepartment}>{formData.department}</Text>
          
          <View style={styles.employeeIdBadge}>
            <MaterialIcons name="badge" size={16} color="#FF7722" />
            <Text style={styles.employeeIdText}>{translations.id}: {formData.employeeId}</Text>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{translations.personalInformation}</Text>
          
          <View style={styles.field}>
            <Text style={styles.label}>{translations.fullName}</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={formData.fullName}
                onChangeText={(text) => setFormData({...formData, fullName: text})}
                placeholder={translations.enterFullName}
                textAlignVertical="center"
              />
            ) : (
              <Text style={styles.value}>{formData.fullName || translations.nA}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{translations.email}</Text>
            <Text style={styles.value}>{formData.email}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{translations.phone}</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({...formData, phone: text})}
                keyboardType="phone-pad"
                placeholder={translations.enterPhone}
                textAlignVertical="center"
              />
            ) : (
              <Text style={styles.value}>{formData.phone || translations.notProvided}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{translations.address}</Text>
            {editing ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.address}
                onChangeText={(text) => setFormData({...formData, address: text})}
                multiline
                numberOfLines={3}
                placeholder={translations.enterAddress}
                textAlignVertical="top"
              />
            ) : (
              <Text style={styles.value}>{formData.address || translations.notProvided}</Text>
            )}
          </View>
        </View>

        {/* Employment Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{translations.employmentInformation}</Text>

          <View style={styles.field}>
            <Text style={styles.label}>{translations.position}</Text>
            <View style={styles.badgeContainer}>
              <MaterialIcons name="work" size={16} color="#FF7722" />
              <Text style={styles.value}>{formData.position}</Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{translations.department}</Text>
            <View style={styles.badgeContainer}>
              <MaterialIcons name="business" size={16} color="#8b5cf6" />
              <Text style={styles.value}>{formData.department}</Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{translations.employeeId}</Text>
            <View style={styles.badgeContainer}>
              <MaterialIcons name="badge" size={16} color="#f59e0b" />
              <Text style={styles.value}>{formData.employeeId}</Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{translations.joiningDate}</Text>
            <View style={styles.dateBadge}>
              <MaterialIcons name="calendar-today" size={14} color="#6b7280" />
              <Text style={styles.dateText}>{formData.joiningDate}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <TouchableOpacity 
          style={styles.taskButton}
          onPress={() => navigation.navigate('EmployeeTasks')}
          activeOpacity={0.7}
        >
          <View style={styles.taskButtonLeft}>
            <View style={styles.taskButtonIcon}>
              <MaterialIcons name="assignment" size={22} color="#ffffff" />
            </View>
            <View>
              <Text style={styles.taskButtonTitle}>{translations.myTasks}</Text>
              <Text style={styles.taskButtonSubtitle}>{translations.viewAssignedTasks}</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#ffffff" />
        </TouchableOpacity>

        {editing && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving} activeOpacity={0.7}>
            <MaterialIcons name="save" size={20} color="#ffffff" />
            <Text style={styles.saveButtonText}>{saving ? translations.saving : translations.save}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <MaterialIcons name="logout" size={20} color="#ffffff" />
          <Text style={styles.logoutButtonText}>{translations.logout}</Text>
        </TouchableOpacity>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>{translations.version}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf8f3',
  },

  headerCard: {
    backgroundColor: '#FF7722',
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
  editButton: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: 14,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 4,
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
    fontSize: 14,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  profileSection: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FF7722',
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FF7722',
  },
  profileName: {
    fontFamily: Fonts.Bold,
    fontSize: 22,
    color: '#1f2937',
    marginTop: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  profilePosition: {
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
    color: '#FF7722',
    marginTop: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  profileDepartment: {
    fontFamily: Fonts.Regular,
    fontSize: 14,
    color: '#6b7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  employeeIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5EB',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
    gap: 6,
  },
  employeeIdText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 14,
    color: '#FF7722',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontFamily: Fonts.Bold,
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontFamily: Fonts.SemiBold,
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  value: {
    fontFamily: Fonts.Regular,
    fontSize: 15,
    color: '#1f2937',
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
    fontFamily: Fonts.Regular,
    color: '#1f2937',
    includeFontPadding: false,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontFamily: Fonts.Regular,
    fontSize: 15,
    color: '#1f2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  taskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#8b5cf6',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  taskButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  taskButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskButtonTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  taskButtonSubtitle: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  saveButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: 16,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  logoutButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
    fontSize: 16,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  versionContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  versionText: {
    fontFamily: Fonts.Regular,
    fontSize: 12,
    color: '#9ca3af',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});