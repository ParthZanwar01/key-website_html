import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEvents } from '../contexts/EventsContext';
import { Ionicons } from '@expo/vector-icons';

export default function AttendeeListScreen({ route, navigation }) {
  const { eventId } = route.params;
  const { getEventById } = useEvents();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load event data
    const eventData = getEventById(eventId);
    if (eventData) {
      setEvent(eventData);
    } else {
      Alert.alert('Error', 'Event not found');
      navigation.goBack();
    }
    setLoading(false);
  }, [eventId, getEventById, navigation]);

  // Export attendees (could be expanded to share as CSV, etc.)
  const exportAttendees = () => {
    Alert.alert(
      'Export Attendees',
      'This feature will allow you to export the attendee list as a CSV file.',
      [{ text: 'OK' }]
    );
  };

  const renderAttendeeItem = ({ item, index }) => (
    <View style={styles.attendeeItem}>
      <View style={styles.attendeeNumberContainer}>
        <Text style={styles.attendeeNumber}>{index + 1}</Text>
      </View>
      <View style={styles.attendeeInfo}>
        <Text style={styles.attendeeName}>{item.name}</Text>
        <Text style={styles.attendeeEmail}>{item.email}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#59a2f0" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Event not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendees</Text>
        <TouchableOpacity 
          style={styles.exportButton}
          onPress={exportAttendees}
        >
          <Ionicons name="download-outline" size={24} color="#59a2f0" />
        </TouchableOpacity>
      </View>

      <View style={styles.eventInfoContainer}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventDetails}>
          {new Date(event.date).toLocaleDateString()} | {event.location}
        </Text>
        <Text style={styles.attendeeCount}>
          {event.attendees.length} / {event.capacity} Attendees
        </Text>
      </View>

      {event.attendees.length > 0 ? (
        <FlatList
          data={event.attendees}
          renderItem={renderAttendeeItem}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No attendees yet</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  exportButton: {
    padding: 5,
  },
  eventInfoContainer: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  eventDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  attendeeCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#59a2f0',
  },
  listContent: {
    padding: 15,
  },
  attendeeItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  attendeeNumberContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  attendeeNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  attendeeEmail: {
    fontSize: 14,
    color: '#666',
  },
  separator: {
    height: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
  },
});