import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEvents } from '../contexts/EventsContext';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function EventDeletionScreen({ navigation }) {
  const { events, refreshEvents } = useEvents();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState({});
  
  // Check if user is admin
  useEffect(() => {
    if (!isAdmin) {
      navigation.goBack();
    }
  }, [isAdmin, navigation]);
  
  // Load events
  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);
  
  // Direct delete function - no alerts or confirmations
  const deleteEventDirectly = async (eventId) => {
    try {
      console.log('Directly deleting event:', eventId);
      
      // Get current events from storage
      const storedEventsJson = await AsyncStorage.getItem('events');
      if (!storedEventsJson) {
        console.log('No events in storage');
        return false;
      }
      
      const storedEvents = JSON.parse(storedEventsJson);
      
      // Filter out the event to delete
      const updatedEvents = storedEvents.filter(event => String(event.id) !== String(eventId));
      
      // Save the updated events back to storage
      await AsyncStorage.setItem('events', JSON.stringify(updatedEvents));
      console.log(`Event ${eventId} deleted successfully`);
      
      return true;
    } catch (error) {
      console.error('Error in direct event deletion:', error);
      return false;
    }
  };
  
  // Delete multiple events - no confirmation alerts
  const deleteSelectedEvents = async () => {
    const selectedIds = Object.keys(selectedEvents).filter(id => selectedEvents[id]);
    
    if (selectedIds.length === 0) {
      return;
    }
    
    setLoading(true);
    
    try {
      let successCount = 0;
      
      for (const eventId of selectedIds) {
        const success = await deleteEventDirectly(eventId);
        if (success) {
          successCount++;
        }
      }
      
      // Clear selection
      setSelectedEvents({});
      
      // Refresh events
      await refreshEvents();
      
      // If any events were deleted, return to calendar screen
      if (successCount > 0) {
        navigation.navigate('CalendarMain');
      }
    } catch (error) {
      console.error('Error in batch deletion:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle selection of an event
  const toggleEventSelection = (eventId) => {
    setSelectedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };
  
  // Group events into upcoming and past
  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate >= today;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const pastEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate < today;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Select all events in a section
  const selectAllInSection = (section) => {
    const newSelection = { ...selectedEvents };
    const eventsToSelect = section === 'upcoming' ? upcomingEvents : pastEvents;
    
    eventsToSelect.forEach(event => {
      newSelection[event.id] = true;
    });
    
    setSelectedEvents(newSelection);
  };
  
  // Format date for display
  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Handle direct delete of a single event
  const handleSingleDelete = async (eventId) => {
    setLoading(true);
    
    try {
      await deleteEventDirectly(eventId);
      await refreshEvents();
      navigation.navigate('CalendarMain');
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Render each event item
  const renderEventItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.eventItem,
        selectedEvents[item.id] && styles.selectedEventItem
      ]}
      onPress={() => toggleEventSelection(item.id)}
    >
      <View style={styles.eventItemContent}>
        <View style={[styles.eventColor, { backgroundColor: item.color || '#4287f5' }]} />
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.eventDetails}>
            {formatEventDate(item.date)} • {item.location}
          </Text>
          <Text style={styles.attendeeCount}>
            {item.attendees?.length || 0} / {item.capacity} attendees
          </Text>
        </View>
        
        <View style={styles.actionButtons}>
          {selectedEvents[item.id] ? (
            <Ionicons name="checkmark-circle" size={24} color="#59a2f0" />
          ) : (
            <Ionicons name="ellipse-outline" size={24} color="#ccc" />
          )}
          
          <TouchableOpacity
            style={styles.deleteIconButton}
            onPress={() => handleSingleDelete(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#ff4d4d" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
  
  // Section header component
  const SectionHeader = ({ title, count, section }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>{count} events</Text>
      </View>
      
      {count > 0 && (
        <TouchableOpacity 
          style={styles.selectAllButton}
          onPress={() => selectAllInSection(section)}
        >
          <Text style={styles.selectAllText}>Select All</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Events</Text>
        <TouchableOpacity 
          style={[
            styles.deleteButton,
            (loading || Object.values(selectedEvents).filter(Boolean).length === 0) && 
            styles.disabledButton
          ]}
          onPress={deleteSelectedEvents}
          disabled={loading || Object.values(selectedEvents).filter(Boolean).length === 0}
        >
          <Text style={[
            styles.deleteButtonText,
            (loading || Object.values(selectedEvents).filter(Boolean).length === 0) && 
            styles.disabledButtonText
          ]}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#59a2f0" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      ) : (
        <FlatList
          data={[
            { type: 'upcomingHeader' },
            ...upcomingEvents.map(event => ({ type: 'event', ...event })),
            { type: 'pastHeader' },
            ...pastEvents.map(event => ({ type: 'event', ...event })),
          ]}
          renderItem={({ item }) => {
            if (item.type === 'upcomingHeader') {
              return <SectionHeader title="Upcoming Events" count={upcomingEvents.length} section="upcoming" />;
            } else if (item.type === 'pastHeader') {
              return <SectionHeader title="Past Events" count={pastEvents.length} section="past" />;
            } else {
              return renderEventItem({ item });
            }
          }}
          keyExtractor={(item, index) => {
            if (item.type === 'upcomingHeader') return 'upcoming-header';
            if (item.type === 'pastHeader') return 'past-header';
            return item.id;
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No events found</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
      
      <View style={styles.footer}>
        <Text style={styles.selectionInfo}>
          {Object.values(selectedEvents).filter(Boolean).length} events selected
        </Text>
        {Object.values(selectedEvents).filter(Boolean).length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => setSelectedEvents({})}
          >
            <Text style={styles.clearButtonText}>Clear Selection</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#94cfec',
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
  deleteButton: {
    backgroundColor: '#ff4d4d',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  disabledButtonText: {
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  listContent: {
    padding: 10,
    flexGrow: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginVertical: 5,
    borderRadius: 4,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionCount: {
    fontSize: 14,
    color: '#666',
  },
  selectAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  selectAllText: {
    color: '#59a2f0',
    fontWeight: 'bold',
    fontSize: 14,
  },
  eventItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginVertical: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedEventItem: {
    borderColor: '#59a2f0',
    borderWidth: 2,
    backgroundColor: '#f0f8ff',
  },
  eventItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  eventColor: {
    width: 8,
    height: '100%',
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  eventDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  attendeeCount: {
    fontSize: 12,
    color: '#59a2f0',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteIconButton: {
    marginLeft: 12,
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
    flex: 1,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  selectionInfo: {
    fontSize: 14,
    color: '#666',
  },
  clearButton: {
    padding: 5,
  },
  clearButtonText: {
    color: '#59a2f0',
    fontWeight: 'bold',
  },
});