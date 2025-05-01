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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';

// Google Sheets API endpoint
const GOOGLE_SHEET_API_ENDPOINT = 'https://api.sheetbest.com/sheets/25c69fca-a42a-4e8e-a5a7-0e0a7622f7f0';

export default function StudentAccountCreationScreen({ route, navigation }) {
  const { sNumber, studentData } = route.params;
  const { loginAsStudent } = useAuth();
  
  const [name, setName] = useState(studentData.name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateAccount = async () => {
    // Input validation
    if (!name.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Missing Information', 'Please fill out all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please try again.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password should be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      // Find the student index in Google Sheets
      const response = await axios.get(`${GOOGLE_SHEET_API_ENDPOINT}`);
      const allStudents = response.data;
      
      const rowIndex = allStudents.findIndex(s => 
        s.sNumber && s.sNumber.toLowerCase() === sNumber.toLowerCase()
      );
      
      if (rowIndex === -1) {
        Alert.alert('Error', 'Student record not found.');
        setLoading(false);
        return;
      }
      
      // Update the student entry with name, password, and first login timestamp
      await axios.patch(`${GOOGLE_SHEET_API_ENDPOINT}/${rowIndex}`, {
        name: name,
        password: password,
        lastLogin: new Date().toISOString()
      });
      
      // Proceed to login with the newly created account
      const success = await loginAsStudent(sNumber, password);
      
      if (success) {
        Alert.alert(
          'Account Created', 
          'Your account has been successfully created!',
          [
            { 
              text: 'OK', 
              onPress: () => {
                // Reset to main screen
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Main', params: { screen: 'Home' } }],
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Login Failed', 'Account created but could not log in automatically. Please try logging in manually.');
      }
    } catch (error) {
      console.error('Account creation error:', error);
      Alert.alert(
        'Error',
        'Could not create your account. Please try again later.'
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
            <Text style={styles.title}>Create Your Account</Text>
            <Text style={styles.subtitle}>Complete your Key Club account setup</Text>
            
            <View style={styles.sNumberDisplay}>
              <Text style={styles.sNumberLabel}>Student ID:</Text>
              <Text style={styles.sNumberValue}>{sNumber}</Text>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Your Name</Text>
              <TextInput
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                style={styles.input}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Create Password</Text>
              <TextInput
                placeholder="Choose a password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                placeholder="Enter password again"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.input}
                secureTextEntry
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.button, loading && styles.disabledButton]} 
              onPress={handleCreateAccount} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
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
  sNumberDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddeeff',
  },
  sNumberLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginRight: 8,
  },
  sNumberValue: {
    fontSize: 16,
    color: '#0d1b2a',
    fontWeight: '500',
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
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  }
});