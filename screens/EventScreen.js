import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEvents } from '../contexts/EventsContext';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import ConfirmationDialog from '../components/ConfirmationDialog';

export default function EventScreen({ route, navigation }) {
  const { eventId } = route.params;
  const { getEventById, signupForEvent, deleteEvent, refreshEvents } = useEvents();
  const { isAdmin } = useAuth();
  const [event, setEvent] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // State for confirmation dialogs
  const [deleteDialog, setDeleteDialog] = useState({ visible: false });
  const [errorDialog, setErrorDialog] = useState({ visible: false, message: '' });
  const [successDialog, setSuccessDialog] = useState({ visible: false, message: '' });

  useEffect(() => {
    const eventData = getEventById(eventId);
    if (eventData) {
      setEvent(eventData);
    } else {
      setErrorDialog({ 
        visible: true, 
        message: 'Event not found' 
      });
    }
  }, [eventId, getEventById, navigation]);

  // Enhanced delete handler using EventsContext
  const handleDeleteEvent = () => {
    console.log('Delete button clicked');
    setDeleteDialog({ visible: true });
  };

  const confirmDelete = async () => {
    console.log('Delete confirmed');
    setDeleteDialog({ visible: false });
    setDeleting(true);
    
    try {
      // Use EventsContext deleteEvent method which handles Google Sheets
      await deleteEvent(eventId);
      
      // Refresh events to ensure sync
      await refreshEvents();
      
      console.log('Delete succeeded, navigating back');
      
      // Show success message briefly then navigate
      setSuccessDialog({
        visible: true,
        message: 'Event deleted successfully'
      });
      
      // Navigate back after showing success
      setTimeout(() => {
        try {
          navigation.navigate('CalendarMain');
        } catch (e1) {
          try {
            navigation.navigate('Calendar');
          } catch (e2) {
            try {
              navigation.goBack();
            } catch (e3) {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            }
          }
        }
      }, 1500);
      
    } catch (error) {
      console.error('Delete failed:', error);
      setDeleting(false);
      setErrorDialog({
        visible: true,
        message: 'Failed to delete event. Please try again.'
      });
    }
  };

  const handleSignup = async () => {
    if (!name.trim() || !email.trim()) {
      setErrorDialog({
        visible: true,
        message: 'Please fill in all fields'
      });
      return;
    }

    // Check if capacity reached
    if (event.attendees && event.attendees.length >= event.capacity) {
      setErrorDialog({
        visible: true,
        message: 'This event has reached its capacity'
      });
      return;
    }

    // Check if already registered
    if (event.attendees && event.attendees.some(attendee => attendee.email === email)) {
      setErrorDialog({
        visible: true,
        message: 'You are already registered for this event'
      });
      return;
    }

    // Submit signup using EventsContext
    try {
      setLoading(true);
      await signupForEvent(eventId, { name, email });
      
      // Refresh the event data to show updated attendee list
      await refreshEvents();
      
      setSuccessDialog({
        visible: true,
        message: 'You have successfully signed up for this event!'
      });
      
      // Navigate back after success
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
      
    } catch (err) {
      console.error('Signup error:', err);
      setErrorDialog({
        visible: true,
        message: 'Failed to sign up for event. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderAttendee = ({ item }) => (
    <View style={styles.attendeeItem}>
      <Text style={styles.attendeeName}>{item.name}</Text>
      <Text style={styles.attendeeEmail}>{item.email}</Text>
    </View>
  );

  if (!event) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading event...</Text>
        
        {/* Error dialog for event not found */}
        <ConfirmationDialog
          visible={errorDialog.visible}
          title="Error"
          message={errorDialog.message}
          onCancel={() => {
            setErrorDialog({ visible: false, message: '' });
            navigation.goBack();
          }}
          onConfirm={() => {
            setErrorDialog({ visible: false, message: '' });
            navigation.goBack();
          }}
          cancelText=""
          confirmText="OK"
          icon="alert-circle"
        />
      </View>
    );
  }

  if (deleting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#59a2f0" />
        <Text style={styles.loadingText}>Deleting event...</Text>
      </View>
    );
  }

  const eventDate = new Date(event.date);
  const startTime = new Date(`${event.date}T${event.startTime}`);
  const endTime = new Date(`${event.date}T${event.endTime}`);
  const isFullyBooked = event.attendees && event.attendees.length >= event.capacity;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          style={Platform.OS === 'web' ? { flex: 1, overflowY: 'auto' } : undefined}
          contentContainerStyle={Platform.OS === 'web' ? { flexGrow: 1 } : undefined}
        >
          <View style={styles.eventDetails}>
            {isAdmin && (
              <View style={styles.adminControls}>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => navigation.navigate('EventCreation', { 
                    eventId: event.id, 
                    isEditing: true 
                  })}
                >
                  <Ionicons name="create-outline" size={22} color="white" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={handleDeleteEvent}
                  disabled={deleting}
                >
                  <Ionicons name="trash-outline" size={22} color="white" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.eventTitle}>{event.title}</Text>
            
            <View style={styles.metadataContainer}>
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Date:</Text>
                <Text style={styles.metadataValue}>
                  {eventDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
              
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Time:</Text>
                <Text style={styles.metadataValue}>
                  {startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>
              </View>
              
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Location:</Text>
                <Text style={styles.metadataValue}>{event.location}</Text>
              </View>
              
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Availability:</Text>
                <Text style={styles.metadataValue}>
                  {event.attendees ? event.attendees.length : 0} / {event.capacity} spots filled
                </Text>
              </View>
            </View>

            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{event.description}</Text>
            </View>

            {/* Attendees section for admins */}
            {isAdmin && (
              <View style={styles.attendeesContainer}>
                <View style={styles.attendeesHeaderRow}>
                  <Text style={styles.attendeesTitle}>
                    Attendees ({event.attendees ? event.attendees.length : 0})
                  </Text>
                  <TouchableOpacity 
                    style={styles.viewAllButton}
                    onPress={() => navigation.navigate('AttendeeList', { eventId: event.id })}
                  >
                    <Text style={styles.viewAllButtonText}>View All</Text>
                    <Ionicons name="chevron-forward" size={16} color="#59a2f0" />
                  </TouchableOpacity>
                </View>
                
                {event.attendees && event.attendees.length > 0 ? (
                  <>
                    {/* Show max 3 attendees in this screen */}
                    <FlatList
                      data={event.attendees.slice(0, 3)}
                      renderItem={renderAttendee}
                      keyExtractor={(item, index) => index.toString()}
                      scrollEnabled={false}
                      ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                    
                    {event.attendees.length > 3 && (
                      <Text style={styles.moreAttendeesText}>
                        +{event.attendees.length - 3} more attendees
                      </Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.noAttendeesText}>No one has signed up yet</Text>
                )}
              </View>
            )}
          </View>

          {!isAdmin && (
            isFullyBooked ? (
              <View style={styles.fullyBookedContainer}>
                <Text style={styles.fullyBookedText}>This event is fully booked</Text>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.buttonText}>Back to Calendar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.signupContainer}>
                <Text style={styles.signupTitle}>Sign Up for This Event</Text>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Name</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your name"
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.signupButton, loading && styles.disabledButton]}
                    onPress={handleSignup}
                    disabled={loading}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? 'Signing up...' : 'Sign Up'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        visible={deleteDialog.visible}
        title="Delete Event"
        message={`Are you sure you want to delete "${event.title}"? This action cannot be undone.`}
        onCancel={() => setDeleteDialog({ visible: false })}
        onConfirm={confirmDelete}
        cancelText="Cancel"
        confirmText="Delete"
        destructive={true}
        icon="trash-outline"
      />

      {/* Error Dialog */}
      <ConfirmationDialog
        visible={errorDialog.visible}
        title="Error"
        message={errorDialog.message}
        onCancel={() => setErrorDialog({ visible: false, message: '' })}
        onConfirm={() => setErrorDialog({ visible: false, message: '' })}
        cancelText=""
        confirmText="OK"
        icon="alert-circle"
      />

      {/* Success Dialog */}
      <ConfirmationDialog
        visible={successDialog.visible}
        title="Success"
        message={successDialog.message}
        onCancel={() => {
          setSuccessDialog({ visible: false, message: '' });
          navigation.goBack();
        }}
        onConfirm={() => {
          setSuccessDialog({ visible: false, message: '' });
          navigation.goBack();
        }}
        cancelText=""
        confirmText="OK"
        icon="checkmark-circle"
        iconColor="#4CAF50"
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#94cfec',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  eventDetails: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  adminControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: '#59a2f0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 10,
  },
  editButtonText: {
    color: 'white',
    marginLeft: 5,
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: 'white',
    marginLeft: 5,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  metadataContainer: {
    marginBottom: 15,
  },
  metadataItem: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  metadataLabel: {
    fontWeight: 'bold',
    width: 100,
    color: '#333',
  },
  metadataValue: {
    flex: 1,
    color: '#333',
  },
  descriptionContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 15,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  descriptionText: {
    color: '#333',
    lineHeight: 20,
  },
  attendeesContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 15,
    marginTop: 15,
  },
  attendeesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  attendeesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllButtonText: {
    color: '#59a2f0',
    fontWeight: 'bold',
    marginRight: 3,
  },
  attendeeItem: {
    paddingVertical: 8,
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  attendeeEmail: {
    fontSize: 14,
    color: '#666',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  moreAttendeesText: {
    color: '#666',
    fontSize: 14,
    marginTop: 10,
    fontStyle: 'italic',
  },
  noAttendeesText: {
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 10,
  },
  fullyBookedContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    margin: 10,
    alignItems: 'center',
  },
  fullyBookedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 20,
  },
  signupContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    margin: 10,
  },
  signupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
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
  buttonContainer: {
    marginTop: 10,
  },
  signupButton: {
    backgroundColor: '#59a2f0',
    padding: 15,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 10,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  backButton: {
    backgroundColor: '#59a2f0',
    padding: 15,
    borderRadius: 4,
    alignItems: 'center',
  },
  buttonText: {
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