// screens/StudentVerificationScreen.js - Updated for Supabase
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SupabaseService from '../services/SupabaseService';

export default function StudentVerificationScreen({ navigation }) {
  const [sNumber, setSNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleVerification = async () => {
    // Reset state
    setErrorMessage('');
    setIsSuccess(false);
    
    // Input validation
    if (!sNumber.trim()) {
      setErrorMessage('Please enter your S-Number.');
      return;
    }

    if (!sNumber.toLowerCase().startsWith('s')) {
      setErrorMessage('Please enter a valid S-Number starting with "s" (e.g., s150712).');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Verifying S-Number:', sNumber);

      // Check if student exists in Supabase
      const student = await SupabaseService.getStudent(sNumber);
      
      if (!student) {
        setErrorMessage('Your S-Number was not found in our system. Please contact your Key Club sponsor to be added to the roster.');
        setLoading(false);
        return;
      }

      console.log('✅ Found student:', student);

      // Check if they already have an auth account
      const authUser = await SupabaseService.getAuthUser(sNumber);
      
      if (authUser) {
        // Already has account - redirect to login
        setIsSuccess(true);
        setErrorMessage('An account with this S-Number already exists. Redirecting to login...');
        setTimeout(() => {
          navigation.navigate('StudentLogin');
        }, 2000);
      } else {
        // No account yet - proceed to account creation
        console.log('👤 Student exists but no auth account - proceeding to registration');
        navigation.navigate('StudentAccountCreation', { 
          sNumber: sNumber,
          studentData: student
        });
      }
    } catch (error) {
      console.error('❌ Verification error:', error);
      setErrorMessage('Could not connect to the database. Please check your internet connection and try again.');
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
          <View style={styles.card}>
            <Text style={styles.title}>Student Verification</Text>
            <Text style={styles.subtitle}>Enter your S-Number to get started</Text>
            
            {errorMessage ? (
              <View style={[styles.messageContainer, isSuccess === true ? styles.successMessage : styles.errorMessage]}>
                <Text style={styles.messageText}>{errorMessage}</Text>
              </View>
            ) : null}
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Student ID Number</Text>
              <TextInput
                placeholder="s150712"
                value={sNumber}
                onChangeText={setSNumber}
                style={styles.input}
                keyboardType="default"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.button, loading === true && styles.disabledButton]} 
              onPress={handleVerification} 
              disabled={loading === true}
            >
              {loading === true ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Verify</Text>
              )}
            </TouchableOpacity>
            
            <Text style={styles.infoText}>
              Your S-Number must be in our system to create an account. If you're not in the system yet, please contact your Key Club sponsor.
            </Text>
            
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => navigation.navigate('StudentLogin')}
            >
              <Text style={styles.linkText}>Already have an account? Log in</Text>
            </TouchableOpacity>

            {/* Debug info for testing */}
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}>🧪 For Testing:</Text>
              <Text style={styles.debugText}>Try: s150712</Text>
              <Text style={styles.debugText}>If it says "account exists", go to Login</Text>
              <Text style={styles.debugText}>If it takes you to registration, complete setup</Text>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
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
  messageContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorMessage: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  successMessage: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  messageText: {
    fontSize: 14,
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
  linkButton: {
    padding: 8,
    alignItems: 'center',
  },
  linkText: {
    color: '#59a2f0',
    fontSize: 14,
    fontWeight: '500',
  },
  debugContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddeeff',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
});