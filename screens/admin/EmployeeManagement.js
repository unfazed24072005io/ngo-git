// screens/admin/EmployeeManagement.js - Updated with Password Field and Language Support
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal, ActivityIndicator, RefreshControl, FlatList, Image, Switch, Platform, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db, getAuthInstance } from '../../config/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { Fonts } from '../../config/fonts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../context/LanguageContext';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;

export default function EmployeeManagement({ navigation }) {
  const { t, counter } = useLanguage();
  
  // Force re-render when language changes
  const renderKey = `employee-${counter}`;

  // Get translations
  const getTranslations = () => ({
    employeeManagement: t('employee.management') || 'Employee Management',
    searchEmployees: t('employee.search') || 'Search employees...',
    total: t('common.total') || 'Total',
    active: t('common.active') || 'Active',
    suspended: t('employee.suspended') || 'Suspended',
    canLogin: t('employee.canLogin') || 'Can Login',
    noEmployees: t('employee.noEmployees') || 'No employees found',
    addFirstEmployee: t('employee.addFirstEmployee') || 'Add your first employee',
    addEmployee: t('employee.addEmployee') || 'Add Employee',
    editEmployee: t('employee.editEmployee') || 'Edit Employee',
    employeeDetails: t('employee.details') || 'Employee Details',
    fullName: t('employee.fullName') || 'Full Name',
    email: t('common.email') || 'Email',
    phone: t('common.phone') || 'Phone',
    position: t('employee.position') || 'Position',
    department: t('employee.department') || 'Department',
    joiningDate: t('employee.joiningDate') || 'Joining Date',
    salary: t('employee.salary') || 'Salary',
    address: t('common.address') || 'Address',
    emergencyContact: t('employee.emergencyContact') || 'Emergency Contact',
    bankAccount: t('employee.bankAccount') || 'Bank Account',
    panNumber: t('employee.panNumber') || 'PAN Number',
    aadharNumber: t('employee.aadharNumber') || 'Aadhar Number',
    status: t('common.status') || 'Status',
    enableLogin: t('employee.enableLogin') || 'Enable Login',
    loginEnabled: t('employee.loginEnabled') || 'Login enabled',
    loginDisabled: t('employee.loginDisabled') || 'Login disabled',
    password: t('common.password') || 'Password',
    newPassword: t('employee.newPassword') || 'New Password (optional)',
    passwordRequired: t('employee.passwordRequired') || 'Password *',
    passwordPlaceholder: t('employee.passwordPlaceholder') || 'Enter password (min 6 chars)',
    newPasswordPlaceholder: t('employee.newPasswordPlaceholder') || 'New password (leave blank to keep current)',
    passwordHelper: t('employee.passwordHelper') || 'Password must be at least 6 characters',
    newPasswordHelper: t('employee.newPasswordHelper') || 'Leave blank to keep current password',
    addPhoto: t('employee.addPhoto') || 'Add Photo',
    edit: t('common.edit') || 'Edit',
    suspend: t('employee.suspend') || 'Suspend',
    activate: t('employee.activate') || 'Activate',
    delete: t('common.delete') || 'Delete',
    save: t('common.save') || 'Save',
    update: t('common.update') || 'Update',
    saving: t('common.saving') || 'Saving...',
    close: t('common.close') || 'Close',
    tasks: t('employee.tasks') || 'Tasks',
    addTask: t('employee.addTask') || 'Add Task',
    noTasks: t('employee.noTasks') || 'No tasks assigned',
    taskTitle: t('employee.taskTitle') || 'Task Title',
    taskDescription: t('employee.taskDescription') || 'Description',
    priority: t('employee.priority') || 'Priority',
    dueDate: t('employee.dueDate') || 'Due Date',
    category: t('common.category') || 'Category',
    taskStatus: t('employee.taskStatus') || 'Status',
    assignedTo: t('employee.assignedTo') || 'Assigned To',
    low: t('common.low') || 'Low',
    medium: t('common.medium') || 'Medium',
    high: t('common.high') || 'High',
    pending: t('common.pending') || 'Pending',
    inProgress: t('employee.inProgress') || 'In Progress',
    completed: t('employee.completed') || 'Completed',
    cancelled: t('common.cancelled') || 'Cancelled',
    start: t('employee.start') || 'Start',
    complete: t('employee.complete') || 'Complete',
    cancel: t('common.cancel') || 'Cancel',
    employeeAdded: t('employee.added') || 'Employee {name} added successfully',
    employeeUpdated: t('employee.updated') || 'Employee updated successfully',
    employeeDeleted: t('employee.deleted') || 'Employee deleted successfully',
    taskAdded: t('employee.taskAdded') || 'Task assigned successfully',
    taskUpdated: t('employee.taskUpdated') || 'Task updated successfully',
    taskDeleted: t('employee.taskDeleted') || 'Task deleted successfully',
    statusUpdated: t('employee.statusUpdated') || 'Status updated to {status}',
    taskStatusUpdated: t('employee.taskStatusUpdated') || 'Task status updated to {status}',
    confirmDelete: t('employee.confirmDelete') || 'Are you sure you want to delete this employee? This will also remove their login access.',
    confirmDeleteTask: t('employee.confirmDeleteTask') || 'Are you sure you want to delete this task?',
    requiredFields: t('employee.requiredFields') || 'Please fill all required fields',
    passwordRequiredForLogin: t('employee.passwordRequiredForLogin') || 'Password is required when enabling login',
    passwordMinLength: t('employee.passwordMinLength') || 'Password must be at least 6 characters',
    emailAlreadyRegistered: t('employee.emailAlreadyRegistered') || 'Email already registered',
    permissionRequired: t('common.permissionRequired') || 'Permission Required',
    allowGallery: t('common.allowGallery') || 'Please allow access to your gallery',
    error: t('common.error') || 'Error',
    success: t('common.success') || 'Success',
    warning: t('common.warning') || 'Warning',
    nA: t('common.nA') || 'N/A',
    id: t('common.id') || 'ID',
    employeeId: t('employee.employeeId') || 'ID',
    loginAccess: t('employee.loginAccess') || 'Login Access',
    enabled: t('common.enabled') || 'Enabled',
    disabled: t('common.disabled') || 'Disabled',
  });

  const translations = getTranslations();

  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showTasks, setShowTasks] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    joiningDate: '',
    salary: '',
    status: 'active',
    profilePhoto: null,
    address: '',
    emergencyContact: '',
    bankAccount: '',
    panNumber: '',
    aadharNumber: '',
    password: '',
    employeeId: '',
    isActive: true,
    canLogin: false
  });
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    dueDate: '',
    assignedTo: '',
    assignedToName: '',
    category: ''
  });

  useEffect(() => {
    setupRealtimeListener();
  }, []);

  const setupRealtimeListener = () => {
    const q = query(collection(db, 'employees'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const employeesList = [];
      snapshot.forEach((doc) => {
        employeesList.push({ id: doc.id, ...doc.data() });
      });
      setEmployees(employeesList);
      applyFilters(employeesList, searchQuery);
      setLoading(false);
    });

    return () => unsubscribe();
  };

  const applyFilters = (data, searchText) => {
    let filtered = data;
    if (searchText) {
      filtered = filtered.filter(emp =>
        emp.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchText.toLowerCase()) ||
        emp.position?.toLowerCase().includes(searchText.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchText.toLowerCase()) ||
        emp.employeeId?.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    setFilteredEmployees(filtered);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    applyFilters(employees, text);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(translations.permissionRequired, translations.allowGallery);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      const base64Url = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setFormData({ ...formData, profilePhoto: base64Url });
    }
  };

  const generateEmployeeId = () => {
    const prefix = 'EMP';
    const random = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}${random}`;
  };

  const handleSave = async () => {
    if (!formData.fullName || !formData.email) {
      Alert.alert(translations.error, translations.requiredFields);
      return;
    }

    if (formData.canLogin && !editingEmployee && !formData.password) {
      Alert.alert(translations.error, translations.passwordRequiredForLogin);
      return;
    }

    if (formData.canLogin && formData.password && formData.password.length < 6) {
      Alert.alert(translations.error, translations.passwordMinLength);
      return;
    }

    setLoading(true);
    try {
      const emailQuery = query(collection(db, 'employees'), where('email', '==', formData.email));
      const emailSnap = await getDocs(emailQuery);
      if (!emailSnap.empty && !editingEmployee) {
        Alert.alert(translations.error, translations.emailAlreadyRegistered);
        setLoading(false);
        return;
      }

      const employeeId = editingEmployee ? formData.employeeId : generateEmployeeId();
      
      const data = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone || '',
        position: formData.position || 'Employee',
        department: formData.department || 'General',
        joiningDate: formData.joiningDate || new Date().toISOString().split('T')[0],
        salary: parseFloat(formData.salary) || 0,
        status: formData.status || 'active',
        profilePhoto: formData.profilePhoto || null,
        address: formData.address || '',
        emergencyContact: formData.emergencyContact || '',
        bankAccount: formData.bankAccount || '',
        panNumber: formData.panNumber || '',
        aadharNumber: formData.aadharNumber || '',
        employeeId: employeeId,
        isActive: formData.isActive !== undefined ? formData.isActive : true,
        canLogin: formData.canLogin || false,
        updatedAt: new Date().toISOString()
      };

      if (editingEmployee) {
        await updateDoc(doc(db, 'employees', editingEmployee.id), data);
        
        if (formData.canLogin && formData.password) {
          await updateDoc(doc(db, 'employees', editingEmployee.id), {
            passwordHash: formData.password
          });
        }
        
        Alert.alert(translations.success, translations.employeeUpdated);
      } else {
        data.createdAt = new Date().toISOString();
        const auth = getAuthInstance();
data.createdBy = auth.currentUser?.uid || 'admin';
        
        const docRef = await addDoc(collection(db, 'employees'), data);
        
        if (formData.canLogin && formData.password) {
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            await updateProfile(userCredential.user, {
              displayName: formData.fullName,
              photoURL: formData.profilePhoto || null
            });
            
            await setDoc(doc(db, 'users', userCredential.user.uid), {
              employeeId: docRef.id,
              fullName: formData.fullName,
              email: formData.email,
              role: 'employee',
              phone: formData.phone || '',
              position: formData.position || 'Employee',
              department: formData.department || 'General',
              profilePhoto: formData.profilePhoto || null,
              createdAt: new Date().toISOString(),
              isEmployee: true
            });
            
            await updateDoc(doc(db, 'employees', docRef.id), {
              authUid: userCredential.user.uid
            });
          } catch (authError) {
            console.error('Auth creation error:', authError);
            Alert.alert(translations.warning, 'Employee added but login creation failed: ' + authError.message);
          }
        }
        
        Alert.alert(translations.success, translations.employeeAdded.replace('{name}', formData.fullName));
      }

      setModalVisible(false);
      resetForm();
    } catch (error) {
      Alert.alert(translations.error, error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert(
      translations.delete,
      translations.confirmDelete,
      [
        { text: translations.cancel, style: 'cancel' },
        {
          text: translations.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              const empRef = doc(db, 'employees', id);
              const empDoc = await getDoc(empRef);
              const empData = empDoc.data();
              
              if (empData?.authUid) {
                try {
                  await updateDoc(doc(db, 'users', empData.authUid), {
                    isDeleted: true,
                    deletedAt: new Date().toISOString()
                  });
                } catch (e) {
                  console.log('Auth user deletion note:', e);
                }
              }
              
              await deleteDoc(empRef);
              Alert.alert(translations.success, translations.employeeDeleted);
            } catch (error) {
              Alert.alert(translations.error, error.message);
            }
          }
        }
      ]
    );
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateDoc(doc(db, 'employees', id), { 
        status, 
        updatedAt: new Date().toISOString() 
      });
      Alert.alert(translations.success, translations.statusUpdated.replace('{status}', status));
    } catch (error) {
      Alert.alert(translations.error, error.message);
    }
  };

  const handleTaskSave = async () => {
  if (!taskData.title || !taskData.assignedTo) {
    Alert.alert(translations.error, translations.requiredFields);
    return;
  }

  setLoading(true);
  try {
    // ✅ MOVE auth HERE - BEFORE the object
    const auth = getAuthInstance();

    const data = {
      title: taskData.title,
      description: taskData.description || '',
      priority: taskData.priority || 'medium',
      status: taskData.status || 'pending',
      dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
      assignedTo: taskData.assignedTo,
      assignedToName: taskData.assignedToName || '',
      assignedByName: auth.currentUser?.displayName || 'Admin',
      assignedBy: auth.currentUser?.uid || 'admin',
      category: taskData.category || 'General',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (editingTask) {
      await updateDoc(doc(db, 'employeeTasks', editingTask.id), data);
      Alert.alert(translations.success, translations.taskUpdated);
    } else {
      await addDoc(collection(db, 'employeeTasks'), data);
      Alert.alert(translations.success, translations.taskAdded);
    }

    setTaskModalVisible(false);
    resetTaskForm();
    fetchTasks(selectedEmployee?.id);
  } catch (error) {
    Alert.alert(translations.error, error.message);
  } finally {
    setLoading(false);
  }
};

  const handleTaskDelete = async (taskId) => {
    Alert.alert(
      translations.delete,
      translations.confirmDeleteTask,
      [
        { text: translations.cancel, style: 'cancel' },
        {
          text: translations.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'employeeTasks', taskId));
              Alert.alert(translations.success, translations.taskDeleted);
              fetchTasks(selectedEmployee?.id);
            } catch (error) {
              Alert.alert(translations.error, error.message);
            }
          }
        }
      ]
    );
  };

  const handleTaskStatusUpdate = async (taskId, status) => {
    try {
      await updateDoc(doc(db, 'employeeTasks', taskId), { 
        status, 
        updatedAt: new Date().toISOString() 
      });
      Alert.alert(translations.success, translations.taskStatusUpdated.replace('{status}', status));
      fetchTasks(selectedEmployee?.id);
    } catch (error) {
      Alert.alert(translations.error, error.message);
    }
  };

  const fetchTasks = async (employeeId) => {
    if (!employeeId) return;
    try {
      const q = query(collection(db, 'employeeTasks'), where('assignedTo', '==', employeeId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const tasksList = [];
      snapshot.forEach((doc) => {
        tasksList.push({ id: doc.id, ...doc.data() });
      });
      setTasks(tasksList);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      joiningDate: '',
      salary: '',
      status: 'active',
      profilePhoto: null,
      address: '',
      emergencyContact: '',
      bankAccount: '',
      panNumber: '',
      aadharNumber: '',
      password: '',
      employeeId: '',
      isActive: true,
      canLogin: false
    });
    setEditingEmployee(null);
  };

  const resetTaskForm = () => {
    setTaskData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      dueDate: '',
      assignedTo: '',
      assignedToName: '',
      category: ''
    });
    setEditingTask(null);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return '#10b981';
      case 'inactive': return '#6b7280';
      case 'suspended': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getTaskStatusColor = (status) => {
    switch(status) {
      case 'completed': return '#10b981';
      case 'in-progress': return '#3b82f6';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const StatCard = ({ label, count, icon, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statIconContainer}>
        <MaterialIcons name={icon} size={isSmallDevice ? 16 : 20} color={color} />
      </View>
      <View>
        <Text style={[styles.statCount, { fontSize: isSmallDevice ? 12 : 14 }]}>{count}</Text>
        <Text style={[styles.statLabel, { fontSize: isSmallDevice ? 8 : 9 }]}>{label}</Text>
      </View>
    </View>
  );

  const EmployeeCard = ({ employee }) => (
    <TouchableOpacity 
      style={styles.employeeCard}
      onPress={() => {
        setSelectedEmployee(employee);
        fetchTasks(employee.id);
        setShowTasks(false);
        setDetailModalVisible(true);
      }}
    >
      <View style={styles.employeeHeader}>
        <View style={styles.employeeInfo}>
          {employee.profilePhoto ? (
            <Image source={{ uri: employee.profilePhoto }} style={styles.employeeAvatar} />
          ) : (
            <View style={styles.employeeAvatarPlaceholder}>
              <Text style={[styles.employeeAvatarText, { fontSize: isSmallDevice ? 16 : 18 }]}>
                {employee.fullName?.charAt(0) || '?'}
              </Text>
            </View>
          )}
          <View style={styles.employeeTextInfo}>
            <Text style={[styles.employeeName, { fontSize: isSmallDevice ? 13 : 14 }]} numberOfLines={1}>
              {employee.fullName}
            </Text>
            <Text style={[styles.employeePosition, { fontSize: isSmallDevice ? 10 : 12 }]} numberOfLines={1}>
              {employee.position}
            </Text>
            <Text style={[styles.employeeIdText, { fontSize: isSmallDevice ? 9 : 10 }]}>{translations.id}: {employee.employeeId}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(employee.status) + '15' }]}>
          <Text style={[styles.statusBadgeText, { color: getStatusColor(employee.status), fontSize: isSmallDevice ? 9 : 10 }]}>
            {employee.status || 'active'}
          </Text>
        </View>
      </View>

      <View style={styles.employeeDetails}>
        <View style={styles.employeeDetail}>
          <MaterialIcons name="email" size={isSmallDevice ? 12 : 14} color="#6b7280" />
          <Text style={[styles.employeeDetailText, { fontSize: isSmallDevice ? 9 : 10 }]} numberOfLines={1}>
            {employee.email}
          </Text>
        </View>
        <View style={styles.employeeDetail}>
          <MaterialIcons name="phone" size={isSmallDevice ? 12 : 14} color="#6b7280" />
          <Text style={[styles.employeeDetailText, { fontSize: isSmallDevice ? 9 : 10 }]}>{employee.phone || translations.nA}</Text>
        </View>
        <View style={styles.employeeDetail}>
          <MaterialIcons name="business" size={isSmallDevice ? 12 : 14} color="#6b7280" />
          <Text style={[styles.employeeDetailText, { fontSize: isSmallDevice ? 9 : 10 }]} numberOfLines={1}>
            {employee.department}
          </Text>
        </View>
      </View>

      {employee.canLogin && (
        <View style={styles.loginBadge}>
          <MaterialIcons name="check-circle" size={12} color="#10b981" />
          <Text style={[styles.loginBadgeText, { fontSize: isSmallDevice ? 9 : 10 }]}>{translations.loginEnabled}</Text>
        </View>
      )}

      <View style={styles.employeeActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => {
            setEditingEmployee(employee);
            setFormData({...employee, password: ''});
            setModalVisible(true);
          }}
        >
          <MaterialIcons name="edit" size={isSmallDevice ? 12 : 14} color="#ffffff" />
          <Text style={[styles.actionButtonText, { fontSize: isSmallDevice ? 8 : 10 }]}>{translations.edit}</Text>
        </TouchableOpacity>
        {employee.status === 'active' ? (
          <TouchableOpacity 
            style={[styles.actionButton, styles.suspendButton]}
            onPress={() => handleStatusUpdate(employee.id, 'suspended')}
          >
            <MaterialIcons name="block" size={isSmallDevice ? 12 : 14} color="#ffffff" />
            <Text style={[styles.actionButtonText, { fontSize: isSmallDevice ? 8 : 10 }]}>{translations.suspend}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.actionButton, styles.activateButton]}
            onPress={() => handleStatusUpdate(employee.id, 'active')}
          >
            <MaterialIcons name="check-circle" size={isSmallDevice ? 12 : 14} color="#ffffff" />
            <Text style={[styles.actionButtonText, { fontSize: isSmallDevice ? 8 : 10 }]}>{translations.activate}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(employee.id)}
        >
          <MaterialIcons name="delete" size={isSmallDevice ? 16 : 18} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const TaskItem = ({ task }) => (
    <View style={styles.taskItem}>
      <View style={styles.taskHeader}>
        <Text style={[styles.taskTitle, { fontSize: isSmallDevice ? 12 : 14 }]} numberOfLines={1}>
          {task.title}
        </Text>
        <View style={[styles.taskStatusBadge, { backgroundColor: getTaskStatusColor(task.status) + '15' }]}>
          <Text style={[styles.taskStatusText, { color: getTaskStatusColor(task.status), fontSize: isSmallDevice ? 8 : 10 }]}>
            {task.status === 'in-progress' ? translations.inProgress : (task.status || translations.pending)}
          </Text>
        </View>
      </View>
      <Text style={[styles.taskDescription, { fontSize: isSmallDevice ? 11 : 12 }]} numberOfLines={2}>
        {task.description || translations.noDescription || 'No description'}
      </Text>
      <View style={styles.taskFooter}>
        <View style={[styles.taskPriorityBadge, { backgroundColor: getPriorityColor(task.priority) + '15' }]}>
          <Text style={[styles.taskPriorityText, { color: getPriorityColor(task.priority), fontSize: isSmallDevice ? 8 : 10 }]}>
            {task.priority || translations.medium}
          </Text>
        </View>
        <Text style={[styles.taskDueDate, { fontSize: isSmallDevice ? 10 : 11 }]}>
          {translations.dueDate}: {task.dueDate || translations.nA}
        </Text>
      </View>
      <View style={styles.taskActions}>
        {task.status === 'pending' && (
          <TouchableOpacity 
            style={[styles.taskActionButton, styles.taskStartButton]}
            onPress={() => handleTaskStatusUpdate(task.id, 'in-progress')}
          >
            <MaterialIcons name="play-arrow" size={isSmallDevice ? 12 : 14} color="#ffffff" />
            <Text style={[styles.taskActionText, { fontSize: isSmallDevice ? 8 : 9 }]}>{translations.start}</Text>
          </TouchableOpacity>
        )}
        {task.status === 'in-progress' && (
          <TouchableOpacity 
            style={[styles.taskActionButton, styles.taskCompleteButton]}
            onPress={() => handleTaskStatusUpdate(task.id, 'completed')}
          >
            <MaterialIcons name="check" size={isSmallDevice ? 12 : 14} color="#ffffff" />
            <Text style={[styles.taskActionText, { fontSize: isSmallDevice ? 8 : 9 }]}>{translations.complete}</Text>
          </TouchableOpacity>
        )}
        {task.status !== 'completed' && task.status !== 'cancelled' && (
          <TouchableOpacity 
            style={[styles.taskActionButton, styles.taskCancelButton]}
            onPress={() => handleTaskStatusUpdate(task.id, 'cancelled')}
          >
            <MaterialIcons name="cancel" size={isSmallDevice ? 12 : 14} color="#ffffff" />
            <Text style={[styles.taskActionText, { fontSize: isSmallDevice ? 8 : 9 }]}>{translations.cancel}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[styles.taskActionButton, styles.taskEditButton]}
          onPress={() => {
            setEditingTask(task);
            setTaskData({
              title: task.title,
              description: task.description || '',
              priority: task.priority || 'medium',
              status: task.status || 'pending',
              dueDate: task.dueDate || '',
              assignedTo: task.assignedTo,
              assignedToName: task.assignedToName || '',
              category: task.category || ''
            });
            setTaskModalVisible(true);
          }}
        >
          <MaterialIcons name="edit" size={isSmallDevice ? 12 : 14} color="#ffffff" />
          <Text style={[styles.taskActionText, { fontSize: isSmallDevice ? 8 : 9 }]}>{translations.edit}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.taskActionButton, styles.taskDeleteButton]}
          onPress={() => handleTaskDelete(task.id)}
        >
          <MaterialIcons name="delete" size={isSmallDevice ? 16 : 18} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer} key={renderKey}>
        <ActivityIndicator size="large" color="#FF7722" />
        <Text style={[styles.loadingText, { fontSize: isSmallDevice ? 13 : 14 }]}>{translations.loading || 'Loading Employees...'}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']} key={renderKey}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { fontSize: isSmallDevice ? 18 : 20 }]}>{translations.employeeManagement}</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => {
                resetForm();
                setModalVisible(true);
              }}
            >
              <MaterialIcons name="add" size={isSmallDevice ? 18 : 20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#9ca3af" />
            <TextInput
              style={[styles.searchInput, { fontSize: isSmallDevice ? 13 : 14 }]}
              placeholder={translations.searchEmployees}
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <MaterialIcons name="close" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <StatCard 
              label={translations.total} 
              count={employees.length} 
              icon="people" 
              color="#FF7722" 
            />
            <StatCard 
              label={translations.active} 
              count={employees.filter(e => e.status === 'active').length} 
              icon="check-circle" 
              color="#10b981" 
            />
            <StatCard 
              label={translations.suspended} 
              count={employees.filter(e => e.status === 'suspended').length} 
              icon="block" 
              color="#ef4444" 
            />
            <StatCard 
              label={translations.canLogin} 
              count={employees.filter(e => e.canLogin).length} 
              icon="login" 
              color="#8b5cf6" 
            />
          </View>
        </View>

        {/* Employee List */}
        <FlatList
          data={filteredEmployees}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EmployeeCard employee={item} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF7722']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="people" size={44} color="#d1d5db" />
              <Text style={[styles.emptyStateText, { fontSize: isSmallDevice ? 15 : 16 }]}>{translations.noEmployees}</Text>
              <Text style={[styles.emptyStateSubtext, { fontSize: isSmallDevice ? 12 : 13 }]}>{translations.addFirstEmployee}</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />

        {/* Add/Edit Employee Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { fontSize: isSmallDevice ? 18 : 20 }]}>
                  {editingEmployee ? translations.editEmployee : translations.addEmployee}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.photoUpload} onPress={pickImage}>
                {formData.profilePhoto ? (
                  <Image source={{ uri: formData.profilePhoto }} style={styles.photoPreview} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <MaterialIcons name="person" size={40} color="#FF7722" />
                    <Text style={[styles.photoText, { fontSize: isSmallDevice ? 9 : 10 }]}>{translations.addPhoto}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.fullName} *</Text>
                <TextInput
                  style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                  value={formData.fullName}
                  onChangeText={(text) => setFormData({...formData, fullName: text})}
                  placeholder={translations.fullName}
                />
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.email} *</Text>
                <TextInput
                  style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                  value={formData.email}
                  onChangeText={(text) => setFormData({...formData, email: text})}
                  placeholder={translations.email}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formField, styles.formHalf]}>
                  <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.phone}</Text>
                  <TextInput
                    style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                    value={formData.phone}
                    onChangeText={(text) => setFormData({...formData, phone: text})}
                    placeholder={translations.phone}
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={[styles.formField, styles.formHalf]}>
                  <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.position}</Text>
                  <TextInput
                    style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                    value={formData.position}
                    onChangeText={(text) => setFormData({...formData, position: text})}
                    placeholder={translations.position}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formField, styles.formHalf]}>
                  <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.department}</Text>
                  <TextInput
                    style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                    value={formData.department}
                    onChangeText={(text) => setFormData({...formData, department: text})}
                    placeholder={translations.department}
                  />
                </View>
                <View style={[styles.formField, styles.formHalf]}>
                  <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.joiningDate}</Text>
                  <TextInput
                    style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                    value={formData.joiningDate}
                    onChangeText={(text) => setFormData({...formData, joiningDate: text})}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.salary} (₹)</Text>
                <TextInput
                  style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                  value={formData.salary}
                  onChangeText={(text) => setFormData({...formData, salary: text})}
                  placeholder={translations.salary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.address}</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea, { fontSize: isSmallDevice ? 13 : 14 }]}
                  value={formData.address}
                  onChangeText={(text) => setFormData({...formData, address: text})}
                  placeholder={translations.address}
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.emergencyContact}</Text>
                <TextInput
                  style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                  value={formData.emergencyContact}
                  onChangeText={(text) => setFormData({...formData, emergencyContact: text})}
                  placeholder={translations.emergencyContact}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formField, styles.formHalf]}>
                  <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.bankAccount}</Text>
                  <TextInput
                    style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                    value={formData.bankAccount}
                    onChangeText={(text) => setFormData({...formData, bankAccount: text})}
                    placeholder={translations.bankAccount}
                  />
                </View>
                <View style={[styles.formField, styles.formHalf]}>
                  <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.panNumber}</Text>
                  <TextInput
                    style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                    value={formData.panNumber}
                    onChangeText={(text) => setFormData({...formData, panNumber: text})}
                    placeholder={translations.panNumber}
                  />
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.aadharNumber}</Text>
                <TextInput
                  style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                  value={formData.aadharNumber}
                  onChangeText={(text) => setFormData({...formData, aadharNumber: text})}
                  placeholder={translations.aadharNumber}
                />
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.status}</Text>
                <View style={styles.statusContainer}>
                  {['active', 'inactive', 'suspended'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[styles.statusOption, formData.status === status && styles.statusOptionActive]}
                      onPress={() => setFormData({...formData, status})}
                    >
                      <Text style={[styles.statusOptionText, formData.status === status && styles.statusOptionTextActive, { fontSize: isSmallDevice ? 10 : 12 }]}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.enableLogin}</Text>
                <View style={styles.loginToggleContainer}>
                  <Switch
                    value={formData.canLogin || false}
                    onValueChange={(value) => setFormData({...formData, canLogin: value})}
                    trackColor={{ false: '#767577', true: '#FF7722' }}
                    thumbColor={formData.canLogin ? '#ffffff' : '#f4f3f4'}
                  />
                  <Text style={[styles.loginToggleText, { fontSize: isSmallDevice ? 12 : 14 }]}>
                    {formData.canLogin ? translations.loginEnabled : translations.loginDisabled}
                  </Text>
                </View>
              </View>

              {formData.canLogin && (
                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>
                    {editingEmployee ? translations.newPassword : translations.passwordRequired}
                  </Text>
                  <TextInput
                    style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                    value={formData.password}
                    onChangeText={(text) => setFormData({...formData, password: text})}
                    placeholder={editingEmployee ? translations.newPasswordPlaceholder : translations.passwordPlaceholder}
                    secureTextEntry
                  />
                  <Text style={[styles.helperText, { fontSize: isSmallDevice ? 10 : 11 }]}>
                    {editingEmployee ? translations.newPasswordHelper : translations.passwordHelper}
                  </Text>
                </View>
              )}

              <TouchableOpacity style={styles.submitButton} onPress={handleSave} disabled={loading}>
                <Text style={[styles.submitButtonText, { fontSize: isSmallDevice ? 14 : 16 }]}>
                  {loading ? translations.saving : editingEmployee ? translations.update : translations.add}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>

        {/* Employee Detail & Task Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={detailModalVisible}
          onRequestClose={() => setDetailModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalContent}>
              {selectedEmployee && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { fontSize: isSmallDevice ? 18 : 20 }]}>{translations.employeeDetails}</Text>
                    <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                      <MaterialIcons name="close" size={24} color="#6b7280" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.detailProfile}>
                    {selectedEmployee.profilePhoto ? (
                      <Image source={{ uri: selectedEmployee.profilePhoto }} style={styles.detailAvatar} />
                    ) : (
                      <View style={styles.detailAvatarPlaceholder}>
                        <Text style={[styles.detailAvatarText, { fontSize: isSmallDevice ? 28 : 32 }]}>
                          {selectedEmployee.fullName?.charAt(0) || '?'}
                        </Text>
                      </View>
                    )}
                    <Text style={[styles.detailName, { fontSize: isSmallDevice ? 18 : 20 }]}>
                      {selectedEmployee.fullName}
                    </Text>
                    <Text style={[styles.detailPosition, { fontSize: isSmallDevice ? 12 : 14 }]}>
                      {selectedEmployee.position}
                    </Text>
                    <Text style={[styles.detailEmployeeId, { fontSize: isSmallDevice ? 11 : 12 }]}>
                      {translations.id}: {selectedEmployee.employeeId}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={[styles.detailLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>{translations.email}</Text>
                    <Text style={[styles.detailValue, { fontSize: isSmallDevice ? 13 : 14 }]}>{selectedEmployee.email}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={[styles.detailLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>{translations.phone}</Text>
                    <Text style={[styles.detailValue, { fontSize: isSmallDevice ? 13 : 14 }]}>{selectedEmployee.phone || translations.nA}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={[styles.detailSection, { flex: 1 }]}>
                      <Text style={[styles.detailLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>{translations.department}</Text>
                      <Text style={[styles.detailValue, { fontSize: isSmallDevice ? 13 : 14 }]}>{selectedEmployee.department}</Text>
                    </View>
                    <View style={[styles.detailSection, { flex: 1 }]}>
                      <Text style={[styles.detailLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>{translations.joiningDate}</Text>
                      <Text style={[styles.detailValue, { fontSize: isSmallDevice ? 13 : 14 }]}>{selectedEmployee.joiningDate || translations.nA}</Text>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={[styles.detailLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>{translations.salary}</Text>
                    <Text style={[styles.detailValue, { fontSize: isSmallDevice ? 15 : 16, color: '#10b981', fontFamily: Fonts.Bold }]}>
                      ₹{selectedEmployee.salary?.toLocaleString() || '0'}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={[styles.detailLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>{translations.address}</Text>
                    <Text style={[styles.detailValue, { fontSize: isSmallDevice ? 13 : 14 }]}>{selectedEmployee.address || translations.nA}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={[styles.detailLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>{translations.emergencyContact}</Text>
                    <Text style={[styles.detailValue, { fontSize: isSmallDevice ? 13 : 14 }]}>{selectedEmployee.emergencyContact || translations.nA}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={[styles.detailLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>{translations.loginAccess}</Text>
                    <View style={styles.detailLoginBadge}>
                      <MaterialIcons 
                        name={selectedEmployee.canLogin ? 'check-circle' : 'block'} 
                        size={16} 
                        color={selectedEmployee.canLogin ? '#10b981' : '#ef4444'} 
                      />
                      <Text style={[styles.detailLoginText, { color: selectedEmployee.canLogin ? '#10b981' : '#ef4444', fontSize: isSmallDevice ? 13 : 14 }]}>
                        {selectedEmployee.canLogin ? translations.enabled : translations.disabled}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={[styles.detailLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>{translations.status}</Text>
                    <View style={[styles.detailStatusBadge, { backgroundColor: getStatusColor(selectedEmployee.status) + '15' }]}>
                      <Text style={[styles.detailStatusText, { color: getStatusColor(selectedEmployee.status), fontSize: isSmallDevice ? 11 : 12 }]}>
                        {selectedEmployee.status || 'active'}
                      </Text>
                    </View>
                  </View>

                  {/* Tasks Section */}
                  <View style={styles.tasksSection}>
                    <View style={styles.tasksHeader}>
                      <Text style={[styles.tasksTitle, { fontSize: isSmallDevice ? 14 : 16 }]}>{translations.tasks}</Text>
                      <TouchableOpacity 
                        style={styles.addTaskButton}
                        onPress={() => {
                          setTaskData({
                            title: '',
                            description: '',
                            priority: 'medium',
                            status: 'pending',
                            dueDate: '',
                            assignedTo: selectedEmployee.id,
                            assignedToName: selectedEmployee.fullName,
                            category: ''
                          });
                          setEditingTask(null);
                          setTaskModalVisible(true);
                        }}
                      >
                        <MaterialIcons name="add" size={16} color="#ffffff" />
                        <Text style={[styles.addTaskButtonText, { fontSize: isSmallDevice ? 11 : 12 }]}>{translations.addTask}</Text>
                      </TouchableOpacity>
                    </View>

                    {tasks.length === 0 ? (
                      <View style={styles.noTasksContainer}>
                        <MaterialIcons name="assignment" size={30} color="#d1d5db" />
                        <Text style={[styles.noTasksText, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.noTasks}</Text>
                      </View>
                    ) : (
                      tasks.map((task) => <TaskItem key={task.id} task={task} />)
                    )}
                  </View>

                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setDetailModalVisible(false)}
                  >
                    <Text style={[styles.closeButtonText, { fontSize: isSmallDevice ? 13 : 14 }]}>{translations.close}</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </Modal>

        {/* Task Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={taskModalVisible}
          onRequestClose={() => setTaskModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { fontSize: isSmallDevice ? 18 : 20 }]}>
                  {editingTask ? translations.edit : translations.addTask}
                </Text>
                <TouchableOpacity onPress={() => setTaskModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.taskTitle} *</Text>
                <TextInput
                  style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                  value={taskData.title}
                  onChangeText={(text) => setTaskData({...taskData, title: text})}
                  placeholder={translations.taskTitle}
                />
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.taskDescription}</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea, { fontSize: isSmallDevice ? 13 : 14 }]}
                  value={taskData.description}
                  onChangeText={(text) => setTaskData({...taskData, description: text})}
                  placeholder={translations.taskDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formField, styles.formHalf]}>
                  <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.priority}</Text>
                  <View style={styles.priorityContainer}>
                    {['low', 'medium', 'high'].map((priority) => (
                      <TouchableOpacity
                        key={priority}
                        style={[styles.priorityOption, taskData.priority === priority && styles.priorityOptionActive]}
                        onPress={() => setTaskData({...taskData, priority})}
                      >
                        <Text style={[styles.priorityOptionText, taskData.priority === priority && styles.priorityOptionTextActive, { fontSize: isSmallDevice ? 9 : 10 }]}>
                          {priority === 'low' ? translations.low :
                           priority === 'medium' ? translations.medium :
                           translations.high}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={[styles.formField, styles.formHalf]}>
                  <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.dueDate}</Text>
                  <TextInput
                    style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                    value={taskData.dueDate}
                    onChangeText={(text) => setTaskData({...taskData, dueDate: text})}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.category}</Text>
                <TextInput
                  style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                  value={taskData.category}
                  onChangeText={(text) => setTaskData({...taskData, category: text})}
                  placeholder={translations.category}
                />
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.taskStatus}</Text>
                <View style={styles.statusContainer}>
                  {['pending', 'in-progress', 'completed', 'cancelled'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[styles.statusOption, taskData.status === status && styles.statusOptionActive]}
                      onPress={() => setTaskData({...taskData, status})}
                    >
                      <Text style={[styles.statusOptionText, taskData.status === status && styles.statusOptionTextActive, { fontSize: isSmallDevice ? 9 : 10 }]}>
                        {status === 'pending' ? translations.pending :
                         status === 'in-progress' ? translations.inProgress :
                         status === 'completed' ? translations.completed :
                         translations.cancelled}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {editingTask && (
                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.assignedTo}</Text>
                  <Text style={[styles.assignedToText, { fontSize: isSmallDevice ? 13 : 14 }]}>{taskData.assignedToName}</Text>
                </View>
              )}

              <TouchableOpacity style={styles.submitButton} onPress={handleTaskSave} disabled={loading}>
                <Text style={[styles.submitButtonText, { fontSize: isSmallDevice ? 14 : 16 }]}>
                  {loading ? translations.saving : editingTask ? translations.update : translations.addTask}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>
      </View>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: Fonts.Bold,
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.Regular,
    color: '#1f2937',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 6,
    borderRadius: 10,
    gap: 6,
  },
  statIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statCount: {
    fontFamily: Fonts.Bold,
    color: '#ffffff',
  },
  statLabel: {
    fontFamily: Fonts.Regular,
    color: 'rgba(255,255,255,0.8)',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  employeeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  employeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  employeeTextInfo: {
    flex: 1,
  },
  employeeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  employeeAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  employeeAvatarText: {
    fontFamily: Fonts.Bold,
    color: '#FF7722',
  },
  employeeName: {
    fontFamily: Fonts.SemiBold,
    color: '#1f2937',
  },
  employeePosition: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
  },
  employeeIdText: {
    fontFamily: Fonts.Regular,
    color: '#9ca3af',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontFamily: Fonts.SemiBold,
  },
  employeeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  employeeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  employeeDetailText: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
  },
  loginBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  loginBadgeText: {
    fontFamily: Fonts.SemiBold,
    color: '#10b981',
  },
  employeeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 4,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  editButton: {
    backgroundColor: '#FF7722',
  },
  suspendButton: {
    backgroundColor: '#ef4444',
  },
  activateButton: {
    backgroundColor: '#10b981',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyStateText: {
    fontFamily: Fonts.SemiBold,
    color: '#1f2937',
  },
  emptyStateSubtext: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
  },
  modalContainer: {
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
    color: '#1f2937',
  },
  photoUpload: {
    alignItems: 'center',
    marginBottom: 16,
  },
  photoPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF7722',
    borderStyle: 'dashed',
  },
  photoText: {
    fontFamily: Fonts.Regular,
    color: '#FF7722',
    marginTop: 4,
  },
  formField: {
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formHalf: {
    width: '48%',
  },
  formLabel: {
    fontFamily: Fonts.SemiBold,
    color: '#1f2937',
    marginBottom: 4,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f9fafb',
    fontFamily: Fonts.Regular,
    color: '#1f2937',
  },
  formTextArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  helperText: {
    fontFamily: Fonts.Regular,
    color: '#9ca3af',
    marginTop: 2,
  },
  loginToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loginToggleText: {
    fontFamily: Fonts.Regular,
    color: '#1f2937',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  statusOptionActive: {
    backgroundColor: '#FF7722',
    borderColor: '#FF7722',
  },
  statusOptionText: {
    fontFamily: Fonts.SemiBold,
    color: '#6b7280',
  },
  statusOptionTextActive: {
    color: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
  },
  detailProfile: {
    alignItems: 'center',
    marginBottom: 16,
  },
  detailAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  detailAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailAvatarText: {
    fontFamily: Fonts.Bold,
    color: '#FF7722',
  },
  detailName: {
    fontFamily: Fonts.Bold,
    color: '#1f2937',
  },
  detailPosition: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
  },
  detailEmployeeId: {
    fontFamily: Fonts.Regular,
    color: '#9ca3af',
  },
  detailSection: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailLabel: {
    fontFamily: Fonts.SemiBold,
    color: '#6b7280',
    marginBottom: 2,
  },
  detailValue: {
    fontFamily: Fonts.Regular,
    color: '#1f2937',
  },
  detailStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailStatusText: {
    fontFamily: Fonts.SemiBold,
  },
  detailLoginBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLoginText: {
    fontFamily: Fonts.SemiBold,
  },
  tasksSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tasksTitle: {
    fontFamily: Fonts.SemiBold,
    color: '#1f2937',
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF7722',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addTaskButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
  },
  noTasksContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  noTasksText: {
    fontFamily: Fonts.Regular,
    color: '#9ca3af',
  },
  taskItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskTitle: {
    fontFamily: Fonts.SemiBold,
    color: '#1f2937',
    flex: 1,
  },
  taskStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  taskStatusText: {
    fontFamily: Fonts.SemiBold,
  },
  taskDescription: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
    marginBottom: 6,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskPriorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  taskPriorityText: {
    fontFamily: Fonts.SemiBold,
  },
  taskDueDate: {
    fontFamily: Fonts.Regular,
    color: '#9ca3af',
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 4,
    flexWrap: 'wrap',
  },
  taskActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 3,
  },
  taskStartButton: {
    backgroundColor: '#3b82f6',
  },
  taskCompleteButton: {
    backgroundColor: '#10b981',
  },
  taskCancelButton: {
    backgroundColor: '#ef4444',
  },
  taskEditButton: {
    backgroundColor: '#FF7722',
  },
  taskDeleteButton: {
    backgroundColor: '#ef4444',
  },
  taskActionText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
  },
  closeButton: {
    backgroundColor: '#6b7280',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  priorityOptionActive: {
    backgroundColor: '#FF7722',
    borderColor: '#FF7722',
  },
  priorityOptionText: {
    fontFamily: Fonts.SemiBold,
    color: '#6b7280',
  },
  priorityOptionTextActive: {
    color: '#ffffff',
  },
  assignedToText: {
    fontFamily: Fonts.SemiBold,
    color: '#1f2937',
    paddingVertical: 8,
  },
});