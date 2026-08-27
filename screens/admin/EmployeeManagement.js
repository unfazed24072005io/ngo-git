// screens/admin/EmployeeManagement.js - Complete with Branch Management
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
  
  const renderKey = `employee-${counter}`;

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
    salaryAmount: t('employee.salaryAmount') || 'Salary Amount (₹)',
    salaryType: t('employee.salaryType') || 'Salary Type',
    monthly: t('employee.monthly') || 'Monthly',
    weekly: t('employee.weekly') || 'Weekly',
    daily: t('employee.daily') || 'Daily',
    hourly: t('employee.hourly') || 'Hourly',
    salaryHistory: t('employee.salaryHistory') || 'Salary History',
    addSalary: t('employee.addSalary') || 'Add Salary',
    salaryAdded: t('employee.salaryAdded') || 'Salary added successfully',
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
    totalEmployees: t('employee.totalEmployees') || 'Total Employees',
    activeEmployees: t('employee.activeEmployees') || 'Active',
    suspendedEmployees: t('employee.suspendedEmployees') || 'Suspended',
    totalPayroll: t('employee.totalPayroll') || 'Total Payroll',
    salaryManagement: t('employee.salaryManagement') || 'Salary Management',
    viewAllTasks: t('employee.viewAllTasks') || 'View All Tasks',
    salaryNotSet: t('employee.salaryNotSet') || 'Salary not set',
    editSalary: t('employee.editSalary') || 'Edit Salary',
    
    // Branch Management Translations
    branchManagement: t('branch.management') || 'Branch / Ashram Management',
    branches: t('branch.branches') || 'Branches',
    addBranch: t('branch.addBranch') || 'Add Branch',
    editBranch: t('branch.editBranch') || 'Edit Branch',
    branchName: t('branch.branchName') || 'Branch Name',
    branchAddress: t('branch.branchAddress') || 'Branch Address',
    branchPhone: t('branch.branchPhone') || 'Branch Phone',
    branchHead: t('branch.branchHead') || 'Branch Head',
    branchCode: t('branch.branchCode') || 'Branch Code',
    selectBranch: t('branch.selectBranch') || 'Select Branch',
    assignedBranch: t('branch.assignedBranch') || 'Assigned Branch',
    noBranch: t('branch.noBranch') || 'No branch assigned',
    employeesAtBranch: t('branch.employeesAtBranch') || 'Employees at Branch',
    branchEmployees: t('branch.branchEmployees') || 'Branch Employees',
    assignToBranch: t('branch.assignToBranch') || 'Assign to Branch',
    branchAdded: t('branch.branchAdded') || 'Branch added successfully',
    branchUpdated: t('branch.branchUpdated') || 'Branch updated successfully',
    branchDeleted: t('branch.branchDeleted') || 'Branch deleted successfully',
    confirmDeleteBranch: t('branch.confirmDeleteBranch') || 'Are you sure you want to delete this branch? This will unassign all employees.',
    noBranches: t('branch.noBranches') || 'No branches created yet',
    addFirstBranch: t('branch.addFirstBranch') || 'Add your first branch',
    branchDetails: t('branch.branchDetails') || 'Branch Details',
    totalBranches: t('branch.totalBranches') || 'Total Branches',
    branchEmployeesCount: t('branch.branchEmployeesCount') || 'Employees',
    viewBranch: t('branch.viewBranch') || 'View Branch',
    showLess: t('common.showLess') || 'Show Less',
    loading: t('common.loading') || 'Loading...',
  });

  const translations = getTranslations();

  // ============ STATE DECLARATIONS ============
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
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
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [showBranchView, setShowBranchView] = useState(false);
  const [salaryModalVisible, setSalaryModalVisible] = useState(false);
  const [salaryHistory, setSalaryHistory] = useState([]);
  
  // Branch Modal States
  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchDetailModalVisible, setBranchDetailModalVisible] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branchEmployees, setBranchEmployees] = useState([]);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    joiningDate: '',
    salary: '',
    salaryType: 'monthly',
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
    canLogin: false,
    branchId: '',
    branchName: ''
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
  
  const [salaryData, setSalaryData] = useState({
    amount: '',
    type: 'monthly',
    note: '',
    date: ''
  });

  const [branchData, setBranchData] = useState({
    name: '',
    address: '',
    phone: '',
    head: '',
    code: '',
    status: 'active'
  });

  // ============ EFFECTS ============
  useEffect(() => {
    setupRealtimeListeners();
  }, []);

  const setupRealtimeListeners = () => {
    // Employees Listener
    const empQuery = query(collection(db, 'employees'), orderBy('createdAt', 'desc'));
    const empUnsubscribe = onSnapshot(empQuery, (snapshot) => {
      const employeesList = [];
      snapshot.forEach((doc) => {
        employeesList.push({ id: doc.id, ...doc.data() });
      });
      setEmployees(employeesList);
      applyFilters(employeesList, searchQuery);
      setLoading(false);
    });

    // Branches Listener
    const branchQuery = query(collection(db, 'branches'), orderBy('createdAt', 'desc'));
    const branchUnsubscribe = onSnapshot(branchQuery, (snapshot) => {
      const branchesList = [];
      snapshot.forEach((doc) => {
        branchesList.push({ id: doc.id, ...doc.data() });
      });
      setBranches(branchesList);
    });

    return () => {
      empUnsubscribe();
      branchUnsubscribe();
    };
  };

  // ============ FILTER FUNCTIONS ============
  const applyFilters = (data, searchText) => {
    let filtered = data;
    if (searchText) {
      filtered = filtered.filter(emp =>
        emp.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchText.toLowerCase()) ||
        emp.position?.toLowerCase().includes(searchText.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchText.toLowerCase()) ||
        emp.employeeId?.toLowerCase().includes(searchText.toLowerCase()) ||
        emp.branchName?.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    setFilteredEmployees(filtered);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    applyFilters(employees, text);
  };

  // ============ BRANCH FUNCTIONS ============
  
  const handleAddBranch = async () => {
    if (!branchData.name.trim()) {
      Alert.alert(translations.error, 'Please enter a branch name');
      return;
    }

    setLoading(true);
    try {
      const auth = getAuthInstance();
      const data = {
        name: branchData.name.trim(),
        address: branchData.address || '',
        phone: branchData.phone || '',
        head: branchData.head || '',
        code: branchData.code || branchData.name.substring(0, 3).toUpperCase() + Date.now().toString().slice(-4),
        status: branchData.status || 'active',
        employeeCount: 0,
        createdBy: auth.currentUser?.uid || 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingBranch) {
        await updateDoc(doc(db, 'branches', editingBranch.id), data);
        Alert.alert(translations.success, translations.branchUpdated);
      } else {
        await addDoc(collection(db, 'branches'), data);
        Alert.alert(translations.success, translations.branchAdded);
      }

      setBranchModalVisible(false);
      resetBranchForm();
    } catch (error) {
      Alert.alert(translations.error, error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBranch = async (branchId) => {
    Alert.alert(
      translations.delete,
      translations.confirmDeleteBranch,
      [
        { text: translations.cancel, style: 'cancel' },
        {
          text: translations.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              const employeesAtBranch = employees.filter(emp => emp.branchId === branchId);
              for (const emp of employeesAtBranch) {
                await updateDoc(doc(db, 'employees', emp.id), {
                  branchId: '',
                  branchName: '',
                  updatedAt: new Date().toISOString()
                });
              }

              await deleteDoc(doc(db, 'branches', branchId));
              Alert.alert(translations.success, translations.branchDeleted);
            } catch (error) {
              Alert.alert(translations.error, error.message);
            }
          }
        }
      ]
    );
  };

  const viewBranchDetails = (branch) => {
    setSelectedBranch(branch);
    const employeesAtBranch = employees.filter(emp => emp.branchId === branch.id);
    setBranchEmployees(employeesAtBranch);
    setBranchDetailModalVisible(true);
  };

  const resetBranchForm = () => {
    setBranchData({
      name: '',
      address: '',
      phone: '',
      head: '',
      code: '',
      status: 'active'
    });
    setEditingBranch(null);
  };

  // ============ SALARY FUNCTIONS ============
  
  const handleAddSalary = async () => {
    if (!salaryData.amount || parseFloat(salaryData.amount) <= 0) {
      Alert.alert(translations.error, 'Please enter a valid salary amount');
      return;
    }

    setLoading(true);
    try {
      const auth = getAuthInstance();
      const salaryEntry = {
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.fullName,
        amount: parseFloat(salaryData.amount),
        type: salaryData.type || 'monthly',
        note: salaryData.note || '',
        date: salaryData.date || new Date().toISOString().split('T')[0],
        addedBy: auth.currentUser?.uid || 'admin',
        addedByName: auth.currentUser?.displayName || 'Admin',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'employeeSalaries'), salaryEntry);

      await updateDoc(doc(db, 'employees', selectedEmployee.id), {
        salary: parseFloat(salaryData.amount),
        salaryType: salaryData.type || 'monthly',
        lastSalaryUpdate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      Alert.alert(translations.success, translations.salaryAdded);
      setSalaryModalVisible(false);
      setSalaryData({ amount: '', type: 'monthly', note: '', date: '' });
      fetchSalaryHistory(selectedEmployee.id);
      
      setSelectedEmployee(prev => ({
        ...prev,
        salary: parseFloat(salaryData.amount),
        salaryType: salaryData.type || 'monthly'
      }));
    } catch (error) {
      Alert.alert(translations.error, error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalaryHistory = async (employeeId) => {
    if (!employeeId) return;
    try {
      const q = query(
        collection(db, 'employeeSalaries'),
        where('employeeId', '==', employeeId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const history = [];
      snapshot.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() });
      });
      setSalaryHistory(history);
    } catch (error) {
      console.error('Error fetching salary history:', error);
    }
  };

  // ============ TASK FUNCTIONS ============

  const handleTaskSave = async () => {
    if (!taskData.title || !taskData.assignedTo) {
      Alert.alert(translations.error, translations.requiredFields);
      return;
    }

    setLoading(true);
    try {
      const auth = getAuthInstance();

      const data = {
        title: taskData.title,
        description: taskData.description || '',
        priority: taskData.priority || 'medium',
        status: taskData.status || 'pending',
        dueDate: taskData.dueDate || '',
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
      const q = query(
        collection(db, 'employeeTasks'),
        where('assignedTo', '==', employeeId),
        orderBy('createdAt', 'desc')
      );
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

  // ============ EMPLOYEE FUNCTIONS ============

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
      
      const selectedBranch = branches.find(b => b.id === formData.branchId);
      
      const data = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone || '',
        position: formData.position || 'Employee',
        department: formData.department || 'General',
        joiningDate: formData.joiningDate || new Date().toISOString().split('T')[0],
        salary: parseFloat(formData.salary) || 0,
        salaryType: formData.salaryType || 'monthly',
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
        branchId: formData.branchId || '',
        branchName: selectedBranch ? selectedBranch.name : '',
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
              branchId: formData.branchId || '',
              branchName: selectedBranch ? selectedBranch.name : '',
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

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      joiningDate: '',
      salary: '',
      salaryType: 'monthly',
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
      canLogin: false,
      branchId: '',
      branchName: ''
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

  // ============ HELPER FUNCTIONS ============
  
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

  const getSalaryTypeLabel = (type) => {
    switch(type) {
      case 'monthly': return translations.monthly;
      case 'weekly': return translations.weekly;
      case 'daily': return translations.daily;
      case 'hourly': return translations.hourly;
      default: return translations.monthly;
    }
  };

  const formatCurrency = (amount) => {
    return '₹' + (amount || 0).toLocaleString('en-IN');
  };

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : translations.noBranch;
  };

  // ============ COMPONENTS ============
  
  const StatCard = ({ label, count, icon, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <MaterialIcons name={icon} size={isSmallDevice ? 20 : 24} color={color} />
      </View>
      <Text style={[styles.statCount, { fontSize: isSmallDevice ? 16 : 20, color }]}>
        {count}
      </Text>
      <Text style={[styles.statLabel, { fontSize: isSmallDevice ? 9 : 10 }]}>
        {label}
      </Text>
    </View>
  );

  const BranchCard = ({ branch }) => {
    const employeeCount = employees.filter(emp => emp.branchId === branch.id).length;
    return (
      <TouchableOpacity 
        style={styles.branchCard}
        onPress={() => viewBranchDetails(branch)}
        activeOpacity={0.7}
      >
        <View style={styles.branchCardHeader}>
          <View style={styles.branchIcon}>
            <MaterialIcons name="storefront" size={isSmallDevice ? 20 : 24} color="#FF7722" />
          </View>
          <View style={styles.branchCardInfo}>
            <Text style={[styles.branchCardName, { fontSize: isSmallDevice ? 13 : 15 }]} numberOfLines={1}>
              {branch.name}
            </Text>
            <Text style={[styles.branchCardCode, { fontSize: isSmallDevice ? 9 : 10 }]}>
              {translations.branchCode}: {branch.code}
            </Text>
          </View>
          <View style={styles.branchCardCount}>
            <Text style={[styles.branchCardCountText, { fontSize: isSmallDevice ? 14 : 16 }]}>
              {employeeCount}
            </Text>
            <Text style={[styles.branchCardCountLabel, { fontSize: isSmallDevice ? 8 : 9 }]}>
              {translations.branchEmployeesCount}
            </Text>
          </View>
        </View>
        {branch.head && (
          <Text style={[styles.branchCardHead, { fontSize: isSmallDevice ? 11 : 12 }]}>
            Head: {branch.head}
          </Text>
        )}
        {branch.address && (
          <Text style={[styles.branchCardAddress, { fontSize: isSmallDevice ? 10 : 11 }]} numberOfLines={1}>
            {branch.address}
          </Text>
        )}
        <View style={styles.branchCardActions}>
          <TouchableOpacity 
            style={[styles.branchActionButton, styles.branchEditButton]}
            onPress={() => {
              setEditingBranch(branch);
              setBranchData({
                name: branch.name,
                address: branch.address || '',
                phone: branch.phone || '',
                head: branch.head || '',
                code: branch.code || '',
                status: branch.status || 'active'
              });
              setBranchModalVisible(true);
            }}
          >
            <MaterialIcons name="edit" size={14} color="#ffffff" />
            <Text style={[styles.branchActionText, { fontSize: isSmallDevice ? 8 : 10 }]}>{translations.edit}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.branchActionButton, styles.branchDeleteButton]}
            onPress={() => handleDeleteBranch(branch.id)}
          >
            <MaterialIcons name="delete" size={14} color="#ffffff" />
            <Text style={[styles.branchActionText, { fontSize: isSmallDevice ? 8 : 10 }]}>{translations.delete}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const EmployeeCard = ({ employee }) => (
    <TouchableOpacity 
      style={styles.employeeCard}
      onPress={() => {
        setSelectedEmployee(employee);
        fetchTasks(employee.id);
        fetchSalaryHistory(employee.id);
        setShowAllTasks(false);
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

      <View style={styles.employeeFooter}>
        {employee.branchId ? (
          <View style={styles.branchBadge}>
            <MaterialIcons name="storefront" size={12} color="#FF7722" />
            <Text style={[styles.branchBadgeText, { fontSize: isSmallDevice ? 9 : 10 }]}>
              {employee.branchName || getBranchName(employee.branchId)}
            </Text>
          </View>
        ) : (
          <View style={[styles.branchBadge, styles.noBranchBadge]}>
            <MaterialIcons name="storefront" size={12} color="#9ca3af" />
            <Text style={[styles.branchBadgeText, { fontSize: isSmallDevice ? 9 : 10, color: '#9ca3af' }]}>
              {translations.noBranch}
            </Text>
          </View>
        )}
        {employee.salary > 0 ? (
          <View style={styles.salaryBadge}>
            <MaterialIcons name="attach-money" size={12} color="#10b981" />
            <Text style={[styles.salaryBadgeText, { fontSize: isSmallDevice ? 9 : 10 }]}>
              {formatCurrency(employee.salary)}/{getSalaryTypeLabel(employee.salaryType)}
            </Text>
          </View>
        ) : (
          <View style={[styles.salaryBadge, styles.salaryNotSetBadge]}>
            <MaterialIcons name="remove-circle-outline" size={12} color="#9ca3af" />
            <Text style={[styles.salaryBadgeText, { fontSize: isSmallDevice ? 9 : 10, color: '#9ca3af' }]}>
              {translations.salaryNotSet}
            </Text>
          </View>
        )}
        {employee.canLogin && (
          <View style={styles.loginBadge}>
            <MaterialIcons name="check-circle" size={12} color="#10b981" />
            <Text style={[styles.loginBadgeText, { fontSize: isSmallDevice ? 9 : 10 }]}>{translations.loginEnabled}</Text>
          </View>
        )}
      </View>

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
        <TouchableOpacity 
          style={[styles.actionButton, styles.salaryButton]}
          onPress={() => {
            setSelectedEmployee(employee);
            setSalaryData({ amount: String(employee.salary || ''), type: employee.salaryType || 'monthly', note: '', date: '' });
            setSalaryModalVisible(true);
          }}
        >
          <MaterialIcons name="attach-money" size={isSmallDevice ? 12 : 14} color="#ffffff" />
          <Text style={[styles.actionButtonText, { fontSize: isSmallDevice ? 8 : 10 }]}>{translations.salary}</Text>
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
        {task.description || 'No description'}
      </Text>
      <View style={styles.taskFooter}>
        <View style={[styles.taskPriorityBadge, { backgroundColor: getPriorityColor(task.priority) + '15' }]}>
          <Text style={[styles.taskPriorityText, { color: getPriorityColor(task.priority), fontSize: isSmallDevice ? 8 : 10 }]}>
            {task.priority || translations.medium}
          </Text>
        </View>
        {task.category && (
          <Text style={[styles.taskCategory, { fontSize: isSmallDevice ? 8 : 10 }]}>
            {task.category}
          </Text>
        )}
        <Text style={[styles.taskDueDate, { fontSize: isSmallDevice ? 10 : 11 }]}>
          {task.dueDate || translations.nA}
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

  // ============ RENDER ============
  if (loading) {
    return (
      <View style={styles.loadingContainer} key={renderKey}>
        <ActivityIndicator size="large" color="#FF7722" />
        <Text style={[styles.loadingText, { fontSize: isSmallDevice ? 13 : 14 }]}>{translations.loading}</Text>
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
              label={translations.totalEmployees} 
              count={employees.length} 
              icon="people" 
              color="#FF7722" 
            />
            <StatCard 
              label={translations.activeEmployees} 
              count={employees.filter(e => e.status === 'active').length} 
              icon="check-circle" 
              color="#10b981" 
            />
            <StatCard 
              label={translations.suspendedEmployees} 
              count={employees.filter(e => e.status === 'suspended').length} 
              icon="block" 
              color="#ef4444" 
            />
            <StatCard 
              label={translations.totalBranches} 
              count={branches.length} 
              icon="storefront" 
              color="#8b5cf6" 
            />
          </View>
        </View>

        {/* Tabs: Employees | Branches */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, !showBranchView && styles.activeTab]}
            onPress={() => setShowBranchView(false)}
          >
            <MaterialIcons name="people" size={18} color={!showBranchView ? '#FF7722' : '#9ca3af'} />
            <Text style={[styles.tabText, !showBranchView && styles.activeTabText]}>
              {translations.totalEmployees} ({employees.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, showBranchView && styles.activeTab]}
            onPress={() => setShowBranchView(true)}
          >
            <MaterialIcons name="storefront" size={18} color={showBranchView ? '#FF7722' : '#9ca3af'} />
            <Text style={[styles.tabText, showBranchView && styles.activeTabText]}>
              {translations.branches} ({branches.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {!showBranchView ? (
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
        ) : (
          <FlatList
            data={branches}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <BranchCard branch={item} />}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF7722']} />
            }
            ListHeaderComponent={
              <TouchableOpacity 
                style={styles.addBranchHeader}
                onPress={() => {
                  resetBranchForm();
                  setBranchModalVisible(true);
                }}
              >
                <MaterialIcons name="add-circle" size={24} color="#FF7722" />
                <Text style={[styles.addBranchHeaderText, { fontSize: isSmallDevice ? 14 : 16 }]}>
                  {translations.addBranch}
                </Text>
              </TouchableOpacity>
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialIcons name="storefront" size={44} color="#d1d5db" />
                <Text style={[styles.emptyStateText, { fontSize: isSmallDevice ? 15 : 16 }]}>{translations.noBranches}</Text>
                <Text style={[styles.emptyStateSubtext, { fontSize: isSmallDevice ? 12 : 13 }]}>{translations.addFirstBranch}</Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
          />
        )}

        {/* ============ MODALS ============ */}

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
                <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.salaryAmount}</Text>
                <TextInput
                  style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                  value={formData.salary}
                  onChangeText={(text) => setFormData({...formData, salary: text})}
                  placeholder={translations.salary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.salaryType}</Text>
                <View style={styles.salaryTypeContainer}>
                  {['monthly', 'weekly', 'daily', 'hourly'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.salaryTypeOption, formData.salaryType === type && styles.salaryTypeOptionActive]}
                      onPress={() => setFormData({...formData, salaryType: type})}
                    >
                      <Text style={[styles.salaryTypeText, formData.salaryType === type && styles.salaryTypeTextActive, { fontSize: isSmallDevice ? 9 : 10 }]}>
                        {type === 'monthly' ? translations.monthly :
                         type === 'weekly' ? translations.weekly :
                         type === 'daily' ? translations.daily :
                         translations.hourly}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.assignToBranch}</Text>
                <View style={styles.branchSelectContainer}>
                  <TouchableOpacity
                    style={[styles.branchSelectOption, !formData.branchId && styles.branchSelectActive]}
                    onPress={() => setFormData({...formData, branchId: '', branchName: ''})}
                  >
                    <Text style={[styles.branchSelectText, !formData.branchId && styles.branchSelectTextActive, { fontSize: isSmallDevice ? 10 : 11 }]}>
                      {translations.noBranch}
                    </Text>
                  </TouchableOpacity>
                  {branches.map((branch) => (
                    <TouchableOpacity
                      key={branch.id}
                      style={[styles.branchSelectOption, formData.branchId === branch.id && styles.branchSelectActive]}
                      onPress={() => setFormData({...formData, branchId: branch.id, branchName: branch.name})}
                    >
                      <Text style={[styles.branchSelectText, formData.branchId === branch.id && styles.branchSelectTextActive, { fontSize: isSmallDevice ? 10 : 11 }]}>
                        {branch.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
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

        {/* Add/Edit Branch Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={branchModalVisible}
          onRequestClose={() => setBranchModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { fontSize: isSmallDevice ? 18 : 20 }]}>
                  {editingBranch ? translations.editBranch : translations.addBranch}
                </Text>
                <TouchableOpacity onPress={() => setBranchModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.branchName} *</Text>
                <TextInput
                  style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                  value={branchData.name}
                  onChangeText={(text) => setBranchData({...branchData, name: text})}
                  placeholder={translations.branchName}
                />
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.branchCode}</Text>
                <TextInput
                  style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                  value={branchData.code}
                  onChangeText={(text) => setBranchData({...branchData, code: text})}
                  placeholder={translations.branchCode}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.branchAddress}</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea, { fontSize: isSmallDevice ? 13 : 14 }]}
                  value={branchData.address}
                  onChangeText={(text) => setBranchData({...branchData, address: text})}
                  placeholder={translations.branchAddress}
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formField, styles.formHalf]}>
                  <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.branchPhone}</Text>
                  <TextInput
                    style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                    value={branchData.phone}
                    onChangeText={(text) => setBranchData({...branchData, phone: text})}
                    placeholder={translations.branchPhone}
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={[styles.formField, styles.formHalf]}>
                  <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.branchHead}</Text>
                  <TextInput
                    style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                    value={branchData.head}
                    onChangeText={(text) => setBranchData({...branchData, head: text})}
                    placeholder={translations.branchHead}
                  />
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.status}</Text>
                <View style={styles.statusContainer}>
                  {['active', 'inactive'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[styles.statusOption, branchData.status === status && styles.statusOptionActive]}
                      onPress={() => setBranchData({...branchData, status})}
                    >
                      <Text style={[styles.statusOptionText, branchData.status === status && styles.statusOptionTextActive, { fontSize: isSmallDevice ? 10 : 12 }]}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleAddBranch} disabled={loading}>
                <Text style={[styles.submitButtonText, { fontSize: isSmallDevice ? 14 : 16 }]}>
                  {loading ? translations.saving : editingBranch ? translations.update : translations.add}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>

        {/* Branch Detail Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={branchDetailModalVisible}
          onRequestClose={() => setBranchDetailModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalContent}>
              {selectedBranch && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { fontSize: isSmallDevice ? 18 : 20 }]}>
                      {selectedBranch.name}
                    </Text>
                    <TouchableOpacity onPress={() => setBranchDetailModalVisible(false)}>
                      <MaterialIcons name="close" size={24} color="#6b7280" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.branchDetailInfo}>
                    <View style={styles.branchDetailRow}>
                      <Text style={[styles.branchDetailLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>
                        {translations.branchCode}
                      </Text>
                      <Text style={[styles.branchDetailValue, { fontSize: isSmallDevice ? 13 : 14 }]}>
                        {selectedBranch.code || translations.nA}
                      </Text>
                    </View>
                    {selectedBranch.head && (
                      <View style={styles.branchDetailRow}>
                        <Text style={[styles.branchDetailLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>
                          {translations.branchHead}
                        </Text>
                        <Text style={[styles.branchDetailValue, { fontSize: isSmallDevice ? 13 : 14 }]}>
                          {selectedBranch.head}
                        </Text>
                      </View>
                    )}
                    {selectedBranch.phone && (
                      <View style={styles.branchDetailRow}>
                        <Text style={[styles.branchDetailLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>
                          {translations.branchPhone}
                        </Text>
                        <Text style={[styles.branchDetailValue, { fontSize: isSmallDevice ? 13 : 14 }]}>
                          {selectedBranch.phone}
                        </Text>
                      </View>
                    )}
                    {selectedBranch.address && (
                      <View style={styles.branchDetailRow}>
                        <Text style={[styles.branchDetailLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>
                          {translations.branchAddress}
                        </Text>
                        <Text style={[styles.branchDetailValue, { fontSize: isSmallDevice ? 13 : 14 }]}>
                          {selectedBranch.address}
                        </Text>
                      </View>
                    )}
                    <View style={styles.branchDetailRow}>
                      <Text style={[styles.branchDetailLabel, { fontSize: isSmallDevice ? 11 : 12 }]}>
                        {translations.totalEmployees}
                      </Text>
                      <Text style={[styles.branchDetailValue, { fontSize: isSmallDevice ? 13 : 14, color: '#FF7722', fontFamily: Fonts.Bold }]}>
                        {branchEmployees.length}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.branchEmployeesSection}>
                    <Text style={[styles.branchEmployeesTitle, { fontSize: isSmallDevice ? 14 : 16 }]}>
                      {translations.branchEmployees}
                    </Text>
                    {branchEmployees.length > 0 ? (
                      branchEmployees.map((emp) => (
                        <View key={emp.id} style={styles.branchEmployeeItem}>
                          <View style={styles.branchEmployeeAvatar}>
                            {emp.profilePhoto ? (
                              <Image source={{ uri: emp.profilePhoto }} style={styles.branchEmployeeAvatarImage} />
                            ) : (
                              <Text style={[styles.branchEmployeeAvatarText, { fontSize: isSmallDevice ? 12 : 14 }]}>
                                {emp.fullName?.charAt(0) || '?'}
                              </Text>
                            )}
                          </View>
                          <View style={styles.branchEmployeeInfo}>
                            <Text style={[styles.branchEmployeeName, { fontSize: isSmallDevice ? 12 : 13 }]}>
                              {emp.fullName}
                            </Text>
                            <Text style={[styles.branchEmployeePosition, { fontSize: isSmallDevice ? 10 : 11 }]}>
                              {emp.position}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.branchEmployeeViewButton}
                            onPress={() => {
                              setBranchDetailModalVisible(false);
                              setSelectedEmployee(emp);
                              fetchTasks(emp.id);
                              fetchSalaryHistory(emp.id);
                              setDetailModalVisible(true);
                            }}
                          >
                            <MaterialIcons name="visibility" size={16} color="#FF7722" />
                          </TouchableOpacity>
                        </View>
                      ))
                    ) : (
                      <View style={styles.emptyState}>
                        <MaterialIcons name="people" size={30} color="#d1d5db" />
                        <Text style={[styles.emptyStateText, { fontSize: isSmallDevice ? 13 : 14 }]}>
                          No employees assigned to this branch
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setBranchDetailModalVisible(false)}
                  >
                    <Text style={[styles.closeButtonText, { fontSize: isSmallDevice ? 13 : 14 }]}>
                      {translations.close}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
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
                    {selectedEmployee.branchId && (
                      <View style={styles.detailBranchBadge}>
                        <MaterialIcons name="storefront" size={14} color="#FF7722" />
                        <Text style={[styles.detailBranchText, { fontSize: isSmallDevice ? 12 : 13 }]}>
                          {selectedEmployee.branchName || getBranchName(selectedEmployee.branchId)}
                        </Text>
                      </View>
                    )}
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
                      {formatCurrency(selectedEmployee.salary)} / {getSalaryTypeLabel(selectedEmployee.salaryType)}
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

                  {/* Salary History */}
                  {salaryHistory.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={[styles.detailLabel, { fontSize: isSmallDevice ? 12 : 13, fontFamily: Fonts.SemiBold }]}>
                        {translations.salaryHistory}
                      </Text>
                      {salaryHistory.slice(0, 3).map((item) => (
                        <View key={item.id} style={styles.salaryHistoryItem}>
                          <View>
                            <Text style={[styles.salaryHistoryAmount, { fontSize: isSmallDevice ? 13 : 14, color: '#10b981' }]}>
                              {formatCurrency(item.amount)}
                            </Text>
                            <Text style={[styles.salaryHistoryType, { fontSize: isSmallDevice ? 10 : 11, color: '#6b7280' }]}>
                              {getSalaryTypeLabel(item.type)} • {item.date || translations.nA}
                            </Text>
                          </View>
                          {item.note && (
                            <Text style={[styles.salaryHistoryNote, { fontSize: isSmallDevice ? 10 : 11, color: '#9ca3af' }]}>
                              {item.note}
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}

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
                      tasks.slice(0, showAllTasks ? tasks.length : 3).map((task) => (
                        <TaskItem key={task.id} task={task} />
                      ))
                    )}
                    
                    {tasks.length > 3 && (
                      <TouchableOpacity 
                        style={styles.viewAllTasksButton}
                        onPress={() => setShowAllTasks(!showAllTasks)}
                      >
                        <Text style={[styles.viewAllTasksText, { fontSize: isSmallDevice ? 12 : 13 }]}>
                          {showAllTasks ? translations.showLess : translations.viewAllTasks}
                        </Text>
                      </TouchableOpacity>
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

        {/* Salary Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={salaryModalVisible}
          onRequestClose={() => setSalaryModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { fontSize: isSmallDevice ? 18 : 20 }]}>
                  {translations.addSalary}
                </Text>
                <TouchableOpacity onPress={() => setSalaryModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.salaryEmployeeInfo}>
                <Text style={[styles.salaryEmployeeName, { fontSize: isSmallDevice ? 16 : 18 }]}>
                  {selectedEmployee?.fullName}
                </Text>
                <Text style={[styles.salaryEmployeePosition, { fontSize: isSmallDevice ? 12 : 13 }]}>
                  {selectedEmployee?.position}
                </Text>
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.salaryAmount} *</Text>
                <TextInput
                  style={[styles.formInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                  value={salaryData.amount}
                  onChangeText={(text) => setSalaryData({...salaryData, amount: text})}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.salaryType}</Text>
                <View style={styles.salaryTypeContainer}>
                  {['monthly', 'weekly', 'daily', 'hourly'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.salaryTypeOption, salaryData.type === type && styles.salaryTypeOptionActive]}
                      onPress={() => setSalaryData({...salaryData, type})}
                    >
                      <Text style={[styles.salaryTypeText, salaryData.type === type && styles.salaryTypeTextActive, { fontSize: isSmallDevice ? 9 : 10 }]}>
                        {type === 'monthly' ? translations.monthly :
                         type === 'weekly' ? translations.weekly :
                         type === 'daily' ? translations.daily :
                         translations.hourly}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { fontSize: isSmallDevice ? 12 : 14 }]}>{translations.note}</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea, { fontSize: isSmallDevice ? 13 : 14 }]}
                  value={salaryData.note}
                  onChangeText={(text) => setSalaryData({...salaryData, note: text})}
                  placeholder="Add a note"
                  multiline
                  numberOfLines={2}
                />
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleAddSalary} disabled={loading}>
                <Text style={[styles.submitButtonText, { fontSize: isSmallDevice ? 14 : 16 }]}>
                  {loading ? translations.saving : translations.addSalary}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>
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
    marginTop: 4,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
    minHeight: 75,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statCount: {
    fontFamily: Fonts.Bold,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 1,
  },
  statLabel: {
    fontFamily: Fonts.Regular,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
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
  employeeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  branchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  noBranchBadge: {
    backgroundColor: '#f3f4f6',
  },
  branchBadgeText: {
    fontFamily: Fonts.SemiBold,
    color: '#FF7722',
  },
  salaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  salaryNotSetBadge: {
    backgroundColor: '#f3f4f6',
  },
  salaryBadgeText: {
    fontFamily: Fonts.SemiBold,
    color: '#10b981',
  },
  loginBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
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
  salaryButton: {
    backgroundColor: '#10b981',
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
  detailBranchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5EB',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
    gap: 4,
  },
  detailBranchText: {
    fontFamily: Fonts.SemiBold,
    color: '#FF7722',
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
  taskCategory: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
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
  // Branch Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#FFF5EB',
  },
  tabText: {
    fontFamily: Fonts.SemiBold,
    color: '#9ca3af',
    fontSize: 12,
  },
  activeTabText: {
    color: '#FF7722',
  },
  branchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  branchCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  branchIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  branchCardInfo: {
    flex: 1,
  },
  branchCardName: {
    fontFamily: Fonts.SemiBold,
    color: '#1f2937',
  },
  branchCardCode: {
    fontFamily: Fonts.Regular,
    color: '#9ca3af',
  },
  branchCardCount: {
    alignItems: 'center',
    backgroundColor: '#FFF5EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  branchCardCountText: {
    fontFamily: Fonts.Bold,
    color: '#FF7722',
  },
  branchCardCountLabel: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
  },
  branchCardHead: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
    marginTop: 6,
  },
  branchCardAddress: {
    fontFamily: Fonts.Regular,
    color: '#9ca3af',
    marginTop: 2,
  },
  branchCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  branchActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  branchEditButton: {
    backgroundColor: '#FF7722',
  },
  branchDeleteButton: {
    backgroundColor: '#ef4444',
  },
  branchActionText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
  },
  addBranchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5EB',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 6,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
    borderStyle: 'dashed',
  },
  addBranchHeaderText: {
    fontFamily: Fonts.SemiBold,
    color: '#FF7722',
  },
  branchSelectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  branchSelectOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  branchSelectActive: {
    backgroundColor: '#FF7722',
    borderColor: '#FF7722',
  },
  branchSelectText: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
  },
  branchSelectTextActive: {
    color: '#ffffff',
  },
  branchDetailInfo: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  branchDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  branchDetailLabel: {
    fontFamily: Fonts.SemiBold,
    color: '#6b7280',
  },
  branchDetailValue: {
    fontFamily: Fonts.Regular,
    color: '#1f2937',
  },
  branchEmployeesSection: {
    marginTop: 8,
  },
  branchEmployeesTitle: {
    fontFamily: Fonts.SemiBold,
    color: '#1f2937',
    marginBottom: 10,
  },
  branchEmployeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 10,
  },
  branchEmployeeAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  branchEmployeeAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  branchEmployeeAvatarText: {
    fontFamily: Fonts.Bold,
    color: '#FF7722',
  },
  branchEmployeeInfo: {
    flex: 1,
  },
  branchEmployeeName: {
    fontFamily: Fonts.SemiBold,
    color: '#1f2937',
  },
  branchEmployeePosition: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
  },
  branchEmployeeViewButton: {
    padding: 4,
  },
  salaryTypeContainer: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  salaryTypeOption: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    minWidth: 60,
  },
  salaryTypeOptionActive: {
    backgroundColor: '#FF7722',
    borderColor: '#FF7722',
  },
  salaryTypeText: {
    fontFamily: Fonts.SemiBold,
    color: '#6b7280',
  },
  salaryTypeTextActive: {
    color: '#ffffff',
  },
  salaryEmployeeInfo: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  salaryEmployeeName: {
    fontFamily: Fonts.Bold,
    color: '#1f2937',
  },
  salaryEmployeePosition: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
    marginTop: 2,
  },
  salaryHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  salaryHistoryAmount: {
    fontFamily: Fonts.SemiBold,
  },
  salaryHistoryType: {
    fontFamily: Fonts.Regular,
  },
  salaryHistoryNote: {
    fontFamily: Fonts.Regular,
    flexShrink: 1,
    marginLeft: 8,
  },
  viewAllTasksButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  viewAllTasksText: {
    fontFamily: Fonts.SemiBold,
    color: '#FF7722',
  },
});