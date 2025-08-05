import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  Animated, 
  Text,
  Image,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../supabase/supabaseClient';
import { useNavigation } from '@react-navigation/native';
import SupabaseService from '../services/SupabaseService';
import { useAuth } from '../contexts/AuthContext';

export default function CreateAnnouncementScreen() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const spinValue = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const imageScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Request permissions on mount
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();

    // Initial entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const startSpinAnimation = () => {
    spinValue.setValue(0);
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      })
    ).start();
  };

  const stopSpinAnimation = () => {
    spinValue.stopAnimation();
  };

  const showSuccessAnimation = () => {
    Animated.parallel([
      Animated.spring(successScale, {
        toValue: 1,
        tension: 50,
        friction: 6,
        useNativeDriver: false,
      }),
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => {
      // Hide success animation after 1.5 seconds
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(successScale, {
            toValue: 0,
            tension: 50,
            friction: 6,
            useNativeDriver: false,
          }),
          Animated.timing(successOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }),
        ]).start();
      }, 1500);
    });
  };

  const pickImage = async (source) => {
    try {
      let result;
      
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [16, 9],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [16, 9],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0]);
        
        // Animate image appearance
        Animated.spring(imageScale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: false,
        }).start();
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    Animated.timing(imageScale, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const uploadImage = async () => {
    if (!selectedImage) return null;

    try {
      setImageUploading(true);
      
      // Generate unique filename
      const timestamp = Date.now();
      const filename = `announcement_${timestamp}.jpg`;
      
      // Upload to Supabase Storage
      const imageUrl = await SupabaseService.uploadAnnouncementImage(
        selectedImage.uri,
        filename
      );
      
      return { url: imageUrl, filename };
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
      return null;
    } finally {
      setImageUploading(false);
    }
  };

  const createAnnouncement = async () => {
    if (!title || !message) {
      Alert.alert('Fill all fields');
      return;
    }

    setIsCreating(true);
    
    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();

    // Start loading animation
    startSpinAnimation();

    try {
      let imageData = null;
      
      // Upload image if selected
      if (selectedImage) {
        imageData = await uploadImage();
        if (!imageData) {
          throw new Error('Failed to upload image');
        }
      }

      // Create announcement
      const announcementData = {
        title,
        message,
        createdBy: user?.sNumber || 'admin',
        imageUrl: imageData?.url,
        imageFilename: imageData?.filename
      };

      await SupabaseService.createAnnouncement(announcementData);

      // Add a small delay to show the animation
      await new Promise(resolve => setTimeout(resolve, 1000));

      stopSpinAnimation();
      showSuccessAnimation();
      
      // Wait for success animation, then navigate back
      setTimeout(() => {
        Alert.alert('Success', 'Announcement posted');
        navigation.goBack();
      }, 2000);
    } catch (error) {
      stopSpinAnimation();
      Alert.alert('Error', error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Text style={styles.headerText}>Create Announcement</Text>
          
          <View style={styles.inputContainer}>
            <Ionicons name="create-outline" size={20} color="#4299e1" style={styles.inputIcon} />
            <TextInput 
              placeholder="Title" 
              value={title} 
              onChangeText={setTitle} 
              style={styles.input}
              editable={!isCreating}
            />
          </View>
          
          <View style={[styles.inputContainer, styles.messageContainer]}>
            <Ionicons name="chatbubble-outline" size={20} color="#4299e1" style={[styles.inputIcon, styles.messageIcon]} />
            <TextInput
              placeholder="Message"
              value={message}
              onChangeText={setMessage}
              style={[styles.input, styles.messageInput]}
              multiline
              textAlignVertical="top"
              editable={!isCreating}
            />
          </View>

          {/* Image Upload Section */}
          <View style={styles.imageSection}>
            <Text style={styles.sectionTitle}>Add Image (Optional)</Text>
            
            {!selectedImage ? (
              <View style={styles.imageButtonsContainer}>
                <TouchableOpacity 
                  style={styles.imageButton} 
                  onPress={() => pickImage('camera')}
                  disabled={isCreating}
                >
                  <Ionicons name="camera" size={24} color="#4299e1" />
                  <Text style={styles.imageButtonText}>Camera</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.imageButton} 
                  onPress={() => pickImage('gallery')}
                  disabled={isCreating}
                >
                  <Ionicons name="images" size={24} color="#4299e1" />
                  <Text style={styles.imageButtonText}>Gallery</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Animated.View 
                style={[
                  styles.imagePreviewContainer,
                  { transform: [{ scale: imageScale }] }
                ]}
              >
                <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
                <TouchableOpacity 
                  style={styles.removeImageButton} 
                  onPress={removeImage}
                  disabled={isCreating}
                >
                  <Ionicons name="close-circle" size={30} color="#e53e3e" />
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>

          <Animated.View
            style={[
              styles.buttonContainer,
              {
                transform: [{ scale: buttonScale }],
              },
            ]}
          >
            <TouchableOpacity 
              style={[styles.postButton, isCreating && styles.postButtonDisabled]} 
              onPress={createAnnouncement}
              disabled={isCreating}
            >
              {isCreating ? (
                <Animated.View
                  style={{
                    transform: [{ rotate: spin }],
                  }}
                >
                  <Ionicons name="refresh" size={24} color="white" />
                </Animated.View>
              ) : (
                <Ionicons name="send" size={24} color="white" />
              )}
              <Text style={styles.buttonText}>
                {isCreating ? 'Creating...' : 'Post Announcement'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>

      {/* Success Animation Overlay */}
      <Animated.View
        style={[
          styles.successOverlay,
          {
            opacity: successOpacity,
            transform: [{ scale: successScale }],
          },
        ]}
        pointerEvents="none"
      >
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#4299e1" />
          <Text style={styles.successText}>Announcement Created!</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a365d',
    padding: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4299e1',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4299e1',
    marginBottom: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  messageContainer: {
    alignItems: 'flex-start',
    paddingVertical: 15,
  },
  inputIcon: {
    marginRight: 8,
    color: '#4299e1',
  },
  messageIcon: {
    marginTop: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2d3748',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderWidth: 0,
  },
  messageInput: {
    minHeight: 100,
  },
  imageSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  imageButton: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.45,
    borderWidth: 1,
    borderColor: '#4299e1',
  },
  imageButtonText: {
    color: '#4299e1',
    fontWeight: '600',
    marginTop: 8,
    fontSize: 14,
  },
  imagePreviewContainer: {
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#4299e1',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 15,
  },
  buttonContainer: {
    marginTop: 20,
  },
  postButton: {
    backgroundColor: '#4299e1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  postButtonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    marginLeft: 8,
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContainer: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  successText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00b894',
    marginTop: 20,
  },
});