import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHelper } from '../contexts/HelperContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function HelperOverlay() {
  const {
    tutorialState,
    completeTutorial,
    dismissTutorial,
    hideTooltip,
    activeTooltip,
  } = useHelper();

  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const tooltipAnim = useRef(new Animated.Value(0)).current;

  // Tutorial definitions
  const tutorials = {
    welcome: {
      title: 'Welcome to Key Club!',
      description: 'Let\'s get you started with the basics',
      steps: [
        {
          title: 'Welcome!',
          content: 'Welcome to the Key Club app! This quick tour will help you get familiar with the main features.',
          position: 'center',
          action: 'next',
        },
        {
          title: 'Your Dashboard',
          content: 'This is your home screen where you can see your progress, upcoming events, and quick access to all features.',
          position: 'center',
          action: 'next',
        },
        {
          title: 'Navigation Menu',
          content: 'Tap the menu button (☰) in the top left to access all sections of the app.',
          position: 'top-left',
          action: 'next',
        },
        {
          title: 'Hours Tracking',
          content: 'Track your volunteer hours and see your progress toward your goals.',
          position: 'center',
          action: 'next',
        },
        {
          title: 'Events',
          content: 'Browse and register for upcoming Key Club events and activities.',
          position: 'center',
          action: 'next',
        },
        {
          title: 'You\'re All Set!',
          content: 'You can always access help and tutorials from the menu. Ready to explore!',
          position: 'center',
          action: 'complete',
        },
      ],
    },
    studentFeatures: {
      title: 'Student Features',
      description: 'Learn about student-specific features',
      steps: [
        {
          title: 'Hour Requests',
          content: 'Submit volunteer hours for approval by club officers.',
          position: 'center',
          action: 'next',
        },
        {
          title: 'Event Registration',
          content: 'Sign up for events and track your attendance.',
          position: 'center',
          action: 'next',
        },
        {
          title: 'Progress Tracking',
          content: 'Monitor your volunteer hours and achievements.',
          position: 'center',
          action: 'complete',
        },
      ],
    },
    adminFeatures: {
      title: 'Admin Features',
      description: 'Learn about administrative tools',
      steps: [
        {
          title: 'Student Management',
          content: 'Manage student accounts and view member information.',
          position: 'center',
          action: 'next',
        },
        {
          title: 'Event Management',
          content: 'Create and manage club events and activities.',
          position: 'center',
          action: 'next',
        },
        {
          title: 'Hour Approval',
          content: 'Review and approve student volunteer hour requests.',
          position: 'center',
          action: 'next',
        },
        {
          title: 'Announcements',
          content: 'Post announcements to keep members informed.',
          position: 'center',
          action: 'complete',
        },
      ],
    },
  };

  const currentTutorial = tutorials[tutorialState.currentTutorial];
  const currentStepData = currentTutorial?.steps[currentStep];

  useEffect(() => {
    if (tutorialState.currentTutorial) {
      setCurrentStep(0);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [tutorialState.currentTutorial]);

  useEffect(() => {
    if (activeTooltip) {
      Animated.timing(tooltipAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(tooltipAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [activeTooltip]);

  const handleNext = () => {
    if (currentStep < currentTutorial.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => {
      completeTutorial(tutorialState.currentTutorial);
    });
  };

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => {
      dismissTutorial(tutorialState.currentTutorial);
    });
  };

  const getPositionStyle = (position) => {
    switch (position) {
      case 'top-left':
        return { top: 100, left: 20 };
      case 'top-right':
        return { top: 100, right: 20 };
      case 'bottom-left':
        return { bottom: 100, left: 20 };
      case 'bottom-right':
        return { bottom: 100, right: 20 };
      case 'center':
      default:
        return { top: '50%', left: '50%', transform: [{ translateX: -150 }, { translateY: -100 }] };
    }
  };

  if (!tutorialState.currentTutorial || !currentTutorial) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={!!tutorialState.currentTutorial}
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Semi-transparent background */}
        <View style={styles.background} />

        {/* Tutorial content */}
        <Animated.View
          style={[
            styles.tutorialContainer,
            getPositionStyle(currentStepData?.position),
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.tutorialHeader}>
            <Text style={styles.tutorialTitle}>{currentStepData?.title}</Text>
            <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.tutorialContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.tutorialText}>{currentStepData?.content}</Text>
          </ScrollView>

          <View style={styles.tutorialFooter}>
            <View style={styles.progressContainer}>
              {currentTutorial.steps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index === currentStep && styles.progressDotActive,
                  ]}
                />
              ))}
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity onPress={handleDismiss} style={styles.skipButton}>
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
                <Text style={styles.nextButtonText}>
                  {currentStep === currentTutorial.steps.length - 1 ? 'Finish' : 'Next'}
                </Text>
                <Ionicons
                  name={currentStep === currentTutorial.steps.length - 1 ? 'checkmark' : 'arrow-forward'}
                  size={16}
                  color="#fff"
                  style={{ marginLeft: 8 }}
                />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Tooltip */}
        {activeTooltip && (
          <Animated.View
            style={[
              styles.tooltipContainer,
              {
                opacity: tooltipAnim,
                transform: [
                  {
                    scale: tooltipAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.tooltipContent}>
              <Text style={styles.tooltipText}>{activeTooltip.content}</Text>
              <TouchableOpacity onPress={hideTooltip} style={styles.tooltipClose}>
                <Ionicons name="close" size={16} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.tooltipArrow} />
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  background: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  tutorialContainer: {
    position: 'absolute',
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: 400,
  },
  tutorialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  tutorialTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  tutorialContent: {
    marginBottom: 20,
  },
  tutorialText: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 20,
  },
  tutorialFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 15,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e0',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#4299e1',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    color: '#718096',
    fontSize: 14,
  },
  nextButton: {
    backgroundColor: '#4299e1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tooltipContainer: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    maxWidth: 250,
    top: 100,
    left: 20,
  },
  tooltipContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tooltipText: {
    fontSize: 12,
    color: '#4a5568',
    flex: 1,
    marginRight: 8,
  },
  tooltipClose: {
    padding: 2,
  },
  tooltipArrow: {
    position: 'absolute',
    top: -6,
    left: 20,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#fff',
  },
}); 