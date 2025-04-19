import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEvents } from '../contexts/EventsContext';
import { useAuth } from '../contexts/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

export default function EventCreationScreen({ route, navigation }) {
  const { addEvent, getEventById, updateEvent } = useEvents();
  const { isAdmin } = useAuth();
  
  // Check if we're editing an existing event
  const { eventId, isEditing } = route.params || {};
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('20');
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 60 * 60 * 1000)); // 1 hour later
  const [color, setColor] = useState('#4287f5');
  const [attendees, setAttendees] = useState([]);
  
  // For date and time pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  const [loading, setLoading] = useState(false);
  
  // Load event data if editing
  useEffect(() => {
    if (isEditing && eventId) {
      const existingEvent = getEventById(eventId);
      if (existingEvent) {
        setTitle(existingEvent.title);
        setDescription(existingEvent.description);
        setLocation(existingEvent.location);
        setCapacity(existingEvent.capacity.toString());
        
        // Convert date strings to Date objects
        const eventDate = new Date(existingEvent.date);
        setDate(eventDate);
        
        // Parse time strings
        const startTimeArr = existingEvent.startTime.split(':');
        const startDateTime = new Date();
        startDateTime.setHours(parseInt(startTimeArr[0]), parseInt(startTimeArr[1]));
        setStartTime(startDateTime);
        
        const endTimeArr = existingEvent.endTime.split(':');
        const endDateTime = new Date();
        endDateTime.setHours(parseInt(endTimeArr[0]), parseInt(endTimeArr[1]));
        setEndTime(endDateTime);
        
        setColor(existingEvent.color || '#4287f5');
        setAttendees(existingEvent.attendees || []);
      }
    }
  }, [isEditing, eventId, getEventById]);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onStartTimeChange = (event, selectedTime) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      setStartTime(selectedTime);
    }
  };

  const onEndTimeChange = (event, selectedTime) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      setEndTime(selectedTime);
    }
  };

  const handleCreateEvent = () => {
    // Validate input
    if (!title.trim() || !description.trim() || !location.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      if (isEditing && eventId) {
        // Update existing event
        const updatedEvent = {
          id: eventId,
          title,
          description,
          location,
          capacity: parseInt(capacity) || 20,
          date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
          startTime: startTime.toTimeString().split(' ')[0], // Format as HH:MM:SS
          endTime: endTime.toTimeString().split(' ')[0], // Format as HH:MM:SS
          color,
          attendees: attendees, // Maintain existing attendees
          lastUpdated: new Date().toISOString()
        };
        
        updateEvent(updatedEvent);
        Alert.alert(
          'Success', 
          'Event updated successfully!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        // Create new event object
        const newEvent = {
          id: Date.now().toString(), // Simple unique ID
          title,
          description,
          location,
          capacity: parseInt(capacity) || 20,
          date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
          startTime: startTime.toTimeString().split(' ')[0], // Format as HH:MM:SS
          endTime: endTime.toTimeString().split(' ')[0], // Format as HH:MM:SS
          color,
          attendees: [], // Start with empty attendees
          createdBy: 'Admin', // Mark that an admin created this
          createdAt: new Date().toISOString()
        };

        // Add the new event
        addEvent(newEvent);
        Alert.alert(
          'Success', 
          'Event created successfully!',
          [{ text: 'OK', onPress: () => navigation.navigate('Calendar') }]
        );
      }
    } catch (err) {
      Alert.alert('Error', isEditing ? 'Failed to update event' : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  // Color options
  const colorOptions = [
    '#4287f5', // Blue
    '#f54242', // Red
    '#42f56f', // Green
    '#f5a742', // Orange
    '#a442f5'  // Purple
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isEditing ? 'Edit Event' : 'Create New Event'}
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Event Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter event title"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter event description"
                multiline
                numberOfLines={4}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Location *</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="Enter event location"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Capacity</Text>
              <TextInput
                style={styles.input}
                value={capacity}
                onChangeText={setCapacity}
                placeholder="Maximum number of attendees"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity 
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text>{formatDate(date)}</Text>
                <Ionicons name="calendar" size={20} color="#666" />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                />
              )}
            </View>
            
            <View style={styles.timeContainer}>
              <View style={styles.timeInputGroup}>
                <Text style={styles.label}>Start Time</Text>
                <TouchableOpacity 
                  style={styles.dateTimeButton}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Text>{formatTime(startTime)}</Text>
                  <Ionicons name="time" size={20} color="#666" />
                </TouchableOpacity>
                {showStartTimePicker && (
                  <DateTimePicker
                    value={startTime}
                    mode="time"
                    display="default"
                    onChange={onStartTimeChange}
                  />
                )}
              </View>
              
              <View style={styles.timeInputGroup}>
                <Text style={styles.label}>End Time</Text>
                <TouchableOpacity 
                  style={styles.dateTimeButton}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Text>{formatTime(endTime)}</Text>
                  <Ionicons name="time" size={20} color="#666" />
                </TouchableOpacity>
                {showEndTimePicker && (
                  <DateTimePicker
                    value={endTime}
                    mode="time"
                    display="default"
                    onChange={onEndTimeChange}
                  />
                )}
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Event Color</Text>
              <View style={styles.colorSelector}>
                {colorOptions.map((colorOption) => (
                  <TouchableOpacity
                    key={colorOption}
                    style={[
                      styles.colorOption,
                      { backgroundColor: colorOption },
                      color === colorOption && styles.selectedColorOption
                    ]}
                    onPress={() => setColor(colorOption)}
                  />
                ))}
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.createButton, loading && styles.disabledButton]}
              onPress={handleCreateEvent}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading 
                  ? (isEditing ? 'Updating Event...' : 'Creating Event...') 
                  : (isEditing ? 'Update Event' : 'Create Event')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#94cfec',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    margin: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateTimeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  timeInputGroup: {
    width: '48%',
  },
  colorSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: '#333',
  },
  createButton: {
    backgroundColor: '#59a2f0',
    padding: 15,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});