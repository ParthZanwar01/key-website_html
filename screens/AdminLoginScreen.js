import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function AdminLoginScreen({ navigation }) {
  const [email, setEmail] = useState(''); // Remove pre-fill for production
  const [password, setPassword] = useState(''); // Remove pre-fill for production
  const [loading, setLoading] = useState(false);
  const { loginAsAdmin } = useAuth();

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
        // Don't manually navigate - let the AppNavigator handle this
        // The AppNavigator will automatically redirect based on authentication state
        console.log("Login successful - AppNavigator will handle navigation");
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Login</Text>
      <TextInput
        placeholder="Email"
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
        onPress={handleAdminLogin} 
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Logging in...' : 'Log In'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.hint}>
        Use admin@example.com / password
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