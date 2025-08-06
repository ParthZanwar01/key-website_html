import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  FlatList,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHelper } from '../contexts/HelperContext';
import { useAuth } from '../contexts/AuthContext';

export default function HelpModal() {
  const { showHelpModal, helpContent, hideHelp, startTutorial, tutorialState } = useHelper();
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('getting-started');

  const helpSections = {
    'getting-started': {
      title: 'Getting Started',
      icon: 'rocket',
      content: [
        {
          title: 'Welcome to Key Club',
          description: 'Learn the basics of using the Key Club app',
          action: () => startTutorial('welcome'),
          completed: tutorialState.completedTutorials.includes('welcome'),
        },
        {
          title: 'Student Features',
          description: 'Discover features available to students',
          action: () => startTutorial('studentFeatures'),
          completed: tutorialState.completedTutorials.includes('studentFeatures'),
          showFor: 'student',
        },
        {
          title: 'Admin Features',
          description: 'Learn about administrative tools',
          action: () => startTutorial('adminFeatures'),
          completed: tutorialState.completedTutorials.includes('adminFeatures'),
          showFor: 'admin',
        },
      ],
    },
    'features': {
      title: 'Features Guide',
      icon: 'grid',
      content: [
        {
          title: 'Hour Tracking',
          description: 'How to submit and track volunteer hours',
          content: `
            <h3>Submitting Hours</h3>
            <p>1. Navigate to "Request Hours" from the menu</p>
            <p>2. Fill in the event details and hours worked</p>
            <p>3. Submit for approval by club officers</p>
            
            <h3>Tracking Progress</h3>
            <p>View your progress on the home screen</p>
            <p>See your total hours and percentage toward goals</p>
          `,
        },
        {
          title: 'Event Registration',
          description: 'How to browse and register for events',
          content: `
            <h3>Finding Events</h3>
            <p>1. Go to "Events" from the main menu</p>
            <p>2. Browse upcoming events and activities</p>
            <p>3. Tap on an event to see details</p>
            
            <h3>Registering</h3>
            <p>1. Select "Register" on the event page</p>
            <p>2. Confirm your registration</p>
            <p>3. Receive confirmation and reminders</p>
          `,
        },
        {
          title: 'Announcements',
          description: 'Stay updated with club announcements',
          content: `
            <h3>Reading Announcements</h3>
            <p>1. Check the "Announcements" section</p>
            <p>2. Read important updates from club officers</p>
            <p>3. Stay informed about upcoming events</p>
          `,
        },
        {
          title: 'Meeting Attendance',
          description: 'Track your meeting participation',
          content: `
            <h3>Checking In</h3>
            <p>1. Navigate to "Meeting Attendance"</p>
            <p>2. Select the current meeting</p>
            <p>3. Check in to record your attendance</p>
          `,
        },
      ],
    },
    'troubleshooting': {
      title: 'Troubleshooting',
      icon: 'help-circle',
      content: [
        {
          title: 'Login Issues',
          description: 'Common login problems and solutions',
          content: `
            <h3>Can't Log In?</h3>
            <p>• Make sure your S-Number starts with "s"</p>
            <p>• Check that your password is correct</p>
            <p>• Contact your club sponsor if you need to be added to the roster</p>
            
            <h3>Forgot Password?</h3>
            <p>Use the "Forgot Password" option on the login screen</p>
          `,
        },
        {
          title: 'Hour Submission Issues',
          description: 'Problems with submitting volunteer hours',
          content: `
            <h3>Hours Not Submitting?</h3>
            <p>• Check your internet connection</p>
            <p>• Make sure all required fields are filled</p>
            <p>• Try refreshing the page and submitting again</p>
            
            <h3>Hours Not Approved?</h3>
            <p>• Contact your club officers for approval status</p>
            <p>• Make sure the event details are accurate</p>
          `,
        },
        {
          title: 'App Not Working',
          description: 'General app issues and solutions',
          content: `
            <h3>App Crashes</h3>
            <p>• Close and reopen the app</p>
            <p>• Clear your browser cache (web version)</p>
            <p>• Update to the latest version</p>
            
            <h3>Slow Performance</h3>
            <p>• Check your internet connection</p>
            <p>• Close other apps to free up memory</p>
          `,
        },
      ],
    },
    'contact': {
      title: 'Contact Support',
      icon: 'mail',
      content: [
        {
          title: 'Club Officers',
          description: 'Contact your Key Club officers for help',
          content: `
            <h3>Getting Help</h3>
            <p>• Ask questions during club meetings</p>
            <p>• Contact officers directly for urgent issues</p>
            <p>• Check the "Officers" section for contact information</p>
          `,
        },
        {
          title: 'Technical Support',
          description: 'For app-related technical issues',
          content: `
            <h3>Report Issues</h3>
            <p>• Describe the problem clearly</p>
            <p>• Include your device and app version</p>
            <p>• Provide steps to reproduce the issue</p>
          `,
        },
      ],
    },
  };

  const renderHelpItem = ({ item }) => {
    if (item.showFor && item.showFor !== (isAdmin ? 'admin' : 'student')) {
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.helpItem}
        onPress={() => {
          if (item.action) {
            item.action();
            hideHelp();
          } else {
            // Show detailed content
            setActiveTab('detail');
          }
        }}
      >
        <View style={styles.helpItemHeader}>
          <View style={styles.helpItemInfo}>
            <Text style={styles.helpItemTitle}>{item.title}</Text>
            <Text style={styles.helpItemDescription}>{item.description}</Text>
          </View>
          {item.completed && (
            <Ionicons name="checkmark-circle" size={20} color="#48bb78" />
          )}
          {!item.action && (
            <Ionicons name="chevron-forward" size={20} color="#cbd5e0" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderTabContent = () => {
    const section = helpSections[activeTab];
    if (!section) return null;

    return (
      <View style={styles.tabContent}>
        <FlatList
          data={section.content}
          renderItem={renderHelpItem}
          keyExtractor={(item) => item.title}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  const renderTabs = () => {
    return (
      <View style={styles.tabsContainer}>
        {Object.entries(helpSections).map(([key, section]) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, activeTab === key && styles.activeTab]}
            onPress={() => setActiveTab(key)}
          >
            <Ionicons
              name={section.icon}
              size={20}
              color={activeTab === key ? '#4299e1' : '#718096'}
            />
            <Text style={[styles.tabText, activeTab === key && styles.activeTabText]}>
              {section.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={showHelpModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={hideHelp}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <TouchableOpacity onPress={hideHelp} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#4a5568" />
          </TouchableOpacity>
        </View>

        {renderTabs()}
        {renderTabContent()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    ...Platform.select({
      ios: {
        paddingTop: 50,
      },
    }),
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  closeButton: {
    padding: 5,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4299e1',
  },
  tabText: {
    fontSize: 12,
    color: '#718096',
    marginLeft: 6,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4299e1',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  helpItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  helpItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpItemInfo: {
    flex: 1,
  },
  helpItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  helpItemDescription: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
  },
}); 