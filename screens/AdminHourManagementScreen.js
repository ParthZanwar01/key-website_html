import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHours } from '../contexts/HourContext';
import { Ionicons } from '@expo/vector-icons';
import ConfirmationDialog from '../components/ConfirmationDialog';

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
  
  // Modal states
  const [reviewModal, setReviewModal] = useState({
    visible: false,
    request: null,
    action: null, // 'approve' or 'reject'
    notes: ''
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

  const loadData = async () => {
    try {
      const requests = getAllRequests();
      console.log('Admin screen loaded requests:', requests.length);
      setAllRequests(requests);
      applyFilters(requests, filter, searchQuery);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshHourRequests();
      await loadData();
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const applyFilters = (requests, filterType, search) => {
    let filtered = requests;
    
    // Apply status filter
    if (filterType !== 'all') {
      filtered = filtered.filter(request => request.status === filterType);
    }
    
    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(request =>
        request.eventName.toLowerCase().includes(searchLower) ||
        request.studentName.toLowerCase().includes(searchLower) ||
        request.studentSNumber.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredRequests(filtered);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters(allRequests, filter, searchQuery);
  }, [filter, searchQuery, allRequests]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const handleReviewRequest = (request, action) => {
    console.log('Starting review for request:', request.id, 'action:', action);
    setReviewModal({
      visible: true,
      request: request,
      action: action,
      notes: ''
    });
  };

  const submitReview = async () => {
    const { request, action, notes } = reviewModal;
    
    console.log('Submitting review:', {
      requestId: request.id,
      action: action,
      notes: notes,
      studentSNumber: request.studentSNumber,
      hoursRequested: request.hoursRequested
    });
    
    setReviewModal({ visible: false, request: null, action: null, notes: '' });
    
    try {
      console.log('Calling updateHourRequestStatus...');
      
      await updateHourRequestStatus(request.id, action, notes);
      
      console.log('updateHourRequestStatus completed successfully');
      
      setMessageDialog({
        visible: true,
        title: 'Success',
        message: `Request ${action === 'approve' ? 'approved' : 'rejected'} successfully!${action === 'approve' ? ' Student hours have been updated.' : ''}`,
        isError: false
      });
      
      // Refresh data
      console.log('Refreshing data after status update...');
      await refreshHourRequests();
      await loadData();
      
    } catch (error) {
      console.error('Failed to update request:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status
      });
      
      setMessageDialog({
        visible: true,
        title: 'Error',
        message: `Failed to ${action} request: ${error.message}. Please try again.`,
        isError: true
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'approved': return '#27ae60';
      case 'rejected': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderRequestItem = ({ item }) => (
    <View style={styles.requestItem}>
      <View style={styles.requestHeader}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.studentName}</Text>
          <Text style={styles.studentId}>{item.studentSNumber}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.eventName}>{item.eventName}</Text>
      
      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>Event: {formatDate(item.eventDate)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.detailText}>Hours: {item.hoursRequested}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="paper-plane-outline" size={16} color="#666" />
          <Text style={styles.detailText}>Submitted: {formatDate(item.submittedAt)}</Text>
        </View>
      </View>
      
      <Text style={styles.description} numberOfLines={3}>
        {item.description}
      </Text>
      
      {item.status === 'pending' && (
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
      
      {item.status !== 'pending' && item.reviewedAt && (
        <View style={styles.reviewInfo}>
          <Text style={styles.reviewInfoText}>
            {item.status === 'approved' ? '✓ Approved' : '✗ Rejected'} on {formatDate(item.reviewedAt)}
            {item.reviewedBy && ` by ${item.reviewedBy}`}
          </Text>
          {item.adminNotes && (
            <Text style={styles.adminNotes}>Notes: {item.adminNotes}</Text>
          )}
        </View>
      )}
    </View>
  );

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
        <ActivityIndicator size="large" color="#59a2f0" />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }

  const counts = getFilterCounts();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hour Requests</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by student name, ID, or event..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {[
          { key: 'all', label: `All (${counts.all})` },
          { key: 'pending', label: `Pending (${counts.pending})` },
          { key: 'approved', label: `Approved (${counts.approved})` },
          { key: 'rejected', label: `Rejected (${counts.rejected})` }
        ].map((filterOption) => (
          <TouchableOpacity
            key={filterOption.key}
            style={[
              styles.filterTab,
              filter === filterOption.key && styles.activeFilterTab
            ]}
            onPress={() => handleFilterChange(filterOption.key)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === filterOption.key && styles.activeFilterTabText
              ]}
            >
              {filterOption.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Requests List */}
      {filteredRequests.length > 0 ? (
        <FlatList
          data={filteredRequests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#59a2f0']}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={60} color="#ccc" />
          <Text style={styles.emptyTitle}>No Requests Found</Text>
          <Text style={styles.emptyText}>
            {filter === 'all' 
              ? "No hour requests have been submitted yet."
              : `No ${filter} requests found.`}
          </Text>
        </View>
      )}

      {/* Review Modal */}
      <Modal
        transparent={true}
        visible={reviewModal.visible}
        animationType="fade"
        onRequestClose={() => setReviewModal({ visible: false, request: null, action: null, notes: '' })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reviewModalContainer}>
            <Text style={styles.reviewModalTitle}>
              {reviewModal.action === 'approve' ? 'Approve' : 'Reject'} Request
            </Text>
            
            {reviewModal.request && (
              <View style={styles.reviewRequestInfo}>
                <Text style={styles.reviewRequestText}>
                  <Text style={styles.bold}>Student:</Text> {reviewModal.request.studentName} ({reviewModal.request.studentSNumber})
                </Text>
                <Text style={styles.reviewRequestText}>
                  <Text style={styles.bold}>Event:</Text> {reviewModal.request.eventName}
                </Text>
                <Text style={styles.reviewRequestText}>
                  <Text style={styles.bold}>Hours:</Text> {reviewModal.request.hoursRequested}
                </Text>
              </View>
            )}
            
            <Text style={styles.notesLabel}>
              {reviewModal.action === 'approve' ? 'Notes (optional):' : 'Reason for rejection:'}
            </Text>
            <TextInput
              style={styles.notesInput}
              placeholder={reviewModal.action === 'approve' 
                ? "Add any notes..." 
                : "Please provide a reason for rejection"}
              value={reviewModal.notes}
              onChangeText={(text) => setReviewModal(prev => ({ ...prev, notes: text }))}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.reviewModalButtons}>
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={() => setReviewModal({ visible: false, request: null, action: null, notes: '' })}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.confirmModalButton,
                  { backgroundColor: reviewModal.action === 'approve' ? '#27ae60' : '#e74c3c' }
                ]}
                onPress={() => {
                  console.log('Confirm button pressed in modal');
                  submitReview();
                }}
              >
                <Text style={styles.confirmModalButtonText}>
                  {reviewModal.action === 'approve' ? 'Approve' : 'Reject'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
  headerRight: {
    width: 34, // Same width as back button for balance
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 2,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: '#59a2f0',
  },
  filterTabText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 15,
  },
  requestItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  studentId: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  requestDetails: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
    marginBottom: 15,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 0.48,
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: '#27ae60',
  },
  rejectButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  reviewInfo: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#59a2f0',
  },
  reviewInfoText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  adminNotes: {
    fontSize: 12,
    color: '#555',
    marginTop: 5,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewModalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  reviewModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  reviewRequestInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    marginBottom: 15,
  },
  reviewRequestText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  bold: {
    fontWeight: 'bold',
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 20,
    minHeight: 80,
  },
  reviewModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelModalButton: {
    flex: 0.48,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelModalButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  confirmModalButton: {
    flex: 0.48,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: 'center',
  },
  confirmModalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});