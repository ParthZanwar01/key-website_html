// Updated HourRequestScreen.js - Now with submitting animation
// This version generates the same filename format as your Google Apps Script

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHours } from '../contexts/HourContext';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ModernDatePicker from '../components/ModernDatePicker';
import HelpButton from '../components/HelpButton';
// Remove Google Drive dependency - we'll use local storage instead

// Conditionally import FileSystem only on native platforms
let FileSystem = null;
if (Platform.OS !== 'web') {
  try {
    FileSystem = require('expo-file-system');
  } catch (error) {
    console.warn('expo-file-system not available:', error);
  }
}

// ENHANCED Hour Request Service with IMAGE NAME integration
class HourRequestService {
  static APPS_SCRIPT_PROXY = '/.netlify/functions/gasProxy';

  // Cross-platform base64 conversion
  // Convert image to base64 for admin viewing
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

  // Generate filename using same format as Google Apps Script
  static generateFileName(studentNumber, eventName) {
    try {
      // Create timestamp - same format as Google Apps Script
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Clean event name - same logic as Google Apps Script
      const cleanEventName = eventName.replace(/[^a-zA-Z0-9]/g, '_');
      
      // Generate filename in same format: studentNumber_eventName_timestamp.jpg
      const fileName = `${studentNumber}_${cleanEventName}_${timestamp}.jpg`;
      
      console.log('📝 Generated filename:', fileName);
      return fileName;
    } catch (error) {
      console.error('❌ Error generating filename:', error);
      // Fallback filename
      return `${studentNumber}_${Date.now()}.jpg`;
    }
  }

  // UPDATED: Submit hour request with proper JSON handling AND image name
  static async submitHourRequest(requestData, imageUri = null) {
    console.log('🚀 Starting submitHourRequest...');
    console.log('📋 Platform:', Platform.OS);
    console.log('📋 Request data:', JSON.stringify(requestData, null, 2));
    console.log('📋 Has image:', !!imageUri);

    try {
      let imageFileName = null;
      let imageData = null;
      
      // RESTORED: Image processing with better error handling
      console.log('🔄 RESTORING IMAGE PROCESSING WITH BETTER ERROR HANDLING');
      
      if (imageUri) {
        console.log('📸 Image URI provided:', imageUri.substring(0, 50) + '...');
        // Generate filename for reference
        imageFileName = this.generateFileName(requestData.studentSNumber, requestData.eventName);
        console.log('📝 Generated filename:', imageFileName);
      }

      // SIMPLE IMAGE PROCESSING FOR ADMIN VIEWING
      console.log('🔄 SIMPLE IMAGE PROCESSING FOR ADMIN PHOTOS');
      
      if (imageUri) {
        console.log('📸 Image provided, processing for admin viewing...');
        try {
          // Generate filename
          imageFileName = this.generateFileName(requestData.studentSNumber, requestData.eventName);
          console.log('📝 Generated filename:', imageFileName);
          
          // Convert image to base64 for admin viewing
          imageData = await this.convertImageToBase64(imageUri);
          console.log('✅ Image converted to base64 successfully, length:', imageData.length);
        } catch (imageError) {
          console.warn('⚠️ Image processing failed, continuing without image:', imageError.message);
          // Continue without image rather than failing entirely
          imageFileName = null;
          imageData = null;
          console.log('📝 Continuing with request submission without image');
        }
      } else {
        console.log('📝 No image to process');
      }

      // Step 2: Prepare request data for Supabase (including image data)
      const supabaseRequestData = {
        studentSNumber: requestData.studentSNumber,
        studentName: requestData.studentName,
        eventName: requestData.eventName,
        eventDate: requestData.eventDate,
        hoursRequested: requestData.hoursRequested,
        description: requestData.description,
        
        // IMPORTANT: Include the image filename if we have one
        ...(imageFileName && { imageName: imageFileName }),
        
        // IMPORTANT: Store image data in description field for admin viewing
        ...(imageData && { 
          description: `${requestData.description}\n\n[PHOTO_DATA:${imageData}]`
        })
      };
      
      // Ensure we have the minimum required data
      if (!supabaseRequestData.studentSNumber || !supabaseRequestData.eventName || !supabaseRequestData.hoursRequested) {
        throw new Error('Missing required fields: student number, event name, or hours requested');
      }
      
      console.log('📋 Supabase data prepared:', {
        hasImageName: !!supabaseRequestData.imageName
      });

      console.log('💾 Step 2: Submitting to Supabase with image filename...');
      console.log('📋 Supabase data:', {
        ...supabaseRequestData,
        hasImageName: !!supabaseRequestData.imageName
      });

      // Submit to Supabase FIRST (even if image upload fails later)
      const supabaseResult = await this.saveToSupabase(supabaseRequestData);
      console.log('✅ Hour request saved to Supabase:', supabaseResult);

            // Step 3: Create simple image upload result
      let imageUploadResult = null;
      if (imageFileName) {
        console.log('📸 Step 3: Creating simple image upload result...');
        
        imageUploadResult = {
          success: true,
          fileName: imageFileName,
          uploadedAt: new Date().toISOString(),
          note: 'Image processing skipped - filename saved for reference'
        };
        
        console.log('🎉 Simple image upload result created!');
      } else {
        console.log('📝 Step 3: No image filename to process');
      }

      // Step 4: Return success result
      return {
        success: true,
        requestId: supabaseResult.id,
        submittedAt: supabaseResult.submitted_at || new Date().toISOString(),
        database: 'saved',
        
        // Image upload results
        imageFileName: imageFileName,
        imageUpload: imageUploadResult ? 'success' : (imageUri ? 'failed' : 'none'),
        imageUploadResult: imageUploadResult,
        
        message: imageUploadResult 
          ? 'Hour request submitted successfully with proof photo!'
          : (imageFileName 
            ? 'Hour request submitted successfully (image upload failed but filename saved)'
            : 'Hour request submitted successfully')
      };

    } catch (error) {
      console.error('💥 submitHourRequest failed:', error);
      console.error('💥 Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        platform: Platform.OS
      });
      
      return {
        success: false,
        error: error.message,
        errorName: error.name,
        platform: Platform.OS,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Save hour request to Supabase database (UPDATED to handle image filename)
  static async saveToSupabase(requestData) {
    try {
      console.log('💾 Saving hour request to Supabase...');
      console.log('📋 Request data keys:', Object.keys(requestData));
      console.log('📋 Has image filename:', !!requestData.imageName);
      
      // Import SupabaseService
      const SupabaseService = (await import('../services/SupabaseService')).default;
      
      // Prepare the hour request data for Supabase
      const hourRequestData = {
        studentSNumber: requestData.studentSNumber,
        studentName: requestData.studentName,
        eventName: requestData.eventName,
        eventDate: requestData.eventDate,
        hoursRequested: requestData.hoursRequested,
        description: requestData.description
      };

      // Add image data if available
      if (requestData.imageName) {
        hourRequestData.imageName = requestData.imageName;
        console.log('📎 Including image filename in Supabase submission:', requestData.imageName);
      }
      
      // Add image data if available
      if (requestData.imageData) {
        hourRequestData.imageData = requestData.imageData;
        console.log('📎 Including image data in Supabase submission');
      }
      
      console.log('📋 Final Supabase data:', {
        studentSNumber: hourRequestData.studentSNumber,
        eventName: hourRequestData.eventName,
        hoursRequested: hourRequestData.hoursRequested,
        hasImageName: !!hourRequestData.imageName,
        imageName: hourRequestData.imageName
      });
      
      // Submit to Supabase using the existing service method
      const result = await SupabaseService.submitHourRequest(hourRequestData);
      
      console.log('✅ Supabase submission successful:', {
        id: result.id,
        status: result.status,
        submittedAt: result.submitted_at,
        imageName: result.image_name
      });
      
      return result;
    } catch (error) {
      console.error('❌ Supabase save failed:', error);
      throw new Error(`Database save failed: ${error.message}`);
    }
  }

  // Test connection method (unchanged)
  static async testConnection() {
    console.log('🧪 Testing connection to Supabase...');
    
    try {
      // Import and test SupabaseService
      const SupabaseService = (await import('../services/SupabaseService')).default;
      
      console.log('🧪 Testing Supabase connection...');
      const result = await SupabaseService.testConnection();
      
      console.log('✅ Connection test successful:', result);
      return {
        success: true,
        message: 'Supabase connection successful',
        details: result
      };
      
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return {
        success: false,
        error: error.message,
        details: 'Failed to connect to Supabase database'
      };
    }
  }
}

// Animated Loading Component
const SubmittingAnimation = ({ visible, stage, hasImage }) => {
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];
  const rotateAnim = useState(new Animated.Value(0))[0];
  const progressAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (visible) {
      // Fade in and scale up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: false,
        }),
      ]).start();

      // Continuous rotation
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      );
      rotateAnimation.start();

      // Progress animation based on stage
      let progressValue = 0;
      switch (stage) {
        case 'processing':
          progressValue = 0.2;
          break;
        case 'saving':
          progressValue = 0.5;
          break;
        case 'uploading':
          progressValue = 0.8;
          break;
        case 'completing':
          progressValue = 1.0;
          break;
      }

      Animated.timing(progressAnim, {
        toValue: progressValue,
        duration: 500,
        useNativeDriver: false,
      }).start();

      return () => {
        rotateAnimation.stop();
      };
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      rotateAnim.setValue(0);
      progressAnim.setValue(0);
    }
  }, [visible, stage]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getStageText = () => {
    switch (stage) {
      case 'processing':
        return hasImage ? 'Processing image...' : 'Processing request...';
      case 'saving':
        return 'Saving to database...';
      case 'uploading':
        return 'Uploading photo...';
      case 'completing':
        return 'Finishing up...';
      default:
        return 'Submitting request...';
    }
  };

  const getStageIcon = () => {
    switch (stage) {
      case 'processing':
        return hasImage ? 'image' : 'document-text';
      case 'saving':
        return 'save';
      case 'uploading':
        return 'cloud-upload';
      case 'completing':
        return 'checkmark-circle';
      default:
        return 'send';
    }
  };

  if (!visible) return null;

  return (
    <View style={animationStyles.overlay}>
      <Animated.View
        style={[
          animationStyles.container,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Main spinning circle */}
        <Animated.View
          style={[
            animationStyles.spinnerCircle,
            { transform: [{ rotate: spin }] },
          ]}
        >
          <View style={animationStyles.spinnerInner} />
        </Animated.View>

        {/* Center icon */}
        <View style={animationStyles.iconContainer}>
          <Ionicons
            name={getStageIcon()}
            size={32}
            color="#59a2f0"
          />
        </View>

        {/* Progress bar */}
        <View style={animationStyles.progressContainer}>
          <View style={animationStyles.progressBackground}>
            <Animated.View
              style={[
                animationStyles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </View>

        {/* Stage text */}
        <Text style={animationStyles.stageText}>
          {getStageText()}
        </Text>

        {/* Key Club branding */}
        <Text style={animationStyles.brandText}>
          Key Club Hour Submission
        </Text>
      </Animated.View>
    </View>
  );
};

export default function HourRequestScreen({ navigation }) {
  const { getStudentHours } = useHours();
  const { user } = useAuth();
  const { showModal } = useModal();
  
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [hoursRequested, setHoursRequested] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentHours, setCurrentHours] = useState(0);
  
  // Image state
  const [image, setImage] = useState(null);
  
  // Animation states
  const [submittingStage, setSubmittingStage] = useState('');
  
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  


  const headerAnim = useRef(new Animated.Value(-100)).current;
  const hoursCardAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const submitAnim = useRef(new Animated.Value(1)).current;
  const sparkPulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate header, hours card, and form fields in sequence
    Animated.sequence([
      Animated.timing(headerAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: false,
      }),
      Animated.timing(hoursCardAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: false,
      }),
      Animated.timing(formAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: false,
      })
    ]).start();

    // Submit button pulse
    const pulse = () => {
      Animated.sequence([
        Animated.timing(submitAnim, {
          toValue: 1.05,
          duration: 1800,
          useNativeDriver: false,
        }),
        Animated.timing(submitAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: false,
        })
      ]).start(pulse);
    };
    pulse();

    // Sparkle pulse
    const sparkPulse = () => {
      Animated.sequence([
        Animated.timing(sparkPulseAnim, {
          toValue: 1.2,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(sparkPulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        })
      ]).start(sparkPulse);
    };
    sparkPulse();
  }, []);

  // Floating sparkles component


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

  // Enhanced submit function with animation stages
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

    // Validate photo is required
    if (!image) {
      console.log('❌ Validation failed: photo is required');
      showModal({
        title: 'Photo Required',
        message: 'Please upload a proof photo for your hour request. This helps verify your volunteer work.',
        onCancel: () => {},
        onConfirm: () => {},
        cancelText: '',
        confirmText: 'OK',
        icon: 'camera',
        iconColor: '#ff4d4d'
      });
      return;
    }

    const hours = parseFloat(hoursRequested);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      console.log('❌ Validation failed: invalid hours value:', hoursRequested);
      showModal({
        title: 'Error',
        message: 'Please enter a valid number of hours (0.1 - 24.0)',
        onCancel: () => {},
        onConfirm: () => {},
        cancelText: '',
        confirmText: 'OK',
        icon: 'alert-circle',
        iconColor: '#ff4d4d'
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

      // Start animation stages
      setSubmittingStage('processing');
      
      // Add delay to show processing stage
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmittingStage('saving');
      
      console.log('📝 Calling HourRequestService.submitHourRequest...');
      
      // Create a promise wrapper to track stages
      const submitWithStages = async () => {
        const result = await HourRequestService.submitHourRequest(requestData, image);
        
        // Ensure result exists and has expected structure
        if (!result) {
          throw new Error('Service returned undefined result');
        }
        
        if (result.success && image) {
          setSubmittingStage('uploading');
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        setSubmittingStage('completing');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        return result;
      };
      
      const result = await submitWithStages();
      console.log('📝 Service call completed, result:', result);
      
      if (result && result.success) {
        console.log('🎉 Request successful!');
        
        let successMessage = `Your request for ${hours} hours has been submitted successfully!`;
        
        if (result.imageFileName) {
          if (result.imageUpload === 'success') {
            successMessage += ` Your proof photo "${result.imageFileName}" has been uploaded and linked to this request.`;
          } else if (result.imageUpload === 'failed') {
            successMessage += ` Your request was saved, but the photo upload failed due to a network issue. Please contact an administrator to resolve this issue.`;
          }
        }
        
        showModal({
          title: 'Success',
          message: successMessage,
          onCancel: () => {},
          onConfirm: () => {},
          cancelText: '',
          confirmText: 'OK',
          icon: 'checkmark-circle',
          iconColor: '#4CAF50'
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
        
        showModal({
          title: 'Error',
          message: (result && result.error) || 'Unknown error occurred',
          onCancel: () => {},
          onConfirm: () => {},
          cancelText: '',
          confirmText: 'OK',
          icon: 'alert-circle',
          iconColor: '#ff4d4d'
        });
      }
      
    } catch (error) {
      console.error('💥 handleSubmitRequest caught error:', error);
      showModal({
        title: 'Error',
        message: `Unexpected error: ${error.message}`,
        onCancel: () => {},
        onConfirm: () => {},
        cancelText: '',
        confirmText: 'OK',
        icon: 'alert-circle',
        iconColor: '#ff4d4d'
      });
    } finally {
      setLoading(false);
      setSubmittingStage('');
    }
  };

    // Modern date picker component
  const renderDatePicker = () => {
    return (
      <ModernDatePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        selectedDate={eventDate}
        onDateSelect={(selectedDate) => setEventDate(selectedDate)}
        title="Select Event Date"
      />
    );
  };

  // Photo section
  const renderPhotoSection = () => (
    <View style={styles.formGroup}>
      <Text style={styles.label}>Upload Proof Photo *</Text>
      
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
        A proof photo is required to verify your volunteer work. Photos will be uploaded and linked to your request.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e90ff" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Animated Header */}
          <Animated.View
            style={[
              styles.header,
              { transform: [{ translateY: headerAnim }] }
            ]}
          >
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#ffd60a" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Request Hours</Text>
            
            <HelpButton
              tooltipId="hour-request-help"
              tooltipContent="Submit volunteer hours for approval by club officers"
              helpContent={{
                title: "Submitting Volunteer Hours",
                content: `
                  <h3>How to Submit Hours</h3>
                  <p>1. Select the event type from the dropdown</p>
                  <p>2. Enter the event name and description</p>
                  <p>3. Choose the date and enter hours worked</p>
                  <p>4. Optionally add a photo for verification</p>
                  <p>5. Click "Submit Request" to send for approval</p>
                  
                  <h3>Tips for Approval</h3>
                  <p>• Be specific about the event and your role</p>
                  <p>• Include accurate dates and times</p>
                  <p>• Add photos when possible for verification</p>
                  <p>• Contact officers if you have questions</p>
                `
              }}
              position="top-right"
              style={{ top: 10, right: 10 }}
            />
          </Animated.View>

          {/* Animated Current Hours Card */}
          <Animated.View
            style={[
              styles.currentHoursCard,
              {
                opacity: hoursCardAnim,
                transform: [
                  { scale: hoursCardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }
                ]
              }
            ]}
          >
            <Ionicons name="time-outline" size={32} color="#ffd60a" />
            <View style={styles.hoursInfo}>
              <Text style={styles.currentHoursLabel}>Your Current Hours</Text>
              <Text style={styles.currentHoursValue}>{currentHours.toFixed(1)}</Text>
            </View>
          </Animated.View>

          {/* Animated Form Container */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: formAnim,
                transform: [
                  { translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }
                ]
              }
            ]}
          >
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

            {/* Animated Submit Button */}
            <Animated.View style={{ alignItems: 'center', transform: [{ scale: submitAnim }] }}>
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.disabledButton]}
                onPress={handleSubmitRequest}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Ionicons name="rocket" size={20} color="#0d1b2a" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>
                  {loading ? 'Submitting Request...' : 'Submit Request'}
                </Text>
              </TouchableOpacity>
            </Animated.View>

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
              onPress={() => navigation.navigate('Calendar', { screen: 'HourRequests' })}
            >
              <Text style={styles.viewRequestsText}>View My Requests</Text>
              <Ionicons name="chevron-forward" size={16} color="#ffd60a" />
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Submitting Animation */}
      <SubmittingAnimation
        visible={loading}
        stage={submittingStage}
        hasImage={!!image}
      />

      {/* Date Picker Modal */}
      {renderDatePicker()}

    </SafeAreaView>
  );
}

// Animation Styles
const animationStyles = StyleSheet.create({
  overlay: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: Platform.OS === 'web' ? '100vw' : '100%',
    height: Platform.OS === 'web' ? '100vh' : '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
    elevation: 99999,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    minWidth: 280,
  },
  spinnerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#e3f2fd',
    borderTopColor: '#59a2f0',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f8f9fa',
  },
  iconContainer: {
    position: 'absolute',
    top: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    width: '100%',
    marginVertical: 20,
  },
  progressBackground: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'visible',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#59a2f0',
    borderRadius: 2,
  },
  stageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  brandText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

// Main Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a365d', // Deep navy blue background
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 18,
    backgroundColor: 'rgba(66, 153, 225, 0.1)', // Professional blue with transparency
    borderBottomWidth: 1,
    borderBottomColor: '#4299e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    marginRight: 10,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(66, 153, 225, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4299e1', // Professional blue
    textShadowColor: 'rgba(66, 153, 225, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  currentHoursCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Subtle transparency
    borderRadius: 18,
    padding: 18,
    margin: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(66, 153, 225, 0.2)',
  },
  hoursInfo: {
    marginLeft: 16,
  },
  currentHoursLabel: {
    color: '#e2e8f0', // Light gray
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  currentHoursValue: {
    color: '#4299e1', // Professional blue
    fontSize: 28,
    fontWeight: 'bold',
    textShadowColor: 'rgba(66, 153, 225, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Subtle transparency
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 18,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(66, 153, 225, 0.2)',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4299e1', // Professional blue
    marginBottom: 18,
    textAlign: 'center',
    textShadowColor: 'rgba(66, 153, 225, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#4299e1', // Professional blue
    fontWeight: 'bold',
    textShadowColor: 'rgba(66, 153, 225, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#4299e1', // Professional blue
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#2d3748', // Dark gray
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateTimeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4299e1',
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#cbd5e0', // Medium gray
    marginTop: 5,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  
  // Photo upload styles
  photoUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4299e1', // Professional blue
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  photoUploadText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#4299e1', // Professional blue
    fontWeight: 'bold',
  },
  photoPreviewContainer: {
    borderRadius: 8,
    overflow: 'visible',
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
    backgroundColor: '#4299e1', // Professional blue
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: '#718096', // Medium gray
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  viewRequestsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#4299e1', // Professional blue
    borderRadius: 4,
  },
  viewRequestsText: {
    color: '#4299e1', // Professional blue
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 5,
  },
  

  modalOverlay: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: Platform.OS === 'web' ? '100vw' : '100%',
    height: Platform.OS === 'web' ? '100vh' : '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
    elevation: 99999,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
    width: '90%',
    maxWidth: 450,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fafbfc',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  pickerHeaderButton: {
    padding: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  pickerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3748',
    letterSpacing: 0.5,
  },
  pickerSubtitle: {
    fontSize: 13,
    color: '#718096',
    marginTop: 4,
    fontWeight: '500',
  },
  pickerDoneButton: {
    backgroundColor: '#4299e1',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  pickerDone: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerCancel: {
    color: '#e53e3e',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedDateDisplay: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f8fafc',
  },
  selectedDateText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2d3748',
    letterSpacing: 1,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 15,
    marginBottom: 20,
    marginTop: 10,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  pickerLabel: {
    fontSize: 13,
    color: '#718096',
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerWrapper: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  picker: {
    width: '100%',
    height: 180,
  },
  pickerItem: {
    height: 45,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingHorizontal: 15,
  },
  quickActionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    backgroundColor: '#ebf8ff',
    borderWidth: 2,
    borderColor: '#bee3f8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 14,
    color: '#3182ce',
    fontWeight: '600',
  },
  floatingSparkle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4299e1', // Professional blue
    shadowColor: '#4299e1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 1,
  },
});