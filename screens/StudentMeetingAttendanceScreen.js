import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
  Dimensions,
  StatusBar,
  Animated,
  TextInput,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import SupabaseService from '../services/SupabaseService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function StudentMeetingAttendanceScreen({ navigation }) {
  const { user } = useAuth();
  const [openMeetings, setOpenMeetings] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('open'); // 'open' or 'history'
  
  // Attendance submission modal
  const [attendanceModal, setAttendanceModal] = useState({
    visible: false,
    meeting: null,
    attendanceCode: '',
    sessionType: 'morning'
  });
  
  // Animation refs
  const headerAnim = useRef(new Animated.Value(-100)).current;
  const listAnim = useRef(new Animated.Value(0)).current;
  const tabAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    loadData();
    animateHeader();
  }, []);

  const animateHeader = () => {
    Animated.sequence([
      Animated.timing(headerAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(listAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  };

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('📅 Loading student meeting data...');
      
      // Load both open meetings and attendance history
      const [meetings, history] = await Promise.all([
        SupabaseService.getOpenMeetings(),
        SupabaseService.getStudentAttendanceHistory(user.sNumber)
      ]);
      
      setOpenMeetings(meetings);
      setAttendanceHistory(history);
      
      console.log(`✅ Loaded ${meetings.length} open meetings and ${history.length} attendance records`);
    } catch (error) {
      console.error('❌ Failed to load meeting data:', error);
      Alert.alert('Error', 'Failed to load meeting data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (error) {
      console.error('❌ Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const openAttendanceModal = (meeting) => {
    setAttendanceModal({
      visible: true,
      meeting: meeting,
      attendanceCode: '',
      sessionType: 'morning'
    });
  };

  const closeAttendanceModal = () => {
    setAttendanceModal({
      visible: false,
      meeting: null,
      attendanceCode: '',
      sessionType: 'morning'
    });
  };

  const submitAttendance = async () => {
    const { meeting, attendanceCode, sessionType } = attendanceModal;
    
    if (!attendanceCode.trim()) {
      Alert.alert('Error', 'Please enter the attendance code');
      return;
    }

    try {
      console.log('📝 Submitting attendance...');
      console.log('📝 Meeting ID:', meeting.id);
      console.log('📝 Student S-Number:', user.sNumber);
      console.log('📝 Attendance Code:', attendanceCode);
      console.log('📝 Session Type:', sessionType);
      
      await SupabaseService.submitAttendance(
        meeting.id,
        user.sNumber,
        attendanceCode.trim(),
        sessionType
      );
      
      Alert.alert('Success!', 'Attendance submitted successfully!', [
        { text: 'OK', onPress: () => {
          closeAttendanceModal();
          loadData(); // Refresh data to update history
        }}
      ]);
    } catch (error) {
      console.error('❌ Attendance submission failed:', error);
      Alert.alert('Error', error.message || 'Failed to submit attendance');
    }
  };

  const formatMeetingDate = (dateString) => {
    // Parse the date string and treat it as local time to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed in JavaScript
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatMeetingTime = (meetingType) => {
    return meetingType === 'both' ? 'Morning & Afternoon Sessions' : 'Single Session';
  };

  const formatSubmissionTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderOpenMeetingItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={[styles.meetingCard, { opacity: listAnim }]}
        onPress={() => openAttendanceModal(item)}
        activeOpacity={0.7}
      >
        <View style={styles.meetingHeader}>
          <View style={styles.meetingInfo}>
            <Text style={styles.meetingDate}>{formatMeetingDate(item.meeting_date)}</Text>
            <Text style={styles.meetingTime}>{formatMeetingTime(item.meeting_type)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: '#10b98120' }]}>
            <Text style={[styles.statusText, { color: '#10b981' }]}>
              🔓 Open
            </Text>
          </View>
        </View>
        
        <View style={styles.codeSection}>
          <Text style={styles.codeLabel}>Attendance Code:</Text>
          <Text style={styles.codeText}>{item.attendance_code}</Text>
        </View>
        
        <View style={styles.submitSection}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => openAttendanceModal(item)}
          >
            <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
            <Text style={styles.submitButtonText}>Submit Attendance</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHistoryItem = ({ item }) => {
    return (
      <View style={[styles.historyCard, { opacity: listAnim }]}>
        <View style={styles.historyHeader}>
          <View style={styles.historyInfo}>
            <Text style={styles.historyDate}>
              {item.meetings ? formatMeetingDate(item.meetings.meeting_date) : 'Unknown Meeting'}
            </Text>
            <Text style={styles.historyTime}>
              {item.meetings ? formatMeetingTime(item.meetings.meeting_type) : 'Unknown Type'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: '#10b98120' }]}>
            <Text style={[styles.statusText, { color: '#10b981' }]}>
              ✅ Attended
            </Text>
          </View>
        </View>
        
        <View style={styles.submissionInfo}>
          <Text style={styles.submissionTime}>
            Submitted: {formatSubmissionTime(item.submitted_at)}
          </Text>
          <Text style={styles.submissionCode}>
            Code: {item.attendance_code}
          </Text>
          {item.session_type && (
            <Text style={styles.submissionSession}>
              Session: {item.session_type === 'morning' ? 'Before School' : 
                       item.session_type === 'afternoon' ? 'After School' : 'Both Sessions'}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderTabButton = (tabName, title, icon) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tabName && styles.activeTabButton
      ]}
      onPress={() => {
        setActiveTab(tabName);
        Animated.timing(tabAnim, {
          toValue: tabName === 'open' ? 0 : 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }}
    >
      <Ionicons 
        name={icon} 
        size={20} 
        color={activeTab === tabName ? '#ffffff' : '#4a5568'} 
      />
      <Text style={[
        styles.tabButtonText,
        activeTab === tabName && styles.activeTabButtonText
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a365d" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4299e1" />
          <Text style={styles.loadingText}>Loading meetings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a365d" />
      
      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          { transform: [{ translateY: headerAnim }] }
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meeting Attendance</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {renderTabButton('open', 'Open Meetings', 'calendar-outline')}
        {renderTabButton('history', 'My History', 'time-outline')}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <FlatList
          data={activeTab === 'open' ? openMeetings : attendanceHistory}
          renderItem={activeTab === 'open' ? renderOpenMeetingItem : renderHistoryItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#4299e1']}
              tintColor="#4299e1"
            />
          }
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons 
                name={activeTab === 'open' ? 'calendar-outline' : 'time-outline'} 
                size={64} 
                color="#cbd5e0" 
              />
              <Text style={styles.emptyText}>
                {activeTab === 'open' 
                  ? 'No open meetings available' 
                  : 'No attendance history yet'
                }
              </Text>
              <Text style={styles.emptySubtext}>
                {activeTab === 'open' 
                  ? 'Check back later for upcoming meetings' 
                  : 'Submit attendance for meetings to see your history here'
                }
              </Text>
            </View>
          }
        />
      </View>

      {/* Attendance Submission Modal */}
      <Modal
        visible={attendanceModal.visible}
        transparent
        animationType="slide"
        onRequestClose={closeAttendanceModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submit Attendance</Text>
              <TouchableOpacity onPress={closeAttendanceModal}>
                <Ionicons name="close" size={24} color="#4a5568" />
              </TouchableOpacity>
            </View>
            
            {attendanceModal.meeting && (
              <View style={styles.meetingInfo}>
                <Text style={styles.meetingInfoDate}>
                  {formatMeetingDate(attendanceModal.meeting.meeting_date)}
                </Text>
                <Text style={styles.meetingInfoTime}>
                  {formatMeetingTime(attendanceModal.meeting.meeting_type)}
                </Text>
              </View>
            )}
            
            <Text style={styles.inputLabel}>Session Type</Text>
            <View style={styles.sessionButtons}>
              <TouchableOpacity
                style={[
                  styles.sessionButton,
                  attendanceModal.sessionType === 'morning' && styles.sessionButtonActive
                ]}
                onPress={() => setAttendanceModal(prev => ({ ...prev, sessionType: 'morning' }))}
              >
                <Text style={[
                  styles.sessionButtonText,
                  attendanceModal.sessionType === 'morning' && styles.sessionButtonTextActive
                ]}>Before School</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sessionButton,
                  attendanceModal.sessionType === 'afternoon' && styles.sessionButtonActive
                ]}
                onPress={() => setAttendanceModal(prev => ({ ...prev, sessionType: 'afternoon' }))}
              >
                <Text style={[
                  styles.sessionButtonText,
                  attendanceModal.sessionType === 'afternoon' && styles.sessionButtonTextActive
                ]}>After School</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>Enter Attendance Code</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="Enter the 6-digit code"
              value={attendanceModal.attendanceCode}
              onChangeText={(text) => setAttendanceModal(prev => ({
                ...prev,
                attendanceCode: text.toUpperCase()
              }))}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus={true}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={closeAttendanceModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={submitAttendance}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
    paddingTop: 0,
  },
  header: {
    backgroundColor: '#1a365d',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTabButton: {
    backgroundColor: '#4299e1',
  },
  tabButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
  },
  activeTabButtonText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4a5568',
  },
  listContainer: {
    paddingBottom: 20,
  },
  meetingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  meetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  meetingInfo: {
    flex: 1,
  },
  meetingDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 4,
  },
  meetingTime: {
    fontSize: 14,
    color: '#4a5568',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  codeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f7fafc',
    borderRadius: 8,
  },
  codeLabel: {
    fontSize: 14,
    color: '#4a5568',
    marginRight: 8,
  },
  codeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
    letterSpacing: 2,
  },
  submitSection: {
    alignItems: 'center',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  submitButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 4,
  },
  historyTime: {
    fontSize: 14,
    color: '#4a5568',
  },
  submissionInfo: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f7fafc',
    borderRadius: 8,
  },
  submissionTime: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 4,
  },
  submissionCode: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  submissionSession: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a5568',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  meetingInfo: {
    backgroundColor: '#f7fafc',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  meetingInfoDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 4,
  },
  meetingInfoTime: {
    fontSize: 14,
    color: '#4a5568',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a365d',
    marginBottom: 8,
  },
  sessionButtons: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  sessionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginHorizontal: 4,
  },
  sessionButtonActive: {
    backgroundColor: '#4299e1',
    borderColor: '#4299e1',
  },
  sessionButtonText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
  },
  sessionButtonTextActive: {
    color: '#ffffff',
  },
  codeInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    backgroundColor: '#f7fafc',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#4a5568',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  submitButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
}); 