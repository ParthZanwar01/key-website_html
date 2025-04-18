import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';

export default function AdminLoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAdminLogin = () => {
    if (email === 'admin@example.com' && password === 'password') {
      navigation.replace('Main');
    } else {
      Alert.alert('Error', 'Invalid admin credentials');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Login</Text>
      <TextInput style={styles.input} placeholder="Email" onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry onChangeText={setPassword} />
      <TouchableOpacity style={styles.button} onPress={handleAdminLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>
      <Text style={styles.demoText}>Demo credentials: admin@example.com / password</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#b3e5fc' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { width: '100%', padding: 12, marginBottom: 12, backgroundColor: '#fff', borderRadius: 6 },
  button: { backgroundColor: '#fdd835', padding: 12, borderRadius: 6, width: '100%' },
  buttonText: { textAlign: 'center', fontWeight: 'bold' },
  demoText: { marginTop: 12, fontSize: 12, color: '#555' }
});
