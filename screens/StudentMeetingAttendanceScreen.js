import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  Dimensions,
  StatusBar,
  Animated,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import SupabaseService from '../services/SupabaseService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function StudentMeetingAttendanceScreen({ navigation }) {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [missedMeetings, setMissedMeetings] = useState([]);
  
  // Modal states
  const [attendanceModal, setAttendanceModal] = useState({
    visible: false,
    meeting: null,
    code: '',
    sessionType: 'morning'
  });
  
  // Animation refs
  const headerAnim = useRef(new Animated.Value(-100)).current;
  const listAnim = useRef(new Animated.Value(0)).current;
  
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
      console.log('📅 Loading meeting attendance data...');
      
      // Load all meetings
      const allMeetings = await SupabaseService.getAllMeetings();
      
      // Load student's attendance history
      const attendance = await SupabaseService.getStudentAttendance(user.sNumber);
      
      // Get missed meetings
      const missed = await SupabaseService.getStudentMissedMeetings(user.sNumber);
      
      setMeetings(allMeetings);
      setStudentAttendance(attendance);
      setMissedMeetings(missed);
      
      console.log(`✅ Loaded ${allMeetings.length} meetings, ${attendance.length} attended, ${missed.length} missed`);
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
      code: '',
      sessionType: 'morning'
    });
  };

  const closeAttendanceModal = () => {
    setAttendanceModal({
      visible: false,
      meeting: null,
      code: '',
      sessionType: 'morning'
    });
  };

  const submitAttendance = async () => {
    if (!attendanceModal.code.trim()) {
      Alert.alert('Error', 'Please enter the attendance code');
      return;
    }

    try {
      console.log('✅ Submitting attendance...');
      
      await SupabaseService.submitAttendance(
        attendanceModal.meeting.id,
        user.sNumber,
        attendanceModal.code.trim(),
        attendanceModal.sessionType
      );
      
      Alert.alert('Success!', 'Attendance submitted successfully!', [
        { text: 'OK', onPress: () => {
          closeAttendanceModal();
          loadData(); // Refresh data
        }}
      ]);
    } catch (error) {
      console.error('❌ Attendance submission failed:', error);
      Alert.alert('Error', error.message || 'Failed to submit attendance');
    }
  };

  const getAttendanceStatus = (meeting) => {
    const attended = studentAttendance.find(a => a.meeting_id === meeting.id);
    if (attended) {
      return { status: 'attended', text: '✓ Attended', color: '#10b981' };
    }
    
    // Check if meeting date has passed
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const meetingDate = new Date(meeting.meeting_date);
    meetingDate.setHours(0, 0, 0, 0);
    const hasPassed = meetingDate < today;
    
    if (hasPassed) {
      const missed = missedMeetings.find(m => m.id === meeting.id);
      if (missed) {
        return { status: 'missed', text: '✗ Missed', color: '#ef4444' };
      }
    }
    
    if (meeting.is_open) {
      return { status: 'open', text: '📝 Mark Attendance', color: '#3b82f6' };
    } else {
      return { status: 'closed', text: '🔒 Closed', color: '#6b7280' };
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

  const getSeasonalTheme = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const monthNum = date.getMonth() + 1; // 1-12
    
    if (monthNum >= 12 || monthNum <= 2) {
      return {
        name: 'winter',
        backgroundColor: 'rgba(147, 197, 253, 0.15)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        icon: '❄️',
        gradient: ['#dbeafe', '#bfdbfe']
      };
    } else if (monthNum >= 3 && monthNum <= 5) {
      return {
        name: 'spring',
        backgroundColor: 'rgba(167, 243, 208, 0.15)',
        borderColor: 'rgba(34, 197, 94, 0.3)',
        icon: '🌸',
        gradient: ['#dcfce7', '#bbf7d0']
      };
    } else if (monthNum >= 6 && monthNum <= 8) {
      return {
        name: 'summer',
        backgroundColor: 'rgba(254, 243, 199, 0.15)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
        icon: '☀️',
        gradient: ['#fef3c7', '#fde68a']
      };
    } else {
      return {
        name: 'fall',
        backgroundColor: 'rgba(254, 215, 170, 0.15)',
        borderColor: 'rgba(251, 146, 60, 0.3)',
        icon: '🍂',
        gradient: ['#fed7aa', '#fdba74']
      };
    }
  };

  const formatMeetingTime = (meetingType) => {
    return meetingType === 'both' ? 'Morning & Afternoon Sessions' : 'Single Session';
  };

  const renderMeetingItem = ({ item }) => {
    const attendanceStatus = getAttendanceStatus(item);
    const isAttended = attendanceStatus.status === 'attended';
    const canMarkAttendance = attendanceStatus.status === 'open';
    const seasonalTheme = getSeasonalTheme(item.meeting_date);
    
    return (
      <TouchableOpacity 
        style={[
          styles.meetingCard, 
          { 
            opacity: listAnim,
            backgroundColor: seasonalTheme.backgroundColor,
            borderColor: seasonalTheme.borderColor,
          }
        ]}
        onPress={() => {
          if (canMarkAttendance) {
            openAttendanceModal(item);
          }
        }}
        activeOpacity={canMarkAttendance ? 0.7 : 1}
      >
        <View style={styles.meetingHeader}>
          <View style={styles.meetingInfo}>
            <View style={styles.dateRow}>
              <Text style={styles.seasonalIcon}>{seasonalTheme.icon}</Text>
              <Text style={styles.meetingDate}>{formatMeetingDate(item.meeting_date)}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: attendanceStatus.color + '20' }]}>
            <Text style={[styles.statusText, { color: attendanceStatus.color }]}>
              {attendanceStatus.text}
            </Text>
          </View>
        </View>
        
        {isAttended && (
          <View style={styles.attendedInfo}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.attendedText}>Attendance confirmed</Text>
          </View>
        )}
        
        {canMarkAttendance && (
          <View style={styles.markAttendanceHint}>
            <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
            <Text style={styles.markAttendanceHintText}>Tap to mark attendance</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderAttendanceSummary = () => {
    const totalMeetings = meetings.length;
    const attendedCount = studentAttendance.length;
    const missedCount = missedMeetings.length;
    const remainingCount = totalMeetings - attendedCount - missedCount;
    
    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Attendance Summary</Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryNumber}>{attendedCount}</Text>
            <Text style={styles.summaryLabel}>Attended</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryNumber}>{missedCount}</Text>
            <Text style={styles.summaryLabel}>Missed</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryNumber}>{remainingCount}</Text>
            <Text style={styles.summaryLabel}>Remaining</Text>
          </View>
        </View>
        {missedCount >= 3 && (
          <View style={styles.warningContainer}>
            <Ionicons name="warning" size={16} color="#f59e0b" />
            <Text style={styles.warningText}>
              You have missed {missedCount} meetings. Maximum allowed is 3.
            </Text>
          </View>
        )}
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>Meeting Attendance</Text>
      </Animated.View>

      {/* Content */}
      <View style={styles.content}>
        {/* Back Button */}
        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#4299e1" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
        
        {renderAttendanceSummary()}
        
        <Text style={styles.sectionTitle}>All Meetings</Text>
        
        <FlatList
          data={meetings}
          renderItem={renderMeetingItem}
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
        />
      </View>

      {/* Attendance Modal */}
      <Modal
        visible={attendanceModal.visible}
        transparent
        animationType="slide"
        onRequestClose={closeAttendanceModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mark Attendance</Text>
            <Text style={styles.modalSubtitle}>
              {attendanceModal.meeting && formatMeetingDate(attendanceModal.meeting.meeting_date)}
            </Text>
            <Text style={styles.modalInstruction}>
              Select which session you attended and enter the attendance code:
            </Text>
            
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
            
            <Text style={styles.inputLabel}>Attendance Code</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="Enter 6-digit code"
              value={attendanceModal.code}
              onChangeText={(text) => setAttendanceModal(prev => ({ ...prev, code: text.toUpperCase() }))}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
              textAlign="center"
              fontSize={18}
              letterSpacing={2}
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
    backgroundColor: '#1a365d',
    paddingTop: 0,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4299e1',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 10,
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
  content: {
    flex: 1,
    padding: 10,
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
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(66,153,225,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e2e8f0',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4299e1',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#cbd5e0',
    marginTop: 4,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  warningText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#92400e',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e2e8f0',
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  meetingCard: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(66,153,225,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  meetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  meetingInfo: {
    flex: 1,
  },
  meetingDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e2e8f0',
    marginBottom: 2,
  },
  meetingTime: {
    fontSize: 13,
    color: '#cbd5e0',
    marginBottom: 6,
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
  attendedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  attendedText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#10b981',
  },
  markAttendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ebf8ff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  markAttendanceHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  markAttendanceHintText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#3b82f6',
    fontStyle: 'italic',
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a365d',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#4a5568',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalInstruction: {
    fontSize: 14,
    color: '#4a5568',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  codeInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    backgroundColor: '#f7fafc',
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
    backgroundColor: '#4299e1',
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
  backButtonContainer: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(66,153,225,0.3)',
    alignSelf: 'flex-start',
  },
  backButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  seasonalIcon: {
    fontSize: 20,
    marginRight: 8,
  },
}); 