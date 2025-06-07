import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabase/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function AnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState([]);
  const { isAdmin } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    fetchAnnouncements();
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
    }
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

  const renderItem = ({ item }) => (
    <View style={styles.card}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Ionicons name="megaphone" size={18} color="#00b894" style={{ marginRight: 6 }} />
      <Text style={styles.title}>{item.title}</Text>
    </View>
      <Text>{item.message}</Text>
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
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Announcements</Text>
      {announcements.length === 0 && (
  <Text style={{ textAlign: 'center', marginTop: 20, color: '#777' }}>
    No announcements yet.
  </Text>
  )}
      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
      />
      {isAdmin && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateAnnouncement')}
        >
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
      )}
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#00b894',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
});