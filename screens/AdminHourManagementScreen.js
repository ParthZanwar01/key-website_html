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
  Image,
  Dimensions,
  StatusBar,
  Animated,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHours } from '../contexts/HourContext';
import { Ionicons } from '@expo/vector-icons';
import ConfirmationDialog from '../components/ConfirmationDialog';
import GoogleDriveService from '../services/GoogleDriveService';
import SimpleDriveService from '../services/SimpleDriveService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function AdminHourManagementScreen({ navigation }) {
  const { 
    getAllRequests, 
    getPendingRequests, 
    updateHourRequestStatus, 
    refreshHourRequests 
  } = useHours();
  
  const [allRequests, setAllRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [searchQuery, setSearchQuery] = useState('');
  const [lastLoadTime, setLastLoadTime] = useState(null);
  
  // Track which requests are being processed to prevent double-clicks
  const [processingRequests, setProcessingRequests] = useState(new Set());
  
  // Animation refs
  const headerAnim = useRef(new Animated.Value(-100)).current;
  const listAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Modal states
  const [reviewModal, setReviewModal] = useState({
    visible: false,
    request: null,
    action: null, // 'approve' or 'reject'
    notes: ''
  });
  
  const [photoModal, setPhotoModal] = useState({
    visible: false,
    imageName: null,
    imageData: null
  });
  
  const [confirmDialog, setConfirmDialog] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: null
  });
  
  const [messageDialog, setMessageDialog] = useState({
    visible: false,
    title: '',
    message: '',
    isError: false
  });

  useEffect(() => {
    // Load data first
    loadData();
    
    // Start entrance animations
    Animated.sequence([
      Animated.timing(headerAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(listAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();

    // Start pulsing animation
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ]).start(() => pulse());
    };
    pulse();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        loadData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const requests = await getAllRequests();
      console.log('🔍 DEBUG: Loaded requests from database:', requests.length);
      console.log('🔍 DEBUG: Sample requests:', requests.slice(0, 3).map(r => ({
        id: r.id,
        student: r.student_name,
        event: r.event_name,
        status: r.status,
        description: r.description?.substring(0, 50) + '...'
      })));
      
      setAllRequests(requests);
      applyFilters(requests, filter, searchQuery);
      setLastLoadTime(new Date());
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const applyFilters = (requests, filterType, search) => {
    let filtered = [...requests];

    // TEMPORARILY DISABLED: Filter out test data
    // This was filtering out legitimate requests - temporarily disabled for debugging
    /*
    filtered = filtered.filter(request => {
      const studentName = request.student_name?.toLowerCase() || '';
      const eventName = request.event_name?.toLowerCase() || '';
      const description = request.description?.toLowerCase() || '';
      
      // Remove test entries - more comprehensive filtering
      if (studentName.includes('test') || 
          eventName.includes('test') || 
          description.includes('test') ||
          studentName.includes('debug') ||
          eventName.includes('debug') ||
          description.includes('debug') ||
          studentName.includes('upload') ||
          eventName.includes('upload') ||
          description.includes('upload') ||
          studentName.includes('drive') ||
          eventName.includes('drive') ||
          description.includes('drive') ||
          studentName.includes('extraction') ||
          eventName.includes('extraction') ||
          description.includes('extraction') ||
          studentName.includes('photo') ||
          eventName.includes('photo') ||
          description.includes('photo') ||
          // Also filter out entries that look like test data
          studentName.length < 3 ||
          eventName.length < 3 ||
          (description && description.length < 5)) {
        return false;
      }
      
      return true;
    });
    */

    // Apply status filter
    if (filterType !== 'all') {
      filtered = filtered.filter(request => {
        if (filterType === 'pending') return request.status === 'pending';
        if (filterType === 'approved') return request.status === 'approved';
        if (filterType === 'rejected') return request.status === 'rejected';
        return true;
      });
    }

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(request => 
        request.student_name?.toLowerCase().includes(searchLower) ||
        request.event_name?.toLowerCase().includes(searchLower) ||
        request.description?.toLowerCase().includes(searchLower)
      );
    }

    console.log('🔍 DEBUG: After filtering:', filtered.length, 'requests');
    console.log('🔍 DEBUG: Filtered requests:', filtered.slice(0, 3).map(r => ({
      id: r.id,
      student: r.student_name,
      event: r.event_name,
      status: r.status
    })));
    setFilteredRequests(filtered);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    applyFilters(allRequests, newFilter, searchQuery);
  };

  const handleReviewRequest = (request, action) => {
    setReviewModal({
      visible: true,
      request,
      action,
      notes: ''
    });
  };

  const submitReview = async () => {
    if (!reviewModal.request || !reviewModal.action) return;

    const { request, action, notes } = reviewModal;
    const requestId = request.id;

    // Prevent double-clicks
    if (processingRequests.has(requestId)) return;
    setProcessingRequests(prev => new Set([...prev, requestId]));

    try {
      const result = await updateHourRequestStatus(
        requestId,
        action === 'approve' ? 'approved' : 'rejected',
        notes,
        request.student_s_number,
        request.hours_requested
      );

      if (result.success) {
        setMessageDialog({
          visible: true,
          title: 'Success',
          message: `Request ${action === 'approve' ? 'approved' : 'rejected'} successfully!`,
          isError: false
        });

        // Refresh data
        await loadData();
      } else {
        setMessageDialog({
          visible: true,
          title: 'Error',
          message: result.error || 'Failed to update request status',
          isError: true
        });
      }
    } catch (error) {
      setMessageDialog({
        visible: true,
        title: 'Error',
        message: 'An error occurred while processing the request',
        isError: true
      });
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
      setReviewModal({ visible: false, request: null, action: null, notes: '' });
    }
  };

  const extractPhotoData = (description) => {
    // Look for photo data in the description
    if (!description) return null;
    
    // Try different patterns for photo data
    const patterns = [
      /Photo: ([^|]+)/,
      /\[PHOTO_DATA:(.*?)\]/,
      /data:image\/[^;]+;base64,[^|]+/
    ];
    
    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match) {
        const photoData = match[1] || match[0];
        // If it's a base64 data URL, return it as is
        if (photoData.startsWith('data:image/')) {
          return photoData;
        }
        // If it's just base64 data, convert to data URL
        if (photoData && !photoData.startsWith('data:')) {
          return `data:image/jpeg;base64,${photoData}`;
        }
        return photoData;
      }
    }
    
    return null;
  };

  const cleanDescription = (description) => {
    if (!description) return '';
    // Remove photo data patterns from description
    return description
      .replace(/Photo: [^|]+/, '')
      .replace(/\[PHOTO_DATA:.*?\]/, '')
      .replace(/data:image\/[^;]+;base64,[^|]+/, '')
      .trim();
  };

  const testNetlifyConnection = async () => {
    try {
      // Use the actual Netlify URL
      const netlifyFunctionUrl = 'https://crhskeyclubwebsite.netlify.app/.netlify/functions/gasProxy';
      
      console.log('🧪 Testing Netlify function connection...');
      console.log('🌐 URL:', netlifyFunctionUrl);
      
      const response = await fetch(netlifyFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestType: 'connectionTest'
        })
      });
      
      console.log('📨 Test response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Netlify function connection successful:', result);
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Netlify function connection failed:', errorText);
        return false;
      }
    } catch (error) {
      console.error('❌ Netlify function connection test failed:', error);
      return false;
    }
  };

  const savePhotoToDrive = async (imageName, imageData, studentName, eventName) => {
    if (!imageData) {
      Alert.alert('Error', 'No photo data available to save');
      return;
    }

    try {
      console.log('📁 Starting Google Drive upload...');
      console.log('📊 Photo data length:', imageData.length);
      console.log('👤 Student name:', studentName);
      console.log('📅 Event name:', eventName);
      
      // Extract base64 data if it's a data URL
      let base64Data = imageData;
      if (imageData.startsWith('data:image/')) {
        base64Data = imageData.split(',')[1];
        console.log('📝 Extracted base64 data length:', base64Data.length);
      }

      // Create filename with student and event info
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const cleanEventName = eventName.replace(/[^a-zA-Z0-9]/g, '_');
      const cleanStudentName = studentName.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${cleanStudentName}_${cleanEventName}_${timestamp}.jpg`;
      
      console.log('📝 Filename:', fileName);
      
      // Try Netlify function first
      try {
        console.log('🔄 Attempting Netlify function upload...');
        
        // Use the actual Netlify URL
        const netlifyFunctionUrl = 'https://crhskeyclubwebsite.netlify.app/.netlify/functions/gasProxy';
        
        // Prepare the photo info for Google Apps Script
        const photoInfo = {
          requestType: 'savePhotoToDrive',
          fileName: fileName,
          studentName: studentName,
          eventName: eventName,
          timestamp: timestamp,
          folderId: '17Z64oFj5nolu4sQPYAcrdv7KvKKw967l',
          photoData: base64Data
        };
        
        console.log('📤 Sending request to Netlify function...');
        console.log('📋 Request data keys:', Object.keys(photoInfo));
        console.log('🌐 Netlify function URL:', netlifyFunctionUrl);
        
        // Send to Netlify function which will proxy to Google Apps Script
        const response = await fetch(netlifyFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(photoInfo)
        });
        
        console.log('📨 Response received!');
        console.log('📨 Response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('📨 Response result:', result);
          
          if (result.success) {
            Alert.alert(
              'Success', 
              'Photo saved to Google Drive successfully!'
            );
            return;
          } else {
            throw new Error(`Netlify function error: ${result.error}`);
          }
        } else {
          const errorText = await response.text();
          console.error('❌ Netlify function error:', errorText);
          throw new Error(`Netlify function failed: ${response.status} - ${errorText}`);
        }
      } catch (netlifyError) {
        console.warn('⚠️ Netlify function failed, trying SimpleDriveService fallback...', netlifyError);
        
        // Fallback to SimpleDriveService
        try {
          console.log('🔄 Attempting SimpleDriveService upload...');
          
          // Convert base64 data back to data URL for SimpleDriveService
          const dataUrl = `data:image/jpeg;base64,${base64Data}`;
          
          // Use SimpleDriveService uploadImage method
          const result = await SimpleDriveService.uploadImage(
            dataUrl, 
            studentName, // Using student name as S-Number for now
            eventName
          );
          
          console.log('📨 SimpleDriveService result:', result);
          
          if (result.uploadStatus === 'success' || result.fileId) {
            Alert.alert(
              'Success', 
              'Photo saved to Google Drive successfully!'
            );
            return;
          } else {
            throw new Error(`SimpleDriveService error: ${result.error || 'Unknown error'}`);
          }
        } catch (simpleDriveError) {
          console.error('❌ SimpleDriveService also failed:', simpleDriveError);
          throw new Error(`Both upload methods failed. Netlify: ${netlifyError.message}, SimpleDrive: ${simpleDriveError.message}`);
        }
      }
    } catch (error) {
      console.error('❌ Google Drive upload failed:', error);
      Alert.alert(
        'Upload Failed', 
        `Failed to save photo to Google Drive: ${error.message}`
      );
    }
  };

  const viewPhoto = (imageName, imageData) => {
    setPhotoModal({
      visible: true,
      imageName,
      imageData
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#ffd60a';
      case 'approved':
        return '#4CAF50';
      case 'rejected':
        return '#f44336';
      default:
        return '#999';
    }
  };

  const getDisplayStatus = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isRequestProcessed = (request) => {
    return request.status === 'approved' || request.status === 'rejected';
  };

  const isRequestPending = (request) => {
    return request.status === 'pending';
  };

  const renderRequestItem = ({ item, index }) => {
    const photoData = extractPhotoData(item.description);
    const cleanDescriptionText = cleanDescription(item.description);
    const isProcessing = processingRequests.has(item.id);

    return (
      <Animated.View
        style={[
          styles.requestCard,
          { 
            opacity: listAnim,
            transform: [{ scale: listAnim }],
            marginTop: index === 0 ? 10 : 8
          }
        ]}
      >
        {/* Header */}
        <View style={styles.requestHeader}>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{item.student_name}</Text>
            <Text style={styles.studentNumber}>#{item.student_s_number}</Text>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) }
            ]}>
              <Text style={styles.statusText}>
                {getDisplayStatus(item.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Event Info */}
        <View style={styles.eventInfo}>
          <Text style={styles.eventName}>{item.event_name}</Text>
          <Text style={styles.hoursText}>{item.hours_requested} hours</Text>
        </View>

        {/* Description */}
        {cleanDescriptionText && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>{cleanDescriptionText}</Text>
          </View>
        )}

        {/* Photo Section */}
        {photoData && (
          <View style={styles.photoSection}>
            <View style={styles.photoHeader}>
              <Ionicons name="camera" size={16} color="#4299e1" />
              <Text style={styles.photoTitle}>Proof Photo</Text>
            </View>
            
            <View style={styles.photoContainer}>
              <Image 
                source={{ uri: photoData }}
                style={styles.photoThumbnail}
                resizeMode="cover"
              />
              
              <View style={styles.photoActions}>
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={() => viewPhoto(item.event_name, photoData)}
                >
                  <Ionicons name="eye" size={16} color="#4299e1" />
                  <Text style={styles.photoButtonText}>View</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={() => savePhotoToDrive(item.event_name, photoData, item.student_name, item.event_name)}
                >
                  <Ionicons name="cloud-upload" size={16} color="#4299e1" />
                  <Text style={styles.photoButtonText}>Save to Drive</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.photoButton, { backgroundColor: 'rgba(255, 193, 7, 0.2)' }]}
                  onPress={() => testNetlifyConnection().then(available => {
                    Alert.alert(
                      'Connection Test', 
                      available ? 'Netlify function is accessible!' : 'Netlify function is not accessible. Check your deployment.'
                    );
                  })}
                >
                  <Ionicons name="wifi" size={16} color="#ffc107" />
                  <Text style={styles.photoButtonText}>Test Connection</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Date */}
        <Text style={styles.dateText}>
          Submitted: {formatDate(item.created_at)}
        </Text>

        {/* Action Buttons */}
        {isRequestPending(item) && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleReviewRequest(item, 'approve')}
              disabled={isProcessing}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Approve</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleReviewRequest(item, 'reject')}
              disabled={isProcessing}
            >
              <Ionicons name="close" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="small" color="#ffd60a" />
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  const getFilterCounts = () => {
    return {
      all: allRequests.length,
      pending: allRequests.filter(r => r.status === 'pending').length,
      approved: allRequests.filter(r => r.status === 'approved').length,
      rejected: allRequests.filter(r => r.status === 'rejected').length
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffd60a" />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }

  const counts = getFilterCounts();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e90ff" />
      
      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          { transform: [{ translateY: headerAnim }] }
        ]}
      >
        <Text style={styles.headerTitle}>Hour Requests</Text>
      </Animated.View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {[
          { key: 'all', label: 'All', count: counts.all },
          { key: 'pending', label: 'Pending', count: counts.pending },
          { key: 'approved', label: 'Approved', count: counts.approved },
          { key: 'rejected', label: 'Rejected', count: counts.rejected }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.filterTab,
              filter === tab.key && styles.activeFilterTab
            ]}
            onPress={() => handleFilterChange(tab.key)}
          >
            <Text style={[
              styles.filterTabText,
              filter === tab.key && styles.activeFilterTabText
            ]}>
              {tab.label} ({tab.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#ffd60a" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by student, event, or description..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            applyFilters(allRequests, filter, text);
          }}
        />
      </View>

      {/* Requests List */}
      <FlatList
        data={filteredRequests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#ffd60a']}
            tintColor="#ffd60a"
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Review Modal */}
      <Modal
        visible={reviewModal.visible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {reviewModal.action === 'approve' ? 'Approve' : 'Reject'} Request
            </Text>
            
            <Text style={styles.modalSubtitle}>
              Student: {reviewModal.request?.student_name}
            </Text>
            <Text style={styles.modalSubtitle}>
              Event: {reviewModal.request?.event_name}
            </Text>
            <Text style={styles.modalSubtitle}>
              Hours: {reviewModal.request?.hours_requested}
            </Text>
            
            <TextInput
              style={styles.notesInput}
              placeholder="Add notes (optional)..."
              placeholderTextColor="#999"
              value={reviewModal.notes}
              onChangeText={(text) => setReviewModal(prev => ({ ...prev, notes: text }))}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setReviewModal({ visible: false, request: null, action: null, notes: '' })}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  reviewModal.action === 'approve' ? styles.approveButton : styles.rejectButton
                ]}
                onPress={submitReview}
              >
                <Text style={styles.actionButtonText}>
                  {reviewModal.action === 'approve' ? 'Approve' : 'Reject'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Photo Modal */}
      <Modal
        visible={photoModal.visible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.photoModalContainer}>
            <Text style={styles.photoModalTitle}>Photo Information</Text>
            <Text style={styles.photoModalText}>
              Photo filename: {photoModal.imageName}
            </Text>
            
            {photoModal.imageData && (
              <View style={styles.fullPhotoContainer}>
                <Image 
                  source={{ uri: photoModal.imageData }}
                  style={styles.fullPhoto}
                  resizeMode="contain"
                />
              </View>
            )}
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setPhotoModal({ visible: false, imageName: null, imageData: null })}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        visible={confirmDialog.visible}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onCancel={() => setConfirmDialog({ visible: false, title: '', message: '', onConfirm: null })}
        onConfirm={confirmDialog.onConfirm}
      />

      {/* Message Dialog */}
      <ConfirmationDialog
        visible={messageDialog.visible}
        title={messageDialog.title}
        message={messageDialog.message}
        onCancel={() => setMessageDialog({ visible: false, title: '', message: '', isError: false })}
        onConfirm={() => setMessageDialog({ visible: false, title: '', message: '', isError: false })}
        cancelText=""
        confirmText="OK"
        icon={messageDialog.isError ? "alert-circle" : "checkmark-circle"}
        iconColor={messageDialog.isError ? "#ff4d4d" : "#4CAF50"}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a365d',
    padding: 10,
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
  requestCard: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4299e1',
    marginBottom: 2,
  },
  studentNumber: {
    fontSize: 14,
    color: '#ccc',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  eventInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  hoursText: {
    fontSize: 14,
    color: '#ffd60a',
    fontWeight: 'bold',
  },
  descriptionContainer: {
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  photoSection: {
    marginBottom: 12,
  },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  photoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4299e1',
    marginLeft: 6,
  },
  photoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  photoActions: {
    flex: 1,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(66, 153, 225, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 6,
  },
  photoButtonText: {
    fontSize: 12,
    color: '#4299e1',
    marginLeft: 4,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 214, 10, 0.1)',
    borderRadius: 6,
  },
  processingText: {
    fontSize: 12,
    color: '#ffd60a',
    marginLeft: 6,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 8,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeFilterTab: {
    backgroundColor: '#4299e1',
  },
  filterTabText: {
    fontSize: 12,
    color: '#ccc',
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    color: '#fff',
    fontSize: 14,
  },
  listContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a365d',
  },
  loadingText: {
    color: '#ffd60a',
    fontSize: 16,
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#2d3748',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 4,
  },
  notesInput: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    marginTop: 12,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  photoModalContainer: {
    backgroundColor: '#2d3748',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  photoModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  photoModalText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 16,
  },
  fullPhotoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  fullPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  closeButton: {
    backgroundColor: '#4299e1',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});