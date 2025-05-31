import React, { useState, useEffect } from 'react';
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
import axios from 'axios';

// Google Sheets API endpoint
const GOOGLE_SHEET_API_ENDPOINT = 'https://api.sheetbest.com/sheets/216a1c49-0ea0-48d4-be6d-d9245fd7896e';

export default function StudentAccountCreationScreen(props) {
  const { route, navigation } = props;
  const params = route?.params || {};
  const sNumber = params.sNumber || '';
  const studentData = params.studentData || {};
  
  const [name, setName] = useState(studentData.name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [redirectTimer, setRedirectTimer] = useState(null);

  // Check if we have valid data
  useEffect(() => {
    if (!sNumber) {
      setErrorMessage('Missing student information. Please try the verification process again.');
      const timer = setTimeout(() => {
        navigation.navigate('StudentVerification');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [sNumber, navigation]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [redirectTimer]);

  const handleCreateAccount = async (event) => {
    // Prevent any default form submission behavior
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    
    // Reset state
    setErrorMessage('');
    setSuccessMessage('');
    
    // Input validation
    if (!name.trim() || !password.trim() || !confirmPassword.trim()) {
      setErrorMessage('Please fill out all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please try again.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password should be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      console.log('Creating account for:', sNumber);
      
      // Find the student index in Google Sheets
      const response = await axios.get(`${GOOGLE_SHEET_API_ENDPOINT}`);
      const allStudents = response.data;
      
      console.log('Found students:', allStudents.length);
      
      const rowIndex = allStudents.findIndex(s => 
        s.sNumber && s.sNumber.toLowerCase() === sNumber.toLowerCase()
      );
      
      if (rowIndex === -1) {
        setErrorMessage('Student record not found.');
        setLoading(false);
        return;
      }
      
      console.log('Updating student at index:', rowIndex);
      
      // Update with ALL required headers - consistent with sheet structure
      const updateData = {
        sNumber: sNumber, // Keep existing sNumber
        name: name.trim(),
        password: password,
        totalHours: '0',
        lastLogin: new Date().toISOString(),
        lastHourUpdate: new Date().toISOString(),
        accountCreated: new Date().toISOString(),
        id: allStudents[rowIndex].id || Date.now().toString()
      };
      
      console.log('Account creation - updating with data:', updateData);
      
      const updateResponse = await axios.patch(`${GOOGLE_SHEET_API_ENDPOINT}/${rowIndex}`, updateData);
      
      console.log('Account creation successful, response:', updateResponse.status);
      
      // Display success message
      setSuccessMessage('Your account has been successfully created! Redirecting you to the login page...');
      
      // Set a timer to redirect to login
      const timer = setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [
            { name: 'Landing' },
            { name: 'StudentLogin' }
          ],
        });
      }, 3000);
      
      setRedirectTimer(timer);
      
    } catch (error) {
      console.error('Account creation error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setErrorMessage('Could not create your account. Please try again later.');
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
            
            {errorMessage ? (
              <View style={[styles.messageContainer, styles.errorMessage]}>
                <Text style={styles.messageText}>{errorMessage}</Text>
              </View>
            ) : null}
            
            {successMessage ? (
              <View style={[styles.messageContainer, styles.successMessage]}>
                <Text style={styles.messageText}>{successMessage}</Text>
              </View>
            ) : null}
            
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
                editable={!loading && !successMessage}
                autoComplete="off"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => {
                  // Focus next field or do nothing to prevent submission
                }}
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
                editable={!loading && !successMessage}
                autoComplete="new-password"
                autoCorrect={false}
                textContentType="newPassword"
                passwordRules="minlength: 6;"
                returnKeyType="next"
                onSubmitEditing={() => {
                  // Focus next field or do nothing to prevent submission
                }}
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
                editable={!loading && !successMessage}
                autoComplete="new-password"
                autoCorrect={false}
                textContentType="newPassword"
                returnKeyType="done"
                onSubmitEditing={(event) => {
                  // Prevent automatic submission on Enter
                  if (event && event.preventDefault) {
                    event.preventDefault();
                  }
                }}
              />
            </View>
            
            {!successMessage && (
              <>
                <TouchableOpacity 
                  style={[styles.button, (loading || Boolean(successMessage)) && styles.disabledButton]} 
                  onPress={(event) => {
                    event.preventDefault();
                    handleCreateAccount(event);
                  }} 
                  disabled={loading || Boolean(successMessage)}
                  activeOpacity={0.8}
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
                  disabled={loading || Boolean(successMessage)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
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