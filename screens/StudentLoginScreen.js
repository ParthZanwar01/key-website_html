import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function StudentLoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleStudentLogin = async () => {
    if (!email.endsWith('@stu.cfisd.net')) {
      Alert.alert('Invalid Email', 'Email must end with @stu.cfisd.net');
      return;
    }

    try {
      await login(email, password);
    } catch (e) {
      Alert.alert('Login Failed', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student Login</Text>
      <TextInput
        placeholder="Enter school email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Enter your password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      <TouchableOpacity style={styles.button} onPress={handleStudentLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#0d1b2a' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#ffd60a', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#fff', padding: 12, marginBottom: 15, borderRadius: 6 },
  button: { backgroundColor: '#ffd60a', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#0d1b2a', fontWeight: 'bold' },
});