import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function StudentLoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginAsStudent, signInWithGoogle } = useAuth();

// Inside handleLogin function in StudentLoginScreen.js
const handleLogin = async () => {
  if (!email.endsWith('@stu.cfisd.net')) {
    Alert.alert('Invalid Email', 'Please use a @stu.cfisd.net email to log in.');
    return;
  }

  setLoading(true);
  try {
    const success = await loginAsStudent(email, password);
    
    if (success) {
      // Explicitly navigate to Main screen on success
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main', params: { screen: 'Home' } }],
      });
    } else {
      Alert.alert('Login Failed', 'Invalid credentials');
    }
  } catch (error) {
    console.error('Student login error:', error);
    Alert.alert('Error', 'An unexpected error occurred');
  } finally {
    setLoading(false);
  }
};

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const result = await signInWithGoogle();
      
      if (!result.success) {
        Alert.alert('Sign In Failed', result.error || 'Could not sign in with Google');
      }
      // Navigation will be handled by the AuthProvider's onAuthStateChanged listener
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student Login</Text>
      
      {/* Email/Password Login */}
      <TextInput
        placeholder="Your school email address (@stu.cfisd.net)"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />
      <TouchableOpacity 
        style={[styles.button, loading && styles.disabledButton]} 
        onPress={handleLogin} 
        disabled={loading}
      >
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>
      
      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>
      
      {/* Google Sign-In Button */}
      <TouchableOpacity 
        style={styles.googleButton} 
        onPress={handleGoogleSignIn}
        disabled={loading}
      >
        <Text style={styles.googleButtonText}>Sign in with Google</Text>
      </TouchableOpacity>
      
      <Text style={styles.hint}>
        Use your @stu.cfisd.net school account
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#add8e6',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#fcd53f',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 10,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666',
  },
  googleButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  googleButtonText: {
    fontWeight: 'bold',
    color: '#757575',
    marginLeft: 10,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    fontWeight: 'bold',
  },
  hint: {
    fontSize: 12,
    marginTop: 10,
  },
 });
 
 