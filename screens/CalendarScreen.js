import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEvents } from '../contexts/EventsContext';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function CalendarScreen({ navigation }) {
  const { events } = useEvents();
  const { isAdmin } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);

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
  }, [currentDate]);

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
                onPress={() => navigation.navigate('Event', { eventId: event.id })}
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
          data={calendarDays}
          renderItem={renderDay}
          keyExtractor={(_, index) => index.toString()}
          numColumns={7}
          scrollEnabled={false}
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
});