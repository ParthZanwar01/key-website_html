import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

export default function StudentLoginScreen({ navigation }) {
  const [sNumber, setSNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginAsStudent } = useAuth();
  
  // Login with S-Number/password (Google Sheets)
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.loginCard}>
            <Text style={styles.title}>Student Login</Text>
            <Text style={styles.subtitle}>Sign in with your S-Number</Text>
            
            {/* S-Number input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Student ID Number</Text>
              <TextInput
                placeholder="s123456"
                value={sNumber}
                onChangeText={setSNumber}
                style={styles.input}
                keyboardType="default"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            {/* Password input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
              />
            </View>
            
            {/* Login button */}
            <TouchableOpacity 
              style={[styles.button, loading && styles.disabledButton]} 
              onPress={handleLogin} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Log In</Text>
              )}
            </TouchableOpacity>
            
            {/* First-time login info */}
            <Text style={styles.infoText}>
              First time? Enter your S-Number and create a password. Your S-Number must be in our system to log in.
            </Text>
            
            {/* Help text */}
            <Text style={styles.helpText}>
              Need help? Contact your Key Club sponsor.
            </Text>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loginCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0d1b2a',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
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
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#fcd53f',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
  },
  buttonText: {
    color: '#0d1b2a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  helpText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  }
});