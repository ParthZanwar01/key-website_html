import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  Animated, 
  Text,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase/supabaseClient';
import { useNavigation } from '@react-navigation/native';
import SupabaseService from '../services/SupabaseService';
import { useAuth } from '../contexts/AuthContext';
import HelpButton from '../components/HelpButton';

export default function CreateAnnouncementScreen() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const spinValue = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

  const createAnnouncement = async () => {
    if (!title || !message) {
      Alert.alert('Fill all fields');
      return;
    }

    // Debug authentication
    console.log('🔐 Current user:', user);
    console.log('🔐 Is authenticated:', !!user);
    console.log('🔐 User S-Number:', user?.sNumber);

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
      // Create announcement
      const announcementData = {
        title,
        message,
        createdBy: user?.sNumber || 'admin'
      };

      console.log('📝 Creating announcement with data:', announcementData);

      // Check Supabase auth status
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      console.log('🔐 Supabase auth user:', supabaseUser);

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
          
          <HelpButton
            tooltipId="announcement-help"
            tooltipContent="Create announcements to keep club members informed about events, meetings, and important updates"
            helpContent={{
              title: "Creating Announcements",
              content: `
                <h3>How to Create an Announcement</h3>
                <p>1. Enter a clear, descriptive title</p>
                <p>2. Write your message in the text area</p>
                <p>3. Click "Post Announcement" to publish</p>
                
                <h3>Best Practices</h3>
                <p>• Keep titles concise and informative</p>
                <p>• Include relevant details like dates, times, and locations</p>
                <p>• Use clear, professional language</p>
                <p>• Proofread before posting</p>
              `
            }}
            position="top-right"
            style={{ top: 10, right: 10 }}
          />
          
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