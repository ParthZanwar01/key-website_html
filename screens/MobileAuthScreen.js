import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import SupabaseService from '../services/SupabaseService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function MobileAuthScreen({ navigation }) {
  const { loginAsStudent, registerStudent } = useAuth();
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' or 'signup'
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  // Sign In State
  const [signInSNumber, setSignInSNumber] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  
  // Sign Up State
  const [signUpSNumber, setSignUpSNumber] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  
  // Switch between tabs with animation
  const switchTab = (tab) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setActiveTab(tab);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };
  
  // Handle Sign In
  const handleSignIn = async () => {
    if (!signInSNumber || !signInPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (!signInSNumber.toLowerCase().startsWith('s')) {
      Alert.alert('Error', 'Please enter a valid S-Number starting with "s"');
      return;
    }
    
    if (signInPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }
    
    setSignInLoading(true);
    
    try {
      const success = await loginAsStudent(signInSNumber.toLowerCase(), signInPassword);
      
      if (success) {
        // Navigation handled by AuthContext
      }
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setSignInLoading(false);
    }
  };
  
  // Handle Sign Up
  const handleSignUp = async () => {
    if (!signUpSNumber || !signUpName || !signUpPassword || !signUpConfirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (!signUpSNumber.toLowerCase().startsWith('s')) {
      Alert.alert('Error', 'Please enter a valid S-Number starting with "s"');
      return;
    }
    
    if (signUpName.length < 2) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }
    
    if (signUpPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }
    
    if (signUpPassword !== signUpConfirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    setSignUpLoading(true);
    
    try {
      // Check if student exists in the system
      const student = await SupabaseService.getStudent(signUpSNumber);
      
      if (!student) {
        Alert.alert(
          'Not Found', 
          'Your S-Number was not found in our system. Please contact your Key Club sponsor to be added to the roster.'
        );
        setSignUpLoading(false);
        return;
      }
      
      // Check if already has account
      const authUser = await SupabaseService.getAuthUser(signUpSNumber);
      
      if (authUser) {
        Alert.alert(
          'Account Exists', 
          'An account with this S-Number already exists. Please sign in instead.',
          [
            {
              text: 'Go to Sign In',
              onPress: () => switchTab('signin')
            }
          ]
        );
        setSignUpLoading(false);
        return;
      }
      
      // Create account
      const success = await registerStudent(signUpSNumber.toLowerCase(), signUpPassword, signUpName);
      
      if (success) {
        Alert.alert(
          'Success', 
          `Account created successfully! You can now sign in.`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Clear sign up form
                setSignUpSNumber('');
                setSignUpName('');
                setSignUpPassword('');
                setSignUpConfirmPassword('');
                // Switch to sign in
                switchTab('signin');
                // Pre-fill S-Number
                setSignInSNumber(signUpSNumber);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Sign up error:', error);
    } finally {
      setSignUpLoading(false);
    }
  };
  
  // Social login placeholder
  const handleSocialLogin = (provider) => {
    Alert.alert('Coming Soon', `${provider} login will be available soon!`);
  };
  
  // Forgot password handler
  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };
  
  const renderSignIn = () => (
    <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.socialButtonsContainer}>
          <Text style={styles.socialText}>Sign in with</Text>
          <View style={styles.socialButtons}>
            <TouchableOpacity 
              style={styles.socialBtn}
              onPress={() => handleSocialLogin('Google')}
            >
              <Ionicons name="logo-google" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.socialBtn}
              onPress={() => handleSocialLogin('Facebook')}
            >
              <Ionicons name="logo-facebook" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.socialBtn}
              onPress={() => handleSocialLogin('Apple')}
            >
              <Ionicons name="logo-apple" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or use your S-Number</Text>
          <View style={styles.dividerLine} />
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="S-Number"
              value={signInSNumber}
              onChangeText={setSignInSNumber}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!signInLoading}
            />
          </View>
          
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={signInPassword}
              onChangeText={setSignInPassword}
              secureTextEntry={!showSignInPassword}
              editable={!signInLoading}
            />
            <TouchableOpacity 
              onPress={() => setShowSignInPassword(!showSignInPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons 
                name={showSignInPassword ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity 
          onPress={handleForgotPassword}
          style={styles.forgotPasswordLink}
        >
          <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.primaryButton, signInLoading && styles.disabledButton]}
          onPress={handleSignIn}
          disabled={signInLoading}
        >
          {signInLoading ? (
            <ActivityIndicator color="#0d1b2a" size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
  
  const renderSignUp = () => (
    <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.socialButtonsContainer}>
          <Text style={styles.socialText}>Sign up with</Text>
          <View style={styles.socialButtons}>
            <TouchableOpacity 
              style={styles.socialBtn}
              onPress={() => handleSocialLogin('Google')}
            >
              <Ionicons name="logo-google" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.socialBtn}
              onPress={() => handleSocialLogin('Facebook')}
            >
              <Ionicons name="logo-facebook" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.socialBtn}
              onPress={() => handleSocialLogin('Apple')}
            >
              <Ionicons name="logo-apple" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or register with S-Number</Text>
          <View style={styles.dividerLine} />
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Ionicons name="card-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="S-Number (e.g., s150712)"
              value={signUpSNumber}
              onChangeText={setSignUpSNumber}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!signUpLoading}
            />
          </View>
          
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={signUpName}
              onChangeText={setSignUpName}
              editable={!signUpLoading}
            />
          </View>
          
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={signUpPassword}
              onChangeText={setSignUpPassword}
              secureTextEntry={!showSignUpPassword}
              editable={!signUpLoading}
            />
            <TouchableOpacity 
              onPress={() => setShowSignUpPassword(!showSignUpPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons 
                name={showSignUpPassword ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={signUpConfirmPassword}
              onChangeText={setSignUpConfirmPassword}
              secureTextEntry={!showSignUpPassword}
              editable={!signUpLoading}
            />
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.primaryButton, signUpLoading && styles.disabledButton]}
          onPress={handleSignUp}
          disabled={signUpLoading}
        >
          {signUpLoading ? (
            <ActivityIndicator color="#0d1b2a" size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>Sign Up</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>KC</Text>
            </View>
            <Text style={styles.appTitle}>Key Club</Text>
          </View>
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'signin' && styles.activeTab]}
              onPress={() => switchTab('signin')}
            >
              <Text style={[styles.tabText, activeTab === 'signin' && styles.activeTabText]}>
                Sign In
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'signup' && styles.activeTab]}
              onPress={() => switchTab('signup')}
            >
              <Text style={[styles.tabText, activeTab === 'signup' && styles.activeTabText]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
          
          {activeTab === 'signin' ? renderSignIn() : renderSignUp()}
        </View>
        
        {/* Demo Info */}
        <View style={styles.demoInfo}>
          <Text style={styles.demoTitle}>Demo Credentials:</Text>
          <Text style={styles.demoText}>S-Number: s150712 | Password: password</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  backButton: {
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 60,
    height: 60,
    backgroundColor: '#ffd60a',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0d1b2a',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 22,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#512da8',
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  socialButtonsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  socialText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  socialButtons: {
    flexDirection: 'row',
  },
  socialBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    backgroundColor: '#fff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    fontSize: 12,
    color: '#999',
    marginHorizontal: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 5,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#512da8',
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: '#ffd60a',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  primaryButtonText: {
    color: '#0d1b2a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  demoInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  demoTitle: {
    color: '#ffd60a',
    fontSize: 12,
    fontWeight: 'bold',
  },
  demoText: {
    color: '#fff',
    fontSize: 12,
  },
});