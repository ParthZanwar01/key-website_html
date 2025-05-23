import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useHours } from '../contexts/HourContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { user, isAdmin } = useAuth();
  const { getStudentHours } = useHours();
  const navigation = useNavigation();
  const [currentHours, setCurrentHours] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load current hours when component mounts
  useEffect(() => {
    const loadCurrentHours = async () => {
      if (user?.sNumber && !isAdmin) {
        try {
          const hours = await getStudentHours(user.sNumber);
          setCurrentHours(hours);
        } catch (error) {
          console.error('Failed to load current hours:', error);
        }
      }
      setLoading(false);
    };
    
    loadCurrentHours();
  }, [user, getStudentHours, isAdmin]);
  
  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/keyclublogo.png')} style={styles.logo} />
      <Text style={styles.welcome}>Welcome, {user?.name || user?.sNumber || 'Member'}</Text>
      <Text style={styles.title}>Cypress Ranch Key Club</Text>
      
      {/* Hours Display for Students */}
      {!isAdmin && (
        <View style={styles.hoursCard}>
          <View style={styles.hoursHeader}>
            <Ionicons name="time" size={32} color="#ffd60a" />
            <View style={styles.hoursInfo}>
              <Text style={styles.hoursLabel}>Your Volunteer Hours</Text>
              <Text style={styles.hoursValue}>
                {loading ? '...' : `${currentHours.toFixed(1)} hours`}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.requestButton}
            onPress={() => navigation.navigate('Hours')}
          >
            <Ionicons name="add-circle-outline" size={20} color="#0d1b2a" />
            <Text style={styles.requestButtonText}>Request Hours</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Admin Dashboard */}
      {isAdmin && (
        <View style={styles.adminCard}>
          <Text style={styles.adminTitle}>Admin Dashboard</Text>
          <View style={styles.adminButtons}>
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => navigation.navigate('Calendar', { screen: 'EventCreation' })}
            >
              <Ionicons name="calendar" size={20} color="#0d1b2a" />
              <Text style={styles.adminButtonText}>Create Event</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => navigation.navigate('Hours')}
            >
              <Ionicons name="time" size={20} color="#0d1b2a" />
              <Text style={styles.adminButtonText}>Manage Hours</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      <Text style={styles.subtitle}>
        {isAdmin ? 'Manage events and oversee club activities' : 'Track events, hours, and stay connected'}
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
    width: 200,
    height: 200,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  hoursCard: {
    backgroundColor: 'rgba(255, 214, 10, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.3)',
  },
  hoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  hoursInfo: {
    marginLeft: 15,
    flex: 1,
  },
  hoursLabel: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 5,
  },
  hoursValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffd60a',
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffd60a',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  requestButtonText: {
    color: '#0d1b2a',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  adminCard: {
    backgroundColor: 'rgba(255, 214, 10, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.3)',
  },
  adminTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffd60a',
    textAlign: 'center',
    marginBottom: 15,
  },
  adminButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffd60a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
  },
  adminButtonText: {
    color: '#0d1b2a',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 22,
  },
});