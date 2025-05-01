import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

export default function LandingScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/images/keyclublogo.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
      
      <Text style={styles.title}>Cypress Ranch Key Club</Text>
      <Text style={styles.subtitle}>Track events, hours, and stay connected</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('StudentVerification')}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('StudentLogin')}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.adminButton]}
          onPress={() => navigation.navigate('AdminLogin')}
        >
          <Text style={styles.buttonText}>Admin Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#0d1b2a',
    padding: 20
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 20
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#ffd60a', 
    marginBottom: 10,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 40,
    textAlign: 'center'
  },
  buttonContainer: {
    width: '80%',
    alignItems: 'center'
  },
  button: { 
    backgroundColor: '#ffd60a', 
    padding: 15, 
    borderRadius: 8, 
    marginVertical: 10, 
    width: '100%', 
    alignItems: 'center' 
  },
  adminButton: {
    backgroundColor: 'rgba(255, 214, 10, 0.6)',
    marginTop: 30
  },
  buttonText: { 
    color: '#0d1b2a', 
    fontSize: 16, 
    fontWeight: 'bold' 
  }
});