import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEvents } from '../contexts/EventsContext';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function CalendarScreen({ navigation, route }) {
  const { events, deleteEvent } = useEvents();
  const { isAdmin } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0); // Used to force re-render
  
  // State for context menu
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    eventId: null
  });
  
  // Listen for focus events to refresh the calendar when navigating back
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Force refresh of the calendar when screen comes into focus
      setRefreshKey(prevKey => prevKey + 1);
    });
    
    return unsubscribe;
  }, [navigation]);

  // Generate calendar days for the current month
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const calendarArr = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      calendarArr.push(null);
    }

    // Add cells for each day of the month
    for (let i = 1; i <= daysInMonth; i++) {
      calendarArr.push(new Date(year, month, i));
    }

    setCalendarDays(calendarArr);
  }, [currentDate, refreshKey, events]); // Add refreshKey and events as dependencies

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Get events for a specific day
  const getEventsForDay = (day) => {
    if (!day) return [];

    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === day.getDate() &&
             eventDate.getMonth() === day.getMonth() &&
             eventDate.getFullYear() === day.getFullYear();
    });
  };

  // Handle event press
  const handleEventPress = (eventId) => {
    navigation.navigate('Event', { eventId });
  };

  // Handle event long press (for admin context menu)
  const handleEventLongPress = (eventId, event) => {
    if (isAdmin) {
      // Prevent opening context menu if not an admin
      setContextMenu({
        visible: true,
        eventId
      });
    }
  };

  // Handle context menu options
  const handleMenuOption = (option) => {
    const eventId = contextMenu.eventId;
    
    // Close the menu first
    setContextMenu({ visible: false, eventId: null });
    
    switch (option) {
      case 'view':
        navigation.navigate('Event', { eventId });
        break;
      case 'edit':
        navigation.navigate('EventCreation', { eventId, isEditing: true });
        break;
      case 'attendees':
        navigation.navigate('AttendeeList', { eventId });
        break;
      case 'delete':
        Alert.alert(
          'Confirm Delete',
          'Are you sure you want to delete this event? This action cannot be undone.',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                try {
                  // Delete the event
                  deleteEvent(eventId);
                  
                  // Force refresh the calendar by updating the refresh key
                  setRefreshKey(prev => prev + 1);
                  
                  // Show success message
                  Alert.alert('Success', 'Event deleted successfully');
                } catch (error) {
                  console.error('Error deleting event:', error);
                  Alert.alert('Error', 'Failed to delete event. Please try again.');
                }
              }
            }
          ]
        );
        break;
    }
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const renderDay = ({ item: day, index }) => {
    const dayEvents = day ? getEventsForDay(day) : [];
    
    return (
      <View 
        style={[
          styles.calendarDay,
          !day && styles.emptyDay
        ]}
      >
        {day && (
          <>
            <Text style={styles.dayNumber}>{day.getDate()}</Text>
            {dayEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={[styles.eventItem, { backgroundColor: event.color || '#4287f5' }]}
                onPress={() => handleEventPress(event.id)}
                onLongPress={() => handleEventLongPress(event.id, event)}
                delayLongPress={500}
              >
                <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                <Text style={styles.eventTime}>
                  {new Date(`2000-01-01T${event.startTime}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={prevMonth} style={styles.navButton}>
            <Text style={styles.navButtonText}>&lt;</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
            <Text style={styles.navButtonText}>&gt;</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weekdayHeader}>
          <Text style={styles.weekdayText}>Sun</Text>
          <Text style={styles.weekdayText}>Mon</Text>
          <Text style={styles.weekdayText}>Tue</Text>
          <Text style={styles.weekdayText}>Wed</Text>
          <Text style={styles.weekdayText}>Thu</Text>
          <Text style={styles.weekdayText}>Fri</Text>
          <Text style={styles.weekdayText}>Sat</Text>
        </View>

        <FlatList
          key={`calendar-${refreshKey}`}
          data={calendarDays}
          renderItem={renderDay}
          keyExtractor={(_, index) => index.toString()}
          numColumns={7}
          scrollEnabled={false}
          extraData={events} // Add this to make sure it updates when events change
        />
        
        {/* Floating Action Button for admins to create events */}
        {isAdmin && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate('EventCreation')}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        )}
        
        {/* Context Menu Modal */}
        <Modal
          transparent={true}
          visible={contextMenu.visible}
          animationType="fade"
          onRequestClose={() => setContextMenu({ visible: false, eventId: null })}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setContextMenu({ visible: false, eventId: null })}
          >
            <View style={styles.contextMenuContainer}>
              <TouchableOpacity 
                style={styles.contextMenuItem}
                onPress={() => handleMenuOption('view')}
              >
                <Ionicons name="eye-outline" size={20} color="#333" />
                <Text style={styles.contextMenuText}>View Event</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.contextMenuItem}
                onPress={() => handleMenuOption('edit')}
              >
                <Ionicons name="create-outline" size={20} color="#333" />
                <Text style={styles.contextMenuText}>Edit Event</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.contextMenuItem}
                onPress={() => handleMenuOption('attendees')}
              >
                <Ionicons name="people-outline" size={20} color="#333" />
                <Text style={styles.contextMenuText}>View Attendees</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.contextMenuItem, styles.deleteMenuItem]}
                onPress={() => handleMenuOption('delete')}
              >
                <Ionicons name="trash-outline" size={20} color="#ff4d4d" />
                <Text style={[styles.contextMenuText, styles.deleteMenuText]}>Delete Event</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#94cfec',
  },
  calendarContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    margin: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f2f2f2',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  navButton: {
    backgroundColor: '#59a2f0',
    padding: 8,
    borderRadius: 4,
    width: 40,
    alignItems: 'center',
  },
  navButtonText: {
    color: 'white',
    fontSize: 16,
  },
  weekdayHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    padding: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  calendarDay: {
    flex: 1,
    minHeight: 100,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    padding: 5,
    width: '14.28%', // 100% / 7 days
  },
  emptyDay: {
    backgroundColor: '#f8f9fa',
  },
  dayNumber: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  eventItem: {
    borderRadius: 4,
    padding: 4,
    marginBottom: 2,
  },
  eventTitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventTime: {
    color: 'white',
    fontSize: 10,
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    backgroundColor: '#f1ca3b',
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contextMenuContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    width: '80%',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  contextMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  deleteMenuItem: {
    borderBottomWidth: 0,
  },
  contextMenuText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  deleteMenuText: {
    color: '#ff4d4d',
  },
});