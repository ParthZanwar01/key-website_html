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
import axios from 'axios';

// Google Sheets API endpoint
const GOOGLE_SHEET_API_ENDPOINT = 'https://api.sheetbest.com/sheets/25c69fca-a42a-4e8e-a5a7-0e0a7622f7f0';

export default function StudentVerificationScreen({ navigation }) {
  const [sNumber, setSNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerification = async () => {
    // Input validation
    if (!sNumber.trim()) {
      Alert.alert('Missing Information', 'Please enter your S-Number.');
      return;
    }

    if (!sNumber.toLowerCase().startsWith('s')) {
      Alert.alert('Invalid S-Number', 'Please enter a valid S-Number starting with "s" (e.g., s150712).');
      return;
    }

    setLoading(true);
    try {
      // Fetch student data from Google Sheets
      const response = await axios.get(`${GOOGLE_SHEET_API_ENDPOINT}`);
      const allStudents = response.data;
      
      // Look for the student by S-Number
      const studentInSheet = allStudents.find(s => 
        s.sNumber && s.sNumber.toLowerCase() === sNumber.toLowerCase()
      );
      
      if (!studentInSheet) {
        Alert.alert(
          'Not Found', 
          'Your S-Number was not found in our system. Please contact your Key Club sponsor to be added to the roster.'
        );
        setLoading(false);
        return;
      }
      
      // Check if student has already set up an account (has a password)
      if (studentInSheet.password) {
        Alert.alert(
          'Account Exists', 
          'An account with this S-Number already exists. Please go to the login page.',
          [
            { 
              text: 'Go to Login', 
              onPress: () => navigation.navigate('StudentLogin') 
            }
          ]
        );
      } else {
        // Student exists but doesn't have a password - proceed to account creation
        navigation.navigate('StudentAccountCreation', { 
          sNumber: sNumber,
          studentData: studentInSheet 
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert(
        'Connection Error',
        'Could not connect to the student database. Please check your internet connection and try again.'
      );
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
            
            <TouchableOpacity 
              style={[styles.button, loading && styles.disabledButton]} 
              onPress={handleVerification} 
              disabled={loading}
            >
              {loading ? (
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
  }
});