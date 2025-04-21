import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';

export default function ContactScreen() {
  const handleContactPress = () => {
    Linking.openURL('https://forms.gle/fvSSchptcLwB9uYy6'); // Replace this with your actual Google Form link
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🗒️ Have a question, suggestion, or issue? Fill out this contact form and an officer will get back to you soon!</Text>
      <TouchableOpacity onPress={handleContactPress} style={styles.button}>
        <Text style={styles.buttonText}>Key Club Contact Form</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1b2a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#ffc43b',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#0d1b2a',
    fontSize: 16,
    fontWeight: 'bold',
  },
});