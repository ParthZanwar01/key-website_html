import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function LandingScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cypress Ranch Key Club</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('AdminLoginScreen')}
      >
        <Text style={styles.buttonText}>Admin Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('StudentLogin')}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d1b2a' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#ffd60a', marginBottom: 40 },
  button: { backgroundColor: '#ffd60a', padding: 15, borderRadius: 8, marginVertical: 10, width: '60%', alignItems: 'center' },
  buttonText: { color: '#0d1b2a', fontSize: 16, fontWeight: 'bold' }
});