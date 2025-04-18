import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEvents } from '../contexts/EventsContext';
import { useAuth } from '../contexts/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AdminScreen({ navigation }) {
  const { events, addEvent, updateEvent, deleteEvent } = useEvents();
  const { logout } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // New event state
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    capacity: '10',
    color: '#4287f5',
    location: '',
  });

  // Handle input change for new event
  const handleInputChange = (name, value) => {
    setNewEvent({
      ...newEvent,
      [name]: value
    });
  };

  // Handle date change
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      handleInputChange('date', formattedDate);
    }
  };

  // Handle time change
  const handleStartTimeChange = (event, selectedTime) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      handleInputChange('startTime', `${hours}:${minutes}`);
    }
  };

  const handleEndTimeChange = (event, selectedTime) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      handleInputChange('endTime', `${hours}:${minutes}`);
    }
  };

  // Handle form submission for new event
  const handleSubmit = () => {
    // Basic validation
    if (!newEvent.title || !newEvent.date || !newEvent.startTime || !newEvent.endTime || !newEvent.location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Create a unique ID
    const eventId = Date.now().toString();

    // Add the new event
    addEvent({
      id: eventId,
      ...newEvent,
      capacity: parseInt(newEvent.capacity, 10),
      attendees: [],
    });

    // Reset form and hide modal
    setNewEvent({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      capacity: '10',
      color: '#4287f5',
      location: '',
    });
    setShowAddModal(false);
    
    Alert.alert('Success', 'Event created successfully');
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      // Navigation is handled by the AppNavigator
    } catch (error) {
      Alert.alert('Error', 'Failed to log out');
    }
  };

  // Handle edit event
  const handleEditEvent = (event) => {
    setSelectedEvent({
      ...event,
      capacity: event.capacity.toString()
    });
    setShowEditModal(true);
  };

  // Handle update event
  const handleUpdateEvent = () => {
    if (!selectedEvent.title || !selectedEvent.date || !selectedEvent.startTime || !selectedEvent.endTime || !selectedEvent.location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    updateEvent({
      ...selectedEvent,
      capacity: parseInt(selectedEvent.capacity, 10)
    });
    setShowEditModal(false);
    setSelectedEvent(null);
    
    Alert.alert('Success', 'Event updated successfully');
  };

  // Handle delete event
  const handleDeleteEvent = (eventId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          deleteEvent(eventId);
          Alert.alert('Success', 'Event deleted successfully');
        }}
      ]
    );
  };

  // Handle input change for selected event
  const handleEditInputChange = (name, value) => {
    setSelectedEvent({
      ...selectedEvent,
      [name]: value
    });
  };

  const renderEventItem = ({ item }) => (
    <View style={styles.eventItem}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
      </View>
      
      <View style={styles.eventDetail}>
        <Text style={styles.detailLabel}>Date:</Text>
        <Text style={styles.detailValue}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
      </View>
      
      <View style={styles.eventDetail}>
        <Text style={styles.detailLabel}>Time:</Text>
        <Text style={styles.detailValue}>
          {new Date(`2000-01-01T${item.startTime}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} -
          {new Date(`2000-01-01T${item.endTime}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </Text>
      </View>
      
      <View style={styles.eventDetail}>
        <Text style={styles.detailLabel}>Capacity:</Text>
        <Text style={styles.detailValue}>
          {item.attendees.length} / {item.capacity}
        </Text>
      </View>
      
      <View style={styles.eventActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditEvent(item)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteEvent(item.id)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Add Event Modal
  const renderAddEventModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      transparent={true}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalTitle}>Add New Event</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Event Title</Text>
              <TextInput
                style={styles.input}
                value={newEvent.title}
                onChangeText={(text) => handleInputChange('title', text)}
                placeholder="Enter event title"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newEvent.description}
                onChangeText={(text) => handleInputChange('description', text)}
                placeholder="Enter event description"
                multiline
                numberOfLines={4}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Text>{newEvent.date}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={new Date(newEvent.date)}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.halfWidth]}>
                <Text style={styles.label}>Start Time</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Text>{newEvent.startTime}</Text>
                </TouchableOpacity>
                {showStartTimePicker && (
                  <DateTimePicker
                    value={new Date(`2000-01-01T${newEvent.startTime}`)}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={handleStartTimeChange}
                  />
                )}
              </View>
              
              <View style={[styles.formGroup, styles.halfWidth]}>
                <Text style={styles.label}>End Time</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Text>{newEvent.endTime}</Text>
                </TouchableOpacity>
                {showEndTimePicker && (
                  <DateTimePicker
                    value={new Date(`2000-01-01T${newEvent.endTime}`)}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={handleEndTimeChange}
                  />
                )}
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Capacity</Text>
              <TextInput
                style={styles.input}
                value={newEvent.capacity}
                onChangeText={(text) => handleInputChange('capacity', text)}
                keyboardType="numeric"
                placeholder="Enter event capacity"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={newEvent.location}
                onChangeText={(text) => handleInputChange('location', text)}
                placeholder="Enter event location"
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>Create Event</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // Edit Event Modal
  const renderEditEventModal = () => {
    if (!selectedEvent) return null;
    
    return (
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Edit Event</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Event Title</Text>
                <TextInput
                  style={styles.input}
                  value={selectedEvent.title}
                  onChangeText={(text) => handleEditInputChange('title', text)}
                  placeholder="Enter event title"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={selectedEvent.description}
                  onChangeText={(text) => handleEditInputChange('description', text)}
                  placeholder="Enter event description"
                  multiline
                  numberOfLines={4}
                />
              </View>
              
              {/* Similar date and time pickers for edit modal */}
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Capacity</Text>
                <TextInput
                  style={styles.input}
                  value={selectedEvent.capacity}
                  onChangeText={(text) => handleEditInputChange('capacity', text)}
                  keyboardType="numeric"
                  placeholder="Enter event capacity"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={selectedEvent.location}
                  onChangeText={(text) => handleEditInputChange('location', text)}
                  placeholder="Enter event location"
                />
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleUpdateEvent}
                >
                  <Text style={styles.submitButtonText}>Update Event</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowEditModal(false);
                    setSelectedEvent(null);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>Add New Event</Text>
        </TouchableOpacity>
      </View>
      
      {events.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No events have been created yet.</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.eventsList}
        />
      )}
      
      {renderAddEventModal()}
      {renderEditEventModal()}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ff6b6b',
    borderRadius: 4,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  actionBar: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  addButton: {
    backgroundColor: '#59a2f0',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  eventsList: {
    padding: 10,
  },
  eventItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  eventDetail: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailLabel: {
    width: 70,
    fontWeight: 'bold',
    color: '#666',
  },
  detailValue: {
    flex: 1,
    color: '#333',
  },
  eventActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#59a2f0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 10,
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 15,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 15,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
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
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
  },
  modalButtons: {
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: '#59a2f0',
    padding: 15,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 15,
    borderRadius: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});