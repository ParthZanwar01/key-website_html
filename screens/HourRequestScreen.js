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

// Conditionally import FileSystem only on native platforms
let FileSystem = null;
if (Platform.OS !== 'web') {
  try {
    FileSystem = require('expo-file-system');
  } catch (error) {
    console.warn('expo-file-system not available:', error);
  }
}

// ENHANCED Hour Request Service with extensive debugging
class HourRequestService {
  static APPS_SCRIPT_PROXY = '/.netlify/functions/gasProxy';

  // Cross-platform base64 conversion
  static async convertImageToBase64(imageUri) {
    try {
      console.log('🖼️ Starting image conversion for:', imageUri.substring(0, 50) + '...');
      
      if (Platform.OS === 'web') {
        console.log('🌐 Using web image conversion method');
        const response = await fetch(imageUri);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        
        const blob = await response.blob();
        console.log('📁 Image blob size:', blob.size, 'bytes');
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            console.log('✅ Web image conversion successful, base64 length:', base64.length);
            resolve(base64);
          };
          reader.onerror = () => {
            console.error('❌ FileReader error');
            reject(new Error('Failed to read image file'));
          };
          reader.readAsDataURL(blob);
        });
      } else {
        console.log('📱 Using native image conversion method');
        if (!FileSystem) {
          throw new Error('FileSystem not available on this platform');
        }
        
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        console.log('✅ Native image conversion successful, base64 length:', base64.length);
        return base64;
      }
    } catch (error) {
      console.error('❌ Image conversion failed:', error);
      throw new Error(`Failed to convert image: ${error.message}`);
    }
  }

  // Submit hour request with extensive debugging
  static async submitHourRequest(requestData, imageUri = null) {
    console.log('🚀 Starting submitHourRequest...');
    console.log('📋 Platform:', Platform.OS);
    console.log('📋 Request data:', JSON.stringify(requestData, null, 2));
    console.log('📋 Has image:', !!imageUri);
    console.log('📋 Proxy URL:', this.APPS_SCRIPT_PROXY);

    try {
      // Step 1: Convert image if provided
      let base64Image = null;
      if (imageUri) {
        console.log('🖼️ Step 1: Converting image...');
        try {
          base64Image = await this.convertImageToBase64(imageUri);
          console.log('✅ Image conversion successful');
        } catch (imageError) {
          console.warn('⚠️ Image conversion failed, continuing without image:', imageError.message);
          // Continue without image rather than failing entirely
        }
      } else {
        console.log('📝 Step 1: No image to convert');
      }

      // Step 2: Prepare form data
      console.log('📦 Step 2: Preparing form data...');
      const formDataToSend = new URLSearchParams();
      formDataToSend.append('studentSNumber', requestData.studentSNumber);
      formDataToSend.append('studentName', requestData.studentName);
      formDataToSend.append('eventName', requestData.eventName);
      formDataToSend.append('eventDate', requestData.eventDate);
      formDataToSend.append('hoursRequested', requestData.hoursRequested);
      formDataToSend.append('description', requestData.description);

      // Add image data if available
      if (base64Image && imageUri) {
        console.log('🖼️ Adding image data to form...');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const cleanEventName = requestData.eventName.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${requestData.studentSNumber}_${cleanEventName}_${timestamp}.jpg`;

        formDataToSend.append('filename', fileName);
        formDataToSend.append('mimeType', 'image/jpeg');
        formDataToSend.append('file', `data:image/jpeg;base64,${base64Image}`);
        console.log('✅ Image data added to form');
      }

      // Add metadata
      formDataToSend.append('requestType', 'hourSubmission');
      formDataToSend.append('platform', Platform.OS);
      formDataToSend.append('timestamp', new Date().toISOString());

      const formDataString = formDataToSend.toString();
      console.log('📦 Form data prepared, size:', formDataString.length, 'characters');
      console.log('📦 Form data preview:', formDataString.substring(0, 300) + '...');

      // Step 3: Make the request
      console.log('🌐 Step 3: Making network request...');
      console.log('🌐 URL:', this.APPS_SCRIPT_PROXY);
      console.log('🌐 Method: POST');
      console.log('🌐 Content-Type: application/x-www-form-urlencoded');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ Request timeout triggered after 45 seconds');
        controller.abort();
      }, 45000);

      let response;
      try {
        response = await fetch(this.APPS_SCRIPT_PROXY, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: formDataString,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log('✅ Network request completed');
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error('❌ Network request failed:', fetchError);
        
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out after 45 seconds. Please try again.');
        }
        
        throw new Error(`Network error: ${fetchError.message}`);
      }

      // Step 4: Process response
      console.log('📨 Step 4: Processing response...');
      console.log('📨 Response status:', response.status);
      console.log('📨 Response statusText:', response.statusText);
      console.log('📨 Response ok:', response.ok);
      console.log('📨 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.error('❌ Non-OK response status:', response.status);
        
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        let errorDetails = null;
        
        try {
          const contentType = response.headers.get('content-type');
          console.log('📨 Error response content-type:', contentType);
          
          if (contentType && contentType.includes('application/json')) {
            errorDetails = await response.json();
            console.error('❌ JSON error response:', errorDetails);
            errorMessage = errorDetails.error || errorDetails.message || errorMessage;
          } else {
            const errorText = await response.text();
            console.error('❌ Text error response:', errorText.substring(0, 500));
            errorMessage = `${errorMessage}: ${errorText.substring(0, 200)}`;
          }
        } catch (parseError) {
          console.error('❌ Could not parse error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }

      // Step 5: Parse successful response
      console.log('✅ Step 5: Parsing successful response...');
      const contentType = response.headers.get('content-type');
      console.log('📨 Success response content-type:', contentType);

      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.warn('⚠️ Non-JSON success response:', textResponse.substring(0, 500));
        throw new Error(`Unexpected response format. Expected JSON, got: ${contentType}`);
      }

      const data = await response.json();
      console.log('✅ Parsed response data:', JSON.stringify(data, null, 2));

      if (!data.success) {
        const errorMsg = data.error || data.message || 'Request processing failed';
        console.error('❌ Server returned failure:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('🎉 Hour request submission completed successfully!');
      return {
        success: true,
        requestId: data.requestId,
        submissionId: data.submissionId,
        message: data.message || 'Hour request submitted successfully',
        photoUrl: data.photoUrl,
        submittedAt: data.submittedAt || new Date().toISOString()
      };

    } catch (error) {
      console.error('💥 submitHourRequest failed at top level:', error);
      console.error('💥 Error name:', error.name);
      console.error('💥 Error message:', error.message);
      console.error('💥 Error stack:', error.stack);

      // Return detailed error info for debugging
      return {
        success: false,
        error: error.message,
        errorName: error.name,
        errorStack: error.stack,
        platform: Platform.OS,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Test connection method
  static async testConnection() {
    console.log('🧪 Testing connection to Netlify function...');
    
    try {
      const testData = new URLSearchParams({
        requestType: 'connectionTest',
        timestamp: new Date().toISOString(),
        platform: Platform.OS || 'web'
      });

      console.log('🧪 Sending test request...');
      const response = await fetch(this.APPS_SCRIPT_PROXY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: testData.toString()
      });

      console.log('🧪 Test response status:', response.status);
      console.log('🧪 Test response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Connection test successful:', result);
        return {
          success: true,
          message: 'Connection test successful',
          details: result
        };
      } else {
        const errorText = await response.text();
        console.log('⚠️ Connection test failed:', response.status, errorText);
        return {
          success: false,
          error: `HTTP ${response.status}`,
          details: errorText.substring(0, 200)
        };
      }
      
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return {
        success: false,
        error: error.message,
        details: 'Failed to connect to Netlify function'
      };
    }
  }
}

export default function HourRequestScreen({ navigation }) {
  const { getStudentHours } = useHours();
  const { user } = useAuth();
  
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [hoursRequested, setHoursRequested] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentHours, setCurrentHours] = useState(0);
  
  // Image state
  const [image, setImage] = useState(null);
  
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

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Cross-platform image picker
  const pickImage = async () => {
    try {
      console.log('📸 Starting image picker...');
      
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'Permission to access your photo library is required to upload proof photos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];
        console.log('✅ Image selected:', {
          uri: selectedImage.uri,
          width: selectedImage.width,
          height: selectedImage.height,
          fileSize: selectedImage.fileSize
        });
        
        if (selectedImage.fileSize && selectedImage.fileSize > 5 * 1024 * 1024) {
          Alert.alert(
            'Large File Warning',
            'This image is quite large and may take longer to upload. Continue?',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Continue', 
                onPress: () => setImage(selectedImage.uri)
              }
            ]
          );
        } else {
          setImage(selectedImage.uri);
        }
      }
    } catch (error) {
      console.error('❌ Image picker error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const removeImage = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => setImage(null)
        }
      ]
    );
  };

  // Enhanced submit function with detailed error reporting
  const handleSubmitRequest = async () => {
    console.log('🚀 handleSubmitRequest called');
    
    // Validate input
    if (!eventName.trim() || !hoursRequested.trim() || !description.trim()) {
      console.log('❌ Validation failed: missing required fields');
      setErrorDialog({
        visible: true,
        message: 'Please fill in all required fields'
      });
      return;
    }

    const hours = parseFloat(hoursRequested);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      console.log('❌ Validation failed: invalid hours value:', hoursRequested);
      setErrorDialog({
        visible: true,
        message: 'Please enter a valid number of hours (0.1 - 24.0)'
      });
      return;
    }

    console.log('✅ Validation passed');

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

      console.log('📝 Calling HourRequestService.submitHourRequest...');
      const result = await HourRequestService.submitHourRequest(requestData, image);
      console.log('📝 Service call completed, result:', result);
      
      if (result.success) {
        console.log('🎉 Request successful!');
        
        let successMessage = `Your request for ${hours} hours has been submitted successfully!`;
        if (result.photoUrl) {
          successMessage += ` Your proof photo has been uploaded and linked to this request.`;
        }
        
        setSuccessDialog({
          visible: true,
          message: successMessage
        });
        
        // Clear form
        setEventName('');
        setHoursRequested('');
        setDescription('');
        setImage(null);
        
        // Refresh current hours
        try {
          const updatedHours = await getStudentHours(user.sNumber);
          setCurrentHours(updatedHours);
        } catch (error) {
          console.error('Failed to refresh hours:', error);
        }
        
      } else {
        console.error('❌ Service returned failure:', result);
        
        // Show detailed error information
        let errorMessage = result.error || 'Unknown error occurred';
        if (result.errorName || result.errorStack) {
          errorMessage += `\n\nTechnical details:\nType: ${result.errorName}\nPlatform: ${result.platform}`;
        }
        
        setErrorDialog({
          visible: true,
          message: errorMessage
        });
      }
      
    } catch (error) {
      console.error('💥 handleSubmitRequest caught error:', error);
      setErrorDialog({
        visible: true,
        message: `Unexpected error: ${error.message}`
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

  // Photo section
  const renderPhotoSection = () => (
    <View style={styles.formGroup}>
      <Text style={styles.label}>Upload Proof Photo (Optional)</Text>
      
      {!image ? (
        <TouchableOpacity
          style={styles.photoUploadButton}
          onPress={pickImage}
          disabled={loading}
        >
          <Ionicons name="camera" size={24} color="#59a2f0" />
          <Text style={styles.photoUploadText}>Select Photo</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.photoPreviewContainer}>
          <Image source={{ uri: image }} style={styles.photoPreview} />
          
          <View style={styles.photoActions}>
            <TouchableOpacity
              style={styles.photoActionButton}
              onPress={removeImage}
              disabled={loading}
            >
              <Ionicons name="trash" size={16} color="#e74c3c" />
              <Text style={styles.photoActionText}>Remove</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.photoActionButton}
              onPress={pickImage}
              disabled={loading}
            >
              <Ionicons name="refresh" size={16} color="#59a2f0" />
              <Text style={styles.photoActionText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      <Text style={styles.helpText}>
        Photos will be uploaded along with your request to help verify your volunteer work.
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
            </View>
            
            {/* Photo Upload Section */}
            {renderPhotoSection()}

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSubmitRequest}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Submitting Request...' : 'Submit Request'}
              </Text>
            </TouchableOpacity>

            {/* DEBUG: Test Connection Button */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: '#f39c12', marginTop: 10 }]}
              onPress={async () => {
                console.log('🧪 Manual connection test started...');
                const result = await HourRequestService.testConnection();
                console.log('🧪 Manual connection test result:', result);
                
                Alert.alert(
                  'Connection Test', 
                  result.success 
                    ? `Connection successful!\n\n${JSON.stringify(result.details, null, 2)}`
                    : `Connection failed: ${result.error}\n\nDetails: ${result.details}`,
                  [{ text: 'OK' }]
                );
              }}
            >
              <Text style={styles.buttonText}>🧪 Test Connection</Text>
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
  
  // Photo upload styles
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
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
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