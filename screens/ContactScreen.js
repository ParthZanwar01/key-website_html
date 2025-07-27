import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Animated,
  Easing,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import SupabaseService from '../services/SupabaseService';
import ConfirmationDialog from '../components/ConfirmationDialog';

export default function ContactScreen() {
  const { user, isAdmin } = useAuth();
  
  // FAQ dropdown states
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [animatedValues] = useState({});
  
  // Contact form states
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Support questions management (admin only)
  const [supportQuestions, setSupportQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Sorting state
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, status, name
  const [showSortMenu, setShowSortMenu] = useState(false);
  
  // Dialog states
  const [dialogs, setDialogs] = useState({
    error: { visible: false, message: '' },
    success: { visible: false, message: '' },
    export: { visible: false },
    video: { visible: false, video: null },
    respond: { visible: false, question: null, response: '' }
  });

  // FAQ data
  const faqData = [
    {
      id: 1,
      question: "How do I submit volunteer hours?",
      answer: "To submit volunteer hours, go to the 'Hours' tab and tap 'Request Hours'. Fill out the form with your event details, date, and number of hours. Include a detailed description of your volunteer work for faster approval."
    },
    {
      id: 2,
      question: "How long does hour approval take?",
      answer: "Hour requests are typically reviewed within 3-5 business days. You'll see the status update in your 'My Hour Requests' section. Approved hours will automatically be added to your total."
    },
    {
      id: 3,
      question: "How do I sign up for events?",
      answer: "Browse events in the Calendar tab. Tap any event to view details and sign up. Make sure to provide accurate contact information as organizers may send updates or reminders."
    },
    {
      id: 4,
      question: "What if I forgot my password?",
      answer: "Contact your Key Club sponsor or an officer to reset your password. For security reasons, password resets must be done manually by an administrator."
    },
    {
      id: 5,
      question: "How can I see my total volunteer hours?",
      answer: "Your current volunteer hours are displayed on the Home screen. You can also view a detailed breakdown of all your hour requests in the 'Hours' section."
    },
    {
      id: 6,
      question: "Can I edit or cancel my event registration?",
      answer: "Currently, you'll need to contact an officer to modify your event registration. Use the contact form below or speak with an officer directly."
    }
  ];

  // Show dialog helper
  const showDialog = (type, data = {}) => {
    setDialogs(prev => ({
      ...prev,
      [type]: { visible: true, ...data }
    }));
  };

  // Hide dialog helper
  const hideDialog = (type) => {
    setDialogs(prev => ({
      ...prev,
      [type]: { visible: false }
    }));
  };

  // Sort questions based on selected criteria
  const sortQuestions = (questions, criteria) => {
    const questionsCopy = [...questions];
    
    switch (criteria) {
      case 'newest':
        return questionsCopy.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
      case 'oldest':
        return questionsCopy.sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
      case 'status':
        return questionsCopy.sort((a, b) => {
          const aResolved = (a.resolved === 'true' || a.status === 'resolved');
          const bResolved = (b.resolved === 'true' || b.status === 'resolved');
          if (aResolved === bResolved) {
            // If same status, sort by newest
            return new Date(b.submitted_at) - new Date(a.submitted_at);
          }
          // Open questions first, then resolved
          return aResolved - bResolved;
        });
      case 'name':
        return questionsCopy.sort((a, b) => {
          const nameA = (a.name || '').toLowerCase();
          const nameB = (b.name || '').toLowerCase();
          if (nameA === nameB) {
            // If same name, sort by newest
            return new Date(b.submitted_at) - new Date(a.submitted_at);
          }
          return nameA.localeCompare(nameB);
        });
      case 'subject':
        return questionsCopy.sort((a, b) => {
          const subjectA = (a.subject || '').toLowerCase();
          const subjectB = (b.subject || '').toLowerCase();
          if (subjectA === subjectB) {
            // If same subject, sort by newest
            return new Date(b.submitted_at) - new Date(a.submitted_at);
          }
          return subjectA.localeCompare(subjectB);
        });
      default:
        return questionsCopy.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
    }
  };

  // Get sorted questions
  const getSortedQuestions = () => {
    return sortQuestions(supportQuestions, sortBy);
  };

  // Handle sort option selection
  const handleSortChange = (newSortBy) => {
    console.log('Changing sort to:', newSortBy);
    setSortBy(newSortBy);
    setShowSortMenu(false);
  };

  // Sort options for the dropdown
  const sortOptions = [
    { key: 'newest', label: 'Newest First', icon: 'time' },
    { key: 'oldest', label: 'Oldest First', icon: 'time-outline' },
    { key: 'status', label: 'By Status (Open First)', icon: 'flag' },
    { key: 'name', label: 'By Student Name', icon: 'person' },
    { key: 'subject', label: 'By Subject', icon: 'chatbubble' }
  ];

  // Handle admin response to question
  const handleRespondToQuestion = (question) => {
    setDialogs(prev => ({
      ...prev,
      respond: { 
        visible: true, 
        question: question,
        response: question.admin_response || '' // Pre-fill if already has response
      }
    }));
  };

  // Submit admin response
  const submitAdminResponse = async () => {
    const { question, response } = dialogs.respond;
    
    if (!response.trim()) {
      showDialog('error', { message: 'Please enter a response before submitting.' });
      return;
    }

    try {
      console.log('Submitting admin response for question:', question.id);
      
      // Update the question with admin response using Supabase
      await SupabaseService.updateSupportQuestion(question.id, {
        admin_response: response.trim(),
        responded_at: new Date().toISOString(),
        responded_by: user?.name || 'Admin',
        resolved: true,
        status: 'resolved'
      });
      
      console.log('Admin response saved successfully');
      
      // Update local state
      setSupportQuestions(prevQuestions => 
        prevQuestions.map(q => 
          q.id === question.id ? {
            ...q,
            admin_response: response.trim(),
            responded_at: new Date().toISOString(),
            responded_by: user?.name || 'Admin',
            resolved: true,
            status: 'resolved'
          } : q
        )
      );
      
      // Hide response dialog
      hideDialog('respond');
      
      // Show success message
      showDialog('success', { 
        message: 'Response sent successfully! The student has been notified.',
        onConfirm: () => {
          hideDialog('success');
          // Refresh from server to ensure sync
          loadSupportQuestions();
        }
      });
      
    } catch (error) {
      console.error('Failed to submit admin response:', error);
      showDialog('error', { 
        message: 'Failed to submit response. Please try again.'
      });
    }
  };

  // Mark question as resolved without response
  const markAsResolved = async (question) => {
    try {
      console.log('Marking question as resolved:', question.id);
      
      // Update the question status using Supabase
      await SupabaseService.updateSupportQuestion(question.id, {
        resolved: true,
        status: 'resolved',
        responded_at: new Date().toISOString(),
        responded_by: user?.name || 'Admin'
      });
      
      console.log('Question marked as resolved');
      
      // Update local state
      setSupportQuestions(prevQuestions => 
        prevQuestions.map(q => 
          q.id === question.id ? {
            ...q,
            resolved: true,
            status: 'resolved',
            responded_at: new Date().toISOString(),
            responded_by: user?.name || 'Admin'
          } : q
        )
      );
      
      // Show success message
      showDialog('success', { 
        message: 'Question marked as resolved.',
        onConfirm: () => {
          hideDialog('success');
          // Refresh from server to ensure sync
          loadSupportQuestions();
        }
      });
      
    } catch (error) {
      console.error('Failed to mark as resolved:', error);
      showDialog('error', { 
        message: 'Failed to update question status. Please try again.'
      });
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadSupportQuestions();
    }
  }, [isAdmin]);

  // Load support questions from Supabase
  const loadSupportQuestions = async () => {
    try {
      setLoadingQuestions(true);
      console.log('Loading support questions from Supabase...');
      
      const questions = await SupabaseService.getAllSupportQuestions();
      
      setSupportQuestions(questions);
      console.log(`Loaded ${questions.length} support questions`);
    } catch (error) {
      console.error('Failed to load support questions:', error);
      showDialog('error', { message: 'Failed to load support questions from database.' });
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Save question to Supabase
  const saveQuestionToSupabase = async (questionData) => {
    try {
      await SupabaseService.submitSupportQuestion({
        studentId: user?.id,
        name: user?.name || user?.sNumber || 'Unknown User',
        sNumber: user?.sNumber || 'N/A',
        subject: questionData.subject,
        message: questionData.message,
        userType: isAdmin ? 'admin' : 'student'
      });
      return true;
    } catch (error) {
      console.error('Failed to save question to Supabase:', error);
      throw error;
    }
  };

  // Export questions to CSV (admin only)
  const exportQuestions = async () => {
    if (!isAdmin) return;
    
    try {
      setExporting(true);
      
      // Create CSV content
      const headers = [
        'ID',
        'Name',
        'Student S-Number',
        'Subject',
        'Message',
        'Submitted At',
        'Status',
        'User Type',
        'Resolved',
        'Admin Response',
        'Responded At',
        'Responded By'
      ];
      
      const csvContent = [
        headers.join(','),
        ...supportQuestions.map(q => [
          q.id || '',
          `"${q.name || ''}"`,
          q.s_number || q.studentSNumber || '',
          `"${q.subject || ''}"`,
          `"${(q.message || '').replace(/"/g, '""')}"`,
          q.submitted_at || '',
          q.status || '',
          q.user_type || '',
          q.resolved || '',
          `"${(q.admin_response || '').replace(/"/g, '""')}"`,
          q.responded_at || '',
          q.responded_by || ''
        ].join(','))
      ].join('\n');
      
      // In a real app, you would use a file system API to save the CSV
      // For now, we'll show the count and simulate the export
      showDialog('export', { 
        message: `Exported ${supportQuestions.length} support questions.\n\nIn a production app, this would download a CSV file with all the question data.`
      });
      
      console.log('CSV Content generated:', csvContent.slice(0, 200) + '...');
      
    } catch (error) {
      console.error('Export failed:', error);
      showDialog('error', { message: 'Could not export questions. Please try again.' });
    } finally {
      setExporting(false);
    }
  };

  const videoGuides = [
    {
      id: 1,
      title: "Getting Started with the Key Club App",
      description: "A complete walkthrough of logging in and navigating the app",
      thumbnail: "play-circle",
      duration: "3:45",
      url: "https://example.com/video1" // Replace with actual video URLs
    },
    {
      id: 2,
      title: "How to Submit Volunteer Hours",
      description: "Step-by-step guide to requesting volunteer hour approval",
      thumbnail: "play-circle",
      duration: "2:30",
      url: "https://example.com/video2"
    },
    {
      id: 3,
      title: "Event Registration Process",
      description: "Learn how to browse and sign up for Key Club events",
      thumbnail: "play-circle",
      duration: "2:15",
      url: "https://example.com/video3"
    }
  ];

  // Initialize animated value for FAQ item
  const initializeAnimation = (id) => {
    if (!animatedValues[id]) {
      animatedValues[id] = new Animated.Value(0);
    }
    return animatedValues[id];
  };

  // Toggle FAQ expansion
  const toggleFaq = (id) => {
    const animatedValue = initializeAnimation(id);
    
    if (expandedFaq === id) {
      // Collapse
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start();
      setExpandedFaq(null);
    } else {
      // Collapse previous if any
      if (expandedFaq !== null) {
        const prevAnimatedValue = initializeAnimation(expandedFaq);
        Animated.timing(prevAnimatedValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
      
      // Expand new
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start();
      setExpandedFaq(id);
    }
  };

  // Handle video guide press
  const handleVideoPress = (video) => {
    showDialog('video', { 
      video,
      message: "This would open the video guide. In a real app, this would link to your actual video content."
    });
  };

  // Handle contact form submission
  const handleContactSubmit = async () => {
    if (!contactForm.subject || !contactForm.message) {
      showDialog('error', { message: 'Please fill out all fields before submitting.' });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Save to Supabase
      await saveQuestionToSupabase(contactForm);
      
      showDialog('success', { 
        message: 'Thank you for your message. Your question has been saved and an officer will get back to you within 24-48 hours.',
        onConfirm: () => {
          setContactForm({ 
            subject: '', 
            message: '' 
          });
          hideDialog('success');
        }
      });
    } catch (error) {
      console.error('Failed to submit question:', error);
      showDialog('error', { 
        message: 'Failed to save your question. Please try again or contact an officer directly.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render FAQ item
  const renderFaqItem = (item) => {
    const animatedValue = initializeAnimation(item.id);
    const isExpanded = expandedFaq === item.id;
    
    const maxHeight = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 200],
    });

    const iconRotation = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg'],
    });

    return (
      <View key={item.id} style={styles.faqItem}>
        <TouchableOpacity
          style={styles.faqHeader}
          onPress={() => toggleFaq(item.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.faqQuestion}>{item.question}</Text>
          <Animated.View style={{ transform: [{ rotate: iconRotation }] }}>
            <Ionicons name="chevron-down" size={20} color="#4299e1" />
          </Animated.View>
        </TouchableOpacity>
        
        <Animated.View style={[styles.faqAnswer, { maxHeight }]}>
          <Text style={styles.faqAnswerText}>{item.answer}</Text>
        </Animated.View>
      </View>
    );
  };

  // Render support question item (admin only)
  const renderSupportQuestion = (question, index) => (
    <View key={question.id || index} style={styles.supportQuestion}>
      <View style={styles.questionHeader}>
        <View style={styles.questionInfo}>
          <Text style={styles.questionSubject}>{question.subject}</Text>
          <Text style={styles.questionMeta}>
            From: {question.name}
          </Text>
          <Text style={styles.questionMeta}>
            S-Number: {question.s_number || question.studentSNumber || 'N/A'}
          </Text>
          <Text style={styles.questionMeta}>
            Submitted: {new Date(question.submitted_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: (question.resolved === true || question.status === 'resolved') ? '#48bb78' : '#6c757d' }
        ]}>
          <Text style={styles.statusText}>
            {(question.resolved === true || question.status === 'resolved') ? 'RESOLVED' : 'OPEN'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.questionMessage}>{question.message}</Text>
      
      {question.admin_response && (
        <View style={styles.adminResponseContainer}>
          <Text style={styles.adminResponseLabel}>Admin Response:</Text>
          <Text style={styles.adminResponseText}>{question.admin_response}</Text>
          <Text style={styles.adminResponseMeta}>
            Responded by {question.responded_by} on {new Date(question.responded_at).toLocaleDateString()}
          </Text>
        </View>
      )}
      
      {/* Admin Action Buttons */}
      {isAdmin && (
        <View style={styles.adminActions}>
          {(question.resolved !== true && question.status !== 'resolved') ? (
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.respondButton}
                onPress={() => handleRespondToQuestion(question)}
              >
                <Ionicons name="chatbubble-outline" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Respond</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.resolveButton}
                onPress={() => markAsResolved(question)}
              >
                <Ionicons name="checkmark-outline" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Mark Resolved</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.resolvedIndicator}>
              <Ionicons name="checkmark-circle" size={16} color="#48bb78" />
              <Text style={styles.resolvedText}>Resolved</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderVideoGuide = (video) => (
    <TouchableOpacity
      key={video.id}
      style={styles.videoItem}
      onPress={() => handleVideoPress(video)}
      activeOpacity={0.7}
    >
      <View style={styles.videoThumbnail}>
        <Ionicons name={video.thumbnail} size={40} color="#fff" />
        <Text style={styles.videoDuration}>{video.duration}</Text>
      </View>
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle}>{video.title}</Text>
        <Text style={styles.videoDescription}>{video.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="help-circle" size={32} color="#4299e1" />
          <Text style={styles.headerTitle}>Help & Support</Text>
          <Text style={styles.headerSubtitle}>
            Find answers, watch guides, or contact us directly
          </Text>
        </View>

        {/* Admin Section - Support Questions Management */}
        {isAdmin && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="settings" size={24} color="#4299e1" />
              <Text style={styles.sectionTitle}>Support Questions Management</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.sortButton}
                  onPress={() => setShowSortMenu(!showSortMenu)}
                >
                  <Ionicons name="funnel" size={16} color="#4299e1" />
                  <Text style={styles.sortButtonText}>Sort</Text>
                  <Ionicons name={showSortMenu ? "chevron-up" : "chevron-down"} size={14} color="#4299e1" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.exportButton}
                  onPress={exportQuestions}
                  disabled={exporting || supportQuestions.length === 0}
                >
                  {exporting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="download" size={16} color="#0d1b2a" />
                  )}
                  <Text style={styles.exportButtonText}>
                    {exporting ? 'Exporting...' : 'Export CSV'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Sort Menu */}
            {showSortMenu && (
              <View style={styles.sortMenu}>
                <Text style={styles.sortMenuTitle}>Sort Questions By:</Text>
                {sortOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.sortOption,
                      sortBy === option.key && styles.activeSortOption
                    ]}
                    onPress={() => handleSortChange(option.key)}
                  >
                    <Ionicons 
                      name={option.icon} 
                      size={16} 
                      color={sortBy === option.key ? "#4299e1" : "#cbd5e0"} 
                    />
                    <Text style={[
                      styles.sortOptionText,
                      sortBy === option.key && styles.activeSortOptionText
                    ]}>
                      {option.label}
                    </Text>
                    {sortBy === option.key && (
                      <Ionicons name="checkmark" size={16} color="#4299e1" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            {loadingQuestions ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4299e1" />
                <Text style={styles.loadingText}>Loading support questions...</Text>
              </View>
            ) : (
              <View style={styles.supportSection}>
                {supportQuestions.length > 0 ? (
                  <>
                    <Text style={styles.questionsCount}>
                      {supportQuestions.length} total questions • {' '}
                      {supportQuestions.filter(q => q.resolved !== true && q.status !== 'resolved').length} open • {' '}
                      {supportQuestions.filter(q => q.resolved === true || q.status === 'resolved').length} resolved
                      {sortBy !== 'newest' && (
                        <Text style={styles.sortIndicator}> • Sorted by {sortOptions.find(o => o.key === sortBy)?.label}</Text>
                      )}
                    </Text>
                    
                    <TouchableOpacity
                      style={styles.refreshButton}
                      onPress={() => {
                        console.log('Manual refresh triggered');
                        loadSupportQuestions();
                      }}
                    >
                      <Ionicons name="refresh" size={16} color="#4299e1" />
                      <Text style={styles.refreshButtonText}>Refresh</Text>
                    </TouchableOpacity>
                    
                    <ScrollView 
                      style={styles.questionsScrollView}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={false}
                    >
                      {getSortedQuestions().slice(0, 10).map(renderSupportQuestion)}
                      {supportQuestions.length > 10 && (
                        <Text style={styles.moreQuestionsText}>
                          Showing 10 of {supportQuestions.length} questions. 
                          Export CSV to view all questions.
                        </Text>
                      )}
                    </ScrollView>
                  </>
                ) : (
                  <View style={styles.noQuestionsContainer}>
                    <Ionicons name="chatbubbles-outline" size={40} color="#666" />
                    <Text style={styles.noQuestionsText}>No support questions yet</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* FAQ Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-buoy" size={24} color="#4299e1" />
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          </View>
          
          <View style={styles.faqContainer}>
            {faqData.map(renderFaqItem)}
          </View>
        </View>

        {/* Video Guides Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="play-circle" size={24} color="#4299e1" />
            <Text style={styles.sectionTitle}>Video Guides</Text>
          </View>
          
          <View style={styles.videoContainer}>
            {videoGuides.map(renderVideoGuide)}
          </View>
        </View>

        {/* Contact Form Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="mail" size={24} color="#4299e1" />
            <Text style={styles.sectionTitle}>Contact Us</Text>
          </View>
          
          <View style={styles.contactForm}>
            <Text style={styles.contactFormDescription}>
              Can't find what you're looking for? Send us a message and we'll get back to you!
            </Text>
            
            {/* Show user info */}
            <View style={styles.userInfoDisplay}>
              <Text style={styles.userInfoLabel}>Submitting as:</Text>
              <Text style={styles.userInfoValue}>
                {user?.name || user?.sNumber || 'Unknown User'}
                {user?.sNumber && ` (${user.sNumber})`}
              </Text>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Subject *</Text>
              <TextInput
                style={styles.formInput}
                value={contactForm.subject}
                onChangeText={(text) => setContactForm(prev => ({ ...prev, subject: text }))}
                placeholder="Brief description of your inquiry"
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Message *</Text>
              <TextInput
                style={styles.formTextArea}
                value={contactForm.message}
                onChangeText={(text) => setContactForm(prev => ({ ...prev, message: text }))}
                placeholder="Please provide details about your question or issue..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleContactSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Text>
              {!isSubmitting && <Ionicons name="send" size={16} color="#0d1b2a" style={styles.sendIcon} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Contact Info */}
        <View style={styles.quickContact}>
          <Text style={styles.quickContactTitle}>Need Immediate Help?</Text>
          <Text style={styles.quickContactText}>
            Speak with an officer during club meetings or contact your faculty sponsor directly.
          </Text>
        </View>
      </ScrollView>

      {/* Error Dialog */}
      <ConfirmationDialog
        visible={dialogs.error.visible}
        title="Error"
        message={dialogs.error.message}
        onCancel={() => hideDialog('error')}
        onConfirm={() => hideDialog('error')}
        cancelText=""
        confirmText="OK"
        icon="alert-circle"
        iconColor="#ff4d4d"
      />

      {/* Success Dialog */}
      <ConfirmationDialog
        visible={dialogs.success.visible}
        title="Success"
        message={dialogs.success.message}
        onCancel={() => {
          if (dialogs.success.onConfirm) dialogs.success.onConfirm();
          hideDialog('success');
        }}
        onConfirm={() => {
          if (dialogs.success.onConfirm) dialogs.success.onConfirm();
          hideDialog('success');
        }}
        cancelText=""
        confirmText="OK"
        icon="checkmark-circle"
        iconColor="#4CAF50"
      />

      {/* Export Dialog */}
      <ConfirmationDialog
        visible={dialogs.export.visible}
        title="Export Complete"
        message={dialogs.export.message}
        onCancel={() => hideDialog('export')}
        onConfirm={() => hideDialog('export')}
        cancelText=""
        confirmText="OK"
        icon="download"
        iconColor="#4CAF50"
      />

      {/* Admin Response Dialog */}
      <ConfirmationDialog
        visible={dialogs.respond.visible}
        title="Respond to Question"
        message=""
        onCancel={() => hideDialog('respond')}
        onConfirm={submitAdminResponse}
        cancelText="Cancel"
        confirmText="Send Response"
        icon="chatbubble"
        iconColor="#59a2f0"
        customContent={
          <View style={styles.responseDialogContent}>
            {dialogs.respond.question && (
              <View style={styles.questionPreview}>
                <Text style={styles.questionPreviewTitle}>Question:</Text>
                <Text style={styles.questionPreviewSubject}>{dialogs.respond.question.subject}</Text>
                <Text style={styles.questionPreviewFrom}>
                  From: {dialogs.respond.question.name} ({dialogs.respond.question.s_number || dialogs.respond.question.studentSNumber})
                </Text>
                <Text style={styles.questionPreviewMessage}>{dialogs.respond.question.message}</Text>
              </View>
            )}
            
            <Text style={styles.responseLabel}>Your Response:</Text>
            <TextInput
              style={styles.responseInput}
              value={dialogs.respond.response}
              onChangeText={(text) => setDialogs(prev => ({
                ...prev,
                respond: { ...prev.respond, response: text }
              }))}
              placeholder="Type your response to the student here..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <Text style={styles.responseNote}>
              This response will be saved and the question will be marked as resolved.
            </Text>
          </View>
        }
      />

      {/* Video Dialog */}
      <ConfirmationDialog
        visible={dialogs.video.visible}
        title={dialogs.video.video?.title || "Video Guide"}
        message={dialogs.video.message}
        onCancel={() => hideDialog('video')}
        onConfirm={() => {
          // In a real app, you would open the video URL
          // Linking.openURL(dialogs.video.video?.url);
          console.log("Opening video:", dialogs.video.video?.title);
          hideDialog('video');
        }}
        cancelText="Cancel"
        confirmText="Watch"
        icon="play-circle"
        iconColor="#59a2f0"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a365d', // Deep navy blue background
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: 'rgba(66, 153, 225, 0.1)', // Professional blue with transparency
    borderBottomWidth: 1,
    borderBottomColor: '#4299e1',
    paddingVertical: 15,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(66, 153, 225, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4299e1', // Professional blue
    textShadowColor: 'rgba(66, 153, 225, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4299e1', // Professional blue
    marginBottom: 15,
    textShadowColor: 'rgba(66, 153, 225, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  faqContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  faqItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Subtle transparency
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(66, 153, 225, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0', // Light gray
    flex: 1,
    marginRight: 10,
  },
  faqIcon: {
    color: '#4299e1', // Professional blue
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(66, 153, 225, 0.1)',
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#cbd5e0', // Medium gray
    lineHeight: 20,
  },
  
  // Video Guide Styles
  videoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
  },
  videoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  videoThumbnail: {
    width: 60,
    height: 45,
    backgroundColor: '#59a2f0',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    position: 'relative',
  },
  videoDuration: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    fontSize: 10,
    color: '#fff',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 3,
  },
  videoDescription: {
    fontSize: 14,
    color: '#ccc',
  },
  
  // Contact Form Styles
  contactForm: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Subtle transparency
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(66, 153, 225, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  contactFormDescription: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 20,
    textAlign: 'center',
  },
  userInfoDisplay: {
    backgroundColor: 'rgba(89, 162, 240, 0.1)',
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(89, 162, 240, 0.3)',
  },
  userInfoLabel: {
    fontSize: 12,
    color: '#59a2f0',
    fontWeight: '600',
    marginBottom: 3,
  },
  userInfoValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0', // Light gray
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2d3748', // Dark gray
    borderWidth: 1,
    borderColor: 'rgba(66, 153, 225, 0.2)',
  },
  formTextArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2d3748', // Dark gray
    borderWidth: 1,
    borderColor: 'rgba(66, 153, 225, 0.2)',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#4299e1', // Professional blue
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#718096', // Medium gray
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButtonTextDisabled: {
    color: '#a0aec0', // Light gray
  },
  sendIcon: {
    marginLeft: 8,
  },
  
  // Admin Question Management Styles
  supportSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Subtle transparency
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(66, 153, 225, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  questionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 15,
  },
  questionsCount: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 15,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(89, 162, 240, 0.2)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 15,
  },
  refreshButtonText: {
    color: '#59a2f0',
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '600',
  },
  questionsScrollView: {
    maxHeight: 400,
  },
  questionItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#59a2f0',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  questionInfo: {
    flex: 1,
    marginRight: 10,
  },
  questionSubject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e2e8f0', // Light gray
    marginBottom: 5,
  },
  questionMeta: {
    fontSize: 12,
    color: '#a0aec0', // Light gray
    marginBottom: 2,
  },
  questionMessage: {
    fontSize: 14,
    color: '#cbd5e0', // Medium gray
    lineHeight: 18,
    marginBottom: 10,
  },
  adminResponseContainer: {
    backgroundColor: 'rgba(72, 187, 120, 0.1)', // Green with transparency
    borderRadius: 6,
    padding: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#48bb78', // Green
  },
  adminResponseLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#48bb78', // Green
    marginBottom: 5,
  },
  adminResponseText: {
    fontSize: 14,
    color: '#e2e8f0', // Light gray
    marginBottom: 5,
  },
  adminResponseMeta: {
    fontSize: 11,
    color: '#a0aec0', // Light gray
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
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4299e1', // Professional blue
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 10,
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#a0aec0', // Light gray
    marginTop: 10,
    fontSize: 14,
  },
  noQuestionsContainer: {
    alignItems: 'center',
    padding: 30,
  },
  noQuestionsText: {
    color: '#718096', // Medium gray
    fontSize: 16,
    marginTop: 10,
  },
  moreQuestionsText: {
    fontSize: 12,
    color: '#a0aec0', // Light gray
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 15,
    padding: 10,
  },
  
  // Sort Menu Styles
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(66, 153, 225, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 10,
  },
  sortButtonText: {
    color: '#4299e1', // Professional blue
    fontSize: 12,
    fontWeight: 'bold',
    marginHorizontal: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortMenu: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(66, 153, 225, 0.3)',
  },
  sortMenuTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e2e8f0', // Light gray
    marginBottom: 10,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 5,
  },
  activeSortOption: {
    backgroundColor: 'rgba(66, 153, 225, 0.2)',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#cbd5e0', // Medium gray
    marginLeft: 10,
    flex: 1,
  },
  activeSortOptionText: {
    color: '#4299e1', // Professional blue
    fontWeight: 'bold',
  },
  sortIndicator: {
    fontSize: 12,
    color: '#4299e1', // Professional blue
    fontStyle: 'italic',
  },
  
  // Admin Actions Styles
  adminActions: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  respondButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4299e1', // Professional blue
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 0.48,
    justifyContent: 'center',
  },
  resolveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#48bb78', // Green
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 0.48,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  resolvedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  resolvedText: {
    color: '#48bb78', // Green
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  
  // Response Dialog Styles
  responseDialogContent: {
    marginVertical: 15,
  },
  questionPreview: {
    backgroundColor: 'rgba(66, 153, 225, 0.1)',
    borderRadius: 6,
    padding: 12,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#4299e1', // Professional blue
  },
  questionPreviewTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4299e1', // Professional blue
    marginBottom: 5,
  },
  questionPreviewSubject: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2d3748', // Dark gray
    marginBottom: 3,
  },
  questionPreviewFrom: {
    fontSize: 12,
    color: '#718096', // Medium gray
    marginBottom: 8,
  },
  questionPreviewMessage: {
    fontSize: 13,
    color: '#4a5568', // Dark gray
    lineHeight: 18,
  },
  responseLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2d3748', // Dark gray
    marginBottom: 8,
  },
  responseInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0', // Light gray
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 10,
    backgroundColor: '#ffffff',
  },
  responseNote: {
    fontSize: 11,
    color: '#718096', // Medium gray
    fontStyle: 'italic',
    textAlign: 'center',
  },
  quickContact: {
    margin: 15,
    padding: 15,
    backgroundColor: 'rgba(66, 153, 225, 0.1)', // Professional blue with transparency
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(66, 153, 225, 0.3)',
    alignItems: 'center',
  },
  quickContactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4299e1', // Professional blue
    marginBottom: 5,
  },
  quickContactText: {
    fontSize: 14,
    color: '#cbd5e0', // Medium gray
    textAlign: 'center',
  },
});