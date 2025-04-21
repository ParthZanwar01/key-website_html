import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export default function HomeScreen() {
return (
  <View style={styles.container}>
  <Image source={require('../assets/images/keyclublogo.png')} style={styles.logo} />
  <Text style={styles.title}>Welcome to Cypress Ranch Key Club</Text>
  <Text style={styles.subtitle}>
    I pledge on my honor{'\n'}
    To uphold the objects of Key Club International;{'\n'}
    To build my home, school and community;{'\n'}
    To serve my nation and God;{'\n'}
    And combat all forces which tend to undermine these institutions.
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
    marginBottom: 30,
    resizeMode: 'contain',
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