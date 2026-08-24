// screens/admin/QuoteManagement.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
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
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot, 
  Timestamp 
} from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { Fonts } from '../../config/fonts';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../context/LanguageContext';
import * as FileSystem from 'expo-file-system';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;

// ============ IMGBB UPLOAD FUNCTION ============
const IMGBB_API_KEY = '0ed452629e9d25fa979b96951e4c625d';

const uploadToImgBB = async (base64Data, fileName) => {
  try {
    let base64Clean = base64Data;
    if (base64Data.includes(',')) {
      base64Clean = base64Data.split(',')[1];
    }
    
    if (!base64Clean || base64Clean.length < 10) {
      throw new Error('Invalid image data');
    }
    
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64Clean);
    if (fileName) {
      formData.append('name', fileName);
    }
    
    console.log('📤 Uploading to ImgBB...');
    
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Upload failed');
    }
    
    console.log('✅ ImgBB upload successful:', result.data.url);
    
    return {
      url: result.data.url,
      display_url: result.data.display_url,
      delete_url: result.data.delete_url,
      id: result.data.id,
    };
    
  } catch (error) {
    console.error('❌ ImgBB upload error:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

// ============ CONVERT TO BASE64 ============
const convertToBase64 = async (image) => {
  try {
    if (image instanceof File) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(image);
      });
    }
    
    if (image?.uri) {
      try {
        const base64 = await FileSystem.readAsStringAsync(image.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return `data:${image.type || 'image/jpeg'};base64,${base64}`;
      } catch (e) {
        const response = await fetch(image.uri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error converting to base64:', error);
    return null;
  }
};

export default function QuoteManagement({ navigation }) {
  const { t, counter } = useLanguage();
  
  const renderKey = `quote-${counter}`;

  const getTranslations = () => ({
    quoteManagement: t('quotes.management') || 'Quote Management',
    loadingQuotes: t('quotes.loading') || 'Loading quotes...',
    totalQuotes: t('quotes.total') || 'Total Quotes',
    active: t('common.active') || 'Active',
    inactive: t('common.inactive') || 'Inactive',
    noQuotes: t('quotes.noQuotes') || 'No quotes yet',
    addFirstQuote: t('quotes.addFirstQuote') || 'Tap the + button to add your first quote',
    addNewQuote: t('quotes.addNew') || 'Add New Quote',
    editQuote: t('quotes.edit') || 'Edit Quote',
    quoteText: t('quotes.quoteText') || 'Quote Text',
    enterQuote: t('quotes.enterQuote') || 'Enter the quote...',
    author: t('quotes.author') || 'Author (Optional)',
    enterAuthor: t('quotes.enterAuthor') || 'Enter author name...',
    startDate: t('quotes.startDate') || 'Start Date',
    endDate: t('quotes.endDate') || 'End Date',
    activeStatus: t('quotes.activeStatus') || 'Active Status',
    selectImage: t('quotes.selectImage') || 'Tap to select image',
    addQuote: t('quotes.addQuote') || 'Add Quote',
    updateQuote: t('quotes.updateQuote') || 'Update Quote',
    deleteQuote: t('quotes.delete') || 'Delete Quote',
    confirmDelete: t('quotes.confirmDelete') || 'Are you sure you want to delete this quote?',
    quoteDeleted: t('quotes.deleted') || 'Quote deleted successfully',
    quoteAdded: t('quotes.added') || 'Quote added successfully',
    quoteUpdated: t('quotes.updated') || 'Quote updated successfully',
    statusToggled: t('quotes.statusToggled') || 'Quote status updated',
    deactivate: t('quotes.deactivate') || 'Deactivate',
    activate: t('quotes.activate') || 'Activate',
    edit: t('common.edit') || 'Edit',
    delete: t('common.delete') || 'Delete',
    save: t('common.save') || 'Save',
    cancel: t('common.cancel') || 'Cancel',
    error: t('common.error') || 'Error',
    success: t('common.success') || 'Success',
    requiredFields: t('quotes.requiredFields') || 'Please enter quote text',
    requiredImage: t('quotes.requiredImage') || 'Please select an image',
    invalidDateRange: t('quotes.invalidDateRange') || 'End date must be after start date',
    permissionRequired: t('common.permissionRequired') || 'Permission Required',
    grantGalleryAccess: t('quotes.grantGalleryAccess') || 'Please grant gallery access to upload quotes',
    failedToPickImage: t('quotes.failedToPickImage') || 'Failed to pick image',
    failedToSave: t('quotes.failedToSave') || 'Failed to save quote. Please try again.',
    failedToDelete: t('quotes.failedToDelete') || 'Failed to delete quote',
    failedToUpdateStatus: t('quotes.failedToUpdateStatus') || 'Failed to update quote status',
    unknown: t('common.unknown') || 'Unknown',
    nA: t('common.nA') || 'N/A',
  });

  const translations = getTranslations();

  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  
  const [quoteImage, setQuoteImage] = useState(null);
  const [quoteText, setQuoteText] = useState('');
  const [author, setAuthor] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    setupRealtimeListener();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(translations.permissionRequired, translations.grantGalleryAccess);
    }
  };

  const setupRealtimeListener = () => {
    const q = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const quotesList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const startDate = data.startDate?.toDate?.() || new Date(data.startDate);
        const endDate = data.endDate?.toDate?.() || new Date(data.endDate);
        quotesList.push({ 
          id: doc.id, 
          ...data,
          startDate,
          endDate
        });
      });
      setQuotes(quotesList);
      setLoading(false);
    });

    return () => unsubscribe();
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        const selected = result.assets[0];
        setQuoteImage(selected);
        setPreviewImage(selected.uri);
        console.log('📸 Image selected');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(translations.error, translations.failedToPickImage);
    }
  };

  const handleSaveQuote = async () => {
    if (!quoteText.trim()) {
      Alert.alert(translations.error, translations.requiredFields);
      return;
    }

    if (!quoteImage) {
      Alert.alert(translations.error, translations.requiredImage);
      return;
    }

    if (endDate < startDate) {
      Alert.alert(translations.error, translations.invalidDateRange);
      return;
    }

    setUploading(true);

    try {
      console.log('📤 Starting image upload to ImgBB...');
      
      const base64Data = await convertToBase64(quoteImage);
      if (!base64Data) {
        throw new Error('Failed to convert image to base64');
      }
      
      const uploadResult = await uploadToImgBB(base64Data, `quote_${Date.now()}.jpg`);
      console.log('✅ Image uploaded to ImgBB:', uploadResult.url);

      const auth = getAuthInstance();
      
      const quoteData = {
        text: quoteText.trim(),
        author: author.trim() || translations.unknown,
        imageUrl: uploadResult.url,
        imgbbId: uploadResult.id,
        deleteUrl: uploadResult.delete_url,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        isActive: isActive, // ✅ Uses the state
        createdBy: auth.currentUser?.uid || 'admin',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      if (isEditing && editingId) {
        const quoteRef = doc(db, 'quotes', editingId);
        await updateDoc(quoteRef, quoteData);
        Alert.alert(translations.success, translations.quoteUpdated);
      } else {
        await addDoc(collection(db, 'quotes'), quoteData);
        Alert.alert(translations.success, translations.quoteAdded);
      }

      resetForm();
      setModalVisible(false);
      onRefresh();
    } catch (error) {
      console.error('❌ Error saving quote:', error);
      Alert.alert(translations.error, translations.failedToSave);
    } finally {
      setUploading(false);
    }
  };

  const handleEditQuote = (quote) => {
    setSelectedQuote(quote);
    setQuoteText(quote.text);
    setAuthor(quote.author || '');
    setStartDate(quote.startDate || new Date());
    setEndDate(quote.endDate || new Date());
    setIsActive(quote.isActive !== false); // ✅ Preserve current status
    setIsEditing(true);
    setEditingId(quote.id);
    setPreviewImage(quote.imageUrl);
    setQuoteImage({ uri: quote.imageUrl }); // ✅ FIXED
    setModalVisible(true);
  };

  const handleDeleteQuote = async (quoteId) => {
    Alert.alert(
      translations.deleteQuote,
      translations.confirmDelete,
      [
        { text: translations.cancel, style: 'cancel' },
        {
          text: translations.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'quotes', quoteId));
              Alert.alert(translations.success, translations.quoteDeleted);
            } catch (error) {
              console.error('Error deleting quote:', error);
              Alert.alert(translations.error, translations.failedToDelete);
            }
          }
        }
      ]
    );
  };

  const toggleQuoteStatus = async (quoteId, currentStatus) => {
    try {
      const quoteRef = doc(db, 'quotes', quoteId);
      await updateDoc(quoteRef, {
        isActive: !currentStatus,
        updatedAt: Timestamp.now()
      });
      Alert.alert(translations.success, translations.statusToggled);
    } catch (error) {
      console.error('Error toggling quote status:', error);
      Alert.alert(translations.error, translations.failedToUpdateStatus);
    }
  };

  const resetForm = () => {
    setQuoteText('');
    setAuthor('');
    setStartDate(new Date());
    setEndDate(new Date());
    setIsActive(true);
    setQuoteImage(null);
    setPreviewImage(null);
    setIsEditing(false);
    setEditingId(null);
    setSelectedQuote(null);
  };

  const formatDate = (date) => {
    if (!date) return translations.nA;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isQuoteActive = (quote) => {
  return quote.isActive === true;  // ✅ Only check the toggle
};

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const QuoteCard = ({ quote }) => {
    const active = isQuoteActive(quote);

    return (
      <View style={[styles.quoteCard, !active && styles.quoteCardInactive]}>
        <Image source={{ uri: quote.imageUrl }} style={styles.quoteImage} />
        <View style={styles.quoteContent}>
          <Text style={[styles.quoteText, { fontSize: isSmallDevice ? 14 : 16 }]}>
            "{quote.text}"
          </Text>
          {quote.author && (
            <Text style={[styles.quoteAuthor, { fontSize: isSmallDevice ? 12 : 14 }]}>
              — {quote.author}
            </Text>
          )}
          <View style={styles.quoteMeta}>
            <View style={styles.dateInfo}>
              <MaterialIcons name="event" size={isSmallDevice ? 12 : 14} color="#6b7280" />
              <Text style={[styles.dateText, { fontSize: isSmallDevice ? 10 : 12 }]}>
                {formatDate(quote.startDate)} - {formatDate(quote.endDate)}
              </Text>
            </View>
            <View style={[styles.statusBadge, active ? styles.statusActive : styles.statusInactive]}>
              <Text style={[styles.statusText, active ? styles.statusTextActive : styles.statusTextInactive, { fontSize: isSmallDevice ? 9 : 11 }]}>
                {active ? translations.active : translations.inactive}
              </Text>
            </View>
          </View>
          <View style={styles.quoteActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.editButton]}
              onPress={() => handleEditQuote(quote)}
            >
              <MaterialIcons name="edit" size={isSmallDevice ? 14 : 18} color="#ffffff" />
              <Text style={[styles.actionButtonText, { fontSize: isSmallDevice ? 10 : 12 }]}>{translations.edit}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.statusToggleButton]}
              onPress={() => toggleQuoteStatus(quote.id, active)}
            >
              <MaterialIcons 
                name={active ? "pause" : "play-arrow"} 
                size={isSmallDevice ? 14 : 18} 
                color="#ffffff" 
              />
              <Text style={[styles.actionButtonText, { fontSize: isSmallDevice ? 10 : 12 }]}>
                {active ? translations.deactivate : translations.activate}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteQuote(quote.id)}
            >
              <MaterialIcons name="delete" size={isSmallDevice ? 14 : 18} color="#ffffff" />
              <Text style={[styles.actionButtonText, { fontSize: isSmallDevice ? 10 : 12 }]}>{translations.delete}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer} key={renderKey}>
        <ActivityIndicator size="large" color="#FF7722" />
        <Text style={[styles.loadingText, { fontSize: isSmallDevice ? 13 : 14 }]}>{translations.loadingQuotes}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']} key={renderKey}>
      <View style={styles.container}>
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { fontSize: isSmallDevice ? 18 : 22 }]}>{translations.quoteManagement}</Text>
            </View>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => {
                resetForm();
                setModalVisible(true);
              }}
            >
              <MaterialIcons name="add" size={isSmallDevice ? 20 : 24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBar}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { fontSize: isSmallDevice ? 16 : 20 }]}>
                {quotes.length}
              </Text>
              <Text style={[styles.statLabel, { fontSize: isSmallDevice ? 10 : 12 }]}>{translations.totalQuotes}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.statActive, { fontSize: isSmallDevice ? 16 : 20 }]}>
                {quotes.filter(q => isQuoteActive(q)).length}
              </Text>
              <Text style={[styles.statLabel, { fontSize: isSmallDevice ? 10 : 12 }]}>{translations.active}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.statInactive, { fontSize: isSmallDevice ? 16 : 20 }]}>
                {quotes.filter(q => !isQuoteActive(q)).length}
              </Text>
              <Text style={[styles.statLabel, { fontSize: isSmallDevice ? 10 : 12 }]}>{translations.inactive}</Text>
            </View>
          </View>
        </View>

        <FlatList
          data={quotes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <QuoteCard quote={item} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF7722']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="format-quote" size={44} color="#d1d5db" />
              <Text style={[styles.emptyStateText, { fontSize: isSmallDevice ? 15 : 16 }]}>{translations.noQuotes}</Text>
              <Text style={[styles.emptyStateSubtext, { fontSize: isSmallDevice ? 12 : 13 }]}>
                {translations.addFirstQuote}
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            resetForm();
            setModalVisible(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { fontSize: isSmallDevice ? 18 : 20 }]}>
                  {isEditing ? translations.editQuote : translations.addNewQuote}
                </Text>
                <TouchableOpacity 
                  onPress={() => {
                    resetForm();
                    setModalVisible(false);
                  }}
                >
                  <MaterialIcons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                  {previewImage ? (
                    <Image source={{ uri: previewImage }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <MaterialIcons name="add-photo-alternative" size={40} color="#9ca3af" />
                      <Text style={[styles.imagePickerText, { fontSize: isSmallDevice ? 12 : 13 }]}>
                        {translations.selectImage}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { fontSize: isSmallDevice ? 13 : 14 }]}>{translations.quoteText} *</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea, { fontSize: isSmallDevice ? 13 : 14 }]}
                    placeholder={translations.enterQuote}
                    placeholderTextColor="#9ca3af"
                    value={quoteText}
                    onChangeText={setQuoteText}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { fontSize: isSmallDevice ? 13 : 14 }]}>{translations.author}</Text>
                  <TextInput
                    style={[styles.textInput, { fontSize: isSmallDevice ? 13 : 14 }]}
                    placeholder={translations.enterAuthor}
                    placeholderTextColor="#9ca3af"
                    value={author}
                    onChangeText={setAuthor}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { fontSize: isSmallDevice ? 13 : 14 }]}>{translations.startDate} *</Text>
                  <TouchableOpacity 
                    style={styles.datePicker}
                    onPress={() => setShowStartPicker(true)}
                  >
                    <MaterialIcons name="calendar-today" size={isSmallDevice ? 16 : 20} color="#6b7280" />
                    <Text style={[styles.datePickerText, { fontSize: isSmallDevice ? 13 : 14 }]}>
                      {formatDate(startDate)}
                    </Text>
                  </TouchableOpacity>
                  {showStartPicker && (
                    <DateTimePicker
                      value={startDate}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowStartPicker(false);
                        if (selectedDate) {
                          setStartDate(selectedDate);
                          if (endDate < selectedDate) {
                            setEndDate(selectedDate);
                          }
                        }
                      }}
                    />
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { fontSize: isSmallDevice ? 13 : 14 }]}>{translations.endDate} *</Text>
                  <TouchableOpacity 
                    style={styles.datePicker}
                    onPress={() => setShowEndPicker(true)}
                  >
                    <MaterialIcons name="calendar-today" size={isSmallDevice ? 16 : 20} color="#6b7280" />
                    <Text style={[styles.datePickerText, { fontSize: isSmallDevice ? 13 : 14 }]}>
                      {formatDate(endDate)}
                    </Text>
                  </TouchableOpacity>
                  {showEndPicker && (
                    <DateTimePicker
                      value={endDate}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowEndPicker(false);
                        if (selectedDate) {
                          setEndDate(selectedDate);
                        }
                      }}
                    />
                  )}
                </View>

                <View style={styles.switchContainer}>
                  <Text style={[styles.inputLabel, { fontSize: isSmallDevice ? 13 : 14 }]}>{translations.activeStatus}</Text>
                  <TouchableOpacity 
                    style={[styles.switch, isActive && styles.switchActive]}
                    onPress={() => setIsActive(!isActive)}
                  >
                    <View style={[styles.switchThumb, isActive && styles.switchThumbActive]} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={[styles.saveButton, uploading && styles.saveButtonDisabled]}
                  onPress={handleSaveQuote}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <MaterialIcons name="save" size={20} color="#ffffff" />
                      <Text style={[styles.saveButtonText, { fontSize: isSmallDevice ? 14 : 16 }]}>
                        {isEditing ? translations.updateQuote : translations.addQuote}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
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
    paddingBottom: 100,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontFamily: Fonts.Bold,
    color: '#ffffff',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginTop: -20,
    marginBottom: 16,
  },
  statBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: -50,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    height: '100%',
  },
  statNumber: {
    fontFamily: Fonts.Bold,
    color: '#ffffff',
  },
  statActive: {
    color: '#10b981',
  },
  statInactive: {
    color: '#ef4444',
  },
  statLabel: {
    fontFamily: Fonts.Regular,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  quoteCard: {
    borderRadius: 14,
    marginBottom: 16,
    marginTop: 16,
    overflow: 'hidden',
  },
  quoteCardInactive: {
    opacity: 0.6,
  },
  quoteImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    backgroundColor: '#f3f4f6',
  },
  quoteContent: {
    padding: 16,
  },
  quoteText: {
    fontFamily: Fonts.Medium,
    color: '#1f2937',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  quoteAuthor: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'right',
  },
  quoteMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#d1fae5',
  },
  statusInactive: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontFamily: Fonts.SemiBold,
  },
  statusTextActive: {
    color: '#065f46',
  },
  statusTextInactive: {
    color: '#991b1b',
  },
  quoteActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  editButton: {
    backgroundColor: '#FF7722',
  },
  statusToggleButton: {
    backgroundColor: '#f59e0b',
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
    gap: 10,
  },
  emptyStateText: {
    fontFamily: Fonts.SemiBold,
    color: '#1f2937',
  },
  emptyStateSubtext: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
    textAlign: 'center',
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
  imagePicker: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  imagePickerText: {
    fontFamily: Fonts.Regular,
    color: '#6b7280',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: Fonts.SemiBold,
    color: '#1f2937',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: Fonts.Regular,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  datePickerText: {
    fontFamily: Fonts.Regular,
    color: '#1f2937',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 8,
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#d1d5db',
    padding: 2,
  },
  switchActive: {
    backgroundColor: '#FF7722',
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ffffff',
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF7722',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontFamily: Fonts.SemiBold,
    color: '#ffffff',
  },
});