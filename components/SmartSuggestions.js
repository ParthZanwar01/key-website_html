import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHelper } from '../contexts/HelperContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function SmartSuggestions() {
  const { tutorialState, shouldShowTutorial, startTutorial } = useHelper();
  const { isAdmin, user } = useAuth();
  const navigation = useNavigation();
  const [suggestions, setSuggestions] = useState([]);
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    generateSuggestions();
  }, [tutorialState, isAdmin]);

  useEffect(() => {
    if (suggestions.length > 0) {
      showSuggestions();
    }
  }, [suggestions]);

  const generateSuggestions = () => {
    const newSuggestions = [];

    // Tutorial suggestions
    if (shouldShowTutorial('welcome')) {
      newSuggestions.push({
        id: 'welcome-tutorial',
        title: 'Take the Welcome Tour',
        description: 'Learn the basics of the Key Club app',
        icon: 'rocket',
        action: () => startTutorial('welcome'),
        priority: 1,
      });
    }

    if (isAdmin && shouldShowTutorial('adminFeatures')) {
      newSuggestions.push({
        id: 'admin-tutorial',
        title: 'Admin Features Guide',
        description: 'Learn about administrative tools',
        icon: 'settings',
        action: () => startTutorial('adminFeatures'),
        priority: 1,
      });
    }

    if (!isAdmin && shouldShowTutorial('studentFeatures')) {
      newSuggestions.push({
        id: 'student-tutorial',
        title: 'Student Features Guide',
        description: 'Discover features available to students',
        icon: 'school',
        action: () => startTutorial('studentFeatures'),
        priority: 1,
      });
    }

    // Feature suggestions based on user behavior
    if (!isAdmin) {
      // Suggest hour tracking for new students
      newSuggestions.push({
        id: 'hour-tracking',
        title: 'Track Your Hours',
        description: 'Submit volunteer hours for approval',
        icon: 'time',
        action: () => navigation.navigate('HourRequest'),
        priority: 2,
      });

      // Suggest event registration
      newSuggestions.push({
        id: 'event-registration',
        title: 'Browse Events',
        description: 'Find and register for upcoming events',
        icon: 'calendar',
        action: () => navigation.navigate('Calendar'),
        priority: 2,
      });
    }

    if (isAdmin) {
      // Suggest admin tasks
      newSuggestions.push({
        id: 'review-hours',
        title: 'Review Hour Requests',
        description: 'Approve pending volunteer hour submissions',
        icon: 'checkmark-circle',
        action: () => navigation.navigate('AdminHourManagement'),
        priority: 2,
      });

      newSuggestions.push({
        id: 'create-event',
        title: 'Create Event',
        description: 'Add a new event to the calendar',
        icon: 'add-circle',
        action: () => navigation.navigate('EventCreation'),
        priority: 2,
      });
    }

    // Best practices suggestions
    if (!tutorialState.completedTutorials.includes('welcome')) {
      newSuggestions.push({
        id: 'best-practices',
        title: 'Pro Tips',
        description: 'Learn efficient ways to use the app',
        icon: 'bulb',
        action: () => {
          // Show best practices modal
        },
        priority: 3,
      });
    }

    // Sort by priority and limit to top 3
    const sortedSuggestions = newSuggestions
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 3);

    setSuggestions(sortedSuggestions);
  };

  const showSuggestions = () => {
    if (!tutorialState.showSuggestions) return;

    setVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: false,
    }).start();
  };

  const hideSuggestions = () => {
    Animated.timing(slideAnim, {
      toValue: -200,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setVisible(false);
    });
  };

  const handleSuggestionPress = (suggestion) => {
    hideSuggestions();
    suggestion.action();
  };

  const handleDismiss = () => {
    hideSuggestions();
  };

  if (!visible || suggestions.length === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="bulb" size={20} color="#4299e1" />
          <Text style={styles.headerTitle}>Suggestions</Text>
        </View>
        <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton}>
          <Ionicons name="close" size={16} color="#718096" />
        </TouchableOpacity>
      </View>

      <View style={styles.suggestionsContainer}>
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={suggestion.id}
            style={[
              styles.suggestionItem,
              index === suggestions.length - 1 && styles.lastItem,
            ]}
            onPress={() => handleSuggestionPress(suggestion)}
            activeOpacity={0.7}
          >
            <View style={styles.suggestionIcon}>
              <Ionicons name={suggestion.icon} size={20} color="#4299e1" />
            </View>
            <View style={styles.suggestionContent}>
              <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
              <Text style={styles.suggestionDescription}>
                {suggestion.description}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#cbd5e0" />
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 80 : 100,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginLeft: 8,
  },
  dismissButton: {
    padding: 4,
  },
  suggestionsContainer: {
    paddingVertical: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  suggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ebf8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 2,
  },
  suggestionDescription: {
    fontSize: 12,
    color: '#718096',
    lineHeight: 16,
  },
}); 