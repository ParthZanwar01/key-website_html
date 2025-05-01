import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function HomeScreen() {
  const { user } = useAuth();
  
  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/keyclublogo.png')} style={styles.logo} />
      <Text style={styles.welcome}>Welcome, {user?.name || user?.sNumber || 'Member'}</Text>
      <Text style={styles.title}>Cypress Ranch Key Club</Text>
      <Text style={styles.subtitle}>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1b2a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  welcome: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffd60a',
    textAlign: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
});