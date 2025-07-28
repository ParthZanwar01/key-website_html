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
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ]).start(pulse);
    };
    pulse();
    
    // Set up auto-refresh every 10 seconds
    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing admin data...');
      loadData();
    }, 10000); // Refresh every 10 seconds
    
    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, []);

  // Floating sparkles component


  const loadData = async () => {
    try {
      console.log('🔄 Loading fresh data from Supabase...');
      
      // Import and call SupabaseService directly
      const SupabaseService = (await import('../services/SupabaseService')).default;
      const requests = await SupabaseService.getAllHourRequests();
      
      console.log('✅ Admin screen loaded requests:', requests.length);
      
      // Debug: Check first few requests
      if (requests.length > 0) {
        console.log('First request sample:', {
          id: requests[0].id,
          studentName: requests[0].student_name,
          eventName: requests[0].event_name,
          hasImageName: !!requests[0].image_name,
          imageName: requests[0].image_name
        });
      }
      
      setAllRequests(requests);
      setLastLoadTime(new Date().toISOString());
      applyFilters(requests, filter, searchQuery);
      console.log('📊 Data loaded successfully:', {
        totalRequests: requests.length,
        filteredRequests: requests.filter(r => filter === 'all' || r.status === filter).length,
        loadTime: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Manual refresh triggered...');
      await loadData(); // Load fresh data directly
    } catch (error) {
      console.error('❌ Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const applyFilters = (requests, filterType, search) => {
    let filtered = requests;
    
    console.log('🔍 Applying filters:', {
      totalRequests: requests.length,
      filterType,
      search: search.trim()
    });
    
    // Apply status filter
    if (filterType !== 'all') {
      filtered = filtered.filter(request => {
        const status = request.status?.toLowerCase();
        return status === filterType || 
               (filterType === 'approved' && (status === 'approve' || status === 'approved')) ||
               (filterType === 'rejected' && (status === 'reject' || status === 'rejected'));
      });
      console.log('📊 After status filter:', filtered.length, 'requests');
    }
    
    // Apply search filter
    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(request => 
        request.student_name?.toLowerCase().includes(query) ||
        request.student_s_number?.toLowerCase().includes(query) ||
        request.event_name?.toLowerCase().includes(query) ||
        request.description?.toLowerCase().includes(query)
      );
      console.log('📊 After search filter:', filtered.length, 'requests');
    }
    
    setFilteredRequests(filtered);
    console.log('✅ Filtered requests set:', filtered.length);
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
    const { request, action, notes } = reviewModal;
    
    if (!request) return;
    
    try {
      console.log('🔄 Starting review process:', { requestId: request.id, action, studentSNumber: request.student_s_number, hoursRequested: request.hours_requested });
      
      setProcessingRequests(prev => new Set(prev).add(request.id));
      
      // Check student hours BEFORE approval
      const { supabase } = require('../supabase/supabaseClient');
      const { data: studentBefore, error: beforeError } = await supabase
        .from('students')
        .select('*')
        .eq('s_number', request.student_s_number.toLowerCase())
        .single();
      
      console.log('📊 Student hours BEFORE approval:', studentBefore?.total_hours || 0);
      
      // Use the correct action (approve or reject) and pass hours_requested explicitly
      await updateHourRequestStatus(
        request.id, 
        action, // use the actual action from the modal
        notes, 
        'Admin',
        request.hours_requested // pass the hours explicitly
      );
      
      // Check student hours AFTER approval
      const { data: studentAfter, error: afterError } = await supabase
        .from('students')
        .select('*')
        .eq('s_number', request.student_s_number.toLowerCase())
        .single();
      
      console.log('📊 Student hours AFTER approval:', studentAfter?.total_hours || 0);
      console.log('📊 Hours change:', (studentAfter?.total_hours || 0) - (studentBefore?.total_hours || 0));
      
      // Refresh the data after approval/rejection
      await loadData();
      
      setMessageDialog({
        visible: true,
        title: 'Success',
        message: `Request ${action === 'approved' ? 'approved' : 'rejected'} successfully!${action === 'approved' ? ' Student hours have been updated.' : ''}`,
        isError: false
      });
      
    } catch (error) {
      console.error('❌ Failed to update request:', error);
      setMessageDialog({
        visible: true,
        title: 'Error',
        message: `Failed to ${action} request: ${error.message}`,
        isError: true
      });
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(request.id);
        return newSet;
      });
      setReviewModal({ visible: false, request: null, action: null, notes: '' });
    }
  };

  // Helper function to extract photo data from description
  const extractPhotoData = (description) => {
    if (!description) return null;
    const match = description.match(/\[PHOTO_DATA:(.*?)\]/);
    return match ? match[1] : null;
  };

  // Helper function to clean description (remove photo data)
  const cleanDescription = (description) => {
    if (!description) return '';
    return description.replace(/\n\n\[PHOTO_DATA:.*?\]/, '');
  };

  const savePhotoToDrive = async (imageName, imageData, studentName, eventName) => {
    if (!imageData) {
      Alert.alert('Error', 'No photo data available to save');
      return;
    }

    try {
      console.log('📁 Starting Google Drive upload...');
      
      // Create filename with student and event info
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const cleanEventName = eventName.replace(/[^a-zA-Z0-9]/g, '_');
      const cleanStudentName = studentName.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${cleanStudentName}_${cleanEventName}_${timestamp}.jpg`;
      
      console.log('📝 Filename:', fileName);
      
      // For now, let's use a simple approach that saves the photo data
      // to a text file in your Google Drive using the existing gasProxy
      const photoInfo = {
        requestType: 'savePhotoToDrive',
        fileName: fileName,
        studentName: studentName,
        eventName: eventName,
        timestamp: timestamp,
        folderId: '17Z64oFj5nolu4sQPYAcrdv7KvKKw967l',
        photoData: imageData, // Include the actual photo data
        photoDataLength: imageData.length
      };
      
      // Send to Google Apps Script via Netlify function proxy
      const response = await fetch('/.netlify/functions/gasProxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(photoInfo)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Photo saved to Google Drive:', result);
        Alert.alert(
          'Success!', 
          `Photo saved to Google Drive as "${fileName}"\n\nStudent: ${studentName}\nEvent: ${eventName}\n\nCheck your Google Drive folder for the new file!`
        );
      } else {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }
      
    } catch (error) {
      console.error('❌ Google Drive upload failed:', error);
      Alert.alert(
        'Upload Failed', 
        `Failed to save photo to Google Drive: ${error.message}\n\nThis feature requires Google Apps Script setup.`
      );
    }
  };

  const viewPhoto = (imageName, imageData) => {
    if (!imageName) return;
    
    setPhotoModal({
      visible: true,
      imageName,
      imageData: imageData ? `data:image/jpeg;base64,${imageData}` : null
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'approve':
        return '#4299e1';
      case 'rejected':
      case 'reject':
        return '#e53e3e';
      case 'pending':
        return '#ff9800';
      default:
        return '#9e9e9e';
    }
  };

  const getDisplayStatus = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'approve':
        return 'Approved';
      case 'rejected':
      case 'reject':
        return 'Rejected';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const isRequestProcessed = (request) => {
    const status = request.status?.toLowerCase();
    return status === 'approved' || status === 'rejected' || status === 'approve' || status === 'reject';
  };

  const isRequestPending = (request) => {
    return request.status?.toLowerCase() === 'pending';
  };

  const renderRequestItem = ({ item, index }) => {
    const isProcessed = isRequestProcessed(item);
    const isPending = isRequestPending(item);
    const isBeingProcessed = processingRequests.has(item.id);
    
    // Debug: Log photo data for first few items
    if (index < 3) {
      console.log(`Request ${index}:`, {
        id: item.id,
        studentName: item.student_name,
        eventName: item.event_name,
        hasImageName: !!item.image_name,
        hasPhotoData: !!extractPhotoData(item.description),
        imageName: item.image_name
      });
    }

    return (
      <Animated.View 
        style={[
          styles.requestItem,
          {
            opacity: listAnim,
            transform: [
              { translateY: listAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) },
              { scale: listAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }
            ]
          }
        ]}
      >
        <View style={styles.requestHeader}>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{item.student_name || 'Unknown Student'}</Text>
            <Text style={styles.studentId}>{item.student_s_number || 'No ID'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getDisplayStatus(item.status)}</Text>
          </View>
        </View>
        
        <Text style={styles.eventName}>{item.event_name || 'No Event Name'}</Text>
        
        <View style={styles.requestDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#ffd60a" />
            <Text style={styles.detailText}>Event: {formatDate(item.event_date)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color="#ffd60a" />
            <Text style={styles.detailText}>Hours: {item.hours_requested || '0'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="paper-plane-outline" size={16} color="#ffd60a" />
            <Text style={styles.detailText}>Submitted: {formatDate(item.submitted_at)}</Text>
          </View>
        </View>
        
        <Text style={styles.description} numberOfLines={3}>
          {cleanDescription(item.description) || 'No description provided'}
        </Text>

        {/* Photo section */}
        {item.image_name && (
          <View style={styles.photoSection}>
            <View style={styles.photoHeader}>
              <Ionicons name="camera" size={16} color="#ffd60a" />
              <Text style={styles.photoLabel}>Proof Photo</Text>
            </View>
            
            {/* Show photo preview if we have image data in description */}
            {item.description && item.description.includes('[PHOTO_DATA:') ? (
              <View style={styles.photoPreview}>
                <Image 
                  source={{ uri: `data:image/jpeg;base64,${extractPhotoData(item.description)}` }}
                  style={styles.photoThumbnail}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.viewPhotoButton}
                  onPress={() => viewPhoto(item.image_name, extractPhotoData(item.description))}
                >
                  <Ionicons name="expand" size={16} color="#ffd60a" />
                  <Text style={styles.viewPhotoText}>View Full Size</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.saveToDriveButton}
                  onPress={() => savePhotoToDrive(item.image_name, extractPhotoData(item.description), item.student_name, item.event_name)}
                >
                  <Ionicons name="cloud-upload" size={16} color="#ffd60a" />
                  <Text style={styles.saveToDriveText}>Save to Drive</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.noPhotoContainer}>
                <Ionicons name="image-outline" size={24} color="#666" />
                <Text style={styles.noPhotoText}>Photo not available</Text>
                <Text style={styles.photoFilename}>Filename: {item.image_name}</Text>
              </View>
            )}
          </View>
        )}
        
        {isPending && !isBeingProcessed && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => {
                console.log('Approve button pressed for request:', item.id);
                handleReviewRequest(item, 'approve');
              }}
            >
              <Ionicons name="checkmark" size={16} color="white" />
              <Text style={styles.actionButtonText}>Approve</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => {
                console.log('Reject button pressed for request:', item.id);
                handleReviewRequest(item, 'reject');
              }}
            >
              <Ionicons name="close" size={16} color="white" />
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}

        {isBeingProcessed && (
          <View style={styles.processingIndicator}>
            <ActivityIndicator size="small" color="#ffd60a" />
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        )}
        
        {isProcessed && item.reviewed_at && (
          <View style={styles.reviewInfo}>
            <Text style={styles.reviewInfoText}>
              {getDisplayStatus(item.status)} on {formatDate(item.reviewed_at)}
              {item.reviewed_by && ` by ${item.reviewed_by}`}
            </Text>
            {item.admin_notes && (
              <Text style={styles.adminNotes}>Notes: {item.admin_notes}</Text>
            )}
          </View>
        )}
      </Animated.View>
    );
  };

  const getFilterCounts = () => {
    return {
      all: allRequests.length,
      pending: allRequests.filter(r => isRequestPending(r)).length,
      approved: allRequests.filter(r => {
        const status = r.status?.toLowerCase();
        return status === 'approved' || status === 'approve';
      }).length,
      rejected: allRequests.filter(r => {
        const status = r.status?.toLowerCase();
        return status === 'rejected' || status === 'reject';
      }).length
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
  requestTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e2e8f0',
    marginBottom: 2,
  },
  requestSNumber: {
    fontSize: 13,
    color: '#cbd5e0',
    marginBottom: 6,
  },
  requestStatus: {
    backgroundColor: '#4299e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  requestStatusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  requestDetails: {
    color: '#e2e8f0',
    fontSize: 15,
    marginBottom: 4,
  },
  requestMeta: {
    color: '#cbd5e0',
    fontSize: 13,
    marginBottom: 2,
  },
  proofPhotoLabel: {
    color: '#4299e1',
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 10,
    marginBottom: 4,
  },
  proofPhotoBox: {
    backgroundColor: 'rgba(66,153,225,0.08)',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  viewFullSizeButton: {
    backgroundColor: '#4299e1',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 6,
    alignSelf: 'center',
  },
  viewFullSizeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Lighter background
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Lighter background
  },
  activeFilterTab: {
    backgroundColor: '#ffd700', // Bright yellow
  },
  filterTabText: {
    fontSize: 12,
    color: '#ffffff', // White for contrast against ocean blue
    fontWeight: '600',
  },
  activeFilterTabText: {
    color: '#000080', // Navy blue for contrast against yellow
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Lighter background
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffd700', // Bright yellow
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000080', // Navy blue for contrast
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  requestItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.3)',
    shadowColor: '#ffd60a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffd60a',
    marginBottom: 2,
  },
  studentId: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  requestDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },
  photoSection: {
    marginBottom: 8,
    backgroundColor: 'rgba(255, 214, 10, 0.05)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.2)',
  },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  photoLabel: {
    fontSize: 14,
    color: '#ffd60a',
    marginLeft: 6,
    fontWeight: 'bold',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(255, 214, 10, 0.1)',
    borderRadius: 6,
  },
  photoText: {
    fontSize: 14,
    color: '#ffd60a',
    marginLeft: 6,
    fontWeight: '500',
  },
  photoPreview: {
    marginTop: 8,
    alignItems: 'center',
  },
  photoThumbnail: {
    width: 150,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffd60a',
    shadowColor: '#ffd60a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  viewPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 6,
    backgroundColor: 'rgba(255, 214, 10, 0.1)',
    borderRadius: 6,
  },
  viewPhotoText: {
    fontSize: 12,
    color: '#ffd60a',
    marginLeft: 4,
    fontWeight: '500',
  },
  saveToDriveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    padding: 6,
    backgroundColor: 'rgba(255, 214, 10, 0.1)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffd60a',
  },
  saveToDriveText: {
    fontSize: 12,
    color: '#ffd60a',
    marginLeft: 4,
    fontWeight: '500',
  },
  noPhotoContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
  },
  noPhotoText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  photoFilename: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
  },
  approveButton: {
    backgroundColor: '#4299e1',
  },
  rejectButton: {
    backgroundColor: '#e53e3e',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  processingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  processingText: {
    color: '#ffd60a',
    marginLeft: 8,
    fontSize: 14,
  },
  reviewInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
  },
  reviewInfoText: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  adminNotes: {
    fontSize: 12,
    color: '#ffd60a',
    marginTop: 4,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d1b2a',
  },
  loadingText: {
    color: '#ffd60a',
    fontSize: 16,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1a365d',
    borderRadius: 18,
    padding: 28,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(66,153,225,0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4299e1',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ffd60a',
    borderRadius: 6,
    padding: 12,
    marginTop: 12,
    marginBottom: 16,
    fontSize: 14,
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#718096',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 22,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: '#4299e1',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 22,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  photoModalContainer: {
    backgroundColor: '#1a365d',
    borderRadius: 18,
    padding: 28,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(66,153,225,0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  photoModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffd60a',
    marginBottom: 12,
  },
  photoModalText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  closeButton: {
    backgroundColor: '#ffd60a',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginTop: 12,
  },
  closeButtonText: {
    color: '#0d1b2a',
    fontSize: 14,
    fontWeight: 'bold',
  },
  fullPhotoContainer: {
    marginVertical: 12,
    alignItems: 'center',
  },
  fullPhoto: {
    width: 250,
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffd60a',
  },
});