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
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

export default function AdminLoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);
  const { loginAsAdmin } = useAuth();
  
  // Animation values
  const keyAnim = useRef(new Animated.Value(0)).current;
  const lockAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  const handleAdminLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      console.log("Calling loginAsAdmin");
      const success = await loginAsAdmin(email, password);
      console.log("LoginAsAdmin result:", success);
      
      if (success) {
        // Show unlock animation
        setShowUnlockAnimation(true);
        
        // Animate key moving to lock
        Animated.sequence([
          Animated.timing(keyAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(lockAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: false,
          }),
          Animated.timing(successAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: false,
          })
        ]).start(() => {
          // Navigation handled by AuthContext
          console.log("Login successful - AppNavigator will handle navigation");
        });
      } else {
        Alert.alert('Login Failed', 'Invalid credentials or account creation failed');
      }
    } catch (error) {
      console.error("Admin login error:", error);
      Alert.alert('Login Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Unlock Animation Component
  const UnlockAnimation = () => (
    <View style={styles.animationContainer}>
      {/* Lock */}
      <Animated.View 
        style={[
          styles.lockContainer,
          {
            transform: [
              { scale: lockAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.2]
              }) },
              { rotate: lockAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg']
              }) }
            ]
          }
        ]}
      >
        <Ionicons name="lock-closed" size={60} color="#4299e1" />
      </Animated.View>
      
      {/* Key */}
      <Animated.View 
        style={[
          styles.keyContainer,
          {
            transform: [
              { translateX: keyAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-100, 0]
              }) },
              { scale: keyAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.5, 1.2, 1]
              }) }
            ]
          }
        ]}
      >
        <Ionicons name="key" size={50} color="#4299e1" />
      </Animated.View>
      
      {/* Success checkmark */}
      <Animated.View 
        style={[
          styles.successContainer,
          {
            opacity: successAnim,
            transform: [
              { scale: successAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1]
              }) }
            ]
          }
        ]}
      >
        <Ionicons name="checkmark-circle" size={80} color="#48bb78" />
      </Animated.View>
      
      <Animated.Text 
        style={[
          styles.successText,
          { opacity: successAnim }
        ]}
      >
        Access Granted!
      </Animated.Text>
    </View>
  );

  if (showUnlockAnimation) {
    return (
      <SafeAreaView style={styles.container}>
        <UnlockAnimation />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.loginCard}>
            <View style={styles.headerContainer}>
              <Ionicons name="shield-checkmark" size={80} color="#4299e1" />
              <Text style={styles.title}>Admin Login</Text>
              <Text style={styles.subtitle}>Access administrative controls</Text>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail" size={20} color="#4299e1" style={styles.inputIcon} />
                <TextInput
                  placeholder="admin@example.com"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed" size={20} color="#4299e1" style={styles.inputIcon} />
                <TextInput
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color="#4299e1" 
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.button, loading && styles.disabledButton]} 
              onPress={handleAdminLogin} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Access Admin Panel</Text>
                  <Ionicons name="arrow-forward" size={20} color="#ffffff" style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>
            
            <View style={styles.hintContainer}>
              <Ionicons name="information-circle" size={16} color="#cbd5e0" />
              <Text style={styles.hint}>
                Demo: admin@example.com / password
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  loginCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Subtle transparency
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(66, 153, 225, 0.2)',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4299e1', // Professional blue
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(66, 153, 225, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#e2e8f0', // Light gray
    textAlign: 'center',
    opacity: 0.9,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    color: '#4299e1', // Professional blue
    marginBottom: 6,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4299e1', // Professional blue
  },
  inputIcon: {
    marginLeft: 13,
    color: '#4299e1', // Professional blue
  },
  input: {
    flex: 1,
    paddingHorizontal: 13,
    paddingVertical: 13,
    fontSize: 16,
    color: '#2d3748', // Dark gray
  },
  eyeIcon: {
    padding: 13,
    color: '#4299e1', // Professional blue
  },
  button: {
    backgroundColor: '#4299e1', // Professional blue
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 10,
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
    fontSize: 17,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginLeft: 8,
    color: '#ffffff',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  hint: {
    fontSize: 13,
    color: '#cbd5e0', // Medium gray
    marginLeft: 5,
    textAlign: 'center',
  },
  // Animation styles
  animationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a365d', // Deep navy blue background
  },
  lockContainer: {
    marginBottom: 30,
  },
  keyContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -25,
    marginTop: -25,
  },
  successContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -40,
    marginTop: -40,
  },
  successText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#48bb78', // Green
    marginTop: 120,
    textAlign: 'center',
  },
});