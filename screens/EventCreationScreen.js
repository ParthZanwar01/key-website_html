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
  Switch,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEvents } from '../contexts/EventsContext';
import { useAuth } from '../contexts/AuthContext';
import { Picker } from '@react-native-picker/picker';
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
        if (existingEvent.startTime) {
          const startTimeArr = existingEvent.startTime.split(':');
          const startDateTime = new Date();
          startDateTime.setHours(parseInt(startTimeArr[0]), parseInt(startTimeArr[1]));
          setStartTime(startDateTime);
        }
        
        if (existingEvent.endTime) {
          const endTimeArr = existingEvent.endTime.split(':');
          const endDateTime = new Date();
          endDateTime.setHours(parseInt(endTimeArr[0]), parseInt(endTimeArr[1]));
          setEndTime(endDateTime);
        }
        
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
          startTime: `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}:00`,
          endTime: `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}:00`,
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
          startTime: `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}:00`,
          endTime: `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}:00`,
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
      console.error('Event creation error:', err);
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
  
  // Date picker component
  const renderDatePicker = () => {
    if (!showDatePicker) return null;
    
    // Generate arrays for day, month, year options
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i);
    
    return (
      <Modal
        transparent={true}
        visible={showDatePicker}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.pickerCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.pickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.pickerRow}>
              {/* Month picker */}
              <Picker
                style={styles.picker}
                selectedValue={date.getMonth()}
                onValueChange={(itemValue) => {
                  const newDate = new Date(date);
                  newDate.setMonth(itemValue);
                  setDate(newDate);
                }}
              >
                {months.map((month, index) => (
                  <Picker.Item key={month} label={month} value={index} />
                ))}
              </Picker>
              
              {/* Day picker */}
              <Picker
                style={styles.picker}
                selectedValue={date.getDate()}
                onValueChange={(itemValue) => {
                  const newDate = new Date(date);
                  newDate.setDate(itemValue);
                  setDate(newDate);
                }}
              >
                {days.map(day => (
                  <Picker.Item key={day} label={day.toString()} value={day} />
                ))}
              </Picker>
              
              {/* Year picker */}
              <Picker
                style={styles.picker}
                selectedValue={date.getFullYear()}
                onValueChange={(itemValue) => {
                  const newDate = new Date(date);
                  newDate.setFullYear(itemValue);
                  setDate(newDate);
                }}
              >
                {years.map(year => (
                  <Picker.Item key={year} label={year.toString()} value={year} />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  
  // Time picker component for start time
  const renderStartTimePicker = () => {
    if (!showStartTimePicker) return null;
    
    // Generate arrays for hour and minute options
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);
    
    return (
      <Modal
        transparent={true}
        visible={showStartTimePicker}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setShowStartTimePicker(false)}>
                <Text style={styles.pickerCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>Start Time</Text>
              <TouchableOpacity onPress={() => setShowStartTimePicker(false)}>
                <Text style={styles.pickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.pickerRow}>
              {/* Hour picker */}
              <Picker
                style={styles.picker}
                selectedValue={startTime.getHours()}
                onValueChange={(itemValue) => {
                  const newTime = new Date(startTime);
                  newTime.setHours(itemValue);
                  setStartTime(newTime);
                }}
              >
                {hours.map(hour => (
                  <Picker.Item 
                    key={hour} 
                    label={hour < 10 ? `0${hour}` : `${hour}`}
                    value={hour} 
                  />
                ))}
              </Picker>
              
              <Text style={styles.pickerSeparator}>:</Text>
              
              {/* Minute picker */}
              <Picker
                style={styles.picker}
                selectedValue={startTime.getMinutes()}
                onValueChange={(itemValue) => {
                  const newTime = new Date(startTime);
                  newTime.setMinutes(itemValue);
                  setStartTime(newTime);
                }}
              >
                {minutes.map(minute => (
                  <Picker.Item 
                    key={minute} 
                    label={minute < 10 ? `0${minute}` : `${minute}`}
                    value={minute} 
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  
  // Time picker component for end time
  const renderEndTimePicker = () => {
    if (!showEndTimePicker) return null;
    
    // Generate arrays for hour and minute options
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);
    
    return (
      <Modal
        transparent={true}
        visible={showEndTimePicker}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                <Text style={styles.pickerCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>End Time</Text>
              <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                <Text style={styles.pickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.pickerRow}>
              {/* Hour picker */}
              <Picker
                style={styles.picker}
                selectedValue={endTime.getHours()}
                onValueChange={(itemValue) => {
                  const newTime = new Date(endTime);
                  newTime.setHours(itemValue);
                  setEndTime(newTime);
                }}
              >
                {hours.map(hour => (
                  <Picker.Item 
                    key={hour} 
                    label={hour < 10 ? `0${hour}` : `${hour}`}
                    value={hour} 
                  />
                ))}
              </Picker>
              
              <Text style={styles.pickerSeparator}>:</Text>
              
              {/* Minute picker */}
              <Picker
                style={styles.picker}
                selectedValue={endTime.getMinutes()}
                onValueChange={(itemValue) => {
                  const newTime = new Date(endTime);
                  newTime.setMinutes(itemValue);
                  setEndTime(newTime);
                }}
              >
                {minutes.map(minute => (
                  <Picker.Item 
                    key={minute} 
                    label={minute < 10 ? `0${minute}` : `${minute}`}
                    value={minute} 
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

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
              {renderDatePicker()}
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
                {renderStartTimePicker()}
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
                {renderEndTimePicker()}
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
  // Modal Picker Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerContainer: {
    backgroundColor: 'white',
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  pickerCancel: {
    color: '#f54242',
    fontSize: 16,
  },
  pickerDone: {
    color: '#4287f5',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  picker: {
    flex: 1,
    height: 200,
  },
  pickerSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 5,
  }
});