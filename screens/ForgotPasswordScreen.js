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
import { Ionicons } from '@expo/vector-icons';
import SupabaseService from '../services/SupabaseService';
import ConfirmationDialog from '../components/ConfirmationDialog';

export default function ForgotPasswordScreen({ navigation }) {
  const [sNumber, setSNumber] = useState('');
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('verify'); // 'verify', 'reset'
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Dialog states
  const [successDialog, setSuccessDialog] = useState({
    visible: false,
    title: '',
    message: ''
  });
  
  const [errorDialog, setErrorDialog] = useState({
    visible: false,
    message: ''
  });

  // Step 1: Verify S-Number and Name
  const handleVerifyCredentials = async () => {
    if (!sNumber.trim() || !name.trim()) {
      setErrorDialog({
        visible: true,
        message: 'Please enter both your S-Number and name.'
      });
      return;
    }

    if (!sNumber.toLowerCase().startsWith('s')) {
      setErrorDialog({
        visible: true,
        message: 'Please enter a valid S-Number starting with "s" (e.g., s150712).'
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Verifying credentials for:', sNumber);
      
      // Check if student exists and verify name
      const student = await SupabaseService.getStudent(sNumber);
      if (!student) {
        setErrorDialog({
          visible: true,
          message: 'S-Number not found in our system. Please check your S-Number or contact your Key Club sponsor.'
        });
        setLoading(false);
        return;
      }

      // Check if they have an account
      const authUser = await SupabaseService.getAuthUser(sNumber);
      if (!authUser) {
        setErrorDialog({
          visible: true,
          message: 'No account found for this S-Number. Please use the registration process to create an account first.'
        });
        setLoading(false);
        return;
      }

      // Verify name matches (case-insensitive)
      const storedName = student.name.toLowerCase().trim();
      const enteredName = name.toLowerCase().trim();
      
      if (storedName !== enteredName) {
        setErrorDialog({
          visible: true,
          message: 'The name you entered does not match our records. Please check your spelling and try again.'
        });
        setLoading(false);
        return;
      }

      // Verification successful
      setStep('reset');
      setSuccessDialog({
        visible: true,
        title: 'Identity Verified',
        message: `Welcome ${student.name}! You can now set a new password for your account.`
      });
      
    } catch (error) {
      console.error('Verification error:', error);
      setErrorDialog({
        visible: true,
        message: error.message || 'Failed to verify your information. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Set new password
  const handleResetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setErrorDialog({
        visible: true,
        message: 'Please fill in both password fields.'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorDialog({
        visible: true,
        message: 'Passwords do not match. Please try again.'
      });
      return;
    }

    if (newPassword.length < 6) {
      setErrorDialog({
        visible: true,
        message: 'Password must be at least 6 characters long.'
      });
      return;
    }

    setLoading(true);
    try {
      await SupabaseService.resetStudentPassword(sNumber, newPassword);
      
      setSuccessDialog({
        visible: true,
        title: 'Password Reset Complete',
        message: 'Your password has been successfully reset! You can now log in with your new password.'
      });
      
      // Navigate to login after success
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Landing' }, { name: 'StudentLogin' }],
        });
      }, 2500);
      
    } catch (error) {
      console.error('Password reset error:', error);
      setErrorDialog({
        visible: true,
        message: error.message || 'Failed to reset password. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderVerifyStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Ionicons name="shield-checkmark-outline" size={80} color="#59a2f0" />
        <Text style={styles.stepTitle}>Verify Your Identity</Text>
        <Text style={styles.stepDescription}>
          Enter your S-Number and full name exactly as they appear in our system.
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Student ID Number</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="card" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={sNumber}
            onChangeText={setSNumber}
            placeholder="s123456"
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Full Name</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="person" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            autoCapitalize="words"
            editable={!loading}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.disabledButton]}
        onPress={handleVerifyCredentials}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Text style={styles.primaryButtonText}>Verify Identity</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
          </>
        )}
      </TouchableOpacity>

      <View style={styles.helpContainer}>
        <Ionicons name="information-circle" size={20} color="#59a2f0" />
        <Text style={styles.helpText}>
          Your name must match exactly as it appears in our Key Club roster.
        </Text>
      </View>
    </View>
  );

  const renderResetStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Ionicons name="lock-closed" size={80} color="#27ae60" />
        <Text style={styles.stepTitle}>Create New Password</Text>
        <Text style={styles.stepDescription}>
          Choose a strong password that you'll remember.
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>New Password</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            secureTextEntry={!showNewPassword}
            editable={!loading}
          />
          <TouchableOpacity 
            onPress={() => setShowNewPassword(!showNewPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons 
              name={showNewPassword ? "eye-off" : "eye"} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Confirm New Password</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            secureTextEntry={!showConfirmPassword}
            editable={!loading}
          />
          <TouchableOpacity 
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons 
              name={showConfirmPassword ? "eye-off" : "eye"} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.disabledButton]}
        onPress={handleResetPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Text style={styles.primaryButtonText}>Reset Password</Text>
            <Ionicons name="checkmark" size={20} color="#fff" style={styles.buttonIcon} />
          </>
        )}
      </TouchableOpacity>

      <View style={styles.passwordRequirements}>
        <Text style={styles.requirementsTitle}>Password Requirements:</Text>
        <View style={styles.requirementItem}>
          <Ionicons 
            name={newPassword.length >= 6 ? "checkmark-circle" : "ellipse-outline"} 
            size={16} 
            color={newPassword.length >= 6 ? "#27ae60" : "#ccc"} 
          />
          <Text style={[styles.requirementText, newPassword.length >= 6 && styles.requirementMet]}>
            At least 6 characters long
          </Text>
        </View>
        <View style={styles.requirementItem}>
          <Ionicons 
            name={newPassword === confirmPassword && newPassword.length > 0 ? "checkmark-circle" : "ellipse-outline"} 
            size={16} 
            color={newPassword === confirmPassword && newPassword.length > 0 ? "#27ae60" : "#ccc"} 
          />
          <Text style={[styles.requirementText, newPassword === confirmPassword && newPassword.length > 0 && styles.requirementMet]}>
            Passwords match
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setStep('verify')}
        disabled={loading}
      >
        <Ionicons name="arrow-back" size={16} color="#59a2f0" />
        <Text style={styles.backButtonText}>Back to Verification</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={styles.stepIndicatorContainer}>
        <View style={[styles.stepDot, step === 'verify' ? styles.activeStepDot : styles.completedStepDot]}>
          <Text style={styles.stepDotText}>1</Text>
        </View>
        <View style={[styles.stepLine, step === 'reset' && styles.completedStepLine]} />
        <View style={[styles.stepDot, step === 'reset' ? styles.activeStepDot : styles.inactiveStepDot]}>
          <Text style={styles.stepDotText}>2</Text>
        </View>
      </View>
      
      <View style={styles.stepLabels}>
        <Text style={[styles.stepLabel, step === 'verify' && styles.activeStepLabel]}>Verify</Text>
        <Text style={[styles.stepLabel, step === 'reset' && styles.activeStepLabel]}>Reset</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Reset Password</Text>
          </View>

          <View style={styles.card}>
            {renderStepIndicator()}
            
            {step === 'verify' && renderVerifyStep()}
            {step === 'reset' && renderResetStep()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Dialog */}
      <ConfirmationDialog
        visible={successDialog.visible}
        title={successDialog.title}
        message={successDialog.message}
        onCancel={() => setSuccessDialog({ visible: false, title: '', message: '' })}
        onConfirm={() => setSuccessDialog({ visible: false, title: '', message: '' })}
        cancelText=""
        confirmText="OK"
        icon="checkmark-circle"
        iconColor="#4CAF50"
      />

      {/* Error Dialog */}
      <ConfirmationDialog
        visible={errorDialog.visible}
        title="Error"
        message={errorDialog.message}
        onCancel={() => setErrorDialog({ visible: false, message: '' })}
        onConfirm={() => setErrorDialog({ visible: false, message: '' })}
        cancelText=""
        confirmText="OK"
        icon="alert-circle"
        iconColor="#ff4d4d"
      />
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  card: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flex: 1,
    padding: 24,
  },
  stepIndicator: {
    marginBottom: 30,
    alignItems: 'center',
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStepDot: {
    backgroundColor: '#59a2f0',
  },
  completedStepDot: {
    backgroundColor: '#27ae60',
  },
  inactiveStepDot: {
    backgroundColor: '#e0e0e0',
  },
  stepDotText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepLine: {
    width: 80,
    height: 2,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 10,
  },
  completedStepLine: {
    backgroundColor: '#27ae60',
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 140,
  },
  stepLabel: {
    fontSize: 12,
    color: '#666',
  },
  activeStepLabel: {
    color: '#59a2f0',
    fontWeight: 'bold',
  },
  stepContainer: {
    flex: 1,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0d1b2a',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
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
  primaryButton: {
    backgroundColor: '#59a2f0',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 15,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  helpContainer: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#59a2f0',
  },
  helpText: {
    fontSize: 14,
    color: '#1976d2',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  passwordRequirements: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 15,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  requirementText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
  },
  requirementMet: {
    color: '#27ae60',
    fontWeight: '500',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#59a2f0',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
});