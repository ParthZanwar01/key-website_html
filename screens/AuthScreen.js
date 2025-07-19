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

export default function AuthScreen({ navigation }) {
  const { loginAsStudent, registerStudent } = useAuth();
  const [isSignUpActive, setIsSignUpActive] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  // Sign In State
  const [signInSNumber, setSignInSNumber] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);
  
  // Sign Up State
  const [signUpSNumber, setSignUpSNumber] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpLoading, setSignUpLoading] = useState(false);
  
  // Toggle between sign in and sign up
  const toggleAuthMode = () => {
    const toValue = isSignUpActive ? 0 : 1;
    
    Animated.timing(slideAnim, {
      toValue,
      duration: 600,
      useNativeDriver: true,
    }).start();
    
    setIsSignUpActive(!isSignUpActive);
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
      const student = await SupabaseService.getStudent(signUpSNumber);
      
      if (!student) {
        Alert.alert('Not Found', 'Your S-Number was not found in our system. Please contact your Key Club sponsor.');
        setSignUpLoading(false);
        return;
      }
      
      const authUser = await SupabaseService.getAuthUser(signUpSNumber);
      
      if (authUser) {
        Alert.alert('Account Exists', 'An account already exists. Please sign in.');
        setSignUpLoading(false);
        toggleAuthMode();
        return;
      }
      
      const success = await registerStudent(signUpSNumber.toLowerCase(), signUpPassword, signUpName);
      
      if (success) {
        Alert.alert('Success', 'Account created successfully!', [
          {
            text: 'OK',
            onPress: () => {
              setSignUpSNumber('');
              setSignUpName('');
              setSignUpPassword('');
              setSignUpConfirmPassword('');
              toggleAuthMode();
              setSignInSNumber(signUpSNumber);
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Sign up error:', error);
    } finally {
      setSignUpLoading(false);
    }
  };
  
  // Animation interpolations
  const signInOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0]
  });
  
  const signUpOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });
  
  const overlayTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -384] // Half of container width (768/2)
  });
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.authContainer}>
            {/* Forms Container */}
            <View style={styles.formsContainer}>
              {/* Sign In Panel */}
              <Animated.View 
                style={[
                  styles.formPanel,
                  styles.signinPanel,
                  { opacity: signInOpacity }
                ]}
                pointerEvents={isSignUpActive ? 'none' : 'auto'}
              >
                <View style={styles.keyClubLogoContainer}>
                  <Image 
                    source={require('../assets/images/keyclublogo.png')} 
                    style={styles.keyClubLogo}
                    resizeMode="contain"
                  />
                </View>
                
                <Text style={styles.formTitle}>Sign In</Text>
                <Text style={styles.formSubtitle}>Use your S-Number to access your account</Text>
                
                <Text style={styles.orText}>Enter your credentials</Text>
                
                <View style={styles.inputGroup}>
                  <Ionicons name="person" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="S-Number"
                    value={signInSNumber}
                    onChangeText={setSignInSNumber}
                    autoCapitalize="none"
                    editable={!signInLoading}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={signInPassword}
                    onChangeText={setSignInPassword}
                    secureTextEntry
                    editable={!signInLoading}
                  />
                </View>
                
                <TouchableOpacity 
                  onPress={() => navigation.navigate('ForgotPassword')}
                  style={styles.forgotLink}
                >
                  <Text style={styles.forgotLinkText}>Forgot Your Password?</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.btn, signInLoading && styles.disabledBtn]}
                  onPress={handleSignIn}
                  disabled={signInLoading}
                >
                  {signInLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.btnText}>SIGN IN</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
              
              {/* Sign Up Panel */}
              <Animated.View 
                style={[
                  styles.formPanel,
                  styles.signupPanel,
                  isSignUpActive && styles.signupPanelActive,
                  { opacity: signUpOpacity }
                ]}
                pointerEvents={isSignUpActive ? 'auto' : 'none'}
              >
                <View style={styles.keyClubLogoContainer}>
                  <Image 
                    source={require('../assets/images/keyclublogo.png')} 
                    style={styles.keyClubLogo}
                    resizeMode="contain"
                  />
                </View>
                
                <Text style={styles.formTitle}>Create Account</Text>
                <Text style={styles.formSubtitle}>Register with your personal details to join Key Club</Text>
                
                <Text style={styles.orText}>Use your S-Number for registration</Text>
                
                <View style={styles.inputGroup}>
                  <Ionicons name="card" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="S-Number (e.g., s150712)"
                    value={signUpSNumber}
                    onChangeText={setSignUpSNumber}
                    autoCapitalize="none"
                    editable={!signUpLoading}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Ionicons name="person" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    value={signUpName}
                    onChangeText={setSignUpName}
                    editable={!signUpLoading}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={signUpPassword}
                    onChangeText={setSignUpPassword}
                    secureTextEntry
                    editable={!signUpLoading}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    value={signUpConfirmPassword}
                    onChangeText={setSignUpConfirmPassword}
                    secureTextEntry
                    editable={!signUpLoading}
                  />
                </View>
                
                <TouchableOpacity
                  style={[styles.btn, signUpLoading && styles.disabledBtn]}
                  onPress={handleSignUp}
                  disabled={signUpLoading}
                >
                  {signUpLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.btnText}>SIGN UP</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
            
            {/* Overlay Container */}
            <Animated.View 
              style={[
                styles.overlayContainer,
                { transform: [{ translateX: overlayTranslateX }] }
              ]}
            >
              <View style={styles.overlay}>
                {/* Right Overlay Panel - Shows when Sign In is active */}
                <View style={[styles.overlayPanel, styles.overlayRight]}>
                  <Text style={styles.overlayTitle}>New to Key Club?</Text>
                  <Text style={styles.overlayText}>
                    Create an account to track your volunteer hours and participate in events
                  </Text>
                  <TouchableOpacity 
                    style={styles.ghostBtn}
                    onPress={toggleAuthMode}
                  >
                    <Text style={styles.ghostBtnText}>SIGN UP</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Left Overlay Panel - Shows when Sign Up is active */}
                <View style={[styles.overlayPanel, styles.overlayLeft]}>
                  <Text style={styles.overlayTitle}>Already a Member?</Text>
                  <Text style={styles.overlayText}>
                    Welcome back! Sign in to access your account and continue tracking your progress
                  </Text>
                  <TouchableOpacity 
                    style={styles.ghostBtn}
                    onPress={toggleAuthMode}
                  >
                    <Text style={styles.ghostBtnText}>SIGN IN</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </View>
          
          {/* Demo Info */}
          <View style={styles.demoInfo}>
            <Text style={styles.demoInfoTitle}>Demo Credentials:</Text>
            <Text style={styles.demoInfoText}>S-Number: s150712</Text>
            <Text style={styles.demoInfoText}>Password: password</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
    backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: screenHeight,
  },
  authContainer: {
    backgroundColor: '#fff',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.35,
    shadowRadius: 35,
    elevation: 15,
    position: 'relative',
    overflow: 'hidden',
    width: Math.min(768, screenWidth - 40),
    height: 580,
    maxWidth: 768,
  },
  formsContainer: {
    position: 'absolute',
    top: 0,
    height: '100%',
    width: '100%',
    flexDirection: 'row',
  },
  formPanel: {
    position: 'absolute',
    top: 0,
    height: '100%',
    width: '50%',
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signinPanel: {
    left: 0,
    zIndex: 2,
  },
  signupPanel: {
    left: 0,
    zIndex: 1,
  },
  signupPanelActive: {
    transform: [{ translateX: 384 }], // Half of container width
    zIndex: 2,
  },
  keyClubLogoContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  keyClubLogo: {
    width: 80,
    height: 80,
  },
  formTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  orText: {
    fontSize: 12,
    color: '#999',
    marginVertical: 10,
  },
  inputGroup: {
    position: 'relative',
    width: '100%',
    marginVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
  },
  forgotLink: {
    marginVertical: 15,
  },
  forgotLinkText: {
    color: '#666',
    fontSize: 12,
  },
  btn: {
    backgroundColor: '#512da8',
    paddingVertical: 12,
    paddingHorizontal: 45,
    borderRadius: 20,
    marginTop: 10,
  },
  disabledBtn: {
    backgroundColor: '#ccc',
  },
  btnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: '50%',
    height: '100%',
    overflow: 'hidden',
    zIndex: 100,
  },
  overlay: {
    backgroundColor: '#667eea',
    backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    position: 'relative',
    left: '-100%',
    height: '100%',
    width: '200%',
    flexDirection: 'row',
  },
  overlayPanel: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    textAlign: 'center',
    top: 0,
    height: '100%',
    width: '50%',
  },
  overlayRight: {
    right: 0,
  },
  overlayLeft: {
    left: 0,
  },
  overlayTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  overlayText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 30,
    lineHeight: 20,
    opacity: 0.9,
    textAlign: 'center',
  },
  ghostBtn: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 45,
    borderRadius: 20,
  },
  ghostBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  demoInfo: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 15,
    borderRadius: 10,
    zIndex: 1000,
  },
  demoInfoTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  demoInfoText: {
    color: '#fff',
    fontSize: 12,
  },
});