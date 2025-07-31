import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function StudentLoginScreen({ navigation }) {
  const [sNumber, setSNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { loginAsStudent } = useAuth();
  
  // Login with S-Number/password
  const handleLogin = async () => {
    // Input validation
    if (!sNumber.trim() || !password.trim()) {
      Alert.alert('Missing Information', 'Please enter both S-Number and password.');
      return;
    }

    if (!sNumber.startsWith('s')) {
      Alert.alert('Invalid S-Number', 'Please enter a valid S-Number starting with "s" (e.g., s150712).');
      return;
    }

    setLoading(true);
    try {
      const success = await loginAsStudent(sNumber.toLowerCase(), password);
      
      if (success) {
        // Don't manually navigate - let the AppNavigator handle this
        // The AppNavigator will automatically redirect based on authentication state
        console.log("Student login successful - AppNavigator will handle navigation");
      }
      // If not successful, the AuthContext will display appropriate alerts
    } catch (error) {
      console.error('Student login error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <SafeAreaView style={styles.container}> 
      <View style={styles.keyboardAvoid}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.loginCard}>
            <View style={styles.headerContainer}>
              <Ionicons name="person-circle" size={80} color="#59a2f0" />
              <Text style={styles.title}>Student Login</Text>
              <Text style={styles.subtitle}>Sign in with your S-Number</Text>
            </View>
            
            {/* S-Number input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Student ID Number</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="card" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  placeholder="s123456"
                  value={sNumber}
                  onChangeText={setSNumber}
                  style={styles.input}
                  keyboardType="default"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>
            
            {/* Password input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
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
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Forgot password link */}
            <TouchableOpacity 
              style={styles.forgotPasswordContainer}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
            </TouchableOpacity>
            
            {/* Login button */}
            <TouchableOpacity 
              style={[styles.button, loading && styles.disabledButton]} 
              onPress={handleLogin} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Log In</Text>
                  <Ionicons name="arrow-forward" size={20} color="#0d1b2a" style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>
            
            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>
            
            {/* Sign up link */}
            <TouchableOpacity 
              style={styles.signupButton}
              onPress={() => navigation.navigate('StudentVerification')}
              disabled={loading}
            >
              <Text style={styles.signupButtonText}>Don't have an account? Sign Up</Text>
            </TouchableOpacity>
            
            {/* Help text */}
            <View style={styles.helpContainer}>
              <Ionicons name="information-circle" size={16} color="#666" />
              <Text style={styles.helpText}>
                Need help? Contact your Key Club sponsor.
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
    backgroundColor: '#add8e6',
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
    padding: 20,
  },
  loginCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0d1b2a',
    marginTop: 15,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputIcon: {
    marginLeft: 15,
  },
  input: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 15,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 25,
  },
  forgotPasswordText: {
    color: '#59a2f0',
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#fcd53f',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
  },
  buttonText: {
    color: '#0d1b2a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginLeft: 8,
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
    color: '#666',
    fontSize: 14,
    marginHorizontal: 15,
  },
  signupButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#59a2f0',
    borderRadius: 8,
    marginBottom: 20,
  },
  signupButtonText: {
    color: '#59a2f0',
    fontSize: 16,
    fontWeight: '500',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
    textAlign: 'center',
  },
});
            