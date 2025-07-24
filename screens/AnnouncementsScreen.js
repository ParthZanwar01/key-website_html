import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabase/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function AnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState([]);
  const { isAdmin } = useAuth();
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    fetchAnnouncements(); // Initial fetch

    const channel = supabase
      .channel('public:announcements')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'announcements' },
        (payload) => {
          fetchAnnouncements(); // Refresh when a new announcement is added
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'announcements' },
        () => {
          fetchAnnouncements(); // Refresh on delete too
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel); // Clean up on unmount
    };
  }, []);

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setAnnouncements(data);
      // Animate in the announcements
      animateIn();
    }
  };

  const animateIn = () => {
    // Reset animations
    fadeAnim.setValue(0);
    slideAnim.setValue(-50);
    
    // Animate fade and slide in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const deleteAnnouncement = async (id) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          const { error } = await supabase.from('announcements').delete().eq('id', id);
          if (error) {
            Alert.alert('Error', error.message);
          } else {
            fetchAnnouncements();
          }
        },
      },
    ]);
  };

  const AnimatedAnnouncementCard = ({ item, index }) => {
    const cardFade = useRef(new Animated.Value(0)).current;
    const cardSlide = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
      // Stagger the animation for each card
      const delay = index * 150;
      
      Animated.parallel([
        Animated.timing(cardFade, {
          toValue: 1,
          duration: 600,
          delay,
          useNativeDriver: true,
        }),
        Animated.spring(cardSlide, {
          toValue: 0,
          delay,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          delay,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, [index]);

    return (
      <Animated.View
        style={[
          styles.card,
          {
            opacity: cardFade,
            transform: [
              { translateX: cardSlide },
              { scale: scaleAnim }
            ],
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="megaphone" size={18} color="#00b894" style={{ marginRight: 6 }} />
          <Text style={styles.title}>{item.title}</Text>
        </View>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.date}>
          {new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }).format(new Date(item.date))}
        </Text>
        {isAdmin && (
          <TouchableOpacity onPress={() => deleteAnnouncement(item.id)} style={styles.deleteBtn}>
            <Ionicons name="trash" size={20} color="white" />
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  const AnimatedFAB = () => {
    const fabScale = useRef(new Animated.Value(0)).current;
    const fabRotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.sequence([
        Animated.delay(500),
        Animated.parallel([
          Animated.spring(fabScale, {
            toValue: 1,
            tension: 50,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.timing(fabRotate, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }, []);

    const rotation = fabRotate.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <Animated.View
        style={[
          styles.fab,
          {
            transform: [
              { scale: fabScale },
              { rotate: rotation }
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.fabTouchable}
          onPress={() => navigation.navigate('CreateAnnouncement')}
        >
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <Text style={styles.header}>Announcements</Text>
      </Animated.View>
      
      {announcements.length === 0 ? (
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Text style={styles.emptyText}>
            No announcements yet.
          </Text>
        </Animated.View>
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <AnimatedAnnouncementCard item={item} index={index} />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {isAdmin && <AnimatedFAB />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3, // Android
    shadowColor: '#000', // iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderLeftWidth: 5,
    borderLeftColor: '#00b894', // accent stripe
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 4,
    color: '#2d3436',
  },
  message: {
    fontSize: 15,
    color: '#636e72',
    marginBottom: 6,
  },
  date: {
    fontSize: 13,
    color: '#999',
    marginTop: 5,
    fontStyle: 'italic',
  },
  deleteBtn: {
    marginTop: 10,
    backgroundColor: '#d11a2a',
    padding: 10,
    borderRadius: 25,
    alignItems: 'center',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#777',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#00b894',
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabTouchable: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});