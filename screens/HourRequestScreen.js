import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHours } from '../contexts/HourContext';
import { useAuth } from '../contexts/AuthContext';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import ConfirmationDialog from '../components/ConfirmationDialog';
import * as ImagePicker from 'expo-image-picker';
import GoogleDriveService from '../services/GoogleDriveService';

export default function HourRequestScreen({ navigation }) {
  const { submitHourRequest, getStudentHours } = useHours();
  const { user } = useAuth();
  
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [hoursRequested, setHoursRequested] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentHours, setCurrentHours] = useState(0);
  
  // Enhanced photo states
  const [image, setImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageData, setUploadedImageData] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [driveConnectionStatus, setDriveConnectionStatus] = useState(null);
  
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Dialog states
  const [successDialog, setSuccessDialog] = useState({
    visible: false,
    message: ''
  });
  
  const [errorDialog, setErrorDialog] = useState({
    visible: false,
    message: ''
  });

  // Load current hours when component mounts
  useEffect(() => {
    const loadCurrentHours = async () => {
      if (user?.sNumber) {
        try {
          const hours = await getStudentHours(user.sNumber);
          setCurrentHours(hours);
        } catch (error) {
          console.error('Failed to load current hours:', error);
        }
      }
    };
    
    loadCurrentHours();
  }, [user, getStudentHours]);

  // Test Google Apps Script connection on component mount
  useEffect(() => {
    const testDriveConnection = async () => {
      try {
        console.log('🧪 Testing Google Apps Script connection...');
        const result = await GoogleDriveService.testConnection();
        setDriveConnectionStatus(result);
        
        if (result.success) {
          console.log('✅ Google Apps Script connected successfully');
        } else {
          console.warn('⚠️ Google Apps Script connection issue:', result.error);
        }
      } catch (error) {
        console.error('❌ Could not test Google Apps Script connection:', error);
        setDriveConnectionStatus({
          success: false,
          error: error.message,
          diagnostic: 'connection_test_failed'
        });
      }
    };
    
    testDriveConnection();
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Enhanced image picker with better error handling
  const pickImage = async () => {
    try {
      console.log('📸 Starting image picker...');
      
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'Permission to access your photo library is required to upload proof photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => {
              // On iOS, this would open settings
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              }
            }}
          ]
        );
        return;
      }

      // Launch image picker with optimized settings
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8, // Good quality but manageable size
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];
        console.log('✅ Image selected:', {
          uri: selectedImage.uri.substring(0, 50) + '...',
          width: selectedImage.width,
          height: selectedImage.height,
          fileSize: selectedImage.fileSize
        });
        
        setImage(selectedImage.uri);
        
        // Auto-upload to Google Drive
        await uploadImageToGoogleDrive(selectedImage.uri);
      }
    } catch (error) {
      console.error('❌ Image picker error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Simplified upload with Google Apps Script
  const uploadImageToGoogleDrive = async (imageUri) => {
    setUploadingImage(true);
    setUploadProgress(0);
    
    try {
      console.log('📤 Starting Google Apps Script upload...');
      
      // Simulate progress updates for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 15, 90));
      }, 300);
      
      const uploadResult = await GoogleDriveService.uploadImage(
        imageUri,
        user.sNumber,
        eventName || 'hour_request'
      );
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setUploadedImageData(uploadResult);
      
      if (uploadResult.success) {
        Alert.alert(
          '✅ Upload Successful!', 
          `Photo uploaded to Google Drive successfully!\n\nFile: ${uploadResult.fileName}\nStored in: ${uploadResult.studentFolder}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          '⚠️ Upload Failed', 
          `Could not upload to Google Drive: ${uploadResult.error}\n\nPhoto is saved locally and you can still submit your request.`,
          [
            { text: 'Continue Anyway', style: 'default' },
            { text: 'Try Again', onPress: () => uploadImageToGoogleDrive(imageUri) },
            { text: 'Remove Photo', onPress: removeImage, style: 'destructive' }
          ]
        );
      }
      
      console.log('✅ Upload completed:', uploadResult);
      
    } catch (error) {
      console.error('❌ Upload failed:', error);
      
      Alert.alert(
        '❌ Upload Failed', 
        `Could not upload photo to Google Drive: ${error.message}\n\nYou can still submit your hour request.`,
        [
          { text: 'Continue Without Photo', onPress: removeImage },
          { text: 'Try Again', onPress: () => uploadImageToGoogleDrive(imageUri) },
          { text: 'Keep Local Copy', style: 'cancel' }
        ]
      );
      
      setUploadedImageData({
        localUri: imageUri,
        fileName: `${user.sNumber}_${Date.now()}.jpg`,
        uploadStatus: 'failed',
        storage: 'local',
        error: error.message,
        retryable: true,
        requiresAuth: false
      });
      
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
    }
  };

  // Remove/clear selected image
  const removeImage = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setImage(null);
            setUploadedImageData(null);
            setUploadProgress(0);
          }
        }
      ]
    );
  };

  // Simplified retry function
  const retryUpload = async () => {
    if (!uploadedImageData || !uploadedImageData.retryable) {
      Alert.alert('Error', 'Cannot retry this upload');
      return;
    }
    
    await uploadImageToGoogleDrive(uploadedImageData.localUri);
  };

  const handleSubmitRequest = async () => {
    // Validate input
    if (!eventName.trim() || !hoursRequested.trim() || !description.trim()) {
      setErrorDialog({
        visible: true,
        message: 'Please fill in all required fields'
      });
      return;
    }

    const hours = parseFloat(hoursRequested);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      setErrorDialog({
        visible: true,
        message: 'Please enter a valid number of hours (0.1 - 24.0)'
      });
      return;
    }

    try {
      setLoading(true);
      
      const requestData = {
        studentSNumber: user.sNumber,
        studentName: user.name || user.sNumber,
        eventName: eventName.trim(),
        eventDate: eventDate.toISOString().split('T')[0],
        hoursRequested: hours.toString(),
        description: description.trim()
      };

      // Add enhanced photo information if available
      if (uploadedImageData) {
        if (uploadedImageData.storage === 'google_drive') {
          // Successfully uploaded to Google Drive
          requestData.photoUrl = uploadedImageData.fileUrl;
          requestData.photoDownloadUrl = uploadedImageData.downloadUrl;
          requestData.photoThumbnailUrl = uploadedImageData.thumbnailUrl;
          requestData.photoStorage = 'google_drive';
          requestData.photoFileId = uploadedImageData.fileId;
          requestData.photoFileName = uploadedImageData.fileName;
          requestData.photoStudentFolder = uploadedImageData.studentFolder;
        } else {
          // Local storage fallback
          requestData.photoLocalPath = uploadedImageData.localUri;
          requestData.photoStorage = 'local_pending';
          requestData.photoFileName = uploadedImageData.fileName;
          requestData.photoError = uploadedImageData.error;
        }
        
        requestData.photoUploadStatus = uploadedImageData.uploadStatus || 'completed';
        requestData.photoUploadedAt = uploadedImageData.uploadedAt || new Date().toISOString();
      }
      
      await submitHourRequest(requestData);
      
      // Show enhanced success dialog
      const photoMessage = uploadedImageData && uploadedImageData.storage === 'google_drive'
        ? ' Your proof photo has been uploaded to Google Drive and linked to this request.'
        : uploadedImageData 
          ? ' Your proof photo has been saved locally and will be available for admin review.'
          : '';
        
      setSuccessDialog({
        visible: true,
        message: `Your request for ${hours} hours has been submitted successfully!${photoMessage}\n\nYou'll be notified when it's reviewed by an admin.`
      });
      
      // Clear form
      setEventName('');
      setHoursRequested('');
      setDescription('');
      setImage(null);
      setUploadedImageData(null);
      setUploadProgress(0);
      
    } catch (error) {
      console.error('Failed to submit hour request:', error);
      setErrorDialog({
        visible: true,
        message: 'Failed to submit your request. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Date picker component
  const renderDatePicker = () => {
    if (!showDatePicker) return null;
    
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const years = Array.from({ length: 2 }, (_, i) => new Date().getFullYear() - i);
    
    return (
      <Modal
        transparent={true}
        visible={showDatePicker}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.pickerCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>Event Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.pickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.pickerRow}>
              <Picker
                style={styles.picker}
                selectedValue={eventDate.getMonth()}
                onValueChange={(itemValue) => {
                  const newDate = new Date(eventDate);
                  newDate.setMonth(itemValue);
                  setEventDate(newDate);
                }}
              >
                {months.map((month, index) => (
                  <Picker.Item key={month} label={month} value={index} />
                ))}
              </Picker>
              
              <Picker
                style={styles.picker}
                selectedValue={eventDate.getDate()}
                onValueChange={(itemValue) => {
                  const newDate = new Date(eventDate);
                  newDate.setDate(itemValue);
                  setEventDate(newDate);
                }}
              >
                {days.map(day => (
                  <Picker.Item key={day} label={day.toString()} value={day} />
                ))}
              </Picker>
              
              <Picker
                style={styles.picker}
                selectedValue={eventDate.getFullYear()}
                onValueChange={(itemValue) => {
                  const newDate = new Date(eventDate);
                  newDate.setFullYear(itemValue);
                  setEventDate(newDate);
                }}
              >
                {years.map(year => (
                  <Picker.Item key={year} label={year.toString()} value={year} />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Enhanced photo section with better status indicators
  const renderPhotoSection = () => (
    <View style={styles.formGroup}>
      <Text style={styles.label}>Upload Proof Photo (Optional)</Text>
      
      {/* Google Apps Script Status Indicator */}
      {driveConnectionStatus && (
        <View style={[
          styles.connectionStatus,
          { backgroundColor: driveConnectionStatus.success ? '#e8f5e9' : '#ffebee' }
        ]}>
          <Ionicons 
            name={driveConnectionStatus.success ? "cloud-done" : "cloud-offline"} 
            size={16} 
            color={driveConnectionStatus.success ? "#27ae60" : "#e74c3c"} 
          />
          <Text style={[
            styles.connectionStatusText,
            { color: driveConnectionStatus.success ? "#27ae60" : "#e74c3c" }
          ]}>
            {driveConnectionStatus.success 
              ? "Google Apps Script connected - photos will be uploaded to Google Drive"
              : `Google Apps Script unavailable: ${driveConnectionStatus.error}`
            }
          </Text>
        </View>
      )}
      
      {!image ? (
        <TouchableOpacity
          style={styles.photoUploadButton}
          onPress={pickImage}
          disabled={uploadingImage}
        >
          <Ionicons name="camera" size={24} color="#59a2f0" />
          <Text style={styles.photoUploadText}>
            {uploadingImage ? 'Uploading...' : 'Select Photo'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.photoPreviewContainer}>
          <Image source={{ uri: image }} style={styles.photoPreview} />
          
          {/* Upload Progress Bar */}
          {uploadingImage && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>{uploadProgress}%</Text>
            </View>
          )}
          
          <View style={styles.photoActions}>
            <TouchableOpacity
              style={styles.photoActionButton}
              onPress={removeImage}
              disabled={uploadingImage}
            >
              <Ionicons name="trash" size={16} color="#e74c3c" />
              <Text style={styles.photoActionText}>Remove</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.photoActionButton}
              onPress={pickImage}
              disabled={uploadingImage}
            >
              <Ionicons name="refresh" size={16} color="#59a2f0" />
              <Text style={styles.photoActionText}>Change</Text>
            </TouchableOpacity>
            
            {uploadedImageData && uploadedImageData.retryable && uploadedImageData.storage === 'local' && (
              <TouchableOpacity
                style={styles.photoActionButton}
                onPress={retryUpload}
                disabled={uploadingImage}
              >
                <Ionicons name="cloud-upload" size={16} color="#f39c12" />
                <Text style={styles.photoActionText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {uploadingImage && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="large" color="#59a2f0" />
              <Text style={styles.uploadingText}>Uploading to Google Drive...</Text>
            </View>
          )}
          
          {uploadedImageData && !uploadingImage && (
            <View style={styles.uploadStatus}>
              <Ionicons 
                name={
                  uploadedImageData.storage === 'google_drive' 
                    ? "cloud-done" 
                    : uploadedImageData.retryable 
                      ? "cloud-upload-outline" 
                      : "information-circle"
                } 
                size={16} 
                color={
                  uploadedImageData.storage === 'google_drive' 
                    ? "#27ae60" 
                    : uploadedImageData.retryable 
                      ? "#f39c12" 
                      : "#666"
                } 
              />
              <Text style={styles.uploadStatusText}>
                {uploadedImageData.storage === 'google_drive'
                  ? "✅ Uploaded to Google Drive"
                  : uploadedImageData.retryable
                    ? "⚠️ Upload failed - you can retry or submit anyway"
                    : "📱 Saved locally"}
              </Text>
            </View>
          )}
        </View>
      )}
      
      <Text style={styles.helpText}>
        Photos help admins verify your volunteer work. They're automatically uploaded to Google Drive and organized by student.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Request Hours</Text>
          </View>

          {/* Current Hours Display */}
          <View style={styles.currentHoursCard}>
            <Ionicons name="time-outline" size={32} color="#59a2f0" />
            <View style={styles.hoursInfo}>
              <Text style={styles.currentHoursLabel}>Your Current Hours</Text>
              <Text style={styles.currentHoursValue}>{currentHours.toFixed(1)}</Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Submit Hour Request</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Event/Activity Name *</Text>
              <TextInput
                style={styles.input}
                value={eventName}
                onChangeText={setEventName}
                placeholder="e.g., Community Cleanup, Food Drive"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Event Date *</Text>
              <TouchableOpacity 
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text>{formatDate(eventDate)}</Text>
                <Ionicons name="calendar" size={20} color="#666" />
              </TouchableOpacity>
              {renderDatePicker()}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Hours Requested *</Text>
              <TextInput
                style={styles.input}
                value={hoursRequested}
                onChangeText={setHoursRequested}
                placeholder="e.g., 2.5"
                keyboardType="decimal-pad"
              />
              <Text style={styles.helpText}>
                Enter the number of hours you volunteered (e.g., 2.5 for 2 hours 30 minutes)
              </Text>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description/Details *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe what you did during this volunteer activity..."
                multiline
                numberOfLines={4}
              />
              <Text style={styles.helpText}>
                Provide details about your volunteer work to help with verification
              </Text>
            </View>
            
            {/* Enhanced Photo Upload Section */}
            {renderPhotoSection()}

            <TouchableOpacity
              style={[styles.submitButton, (loading || uploadingImage) && styles.disabledButton]}
              onPress={handleSubmitRequest}
              disabled={loading || uploadingImage}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Submitting Request...' : uploadingImage ? 'Uploading Photo...' : 'Submit Request'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.viewRequestsButton}
              onPress={() => navigation.navigate('HourRequests')}
            >
              <Text style={styles.viewRequestsText}>View My Requests</Text>
              <Ionicons name="chevron-forward" size={16} color="#59a2f0" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Dialog */}
      <ConfirmationDialog
        visible={successDialog.visible}
        title="Request Submitted!"
        message={successDialog.message}
        onCancel={() => setSuccessDialog({ visible: false, message: '' })}
        onConfirm={() => setSuccessDialog({ visible: false, message: '' })}
        cancelText=""
        confirmText="OK"
        icon="checkmark-circle"
        iconColor="#4CAF50"
      />

      {/* Error Dialog */}
      <ConfirmationDialog
        visible={errorDialog.visible}
        title="Error"
        message={errorDialog.message}
        onCancel={() => setErrorDialog({ visible: false, message: '' })}
        onConfirm={() => setErrorDialog({ visible: false, message: '' })}
        cancelText=""
        confirmText="OK"
        icon="alert-circle"
        iconColor="#ff4d4d"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#94cfec',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  currentHoursCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 10,
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  hoursInfo: {
    marginLeft: 15,
    flex: 1,
  },
  currentHoursLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  currentHoursValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#59a2f0',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    margin: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateTimeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  
  // Enhanced photo upload styles
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 4,
    marginBottom: 10,
  },
  connectionStatusText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '500',
  },
  photoUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#59a2f0',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  photoUploadText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#59a2f0',
    fontWeight: '500',
  },
  photoPreviewContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#59a2f0',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#59a2f0',
    fontWeight: 'bold',
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: 'white',
  },
  photoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  photoActionText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '500',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#59a2f0',
    fontWeight: '500',
  },
  uploadStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f8ff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  uploadStatusText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  
  submitButton: {
    backgroundColor: '#59a2f0',
    padding: 15,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 15,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  viewRequestsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#59a2f0',
    borderRadius: 4,
  },
  viewRequestsText: {
    color: '#59a2f0',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 5,
  },
  
  // Modal Picker Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerContainer: {
    backgroundColor: 'white',
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  pickerCancel: {
    color: '#f54242',
    fontSize: 16,
  },
  pickerDone: {
    color: '#4287f5',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  picker: {
    flex: 1,
    height: 200,
  },
});