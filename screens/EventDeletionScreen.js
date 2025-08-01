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
import { useEvents } from '../contexts/EventsContext';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import ConfirmationDialog from '../components/ConfirmationDialog';

export default function EventDeletionScreen({ navigation }) {
  const { events, deleteEvent, refreshEvents } = useEvents();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState({});

  const [confirmDialog, setConfirmDialog] = useState({
    visible: false,
    type: 'single',
    eventId: null,
    eventTitle: '',
    count: 0
  });

  const [messageDialog, setMessageDialog] = useState({
    visible: false,
    title: '',
    message: '',
    isError: false
  });

  useEffect(() => {
    if (!isAdmin) {
      navigation.goBack();
    }
  }, [isAdmin]);

  useEffect(() => {
    refreshEvents();
  }, []);

  const deleteSelectedEvents = async () => {
    const selectedIds = Object.keys(selectedEvents).filter(id => selectedEvents[id]);
    if (selectedIds.length === 0) return;

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const id of selectedIds) {
      try {
        await deleteEvent(id);
        successCount++;
      } catch (e) {
        console.error(`Failed to delete ${id}`, e);
        errorCount++;
      }
    }

    setSelectedEvents({});
    await refreshEvents();

    setMessageDialog({
      visible: true,
      title: errorCount ? 'Partial Success' : 'Success',
      message: errorCount
        ? `Deleted ${successCount}, failed ${errorCount}`
        : `Deleted ${successCount} successfully`,
      isError: !!errorCount
    });

    if (!errorCount) {
      setTimeout(() => navigation.navigate('CalendarMain'), 1500);
    }

    setLoading(false);
  };

  const toggleEventSelection = id => {
    setSelectedEvents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const upcomingEvents = events.filter(e => new Date(e.date) >= new Date().setHours(0, 0, 0, 0));
  const pastEvents = events.filter(e => new Date(e.date) < new Date().setHours(0, 0, 0, 0));

  const selectAllInSection = section => {
    const updated = { ...selectedEvents };
    (section === 'upcoming' ? upcomingEvents : pastEvents).forEach(e => updated[e.id] = true);
    setSelectedEvents(updated);
  };

  const formatEventDate = dateStr => new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  });

  const handleSingleDelete = id => {
    const evt = events.find(e => e.id === id);
    setConfirmDialog({
      visible: true,
      type: 'single',
      eventId: id,
      eventTitle: evt?.title || 'this event',
      count: 1
    });
  };

  const handleMultipleDelete = () => {
    const count = Object.values(selectedEvents).filter(Boolean).length;
    setConfirmDialog({ visible: true, type: 'multiple', count });
  };

  const confirmDeletion = async () => {
    setConfirmDialog({ visible: false, type: 'single', eventId: null, eventTitle: '', count: 0 });
    setLoading(true);
    try {
      if (confirmDialog.type === 'single') {
        await deleteEvent(confirmDialog.eventId);
        await refreshEvents();
        setMessageDialog({
          visible: true,
          title: 'Success',
          message: 'Event deleted successfully',
          isError: false
        });
        setTimeout(() => navigation.navigate('CalendarMain'), 1500);
      } else {
        await deleteSelectedEvents();
      }
    } catch (e) {
      console.error(e);
      setMessageDialog({
        visible: true,
        title: 'Error',
        message: 'Failed to delete event(s)',
        isError: true
      });
    } finally {
      setLoading(false);
    }
  };

  const renderEventItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.eventItem, selectedEvents[item.id] && styles.selectedEventItem]}
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
          <Ionicons name={selectedEvents[item.id] ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={selectedEvents[item.id] ? '#59a2f0' : '#ccc'} />
          <TouchableOpacity style={styles.deleteIconButton} onPress={() => handleSingleDelete(item.id)}>
            <Ionicons name="trash-outline" size={20} color="#ff4d4d" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const SectionHeader = ({ title, count, section }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>{count} events</Text>
      </View>
      {count > 0 && (
        <TouchableOpacity style={styles.selectAllButton} onPress={() => selectAllInSection(section)}>
          <Text style={styles.selectAllText}>Select All</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const selectedCount = Object.values(selectedEvents).filter(Boolean).length;

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Events</Text>
          <TouchableOpacity
            style={[styles.deleteButton, (loading || selectedCount === 0) && styles.disabledButton]}
            onPress={handleMultipleDelete}
            disabled={loading || selectedCount === 0}
          >
            <Text style={[styles.deleteButtonText, (loading || selectedCount === 0) && styles.disabledButtonText]}>Delete</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          contentContainerStyle={styles.listContent}
          data={[
            { title: 'Upcoming Events', data: upcomingEvents, key: 'upcoming' },
            { title: 'Past Events', data: pastEvents, key: 'past' }
          ]}
          renderItem={({ item }) => (
            <View>
              <SectionHeader title={item.title} count={item.data.length} section={item.key} />
              {item.data.map(event => renderEventItem({ item: event }))}
            </View>
          )}
          keyExtractor={(_, index) => index.toString()}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>

      <ConfirmationDialog
        visible={confirmDialog.visible}
        title="Confirm Deletion"
        message={confirmDialog.type === 'single'
          ? `Delete ${confirmDialog.eventTitle}?`
          : `Delete ${confirmDialog.count} selected events?`}
        onCancel={() => setConfirmDialog({ visible: false, type: 'single', eventId: null, eventTitle: '', count: 0 })}
        onConfirm={confirmDeletion}
        cancelText="Cancel"
        confirmText="Delete"
        icon="alert-circle"
        iconColor="#ff4d4d"
      />

      <ConfirmationDialog
        visible={messageDialog.visible}
        title={messageDialog.title}
        message={messageDialog.message}
        onCancel={() => setMessageDialog({ visible: false, title: '', message: '', isError: false })}
        onConfirm={() => setMessageDialog({ visible: false, title: '', message: '', isError: false })}
        cancelText=""
        confirmText="OK"
        icon={messageDialog.isError ? 'alert-circle' : 'checkmark-circle'}
        iconColor={messageDialog.isError ? '#ff4d4d' : '#4CAF50'}
      />
    </View>
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
    overflow: 'visible',
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
});
